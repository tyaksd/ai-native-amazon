#!/usr/bin/env python3
"""
X Auto Posting Scheduler
Scheduler for regular X posting execution
"""

import os
import time
import schedule
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path

from loguru import logger
from x_api import XAutoPoster, PostContent


class XScheduler:
    """X Auto Posting Scheduler"""
    
    def __init__(self, config_path: str = "config.env"):
        """Initialize"""
        self.config_path = config_path
        self.poster = XAutoPoster(config_path)
        self.running = False
        self.scheduler_thread = None
        
        # Log configuration
        logger.remove()
        logger.add(
            "scheduler.log",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
            rotation="1 day",
            retention="30 days"
        )
        logger.add(
            lambda msg: print(msg, end=""),
            level="INFO"
        )
    
    def _load_post_queue(self) -> List[Dict[str, Any]]:
        """Load post queue"""
        queue_file = Path("post_queue.json")
        if queue_file.exists():
            try:
                with open(queue_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Post queue loading error: {e}")
        return []
    
    def _save_post_queue(self, queue: List[Dict[str, Any]]):
        """Save post queue"""
        try:
            with open("post_queue.json", 'w', encoding='utf-8') as f:
                json.dump(queue, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Post queue saving error: {e}")
    
    def add_to_queue(self, text: str, media_paths: Optional[List[str]] = None, 
                    scheduled_time: Optional[str] = None) -> bool:
        """Add to post queue"""
        try:
            queue = self._load_post_queue()
            
            post_data = {
                "id": f"post_{int(time.time())}",
                "text": text,
                "media_paths": media_paths or [],
                "scheduled_time": scheduled_time or datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
                "status": "pending"
            }
            
            queue.append(post_data)
            self._save_post_queue(queue)
            
            logger.info(f"Added to post queue: {post_data['id']}")
            return True
            
        except Exception as e:
            logger.error(f"Post queue addition error: {e}")
            return False
    
    def process_queue(self):
        """Process post queue"""
        try:
            queue = self._load_post_queue()
            if not queue:
                return
            
            current_time = datetime.now()
            processed_posts = []
            
            for post_data in queue:
                if post_data["status"] != "pending":
                    continue
                
                # Check scheduled time
                scheduled_time = datetime.fromisoformat(post_data["scheduled_time"])
                if scheduled_time > current_time:
                    continue
                
                # Execute post
                logger.info(f"Queue post execution: {post_data['id']}")
                
                if post_data["media_paths"]:
                    tweet_id = self.poster.post_with_media(
                        text=post_data["text"],
                        media_paths=post_data["media_paths"]
                    )
                else:
                    tweet_id = self.poster.post_text(text=post_data["text"])
                
                if tweet_id:
                    post_data["status"] = "posted"
                    post_data["tweet_id"] = tweet_id
                    post_data["posted_at"] = current_time.isoformat()
                    logger.info(f"Queue post successful: {tweet_id}")
                else:
                    post_data["status"] = "failed"
                    post_data["failed_at"] = current_time.isoformat()
                    logger.warning(f"Queue post failed: {post_data['id']}")
                
                processed_posts.append(post_data)
            
            # Remove processed posts from queue
            if processed_posts:
                remaining_queue = [p for p in queue if p["id"] not in [pp["id"] for pp in processed_posts]]
                self._save_post_queue(remaining_queue)
                logger.info(f"Queue processing completed: {len(processed_posts)} posts")
            
        except Exception as e:
            logger.error(f"Queue processing error: {e}")
    
    def scheduled_post(self):
        """Execute scheduled post"""
        try:
            logger.info("Scheduled post started")
            
            # Check if posting is possible
            if not self.poster._can_post_now():
                logger.info("Posting conditions not met")
                return
            
            # Process posts from queue
            self.process_queue()
            
            # Random post (optional)
            self._random_post()
            
        except Exception as e:
            logger.error(f"Scheduled post error: {e}")
    
    def _random_post(self):
        """Random post (sample)"""
        try:
            # Sample post texts
            sample_posts = [
                "Have a wonderful day! ✨ #GodshipMall",
                "New products have been added! Check them out 🛍️",
                "Thank you to all our followers 🙏",
                "How's the weather today? ☀️",
                "Why not shop at Godship Mall? 🛒",
                "Bringing you the latest trends 📈",
                "We're waiting for your comments 💬",
                "Have a wonderful day 🌟"
            ]
            
            import random
            text = random.choice(sample_posts)
            
            # Execute random post
            tweet_id = self.poster.post_text(text)
            if tweet_id:
                logger.info(f"Random post successful: {tweet_id}")
            
        except Exception as e:
            logger.error(f"Random post error: {e}")
    
    def start_scheduler(self):
        """Start scheduler"""
        try:
            if self.running:
                logger.warning("Scheduler is already running")
                return
            
            # Schedule setup
            schedule.every(5).minutes.do(self.scheduled_post)  # Every 5 minutes
            schedule.every().hour.do(self._cleanup_old_posts)  # Cleanup every hour
            
            self.running = True
            logger.info("X auto posting scheduler started")
            
            # Scheduler execution loop
            while self.running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            
        except KeyboardInterrupt:
            logger.info("Scheduler stop requested")
            self.stop_scheduler()
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            self.stop_scheduler()
    
    def stop_scheduler(self):
        """Stop scheduler"""
        self.running = False
        logger.info("X auto posting scheduler stopped")
    
    def _cleanup_old_posts(self):
        """Cleanup old post history"""
        try:
            # Delete post history older than 30 days
            cutoff_date = datetime.now() - timedelta(days=30)
            
            posts = self.poster.post_history.get("posts", [])
            filtered_posts = [
                post for post in posts 
                if datetime.fromisoformat(post["timestamp"]) > cutoff_date
            ]
            
            if len(posts) != len(filtered_posts):
                self.poster.post_history["posts"] = filtered_posts
                self.poster._save_post_history()
                logger.info(f"Old post history cleaned up: {len(posts) - len(filtered_posts)} posts deleted")
            
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status"""
        queue = self._load_post_queue()
        pending_count = len([p for p in queue if p["status"] == "pending"])
        
        return {
            "running": self.running,
            "queue_size": len(queue),
            "pending_posts": pending_count,
            "post_stats": self.poster.get_post_stats()
        }


def main():
    """Main function"""
    try:
        scheduler = XScheduler()
        
        # Display status
        status = scheduler.get_status()
        logger.info(f"Scheduler status: {status}")
        
        # Start scheduler
        scheduler.start_scheduler()
        
    except Exception as e:
        logger.error(f"Main process error: {e}")


if __name__ == "__main__":
    main()
