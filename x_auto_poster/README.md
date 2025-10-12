# X Auto Posting System

A Python system for automated posting to X (formerly Twitter). Features a scheduler for regular and scheduled posts.

## Features

- ✅ X API v2 support
- ✅ Text posting
- ✅ Media posting (images)
- ✅ Scheduled posting
- ✅ Post limit management (daily limits, time restrictions, post intervals)
- ✅ Post history management
- ✅ Auto scheduler
- ✅ Logging functionality
- ✅ Error handling

## Setup

### 1. Install Dependencies

```bash
cd x_auto_poster
pip install -r requirements.txt
```

### 2. Get X API Authentication

1. Access [X Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Get the following authentication information:
   - API Key (Consumer Key)
   - API Secret Key (Consumer Secret)
   - Access Token
   - Access Token Secret
   - Bearer Token

### 3. Create Configuration File

```bash
cp config.env.example config.env
```

Edit the `config.env` file and enter the obtained authentication information:

```env
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here
X_BEARER_TOKEN=your_bearer_token_here
```

### 4. System Test

```bash
python test_system.py
```

## Usage

### Basic Posting

```python
from x_api import XAutoPoster

# Initialize system
poster = XAutoPoster()

# Text post
tweet_id = poster.post_text("Hello! This is X auto posting system 🚀")

# Media post
tweet_id = poster.post_with_media(
    text="Delivering beautiful images 📸",
    media_paths=["image1.jpg", "image2.jpg"]
)
```

### Using Scheduler

```python
from scheduler import XScheduler

# Initialize scheduler
scheduler = XScheduler()

# Add to post queue
scheduler.add_to_queue(
    text="Scheduled post!",
    scheduled_time="2024-01-01T12:00:00"
)

# Start scheduler
scheduler.start_scheduler()
```

### Command Line Execution

#### Basic posting test
```bash
python x_api.py
```

#### Scheduler execution
```bash
python scheduler.py
```

#### Run usage examples
```bash
python example_usage.py
```

## Configuration Options

The following settings can be configured in the `config.env` file:

| Setting | Description | Default Value |
|---------|-------------|---------------|
| `POST_INTERVAL_MINUTES` | Post interval (minutes) | 60 |
| `MAX_POSTS_PER_DAY` | Maximum posts per day | 10 |
| `POST_START_HOUR` | Post start hour | 9 |
| `POST_END_HOUR` | Post end hour | 21 |
| `LOG_LEVEL` | Log level | INFO |
| `ENABLE_SCHEDULER` | Enable scheduler | true |

## File Structure

```
x_auto_poster/
├── x_api.py              # Main API
├── scheduler.py             # Scheduler
├── example_usage.py         # Usage examples
├── test_system.py          # System tests
├── requirements.txt        # Dependencies
├── config.env.example      # Configuration file example
├── config.env             # Configuration file (needs to be created)
├── post_history_x.json    # Post history (auto-generated)
├── post_queue.json        # Post queue (auto-generated)
├── x_api.log             # API logs (auto-generated)
└── scheduler.log          # Scheduler logs (auto-generated)
```

## Post Limits

The system automatically manages the following limits:

- **Daily limits**: Maximum posts per day
- **Time restrictions**: Allowed posting hours
- **Post intervals**: Minimum interval between posts
- **API limits**: X API rate limits

## Logging

- **x_api.log**: API-related logs
- **scheduler.log**: Scheduler-related logs
- Log rotation: Daily
- Log retention: 30 days

## Error Handling

- API authentication errors
- Network errors
- Post limit errors
- File errors
- Scheduler errors

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Check authentication information in `config.env`
   - Check app permissions in X Developer Portal

2. **Posts Not Executing**
   - Check post limits (time restrictions, daily limits, post intervals)
   - Check error logs

3. **Media Upload Error**
   - Check if file paths are correct
   - Check if file formats are supported

### Debugging Methods

```bash
# Run system test
python test_system.py

# Check log files
tail -f x_api.log
tail -f scheduler.log

# Check post history
cat post_history_x.json
```

## Security

- Authentication information is managed via environment variables
- Authentication information is not included in log files
- Post history is not encrypted (when no sensitive information is included)

## License

This project is released under the MIT License.

## Support

If you encounter issues, please check the following:

1. System test execution results
2. Log file contents
3. X API limit status
4. Configuration file contents

## Changelog

- v1.0.0: Initial release
  - Basic posting functionality
  - Scheduler functionality
  - Post limit management
  - Logging functionality
