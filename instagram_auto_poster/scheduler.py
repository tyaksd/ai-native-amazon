"""
Instagram Auto Posting Scheduler
Manages scheduled posts
"""

import os
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pathlib import Path

import schedule
from dotenv import load_dotenv

# Import posting system
from instagram_graph_api import InstagramGraphAPI

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class InstagramScheduler:
    """Instagram Auto Posting Scheduler"""
    
    def __init__(self):
        """
        Initialize
        """
        self.poster = InstagramGraphAPI()
        
        # Post queue
        self.post_queue_file = 'post_queue.json'
        self.post_queue = self._load_post_queue()
        
        # Schedule settings
        self.post_interval_hours = int(os.getenv('POST_INTERVAL_HOURS', '24'))
        self.max_posts_per_day = int(os.getenv('MAX_POSTS_PER_DAY', '3'))
        
    def _load_post_queue(self) -> List[Dict[str, Any]]:
        """Load post queue"""
        import json
        try:
            if os.path.exists(self.post_queue_file):
                with open(self.post_queue_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load post queue: {e}")
        return []
    
    def _save_post_queue(self):
        """Save post queue"""
        import json
        try:
            with open(self.post_queue_file, 'w', encoding='utf-8') as f:
                json.dump(self.post_queue, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Failed to save post queue: {e}")
    
    def add_to_queue(self, post_data: Dict[str, Any]):
        """
        Add to post queue
        
        Args:
            post_data: Post data
        """
        post_data['id'] = f"post_{int(time.time())}"
        post_data['created_at'] = datetime.now().isoformat()
        post_data['status'] = 'pending'
        
        self.post_queue.append(post_data)
        self._save_post_queue()
        logger.info(f"Added post to queue: {post_data['id']}")
    
    def process_queue(self):
        """Process post queue"""
        if not self.post_queue:
            logger.info("Post queue is empty")
            return
        
        # Check today's posting limit
        if not self.poster.can_post_today():
            logger.warning("Daily posting limit reached")
            return
        
        # Get next post
        next_post = None
        for post in self.post_queue:
            if post.get('status') == 'pending':
                next_post = post
                break
        
        if not next_post:
            logger.info("No posts waiting to be processed")
            return
        
        try:
            # Execute post
            success = self._execute_post(next_post)
            
            if success:
                next_post['status'] = 'completed'
                next_post['completed_at'] = datetime.now().isoformat()
                logger.info(f"Post completed: {next_post['id']}")
            else:
                next_post['status'] = 'failed'
                next_post['failed_at'] = datetime.now().isoformat()
                logger.error(f"Post failed: {next_post['id']}")
            
            self._save_post_queue()
            
        except Exception as e:
            logger.error(f"Post processing error: {e}")
            next_post['status'] = 'error'
            next_post['error'] = str(e)
            self._save_post_queue()
    
    def _execute_post(self, post_data: Dict[str, Any]) -> bool:
        """
        Execute post
        
        Args:
            post_data: Post data
            
        Returns:
            bool: True if successful
        """
        post_type = post_data.get('type', 'photo')
        
        try:
            if post_type == 'photo':
                return self.poster.post_photo_from_url(
                    post_data['image_url'], 
                    post_data.get('caption')
                )
            
            elif post_type == 'carousel':
                return self.poster.post_carousel_from_urls(
                    post_data['image_urls'], 
                    post_data.get('caption')
                )
            
            else:
                logger.error(f"Unsupported post type: {post_type}")
                return False
                
        except Exception as e:
            logger.error(f"Post execution error: {e}")
            return False
    
    def schedule_posts(self):
        """Set up post schedule"""
        # Regular post processing
        schedule.every(self.post_interval_hours).hours.do(self.process_queue)
        
        # Daily statistics report at 9:00 AM
        schedule.every().day.at("09:00").do(self.daily_report)
        
        # Queue cleanup every Sunday at 11:00 PM
        schedule.every().sunday.at("23:00").do(self.cleanup_queue)
        
        logger.info(f"Schedule setup complete: posting every {self.post_interval_hours} hours")
    
    def daily_report(self):
        """Generate daily report"""
        stats = self.poster.get_daily_stats()
        queue_count = len([p for p in self.post_queue if p.get('status') == 'pending'])
        
        report = f"""
=== Instagram Auto Posting Daily Report ===
Date: {stats['date']}
Today's posts: {stats['post_count']}/{stats['max_posts']}
Remaining posts: {stats['remaining_posts']}
Posts in queue: {queue_count}
===============================
        """
        
        logger.info(report)
    
    def cleanup_queue(self):
        """Clean up post queue"""
        # Remove completed posts (older than 30 days)
        cutoff_date = datetime.now() - timedelta(days=30)
        
        original_count = len(self.post_queue)
        self.post_queue = [
            post for post in self.post_queue
            if post.get('status') != 'completed' or 
            datetime.fromisoformat(post.get('completed_at', '1970-01-01')) > cutoff_date
        ]
        
        removed_count = original_count - len(self.post_queue)
        if removed_count > 0:
            logger.info(f"Removed {removed_count} old posts from queue")
            self._save_post_queue()
    
    def run_scheduler(self):
        """Run scheduler"""
        logger.info("Instagram Graph API auto posting scheduler started")
        
        # Set up schedule
        self.schedule_posts()
        
        # Main loop
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Scheduler stopped")
        except Exception as e:
            logger.error(f"Scheduler error: {e}")


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Instagram Graph API Auto Posting Scheduler')
    parser.add_argument('--test', action='store_true',
                       help='Test mode (no actual posting)')
    
    args = parser.parse_args()
    
    if args.test:
        logger.info("Running in test mode")
        # Test configuration
        os.environ['MAX_POSTS_PER_DAY'] = '0'  # Disable posting
    
    scheduler = InstagramScheduler()
    scheduler.run_scheduler()


if __name__ == "__main__":
    main()
