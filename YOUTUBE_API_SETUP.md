# YouTube API Setup Guide

## Getting YouTube Data API v3 Key

### 1. Go to Google Cloud Console
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Sign in with your Google account

### 2. Create or Select a Project
- Click on the project dropdown at the top
- Either select an existing project or create a new one
- Click "New Project" if creating a new one

### 3. Enable YouTube Data API v3
- In the left sidebar, go to "APIs & Services" → "Library"
- Search for "YouTube Data API v3"
- Click on it and press "Enable"

### 4. Create API Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "API Key"
- Copy the generated API key

### 5. Restrict the API Key (Recommended)
- Click on the API key you just created
- Under "API restrictions", select "Restrict key"
- Choose "YouTube Data API v3" from the list
- Under "Application restrictions", you can:
  - Select "HTTP referrers" and add your domain
  - Or select "IP addresses" and add your server IP
- Save the changes

### 6. Add to Your Render Environment Variables
- Go to your Render dashboard
- Select your backend service
- Go to "Environment" tab
- Add: `YOUTUBE_API_KEY=your_api_key_here`
- Save and redeploy

## API Quotas
- Free tier: 10,000 units per day
- Each search request costs ~100 units
- Monitor usage in Google Cloud Console

## Troubleshooting
- If you get "API key not valid" errors, check that the key is correctly set in Render
- If you get quota exceeded errors, you've hit the daily limit
- Make sure the YouTube Data API v3 is enabled for your project
