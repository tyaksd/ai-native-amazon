#!/usr/bin/env python3
"""
Test posting to Instagram and X
"""

import os
import sys
import time
from datetime import datetime

# Add the directories to Python path
sys.path.append('/Users/jackyasui/Desktop/godship-mall2/instagram_auto_poster')
sys.path.append('/Users/jackyasui/Desktop/godship-mall2/x_auto_poster')

def test_instagram_posting():
    """Test Instagram posting"""
    print("🎯 Testing Instagram posting...")
    
    try:
        # Change to the correct directory
        os.chdir('/Users/jackyasui/Desktop/godship-mall2/instagram_auto_poster')
        
        from instagram_brand_poster_simple import InstagramBrandPosterSimple
        
        # Set environment variables for test
        os.environ['POST_TEXT'] = f"🧪 Test post from Python script - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        # Use the uploaded Cloudinary image
        os.environ['POST_IMAGE_URL'] = "https://res.cloudinary.com/dmoyeva1q/image/upload/v1760591807/sns-uploads/test-instagram-image.png"
        
        poster = InstagramBrandPosterSimple()
        
        # Test posting
        result = poster.post_with_content(
            text=os.environ['POST_TEXT'],
            image_url=os.environ['POST_IMAGE_URL']
        )
        
        if result:
            print(f"✅ Instagram test post successful: {result}")
            return True
        else:
            print("❌ Instagram test post failed")
            return False
            
    except Exception as e:
        print(f"❌ Instagram test error: {e}")
        return False

def test_x_posting():
    """Test X posting"""
    print("🎯 Testing X posting...")
    
    try:
        # Change to the correct directory
        os.chdir('/Users/jackyasui/Desktop/godship-mall2/x_auto_poster')
        
        from x_api import XAutoPoster
        
        # Set environment variables for test
        os.environ['POST_TEXT'] = f"🧪 Test post from Python script - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        poster = XAutoPoster()
        
        # Test posting
        result = poster.post_with_content(
            text=os.environ['POST_TEXT']
        )
        
        if result:
            print(f"✅ X test post successful: {result}")
            return True
        else:
            print("❌ X test post failed")
            return False
            
    except Exception as e:
        print(f"❌ X test error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting social media posting tests...")
    print("=" * 50)
    
    # Test Instagram
    instagram_success = test_instagram_posting()
    print()
    
    # Test X
    x_success = test_x_posting()
    print()
    
    # Summary
    print("=" * 50)
    print("📊 Test Results:")
    print(f"Instagram: {'✅ Success' if instagram_success else '❌ Failed'}")
    print(f"X: {'✅ Success' if x_success else '❌ Failed'}")
    
    if instagram_success and x_success:
        print("🎉 All tests passed!")
    else:
        print("⚠️ Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    main()
