#!/usr/bin/env python3
"""
Instagram Brand Auto Posting System (Simplified)
Posts about random brands with single image
"""

import os
import json
import random
import requests
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path

from instagram_graph_api import InstagramGraphAPI
from loguru import logger


class InstagramBrandPosterSimple:
    """Instagram Brand Auto Posting Class (Simplified)"""
    
    def __init__(self, config_path: str = "config_graph_api.env"):
        """Initialize"""
        self.config_path = config_path
        self.api = InstagramGraphAPI()
        self.post_history = self._load_post_history()
        
        # Configure logging
        logger.remove()
        logger.add(
            "instagram_brand_poster_simple.log",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
            rotation="1 day",
            retention="30 days"
        )
        logger.add(
            lambda msg: print(msg, end=""),
            level="INFO"
        )
    
    def _load_post_history(self) -> Dict[str, Any]:
        """Load post history"""
        history_file = Path("post_history_instagram_simple.json")
        if history_file.exists():
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Post history loading error: {e}")
        
        return {
            "posts": [],
            "daily_count": {},
            "last_post_time": None
        }
    
    def _save_post_history(self):
        """Save post history"""
        try:
            with open("post_history_instagram_simple.json", 'w', encoding='utf-8') as f:
                json.dump(self.post_history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Post history saving error: {e}")
    
    def _can_post_now(self) -> bool:
        """Check if posting is possible now"""
        now = datetime.now()
        
        # Daily post count check
        today = now.strftime("%Y-%m-%d")
        daily_count = self.post_history.get("daily_count", {}).get(today, 0)
        if daily_count >= 3:  # Instagram limit: 3 posts per day
            logger.info(f"Daily post limit reached: {daily_count}/3")
            return False
        
        # Post interval check (8 hours)
        last_post_time = self.post_history.get("last_post_time")
        if last_post_time:
            last_post = datetime.fromisoformat(last_post_time)
            time_diff = now - last_post
            if time_diff.total_seconds() < 8 * 60 * 60:  # 8 hours
                remaining_hours = 8 - (time_diff.total_seconds() / 3600)
                logger.info(f"Waiting for post interval: {remaining_hours:.1f} hours remaining")
                return False
        
        return True
    
    def get_all_brands(self) -> List[Dict[str, Any]]:
        """Get all brands from Supabase"""
        try:
            response = requests.get("http://localhost:3000/api/brands")
            if response.status_code == 200:
                brands_data = response.json()
                return brands_data.get('brands', [])
            return []
        except Exception as e:
            logger.error(f"Error fetching brands: {e}")
            return []
    
    def get_random_brand(self) -> Optional[Dict[str, Any]]:
        """Get a random brand from Supabase"""
        brands = self.get_all_brands()
        if brands:
            return random.choice(brands)
        return None
    
    def create_instagram_caption(self, brand_name: str, brand_description: str) -> str:
        """Create Instagram-optimized caption"""
        # Instagram用のハッシュタグを追加
        hashtags = f"#Godship #{brand_name} #fashion #streetwear #style #brand #design #clothing #outfit #trendy #fashionista #ootd #instafashion #fashionblogger #styleinspo #fashionista #streetstyle #urbanfashion #contemporary #modernfashion"
        
        caption = f"""🚀 Introducing {brand_name} from Godship!

{brand_description[:200]}...

Discover more unique designs at godship.io

{hashtags}"""
        
        return caption
    
    def post_brand_single(self) -> Optional[str]:
        """Post about a random brand with single image"""
        try:
            if not self._can_post_now():
                return None
            
            # Get random brand
            brand = self.get_random_brand()
            if not brand:
                logger.error("No brands found")
                return None
            
            brand_name = brand['name']
            brand_description = brand.get('description', f'{brand_name}: Extraordinary Design Since 2020')
            background_image_url = brand.get('background_image')
            
            if not background_image_url:
                logger.error(f"No background image for brand {brand_name}")
                return None
            
            logger.info(f"Creating single image post for brand: {brand_name}")
            
            # Create Instagram caption
            caption = self.create_instagram_caption(brand_name, brand_description)
            
            # Post single image
            media_id = self.api.post_photo_from_url(
                image_url=background_image_url,
                caption=caption
            )
            
            if media_id:
                # Update history
                self._update_post_history(media_id, brand_name, [background_image_url])
                logger.info(f"✅ Instagram brand post successful: {media_id}")
                return media_id
            else:
                logger.error("❌ Instagram brand post failed")
                return None
                
        except Exception as e:
            logger.error(f"Error posting brand single: {e}")
            return None
    
    def _update_post_history(self, media_id: str, brand_name: str, image_urls: List[str]):
        """Update post history"""
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        
        # Add to post history
        post_data = {
            "media_id": media_id,
            "brand_name": brand_name,
            "image_urls": image_urls,
            "timestamp": now.isoformat(),
            "date": today
        }
        
        self.post_history["posts"].append(post_data)
        self.post_history["last_post_time"] = now.isoformat()
        
        # Update daily count
        if "daily_count" not in self.post_history:
            self.post_history["daily_count"] = {}
        
        self.post_history["daily_count"][today] = self.post_history["daily_count"].get(today, 0) + 1
        
        # Save history
        self._save_post_history()
        
        logger.info(f"Post history updated: {today} ({self.post_history['daily_count'][today]}/3)")
    
    def get_post_stats(self) -> Dict[str, Any]:
        """Get post statistics"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_count = self.post_history.get("daily_count", {}).get(today, 0)
        
        return {
            "daily_posts": daily_count,
            "max_daily_posts": 3,
            "remaining_posts": max(0, 3 - daily_count),
            "last_post_time": self.post_history.get("last_post_time"),
            "total_posts": len(self.post_history.get("posts", []))
        }


def main():
    """Main function"""
    try:
        # Initialize Instagram brand posting system
        poster = InstagramBrandPosterSimple()
        
        # Display post statistics
        stats = poster.get_post_stats()
        logger.info(f"Today's posts: {stats['daily_posts']}/{stats['max_daily_posts']}")
        
        # Post random brand
        media_id = poster.post_brand_single()
        
        if media_id:
            logger.info(f"Brand post successful: {media_id}")
        else:
            logger.info("Brand post skipped (restricted or limit reached)")
        
    except Exception as e:
        logger.error(f"Main process error: {e}")


if __name__ == "__main__":
    main()
