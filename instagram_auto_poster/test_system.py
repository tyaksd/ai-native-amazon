"""
Instagram Graph API Auto Posting System Test
Tests system functionality without actual posting
"""

import os
import json
import logging
from datetime import datetime
from instagram_graph_api import InstagramGraphAPI
from scheduler import InstagramScheduler

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_graph_api_system():
    """Graph API system test"""
    print("=== Graph API System Test ===")
    
    try:
        # Initialize system
        api = InstagramGraphAPI()
        
        # Check configuration
        print(f"Access token: {'Set' if api.access_token else 'Not set'}")
        print(f"Account ID: {'Set' if api.instagram_account_id else 'Not set'}")
        print(f"App ID: {'Set' if api.app_id else 'Not set'}")
        
        # Check posting limit
        can_post = api.can_post_today()
        print(f"Can post today: {can_post}")
        
        # Statistics
        stats = api.get_daily_stats()
        print(f"Today's statistics: {stats}")
        
        print("✅ Graph API system test completed")
        
    except Exception as e:
        print(f"❌ Graph API system test error: {e}")

def test_scheduler_system():
    """Scheduler system test"""
    print("=== Scheduler System Test ===")
    
    try:
        # Initialize scheduler
        scheduler = InstagramScheduler()
        
        # Add test data to post queue
        test_post = {
            'type': 'photo',
            'image_url': 'https://example.com/test_image.jpg',
            'caption': 'Test post'
        }
        scheduler.add_to_queue(test_post)
        
        # Check queue
        queue_count = len(scheduler.post_queue)
        print(f"Post queue count: {queue_count}")
        
        # Generate daily report
        scheduler.daily_report()
        
        print("✅ Scheduler system test completed")
        
    except Exception as e:
        print(f"❌ Scheduler system test error: {e}")

def test_configuration():
    """Configuration file test"""
    print("=== Configuration File Test ===")
    
    # Check configuration file existence
    config_files = ['config.env', 'config_graph_api.env.example']
    
    for config_file in config_files:
        if os.path.exists(config_file):
            print(f"✅ {config_file} exists")
        else:
            print(f"❌ {config_file} not found")
    
    # Check required environment variables
    required_vars = [
        'INSTAGRAM_ACCESS_TOKEN',
        'INSTAGRAM_ACCOUNT_ID',
        'FACEBOOK_APP_ID',
        'FACEBOOK_APP_SECRET'
    ]
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: Set")
        else:
            print(f"❌ {var}: Not set")

def test_file_structure():
    """File structure test"""
    print("=== File Structure Test ===")
    
    required_files = [
        'instagram_graph_api.py',
        'scheduler.py',
        'example_usage.py',
        'requirements.txt',
        'config_graph_api.env.example',
        'README.md'
    ]
    
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file} exists")
        else:
            print(f"❌ {file} not found")

def test_dependencies():
    """Dependencies test"""
    print("=== Dependencies Test ===")
    
    required_packages = [
        'python-dotenv',
        'schedule',
        'requests'
    ]
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} is installed")
        except ImportError:
            print(f"❌ {package} is not installed")

def create_test_data():
    """Create test data"""
    print("=== Creating Test Data ===")
    
    # Create test image files (no actual images included)
    test_images = ['test_image1.jpg', 'test_image2.jpg', 'test_image3.jpg']
    
    for image in test_images:
        if not os.path.exists(image):
            # Create dummy file
            with open(image, 'w') as f:
                f.write("# Test dummy image file")
            print(f"✅ Created {image}")
        else:
            print(f"✅ {image} already exists")

def cleanup_test_data():
    """Clean up test data"""
    print("=== Cleaning Up Test Data ===")
    
    test_files = [
        'test_image1.jpg',
        'test_image2.jpg', 
        'test_image3.jpg',
        'post_history.json',
        'post_history_graph.json',
        'post_queue.json',
        'session.json'
    ]
    
    for file in test_files:
        if os.path.exists(file):
            os.remove(file)
            print(f"✅ Removed {file}")

def main():
    """Main test execution"""
    print("Instagram Graph API Auto Posting System - Test Execution")
    print("=" * 50)
    
    # Create test data
    create_test_data()
    
    # Test each system
    test_file_structure()
    test_dependencies()
    test_configuration()
    test_graph_api_system()
    test_scheduler_system()
    
    # Clean up test data
    cleanup_test_data()
    
    print("\n" + "=" * 50)
    print("Test completed!")
    print("Please configure the settings file correctly before actual posting.")

if __name__ == "__main__":
    main()
