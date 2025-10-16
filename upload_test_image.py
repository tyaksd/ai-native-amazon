#!/usr/bin/env python3
"""
Upload a test image to Cloudinary for Instagram testing
"""

import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/jackyasui/Desktop/godship-mall2/instagram_auto_poster/config.env')

def upload_test_image():
    """Upload a test image to Cloudinary"""
    
    # Cloudinary credentials
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    print(f"Cloudinary Cloud Name: {cloud_name}")
    print(f"API Key: {api_key[:10]}...")
    
    # Create a simple test image (1x1 pixel PNG)
    import base64
    
    # Simple 1x1 pixel PNG in base64
    png_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    # Upload to Cloudinary
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    
    data = {
        'file': f'data:image/png;base64,{png_data}',
        'public_id': 'test-instagram-image',
        'folder': 'sns-uploads',
        'upload_preset': 'asi10c9ad'
    }
    
    auth = (api_key, api_secret)
    
    try:
        response = requests.post(url, data=data, auth=auth)
        result = response.json()
        
        if response.status_code == 200:
            image_url = result['secure_url']
            print(f"✅ Image uploaded successfully: {image_url}")
            return image_url
        else:
            print(f"❌ Upload failed: {result}")
            return None
            
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

if __name__ == "__main__":
    image_url = upload_test_image()
    if image_url:
        print(f"\nUse this URL for Instagram testing: {image_url}")
