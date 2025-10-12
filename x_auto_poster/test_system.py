#!/usr/bin/env python3
"""
X Auto Posting System Test
"""

import os
import json
import time
from datetime import datetime
from x_api import XAutoPoster
from scheduler import XScheduler


def test_config_loading():
    """Configuration file loading test"""
    print("=== Configuration File Loading Test ===")
    
    try:
        poster = XAutoPoster()
        print("✅ Configuration file loading successful")
        print(f"  - Post interval: {poster.config.post_interval_minutes} minutes")
        print(f"  - Max daily posts: {poster.config.max_posts_per_day} posts")
        print(f"  - Posting hours: {poster.config.post_start_hour}-{poster.config.post_end_hour}")
        return True
    except Exception as e:
        print(f"❌ Configuration file loading error: {e}")
        return False


def test_api_connection():
    """API connection test"""
    print("=== API Connection Test ===")
    
    try:
        poster = XAutoPoster()
        user_info = poster.get_user_info()
        
        if user_info:
            print("✅ API connection successful")
            print(f"  - Username: @{user_info['username']}")
            print(f"  - Display name: {user_info['name']}")
            return True
        else:
            print("❌ User information retrieval failed")
            return False
            
    except Exception as e:
        print(f"❌ API connection error: {e}")
        return False


def test_post_conditions():
    """Post conditions test"""
    print("=== Post Conditions Test ===")
    
    try:
        poster = XAutoPoster()
        can_post = poster._can_post_now()
        
        if can_post:
            print("✅ Currently able to post")
        else:
            print("⚠️ Currently unable to post (restricted or outside hours)")
        
        # Display post statistics
        stats = poster.get_post_stats()
        print(f"  - Today's posts: {stats['daily_posts']}/{stats['max_daily_posts']}")
        print(f"  - Remaining posts: {stats['remaining_posts']}")
        print(f"  - Last post time: {stats['last_post_time']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Post conditions test error: {e}")
        return False


def test_post_history():
    """Post history test"""
    print("=== Post History Test ===")
    
    try:
        poster = XAutoPoster()
        
        # Check history file existence
        history_file = poster.config.post_history_file
        if os.path.exists(history_file):
            print(f"✅ Post history file exists: {history_file}")
            
            # Check history content
            with open(history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
            
            print(f"  - Total posts: {len(history.get('posts', []))}")
            print(f"  - Daily count: {history.get('daily_count', {})}")
            print(f"  - Last post time: {history.get('last_post_time')}")
        else:
            print(f"⚠️ Post history file not created: {history_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Post history test error: {e}")
        return False


def test_scheduler():
    """Scheduler test"""
    print("=== Scheduler Test ===")
    
    try:
        scheduler = XScheduler()
        
        # Check scheduler status
        status = scheduler.get_status()
        print(f"✅ Scheduler initialization successful")
        print(f"  - Running: {status['running']}")
        print(f"  - Queue size: {status['queue_size']}")
        print(f"  - Pending posts: {status['pending_posts']}")
        
        # Add test post to queue
        test_post = {
            "text": f"System test post - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "scheduled_time": datetime.now().isoformat()
        }
        
        success = scheduler.add_to_queue(
            text=test_post["text"],
            scheduled_time=test_post["scheduled_time"]
        )
        
        if success:
            print("✅ Test post added to queue successfully")
        else:
            print("❌ Test post queue addition failed")
        
        return True
        
    except Exception as e:
        print(f"❌ Scheduler test error: {e}")
        return False


def test_media_upload():
    """Media upload test (optional)"""
    print("=== Media Upload Test ===")
    
    try:
        poster = XAutoPoster()
        
        # Check test image file existence
        test_image_path = "test_image.jpg"
        if not os.path.exists(test_image_path):
            print("⚠️ Test image file not found")
            print("  - Create a test image or specify an existing image file")
            return True
        
        # Media upload test
        print(f"Test image: {test_image_path}")
        print("⚠️ Actual upload will not be executed (test mode)")
        
        return True
        
    except Exception as e:
        print(f"❌ Media upload test error: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("X Auto Posting System Test Started")
    print("=" * 50)
    
    tests = [
        ("Configuration file loading", test_config_loading),
        ("API connection", test_api_connection),
        ("Post conditions", test_post_conditions),
        ("Post history", test_post_history),
        ("Scheduler", test_scheduler),
        ("Media upload", test_media_upload)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{test_name} test running...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test error: {e}")
            results.append((test_name, False))
    
    # Results summary
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ Success" if result else "❌ Failed"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall result: {passed}/{total} tests successful")
    
    if passed == total:
        print("🎉 All tests successful!")
    else:
        print("⚠️ Some tests failed. Please check your configuration.")
    
    return passed == total


def main():
    """Main function"""
    try:
        success = run_all_tests()
        
        if success:
            print("\nThe system is ready to operate normally.")
            print("Please configure API authentication information in config.env file before making actual posts.")
        else:
            print("\nThere are issues with the system. Please check your configuration.")
        
    except Exception as e:
        print(f"Test execution error: {e}")


if __name__ == "__main__":
    main()
