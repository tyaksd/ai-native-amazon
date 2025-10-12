# X API Setup Guide

API authentication setup procedure for X (formerly Twitter) auto posting system.

## 1. Create X Developer Portal Account

1. Access [X Developer Portal](https://developer.twitter.com/)
2. Click "Sign up" to create an account
3. Log in with your existing X account

## 2. Apply for Developer Account

1. After logging in, click "Apply for a developer account"
2. Fill out the developer account application form:
   - **What's your use case?**: Auto posting system development
   - **Will you make Twitter content available to a government entity?**: No
   - **Will you use Twitter data for academic research?**: No
   - **Will you use Twitter data for commercial purposes?**: Yes (for commercial use)
3. Submit the application and wait for approval (usually 1-3 business days)

## 3. Create Application

1. After developer account approval, access the dashboard
2. Click "Create App"
3. Enter application information:
   - **App name**: Any name (e.g., "Godship Mall Auto Poster")
   - **App description**: App description
   - **Website URL**: Website URL (optional)
   - **Callback URL**: Callback URL (optional)
4. Click "Create"

## 4. Get Authentication Information

### 4.1 API Key and API Secret Key

1. Click the "Keys and tokens" tab of the created app
2. Copy the following from the "Consumer Keys" section:
   - **API Key** (Consumer Key)
   - **API Secret Key** (Consumer Secret)

### 4.2 Access Token and Access Token Secret

1. In the same "Keys and tokens" tab, go to the "Access Token and Secret" section
2. Click "Generate" (if not already generated)
3. Copy the following:
   - **Access Token**
   - **Access Token Secret**

### 4.3 Bearer Token

1. In the same "Keys and tokens" tab, go to the "Bearer Token" section
2. Click "Generate" (if not already generated)
3. Copy the **Bearer Token**

## 5. App Permission Settings

1. Click the "App permissions" tab
2. Set permissions:
   - **Read**: Read permissions
   - **Read and Write**: Read and write permissions (required for posting)
   - **Read and Write and Direct Messages**: Full permissions
3. Click "Save"

## 6. Update Configuration File

Set the obtained authentication information in the `config.env` file:

```env
# X API Authentication Settings
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here
X_BEARER_TOKEN=your_bearer_token_here
```

## 7. Authentication Test

After completing the setup, run the system test:

```bash
python test_system.py
```

If the "API connection test" succeeds, the authentication setup is complete.

## Troubleshooting

### If Authentication Errors Occur

1. **Check Authentication Information**
   - Check for extra spaces when copying and pasting
   - Verify that authentication information is correctly set

2. **Check App Permissions**
   - Verify that "Read and Write" permissions are set
   - Wait a few minutes after changing permissions before testing again

3. **Check API Limits**
   - Check if X API limits have been reached
   - Wait a while before testing again

### Common Error Messages

- **401 Unauthorized**: Authentication information is incorrect
- **403 Forbidden**: Insufficient permissions
- **429 Too Many Requests**: API limit reached

## Security Notes

- Never share authentication information publicly
- Do not commit `config.env` file to Git
- Use environment variables in production
- Regularly update authentication information

## Reference Links

- [X Developer Portal](https://developer.twitter.com/)
- [X API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Tweepy Documentation](https://docs.tweepy.org/)
