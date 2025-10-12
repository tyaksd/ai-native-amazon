# Instagram Graph API Auto Posting System

A Python system for automatically posting to Instagram using Instagram Graph API (Official API).

## Features

- 📸 Single image auto posting
- 🖼️ Carousel (multiple image) posting
- ⏰ Scheduled posting
- 📊 Post statistics and analytics
- 🔄 Post queue management
- 📝 Automatic hashtag generation
- 🛡️ Posting limit management
- 📈 Media insights retrieval

## Prerequisites

- **Business Account**: Instagram account must be converted to business account
- **Facebook Page**: Instagram account must be linked to Facebook page
- **Facebook Developer Account**: Required to obtain API keys

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Create Configuration File

Copy `config_graph_api.env.example` to `config.env` and enter your settings.

```env
# Facebook/Instagram Graph API Settings
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_ACCOUNT_ID=your_account_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Post Settings
DEFAULT_CAPTION=#AutoPost #Python
DEFAULT_HASHTAGS=#Python #Automation #Instagram #Tech

# Schedule Settings
POST_INTERVAL_HOURS=24
MAX_POSTS_PER_DAY=3
```

### 3. Obtain API Keys

Please refer to `API_SETUP_GUIDE.md` for detailed setup instructions.

## Usage

### Basic Posting

```python
from instagram_graph_api import InstagramGraphAPI

# Initialize posting system
api = InstagramGraphAPI()

# Post image from URL
api.post_photo_from_url(
    image_url="https://example.com/sample.jpg",
    caption="📸 Test post!"
)

# Carousel post
api.post_carousel_from_urls(
    image_urls=[
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
    ],
    caption="📸 Multiple image post!"
)
```

### Scheduled Posting

```python
from scheduler import InstagramScheduler

# Initialize scheduler
scheduler = InstagramScheduler()

# Add to post queue
post_data = {
    'type': 'photo',
    'image_url': 'https://example.com/sample.jpg',
    'caption': '📸 Scheduled post!'
}
scheduler.add_to_queue(post_data)

# Run scheduler
scheduler.run_scheduler()
```

### Command Line Execution

```bash
# Run scheduler
python scheduler.py

# Test mode
python scheduler.py --test
```

## API Key Setup

### 1. Create Facebook Developer Account

1. Visit [Facebook Developers](https://developers.facebook.com/)
2. Create account or login

### 2. Create App

1. Click "Create App"
2. Enter app name
3. Enter contact email address

### 3. Setup Instagram Graph API

1. Add "Instagram Graph API"
2. Connect business account
3. Request required permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`

### 4. Get Keys

- **Access Token**: Get from Instagram Basic Display API
- **Account ID**: Execute `/me/accounts` in Graph API Explorer
- **App ID/Secret**: Check in app dashboard

## Examples

Detailed usage examples are in `example_usage.py`.

```python
# Basic posting
from instagram_graph_api import InstagramGraphAPI

api = InstagramGraphAPI()
api.post_photo_from_url("https://example.com/image.jpg", "Caption")

# Batch posting
images = [
    {"url": "https://example.com/image1.jpg", "caption": "First image"},
    {"url": "https://example.com/image2.jpg", "caption": "Second image"}
]

for img in images:
    api.post_photo_from_url(img['url'], img['caption'])
    time.sleep(300)  # 5 minute intervals

# Analytics
insights = api.get_media_insights(media_id)
stats = api.get_daily_stats()
```

## Testing

Test system functionality:

```bash
python test_system.py
```

## Important Notes

### Terms of Service Compliance

- Please check Instagram's terms of service
- Excessive automatic posting may result in account suspension
- Set appropriate posting intervals

### Security

- Manage authentication information securely
- Add `.env` file to `.gitignore`
- Use environment variables in production

### Limitations

- Set daily posting limits
- Business account required
- Facebook page integration required

## File Structure

```
instagram_auto_poster/
├── instagram_graph_api.py      # Graph API posting system
├── scheduler.py                # Scheduler
├── example_usage.py            # Usage examples
├── test_system.py             # System tests
├── requirements.txt           # Dependencies
├── config_graph_api.env.example # Configuration example
├── API_SETUP_GUIDE.md         # API setup guide
└── README.md                  # This file
```

## Troubleshooting

### Common Errors

#### Access Token Error
```
Error: Invalid access token
```
**Solution:**
- Regenerate access token
- Check permissions

#### Account ID Error
```
Error: Invalid account ID
```
**Solution:**
- Convert to business account
- Link with Facebook page

#### Permission Error
```
Error: Insufficient permissions
```
**Solution:**
- Request required permissions
- Pass app review

## License

This project is released under the MIT License.

## Contributing

Pull requests and issue reports are welcome.

## Disclaimer

Use this system at your own risk. Please be careful as it may violate Instagram's terms of service.