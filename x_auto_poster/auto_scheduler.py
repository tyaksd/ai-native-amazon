#!/usr/bin/env python3
"""
Auto Scheduler for X Brand Posting
Posts 12 tweets per day, 2 hours apart
"""

import os
import time
import schedule
from datetime import datetime, timedelta
from x_api import XAutoPoster
from loguru import logger

class AutoScheduler:
    """Auto scheduler for brand posting"""
    
    def __init__(self):
        """Initialize scheduler"""
        self.poster = XAutoPoster()
        self.post_count = 0
        self.max_posts_per_day = 12
        
        # Configure logging
        logger.remove()
        logger.add(
            "auto_scheduler.log",
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
            logger.info("Starting scheduled brand post...")
            
            # Check if we've reached daily limit
            if self.post_count >= self.max_posts_per_day:
                logger.info(f"Daily limit reached: {self.post_count}/{self.max_posts_per_day}")
                return
            
            # Post random brand
            tweet_id = self.poster.post_random_brand()
            
            if tweet_id:
                self.post_count += 1
                logger.info(f"✅ Scheduled post successful: {tweet_id}")
                logger.info(f"📊 Posts today: {self.post_count}/{self.max_posts_per_day}")
                logger.info(f"🔗 View at: https://twitter.com/i/web/status/{tweet_id}")
            else:
                logger.error("❌ Scheduled post failed")
                
        except Exception as e:
            logger.error(f"Scheduled post error: {e}")
    
    def reset_daily_count(self):
        """Reset daily post count at midnight"""
        self.post_count = 0
        logger.info("🔄 Daily post count reset")
    
    def setup_schedule(self):
        """Setup the posting schedule"""
        logger.info("Setting up auto scheduler...")
        
        # Reset daily count at midnight
        schedule.every().day.at("00:00").do(self.reset_daily_count)
        
        # Schedule posts every 2 hours from 6:00 to 4:00 (12 posts total)
        posting_times = [
            "06:00", "08:00", "10:00", "12:00", "14:00", "16:00",
            "18:00", "20:00", "22:00", "00:00", "02:00", "04:00"
        ]
        
        for time_str in posting_times:
            schedule.every().day.at(time_str).do(self.post_brand)
            logger.info(f"📅 Scheduled post at {time_str}")
        
        logger.info(f"✅ Auto scheduler configured for {len(posting_times)} posts per day")
    
    def run(self):
        """Run the scheduler"""
        logger.info("🚀 Auto scheduler started")
        logger.info("📅 Posts scheduled every 2 hours")
        logger.info("⏰ Next posts: 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00, 00:00, 02:00, 04:00")
        
        self.setup_schedule()
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("🛑 Auto scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)

def main():
    """Main function"""
    try:
        scheduler = AutoScheduler()
        scheduler.run()
    except Exception as e:
        logger.error(f"Auto scheduler error: {e}")

if __name__ == "__main__":
    main()
