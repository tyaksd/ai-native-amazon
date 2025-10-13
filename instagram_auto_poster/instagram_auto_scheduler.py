#!/usr/bin/env python3
"""
Instagram Auto Scheduler for Brand Posting
Posts 3 times per day, 8 hours apart
"""

import os
import time
import schedule
from datetime import datetime, timedelta
from instagram_brand_poster import InstagramBrandPoster
from loguru import logger

class InstagramAutoScheduler:
    """Instagram auto scheduler for brand posting"""
    
    def __init__(self):
        """Initialize scheduler"""
        self.poster = InstagramBrandPoster()
        self.post_count = 0
        self.max_posts_per_day = 3  # Instagram limit: 3 posts per day
        
        # Configure logging
        logger.remove()
        logger.add(
            "instagram_auto_scheduler.log",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
            rotation="1 day",
            retention="30 days"
        )
        logger.add(
            lambda msg: print(msg, end=""),
            level="INFO"
        )
    
    def post_brand(self):
        """Post about a random brand"""
        try:
            logger.info("Starting scheduled Instagram brand post...")
            
            # Check if we've reached daily limit
            if self.post_count >= self.max_posts_per_day:
                logger.info(f"Daily limit reached: {self.post_count}/{self.max_posts_per_day}")
                return
            
            # Post random brand
            media_id = self.poster.post_brand_carousel()
            
            if media_id:
                self.post_count += 1
                logger.info(f"✅ Scheduled Instagram post successful: {media_id}")
                logger.info(f"📊 Posts today: {self.post_count}/{self.max_posts_per_day}")
            else:
                logger.error("❌ Scheduled Instagram post failed")
                
        except Exception as e:
            logger.error(f"Scheduled Instagram post error: {e}")
    
    def reset_daily_count(self):
        """Reset daily post count at midnight"""
        self.post_count = 0
        logger.info("🔄 Daily Instagram post count reset")
    
    def setup_schedule(self):
        """Setup the posting schedule"""
        logger.info("Setting up Instagram auto scheduler...")
        
        # Reset daily count at midnight
        schedule.every().day.at("00:00").do(self.reset_daily_count)
        
        # Schedule posts every 8 hours (3 posts per day)
        posting_times = ["08:00", "16:00", "00:00"]
        
        for time_str in posting_times:
            schedule.every().day.at(time_str).do(self.post_brand)
            logger.info(f"📅 Scheduled Instagram post at {time_str}")
        
        logger.info(f"✅ Instagram auto scheduler configured for {len(posting_times)} posts per day")
    
    def run(self):
        """Run the scheduler"""
        logger.info("🚀 Instagram auto scheduler started")
        logger.info("📅 Posts scheduled every 8 hours")
        logger.info("⏰ Next posts: 08:00, 16:00, 00:00")
        
        self.setup_schedule()
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("🛑 Instagram auto scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Instagram scheduler error: {e}")
                time.sleep(60)

def main():
    """Main function"""
    try:
        scheduler = InstagramAutoScheduler()
        scheduler.run()
    except Exception as e:
        logger.error(f"Instagram auto scheduler error: {e}")

if __name__ == "__main__":
    main()
