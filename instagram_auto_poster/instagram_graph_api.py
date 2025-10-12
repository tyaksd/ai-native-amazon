"""
Instagram Graph API (Official API) Auto Posting System
Business account required
"""

import os
import time
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pathlib import Path

import requests
from dotenv import load_dotenv
import schedule

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('instagram_graph_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class InstagramGraphAPI:
    """Instagram Graph API (Official API) Auto Posting Class"""
    
    def __init__(self, config_file: str = "config.env"):
        """
        Initialize
        
        Args:
            config_file: Configuration file path
        """
        load_dotenv(config_file)
        
        # Graph API Settings
        self.access_token = os.getenv('INSTAGRAM_ACCESS_TOKEN')
        self.instagram_account_id = os.getenv('INSTAGRAM_ACCOUNT_ID')
        self.app_id = os.getenv('FACEBOOK_APP_ID')
        self.app_secret = os.getenv('FACEBOOK_APP_SECRET')
        
        # Post Settings
        self.default_caption = os.getenv('DEFAULT_CAPTION', '#AutoPost #Python')
        self.default_hashtags = os.getenv('DEFAULT_HASHTAGS', '#Python #Automation #Instagram #Tech')
        self.post_interval_hours = int(os.getenv('POST_INTERVAL_HOURS', '24'))
        self.max_posts_per_day = int(os.getenv('MAX_POSTS_PER_DAY', '3'))
        
        # API Endpoint
        self.base_url = "https://graph.facebook.com/v18.0"
        
        # Post History
        self.post_history_file = 'post_history_graph.json'
        self.post_history = self._load_post_history()
        
    def _load_post_history(self) -> Dict[str, Any]:
        """Load post history"""
        try:
            if os.path.exists(self.post_history_file):
                with open(self.post_history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load post history: {e}")
        return {"posts": [], "daily_count": 0, "last_post_date": None}
    
    def _save_post_history(self):
        """Save post history"""
        try:
            with open(self.post_history_file, 'w', encoding='utf-8') as f:
                json.dump(self.post_history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save post history: {e}")
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """
        Execute Graph API request
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            data: Request data
            params: Query parameters
            
        Returns:
            Dict: API response
        """
        url = f"{self.base_url}/{endpoint}"
        
        if params is None:
            params = {}
        params['access_token'] = self.access_token
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, params=params)
            elif method.upper() == 'POST':
                response = requests.post(url, data=data, params=params)
            else:
                raise ValueError(f"サポートされていないHTTPメソッド: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            raise
    
    def get_account_info(self) -> Dict:
        """Get Instagram account information"""
        try:
            endpoint = f"{self.instagram_account_id}"
            params = {
                'fields': 'id,username,media_count,followers_count,follows_count'
            }
            return self._make_request('GET', endpoint, params=params)
        except Exception as e:
            logger.error(f"Account info retrieval error: {e}")
            return {}
    
    def can_post_today(self) -> bool:
        """Check today's posting limit"""
        today = datetime.now().strftime('%Y-%m-%d')
        last_post_date = self.post_history.get('last_post_date')
        daily_count = self.post_history.get('daily_count', 0)
        
        # Reset count when date changes
        if last_post_date != today:
            self.post_history['daily_count'] = 0
            self.post_history['last_post_date'] = today
            self._save_post_history()
            return True
        
        return daily_count < self.max_posts_per_day
    
    def upload_photo_to_container(self, image_url: str, caption: str) -> str:
        """
        Upload photo to container
        
        Args:
            image_url: Image URL
            caption: Caption
            
        Returns:
            str: Container ID
        """
        endpoint = f"{self.instagram_account_id}/media"
        data = {
            'image_url': image_url,
            'caption': caption
        }
        
        response = self._make_request('POST', endpoint, data=data)
        return response.get('id')
    
    def publish_media(self, container_id: str) -> str:
        """
        Publish media
        
        Args:
            container_id: Container ID
            
        Returns:
            str: Published media ID
        """
        endpoint = f"{self.instagram_account_id}/media_publish"
        data = {
            'creation_id': container_id
        }
        
        response = self._make_request('POST', endpoint, data=data)
        return response.get('id')
    
    def post_photo_from_url(self, image_url: str, caption: str = None) -> bool:
        """
        Post photo from URL
        
        Args:
            image_url: Image URL
            caption: Caption (optional)
            
        Returns:
            bool: True if post successful
        """
        if not self.can_post_today():
            logger.warning("Daily posting limit reached")
            return False
        
        try:
            # Create caption
            if not caption:
                caption = f"🚀 {self.default_caption}\n\n{self.default_hashtags}"
            
            # Upload to container
            logger.info(f"Uploading image to container: {image_url}")
            container_id = self.upload_photo_to_container(image_url, caption)
            
            # Publish
            logger.info(f"Publishing media: {container_id}")
            media_id = self.publish_media(container_id)
            
            # Update post history
            self.post_history['posts'].append({
                'media_id': media_id,
                'image_url': image_url,
                'caption': caption,
                'timestamp': datetime.now().isoformat()
            })
            self.post_history['daily_count'] += 1
            self.post_history['last_post_date'] = datetime.now().strftime('%Y-%m-%d')
            self._save_post_history()
            
            logger.info(f"Post successful: {media_id}")
            return True
            
        except Exception as e:
            logger.error(f"Post error: {e}")
            return False
    
    def upload_carousel_to_container(self, image_urls: List[str], caption: str) -> str:
        """
        Upload carousel to container
        
        Args:
            image_urls: List of image URLs
            caption: Caption
            
        Returns:
            str: Container ID
        """
        endpoint = f"{self.instagram_account_id}/media"
        data = {
            'media_type': 'CAROUSEL',
            'children': ','.join(image_urls),
            'caption': caption
        }
        
        response = self._make_request('POST', endpoint, data=data)
        return response.get('id')
    
    def post_carousel_from_urls(self, image_urls: List[str], caption: str = None) -> bool:
        """
        Post carousel from URLs
        
        Args:
            image_urls: List of image URLs
            caption: Caption (optional)
            
        Returns:
            bool: True if post successful
        """
        if not self.can_post_today():
            logger.warning("Daily posting limit reached")
            return False
        
        try:
            # Create caption
            if not caption:
                caption = f"📸 Multiple Image Post\n\n{self.default_caption}\n\n{self.default_hashtags}"
            
            # Upload carousel to container
            logger.info(f"Uploading carousel to container: {len(image_urls)} images")
            container_id = self.upload_carousel_to_container(image_urls, caption)
            
            # Publish
            logger.info(f"Publishing carousel: {container_id}")
            media_id = self.publish_media(container_id)
            
            # Update post history
            self.post_history['posts'].append({
                'media_id': media_id,
                'image_urls': image_urls,
                'caption': caption,
                'timestamp': datetime.now().isoformat()
            })
            self.post_history['daily_count'] += 1
            self.post_history['last_post_date'] = datetime.now().strftime('%Y-%m-%d')
            self._save_post_history()
            
            logger.info(f"Carousel post successful: {media_id}")
            return True
            
        except Exception as e:
            logger.error(f"Carousel post error: {e}")
            return False
    
    def get_media_insights(self, media_id: str) -> Dict:
        """
        Get media insights
        
        Args:
            media_id: Media ID
            
        Returns:
            Dict: Insights data
        """
        try:
            endpoint = f"{media_id}/insights"
            params = {
                'metric': 'impressions,reach,likes,comments,shares,saves'
            }
            return self._make_request('GET', endpoint, params=params)
        except Exception as e:
            logger.error(f"Insights retrieval error: {e}")
            return {}
    
    def get_post_history(self) -> List[Dict]:
        """Get post history"""
        return self.post_history.get('posts', [])
    
    def get_daily_stats(self) -> Dict[str, Any]:
        """Get daily statistics"""
        today = datetime.now().strftime('%Y-%m-%d')
        today_posts = [p for p in self.post_history.get('posts', []) 
                      if p.get('timestamp', '').startswith(today)]
        
        return {
            'date': today,
            'post_count': len(today_posts),
            'max_posts': self.max_posts_per_day,
            'remaining_posts': self.max_posts_per_day - len(today_posts)
        }


def main():
    """Main execution function"""
    api = InstagramGraphAPI()
    
    # Get account information
    account_info = api.get_account_info()
    if account_info:
        logger.info(f"Account info: {account_info}")
    
    # Display statistics
    stats = api.get_daily_stats()
    logger.info(f"Today's posting status: {stats['post_count']}/{stats['max_posts']}")
    
    # Usage example
    logger.info("Instagram Graph API auto posting system started")
    
    # Sample post (change to actual image URL)
    # api.post_photo_from_url("https://example.com/sample.jpg", "Test post!")


if __name__ == "__main__":
    main()
