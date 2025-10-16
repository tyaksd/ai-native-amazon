# TikTok API Setup Guide

## Overview
This guide explains how to set up TikTok API integration for automatic posting functionality.

## Prerequisites
- TikTok Developer Account
- TikTok App registered in TikTok Developer Portal
- Valid TikTok Business Account

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# TikTok API Configuration
TIKTOK_API_KEY=your_tiktok_api_key_here
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token_here
TIKTOK_CLIENT_KEY=your_tiktok_client_key_here
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret_here
```

## TikTok API Setup Steps

### 1. Create TikTok Developer Account
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Sign up or log in with your TikTok account
3. Complete the developer verification process

### 2. Create a TikTok App
1. Navigate to the TikTok Developer Portal
2. Click "Create App"
3. Fill in the required information:
   - App Name: Your app name
   - App Category: Business
   - Description: Brief description of your app
   - Website: Your website URL
4. Submit for review

### 3. Get API Credentials
1. Once your app is approved, go to your app dashboard
2. Navigate to "Products" section
3. Enable "TikTok for Developers" product
4. Go to "Basic Info" to get your credentials:
   - Client Key (API Key)
   - Client Secret

### 4. Generate Access Token
1. Use TikTok's OAuth flow to get user access tokens
2. Implement the authorization flow in your application
3. Store the access token securely

## API Endpoints Used

### Post Publishing
- **Endpoint**: `https://open-api.tiktok.com/v2/post/publish/`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
  - `X-TikTok-Api-Key: {api_key}`

### Request Body
```json
{
  "text": "Your post caption",
  "media": "video_url_or_image_url",
  "scheduled_time": "2024-01-01T12:00:00Z" // Optional
}
```

## Rate Limits
- TikTok API has rate limits based on your app tier
- Free tier: Limited requests per day
- Business tier: Higher limits available

## Error Handling
The API returns standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 429: Rate Limited
- 500: Server Error

## Testing
1. Use TikTok's sandbox environment for testing
2. Test with small content first
3. Monitor API responses and error messages
4. Implement proper retry logic for rate limits

## Security Considerations
- Store API keys securely (use environment variables)
- Implement proper token refresh logic
- Use HTTPS for all API communications
- Monitor API usage and costs

## Troubleshooting

### Common Issues
1. **Invalid API Key**: Verify your API key is correct
2. **Expired Token**: Implement token refresh logic
3. **Rate Limited**: Implement exponential backoff
4. **Media Upload Issues**: Check file size and format requirements

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG_TIKTOK_API=true
```

## Support
- TikTok Developer Documentation: https://developers.tiktok.com/doc/
- TikTok Developer Community: https://developers.tiktok.com/community
- API Status: https://developers.tiktok.com/status
