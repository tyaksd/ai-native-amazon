"""
Instagram Graph API Auto Posting System Usage Examples
"""

import os
import time
from datetime import datetime
from instagram_graph_api import InstagramGraphAPI
from scheduler import InstagramScheduler

def example_graph_api_usage():
    """Instagram Graph API usage example"""
    print("=== Instagram Graph API Usage Example ===")
    
    # Initialize Graph API posting system
    api = InstagramGraphAPI()
    
    # Get account information
    account_info = api.get_account_info()
    if account_info:
        print(f"Account info: {account_info}")
    
    # Post image from URL
    print("Posting image from URL...")
    success = api.post_photo_from_url(
        image_url="https://example.com/sample.jpg",
        caption="📸 Graph API Post!\n\n#GraphAPI #OfficialAPI #Instagram"
    )
    
    if success:
        print("Graph API post successful!")
    else:
        print("Graph API post failed")
    
    # Carousel post
    print("Posting carousel from URLs...")
    success = api.post_carousel_from_urls(
        image_urls=[
            "https://example.com/image1.jpg",
            "https://example.com/image2.jpg",
            "https://example.com/image3.jpg"
        ],
        caption="📸 Graph API Carousel Post!\n\n#GraphAPI #Carousel"
    )
    
    if success:
        print("Graph API carousel post successful!")
    else:
        print("Graph API carousel post failed")

def example_scheduler_usage():
    """Scheduler usage example"""
    print("=== Scheduler Usage Example ===")
    
    # Initialize scheduler
    scheduler = InstagramScheduler()
    
    # Add to post queue
    post_data = {
        'type': 'photo',
        'image_url': 'https://example.com/sample_image.jpg',
        'caption': '📸 Scheduled Post!\n\n#Scheduled #AutoPost'
    }
    scheduler.add_to_queue(post_data)
    
    # Add carousel post to queue
    carousel_data = {
        'type': 'carousel',
        'image_urls': [
            'https://example.com/image1.jpg', 
            'https://example.com/image2.jpg'
        ],
        'caption': '📸 Scheduled Carousel Post!'
    }
    scheduler.add_to_queue(carousel_data)
    
    print("Added to post queue")
    
    # Process queue manually
    scheduler.process_queue()
    
    # Display statistics
    stats = scheduler.poster.get_daily_stats()
    print(f"Today's posting status: {stats['post_count']}/{stats['max_posts']}")

def example_batch_posting():
    """Batch posting example"""
    print("=== Batch Posting Example ===")
    
    # Initialize posting system
    api = InstagramGraphAPI()
    
    # Post multiple images sequentially
    images = [
        {"url": "https://example.com/image1.jpg", "caption": "First image!"},
        {"url": "https://example.com/image2.jpg", "caption": "Second image!"},
        {"url": "https://example.com/image3.jpg", "caption": "Third image!"}
    ]
    
    for i, img in enumerate(images):
        print(f"Post {i+1}/{len(images)}: {img['url']}")
        
        success = api.post_photo_from_url(
            image_url=img['url'],
            caption=img['caption']
        )
        
        if success:
            print(f"Post {i+1} successful!")
        else:
            print(f"Post {i+1} failed")
        
        # Wait between posts (spam prevention)
        if i < len(images) - 1:
            print("Waiting for next post...")
            time.sleep(300)  # Wait 5 minutes

def example_analytics():
    """Analytics example"""
    print("=== Analytics Example ===")
    
    # Use Graph API (analytics only available with Graph API)
    api = InstagramGraphAPI()
    
    # Get post history
    history = api.get_post_history()
    print(f"Total posts: {len(history)}")
    
    # Display recent posts
    recent_posts = sorted(history, key=lambda x: x.get('timestamp', ''), reverse=True)[:5]
    print("Recent posts:")
    for post in recent_posts:
        timestamp = post.get('timestamp', 'Unknown')
        media_id = post.get('media_id', 'Unknown')
        print(f"  - {timestamp}: {media_id}")
    
    # Daily statistics
    stats = api.get_daily_stats()
    print(f"Today's statistics: {stats}")

def example_media_insights():
    """Media insights example"""
    print("=== Media Insights Example ===")
    
    api = InstagramGraphAPI()
    
    # Get latest media ID from post history
    history = api.get_post_history()
    if history:
        latest_post = history[-1]
        media_id = latest_post.get('media_id')
        
        if media_id:
            print(f"Getting insights for media ID {media_id}...")
            insights = api.get_media_insights(media_id)
            
            if insights:
                print("Insights data:")
                for metric, value in insights.items():
                    print(f"  {metric}: {value}")
            else:
                print("Could not retrieve insights data")
        else:
            print("Media ID not found")
    else:
        print("No post history")

def main():
    """Main execution function"""
    print("Instagram Graph API Auto Posting System - Usage Examples")
    print("=" * 50)
    
    # Execute examples
    try:
        # Note: Actual image URLs required
        print("Note: Change to actual image URLs before running")
        
        # example_graph_api_usage()
        # example_scheduler_usage()
        # example_batch_posting()
        # example_analytics()
        # example_media_insights()
        
        print("\nSkipped example execution")
        print("Set actual image URLs before running")
        
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    main()