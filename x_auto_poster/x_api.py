#!/usr/bin/env python3
"""
X Auto Posting System
Automated posting using X API v2
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path

import tweepy
from dotenv import load_dotenv
from loguru import logger
from pydantic import BaseModel, Field


class XConfig(BaseModel):
    """X API Configuration"""
    api_key: str = Field(..., description="API Key")
    api_secret: str = Field(..., description="API Secret")
    access_token: str = Field(..., description="Access Token")
    access_token_secret: str = Field(..., description="Access Token Secret")
    bearer_token: str = Field(..., description="Bearer Token")
    post_interval_minutes: int = Field(default=60, description="Post interval (minutes)")
    max_posts_per_day: int = Field(default=10, description="Maximum posts per day")
    post_start_hour: int = Field(default=9, description="Post start hour")
    post_end_hour: int = Field(default=21, description="Post end hour")
    log_level: str = Field(default="INFO", description="Log level")
    post_history_file: str = Field(default="post_history_x.json", description="Post history file")


class PostContent(BaseModel):
    """Post content"""
    text: str = Field(..., description="Post text")
    media_paths: Optional[List[str]] = Field(default=None, description="Media file paths")
    reply_to_tweet_id: Optional[str] = Field(default=None, description="Reply to tweet ID")
    quote_tweet_id: Optional[str] = Field(default=None, description="Quote tweet ID")


class XAutoPoster:
    """X Auto Posting Class"""
    
    def __init__(self, config_path: str = "config.env"):
        """Initialize"""
        self.config_path = config_path
        self.config = self._load_config()
        self.client = self._create_client()
        self.post_history = self._load_post_history()
        
        # Log configuration
        logger.remove()
        logger.add(
            "x_api.log",
            level=self.config.log_level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
            rotation="1 day",
            retention="30 days"
        )
        logger.add(
            lambda msg: print(msg, end=""),
            level=self.config.log_level
        )
    
    def _load_config(self) -> XConfig:
        """Load configuration file"""
        load_dotenv(self.config_path)
        
        return XConfig(
            api_key=os.getenv("X_API_KEY", ""),
            api_secret=os.getenv("X_API_SECRET", ""),
            access_token=os.getenv("X_ACCESS_TOKEN", ""),
            access_token_secret=os.getenv("X_ACCESS_TOKEN_SECRET", ""),
            bearer_token=os.getenv("X_BEARER_TOKEN", ""),
            post_interval_minutes=int(os.getenv("POST_INTERVAL_MINUTES", "60")),
            max_posts_per_day=int(os.getenv("MAX_POSTS_PER_DAY", "10")),
            post_start_hour=int(os.getenv("POST_START_HOUR", "9")),
            post_end_hour=int(os.getenv("POST_END_HOUR", "21")),
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            post_history_file=os.getenv("POST_HISTORY_FILE", "post_history_x.json")
        )
    
    def _create_client(self) -> tweepy.Client:
        """Create X API client"""
        try:
            client = tweepy.Client(
                bearer_token=self.config.bearer_token,
                consumer_key=self.config.api_key,
                consumer_secret=self.config.api_secret,
                access_token=self.config.access_token,
                access_token_secret=self.config.access_token_secret,
                wait_on_rate_limit=True
            )
            
            # Authentication test
            user = client.get_me()
            logger.info(f"X API authentication successful: @{user.data.username}")
            return client
            
        except Exception as e:
            logger.error(f"X API authentication error: {e}")
            raise
    
    def _load_post_history(self) -> Dict[str, Any]:
        """Load post history"""
        history_file = Path(self.config.post_history_file)
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
            with open(self.config.post_history_file, 'w', encoding='utf-8') as f:
                json.dump(self.post_history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Post history saving error: {e}")
    
    def _can_post_now(self) -> bool:
        """Check if posting is possible now"""
        now = datetime.now()
        
        # Time zone check
        if not (self.config.post_start_hour <= now.hour < self.config.post_end_hour):
            logger.info(f"Outside posting hours: {now.hour}:00 (Posting hours: {self.config.post_start_hour}-{self.config.post_end_hour})")
            return False
        
        # Daily post count check
        today = now.strftime("%Y-%m-%d")
        daily_count = self.post_history.get("daily_count", {}).get(today, 0)
        if daily_count >= self.config.max_posts_per_day:
            logger.info(f"Daily post limit reached: {daily_count}/{self.config.max_posts_per_day}")
            return False
        
        # Post interval check
        last_post_time = self.post_history.get("last_post_time")
        if last_post_time:
            last_post = datetime.fromisoformat(last_post_time)
            time_diff = now - last_post
            if time_diff.total_seconds() < self.config.post_interval_minutes * 60:
                remaining_minutes = self.config.post_interval_minutes - (time_diff.total_seconds() / 60)
                logger.info(f"Waiting for post interval: {remaining_minutes:.1f} minutes remaining")
                return False
        
        return True
    
    def post_text(self, text: str, reply_to_tweet_id: Optional[str] = None) -> Optional[str]:
        """Post text"""
        if not self._can_post_now():
            return None
        
        try:
            # Character count check
            if len(text) > 280:
                logger.error(f"Post text is too long: {len(text)} characters")
                return None
            
            # Execute post
            response = self.client.create_tweet(
                text=text,
                in_reply_to_tweet_id=reply_to_tweet_id
            )
            
            tweet_id = response.data['id']
            logger.info(f"Post successful: {tweet_id}")
            
            # Update history
            self._update_post_history(tweet_id, text)
            
            return tweet_id
            
        except Exception as e:
            logger.error(f"Post error: {e}")
            return None
    
    def post_with_media(self, text: str, media_paths: List[str], reply_to_tweet_id: Optional[str] = None) -> Optional[str]:
        """Post with media"""
        if not self._can_post_now():
            return None
        
        try:
            # Check media file existence
            valid_media_paths = []
            for path in media_paths:
                if os.path.exists(path):
                    valid_media_paths.append(path)
                else:
                    logger.warning(f"Media file not found: {path}")
            
            if not valid_media_paths:
                logger.error("No valid media files")
                return None
            
            # Media upload
            media_ids = []
            for media_path in valid_media_paths:
                try:
                    media = self.client.media_upload(media_path)
                    media_ids.append(media.media_id)
                    logger.info(f"Media upload successful: {media_path}")
                except Exception as e:
                    logger.error(f"Media upload error {media_path}: {e}")
            
            if not media_ids:
                logger.error("Media upload failed")
                return None
            
            # Execute post
            response = self.client.create_tweet(
                text=text,
                media_ids=media_ids,
                in_reply_to_tweet_id=reply_to_tweet_id
            )
            
            tweet_id = response.data['id']
            logger.info(f"Media post successful: {tweet_id}")
            
            # Update history
            self._update_post_history(tweet_id, text, media_paths)
            
            return tweet_id
            
        except Exception as e:
            logger.error(f"Media post error: {e}")
            return None
    
    def _update_post_history(self, tweet_id: str, text: str, media_paths: Optional[List[str]] = None):
        """Update post history"""
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")
        
        # Add to post history
        post_data = {
            "tweet_id": tweet_id,
            "text": text,
            "media_paths": media_paths or [],
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
        
        logger.info(f"Post history updated: {today} ({self.post_history['daily_count'][today]}/{self.config.max_posts_per_day})")
    
    def get_user_info(self) -> Optional[Dict[str, Any]]:
        """Get user information"""
        try:
            user = self.client.get_me()
            return {
                "id": user.data.id,
                "username": user.data.username,
                "name": user.data.name,
                "followers_count": user.data.public_metrics.get("followers_count", 0),
                "following_count": user.data.public_metrics.get("following_count", 0),
                "tweet_count": user.data.public_metrics.get("tweet_count", 0)
            }
        except Exception as e:
            logger.error(f"User info retrieval error: {e}")
            return None
    
    def get_post_stats(self) -> Dict[str, Any]:
        """Get post statistics"""
        today = datetime.now().strftime("%Y-%m-%d")
        daily_count = self.post_history.get("daily_count", {}).get(today, 0)
        
        return {
            "daily_posts": daily_count,
            "max_daily_posts": self.config.max_posts_per_day,
            "remaining_posts": max(0, self.config.max_posts_per_day - daily_count),
            "last_post_time": self.post_history.get("last_post_time"),
            "total_posts": len(self.post_history.get("posts", []))
        }


def main():
    """Main function"""
    try:
        # Initialize X auto posting system
        poster = XAutoPoster()
        
        # Display user information
        user_info = poster.get_user_info()
        if user_info:
            logger.info(f"User: @{user_info['username']} ({user_info['name']})")
            logger.info(f"Followers: {user_info['followers_count']:,}")
        
        # Display post statistics
        stats = poster.get_post_stats()
        logger.info(f"Today's posts: {stats['daily_posts']}/{stats['max_daily_posts']}")
        
        # Test post (based on configuration)
        test_text = "X auto posting system test post 🚀"
        tweet_id = poster.post_text(test_text)
        
        if tweet_id:
            logger.info(f"Test post successful: https://twitter.com/i/web/status/{tweet_id}")
        else:
            logger.info("Test post skipped (restricted or outside hours)")
        
    except Exception as e:
        logger.error(f"Main process error: {e}")


if __name__ == "__main__":
    main()
