# Strava Integration Setup Guide

This guide walks you through setting up the Strava integration for Landform Labs, allowing users to import activities directly from their Strava accounts.

## Prerequisites

- A Strava account
- Node.js 18+ installed
- Access to create a Strava API application

## 1. Create a Strava API Application

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Click "Create App" or "My API Application"
3. Fill in the application details:
   - **Application Name**: "Landform Labs" (or your preferred name)
   - **Category**: "Other"
   - **Club**: Leave blank unless applicable
   - **Website**: Your website URL (e.g., `https://landformlabs.co`)
   - **Application Description**: "Custom 3D route tiles from GPS activities"
   - **Authorization Callback Domain**: 
     - For local development: `localhost`
     - For production: your domain (e.g., `landformlabs.co`)

4. Read and accept the API Agreement
5. Click "Create"

## 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update the `.env.local` file with your Strava application credentials:
   ```env
   # Strava Client ID (used in both contexts)
   NEXT_PUBLIC_STRAVA_CLIENT_ID=your_client_id_from_strava
   STRAVA_CLIENT_ID=your_client_id_from_strava
   
   # Strava Client Secret (server-only)
   STRAVA_CLIENT_SECRET=your_client_secret_from_strava
   
   # OAuth Redirect URI
   NEXT_PUBLIC_STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
   ```

**Note**: Both `NEXT_PUBLIC_STRAVA_CLIENT_ID` and `STRAVA_CLIENT_ID` should have the same value. The public version is used for client-side OAuth redirects, while the server-only version is used for API authentication.

## 3. Security Configuration

### For Development
The default configuration uses HTTP cookies for local development. Ensure you have:
- `NODE_ENV=development` in your `.env.local`
- Valid Strava credentials

### For Production
**Critical**: Configure secure settings for production:

```env
NODE_ENV=production
NEXT_PUBLIC_STRAVA_CLIENT_ID=your_client_id_from_strava
STRAVA_CLIENT_ID=your_client_id_from_strava
STRAVA_CLIENT_SECRET=your_client_secret_from_strava
NEXT_PUBLIC_STRAVA_REDIRECT_URI=https://yourdomain.com/api/strava/callback
```

The production build automatically:
- Enables secure HTTPS-only cookies
- Sets strict SameSite policies
- Implements CSRF protection
- Uses server-only environment variables for API calls

## 4. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/strava`
3. Click "Connect with Strava"
4. Authorize the application in Strava
5. You should be redirected back to the app with access to your activities

## 5. Troubleshooting

### Common Issues

**"Strava integration is not properly configured"**
- Verify all environment variables are set correctly
- Check that `NEXT_PUBLIC_STRAVA_CLIENT_ID` is not empty
- Ensure the redirect URI matches your Strava app settings

**"Your Strava session has expired"**
- The integration automatically refreshes tokens
- If this persists, try reconnecting your Strava account
- Check server logs for token refresh errors

**"Failed to connect to Strava"**
- Verify your Strava app is not in "Demo" mode
- Check that the Authorization Callback Domain is correct
- Ensure your app has "Read All" permissions

**Activities not loading**
- Check Strava API rate limits (100 requests per 15 minutes, 1000 per day)
- Verify the user has activities with GPS data
- Check browser network tab for API errors

### Rate Limits

Strava enforces the following rate limits:
- **15-minute limit**: 100 requests
- **Daily limit**: 1,000 requests

The integration handles rate limiting gracefully with user-friendly error messages.

### Debugging

Enable debug logging by setting:
```env
DEBUG=strava:*
```

Check server logs for detailed error information during authentication and API calls.

## 6. Production Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_STRAVA_CLIENT_ID` (same value as STRAVA_CLIENT_ID)
   - `STRAVA_CLIENT_ID` (your Strava app client ID)
   - `STRAVA_CLIENT_SECRET` (keep this secure)
   - `NEXT_PUBLIC_STRAVA_REDIRECT_URI` (https://yourdomain.com/api/strava/callback)

2. Update your Strava app's Authorization Callback Domain to your production domain

3. Deploy and test the integration

### Security Checklist

- [ ] `STRAVA_CLIENT_SECRET` is kept secure and not exposed to client
- [ ] Both `NEXT_PUBLIC_STRAVA_CLIENT_ID` and `STRAVA_CLIENT_ID` are configured with same value
- [ ] Redirect URI uses HTTPS in production
- [ ] Rate limiting is implemented and handled gracefully
- [ ] Error messages don't expose sensitive information
- [ ] Tokens are stored in HTTP-only cookies
- [ ] CSRF protection is enabled
- [ ] Automatic token refresh is working properly

## 7. API Usage and Limitations

### Strava API Permissions
The integration requests `activity:read_all` scope, which allows:
- Reading all public and private activities
- Accessing activity details and GPS streams
- No write permissions (cannot create or modify activities)

### Data Usage
The integration:
- Fetches activity lists for user selection
- Downloads GPS streams for selected activities
- Converts GPS data to GPX format for route tile generation
- Stores Strava activity URLs in export metadata for order fulfillment

### Privacy Considerations
- Only GPS coordinate data is processed
- No personal information beyond activity names and GPS tracks is stored
- Users can disconnect their Strava account at any time
- All data processing is done securely server-side

## 8. Support and Resources

- [Strava API Documentation](https://developers.strava.com/docs/)
- [Strava API Rate Limiting](https://developers.strava.com/docs/rate-limits/)
- [OAuth 2.0 Flow](https://developers.strava.com/docs/authentication/)

For integration issues, check the server logs and browser network tab for detailed error information.