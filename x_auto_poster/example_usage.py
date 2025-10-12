#!/usr/bin/env python3
"""
X Auto Posting System Usage Examples
"""

import os
import time
from datetime import datetime, timedelta
from x_api import XAutoPoster
from scheduler import XScheduler


def example_basic_post():
    """Basic posting example"""
    print("=== Basic Posting Example ===")
    
    # Initialize X auto posting system
    poster = XAutoPoster()
    
    # Text post
    text = "X auto posting system test post! 🚀 #GodshipMall #AutoPost"
    tweet_id = poster.post_text(text)
    
    if tweet_id:
        print(f"Post successful: https://twitter.com/i/web/status/{tweet_id}")
    else:
        print("Post skipped (restricted or outside hours)")


def example_media_post():
    """Media posting example"""
    print("=== Media Posting Example ===")
    
    poster = XAutoPoster()
    
    # Media file paths (replace with actual files)
    media_paths = [
        "path/to/image1.jpg",
        "path/to/image2.jpg"
    ]
    
    text = "Delivering beautiful product images! 📸 #GodshipMall"
    
    # Media post
    tweet_id = poster.post_with_media(text, media_paths)
    
    if tweet_id:
        print(f"Media post successful: https://twitter.com/i/web/status/{tweet_id}")
    else:
        print("Media post skipped")


def example_scheduled_post():
    """Scheduled posting example"""
    print("=== Scheduled Posting Example ===")
    
    scheduler = XScheduler()
    
    # Add to post queue
    posts = [
        {
            "text": "Good morning! Have a great day ☀️ #GoodMorning",
            "scheduled_time": (datetime.now() + timedelta(minutes=1)).isoformat()
        },
        {
            "text": "Afternoon post! Let's keep going 💪 #Afternoon",
            "scheduled_time": (datetime.now() + timedelta(minutes=2)).isoformat()
        },
        {
            "text": "Good evening! Great work today 🌙 #GoodEvening",
            "scheduled_time": (datetime.now() + timedelta(minutes=3)).isoformat()
        }
    ]
    
    for post in posts:
        scheduler.add_to_queue(
            text=post["text"],
            scheduled_time=post["scheduled_time"]
        )
        print(f"Scheduled post added: {post['text']}")
    
    print("Scheduled posts have been added to the queue")


def example_user_info():
    """User information retrieval example"""
    print("=== User Information Retrieval Example ===")
    
    poster = XAutoPoster()
    
    # Get user information
    user_info = poster.get_user_info()
    if user_info:
        print(f"Username: @{user_info['username']}")
        print(f"Display name: {user_info['name']}")
        print(f"Followers: {user_info['followers_count']:,}")
        print(f"Following: {user_info['following_count']:,}")
        print(f"Tweets: {user_info['tweet_count']:,}")
    else:
        print("Failed to retrieve user information")


def example_post_stats():
    """Post statistics retrieval example"""
    print("=== Post Statistics Retrieval Example ===")
    
    poster = XAutoPoster()
    
    # Get post statistics
    stats = poster.get_post_stats()
    print(f"Today's posts: {stats['daily_posts']}/{stats['max_daily_posts']}")
    print(f"Remaining posts: {stats['remaining_posts']}")
    print(f"Last post time: {stats['last_post_time']}")
    print(f"Total posts: {stats['total_posts']}")


def example_scheduler_status():
    """Scheduler status retrieval example"""
    print("=== Scheduler Status Retrieval Example ===")
    
    scheduler = XScheduler()
    
    # Get scheduler status
    status = scheduler.get_status()
    print(f"Scheduler running: {status['running']}")
    print(f"Queue size: {status['queue_size']}")
    print(f"Pending posts: {status['pending_posts']}")
    print(f"Post statistics: {status['post_stats']}")


def example_batch_posts():
    """Batch posting example"""
    print("=== Batch Posting Example ===")
    
    poster = XAutoPoster()
    
    # Prepare multiple posts
    posts = [
        "How's the weather today? ☀️ #Weather",
        "New products have arrived! 🛍️ #NewProducts",
        "Thank you to all our followers 🙏 #Gratitude",
        "Have a wonderful day! ✨ #Positive",
        "Why not shop at Godship Mall? 🛒 #Shopping"
    ]
    
    successful_posts = 0
    
    for i, text in enumerate(posts, 1):
        print(f"Post {i}/{len(posts)}: {text}")
        
        tweet_id = poster.post_text(text)
        if tweet_id:
            successful_posts += 1
            print(f"  ✅ Success: {tweet_id}")
        else:
            print(f"  ❌ Skipped (restricted or outside hours)")
        
        # Wait between posts
        if i < len(posts):
            print("  Waiting for post interval...")
            time.sleep(2)
    
    print(f"Batch posting completed: {successful_posts}/{len(posts)} successful")


def main():
    """Main function"""
    print("X Auto Posting System Usage Examples")
    print("=" * 50)
    
    try:
        # Basic posting example
        example_basic_post()
        print()
        
        # User information retrieval example
        example_user_info()
        print()
        
        # Post statistics retrieval example
        example_post_stats()
        print()
        
        # Scheduler status retrieval example
        example_scheduler_status()
        print()
        
        # Scheduled posting example
        example_scheduled_post()
        print()
        
        # Batch posting example (commented out)
        # example_batch_posts()
        
        print("Usage examples execution completed")
        
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
