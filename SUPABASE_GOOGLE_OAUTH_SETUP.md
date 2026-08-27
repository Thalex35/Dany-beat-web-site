# Supabase Google OAuth Setup Guide

This guide explains how to configure Google OAuth authentication for the Dany Beats application.

## Overview

The application now supports Google OAuth authentication through Supabase. Users can sign in using their Google account without creating a separate password.

## Prerequisites

- Supabase project (https://supabase.io)
- Google Cloud Console access
- Access to Supabase Dashboard for your project

## Step-by-Step Setup

### 1. Create Google OAuth Credentials

#### 1.1 Go to Google Cloud Console
- Visit https://console.cloud.google.com/
- Create a new project or select an existing one
- Name it "Dany Beats" or similar

#### 1.2 Enable Google+ API
- In the Cloud Console, navigate to "APIs & Services" > "Library"
- Search for "Google+ API"
- Click "Enable"

#### 1.3 Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth Client ID"
- Select "Web application"
- Give it a name like "Dany Beats Web App"

#### 1.4 Configure Authorized Redirect URIs
Add these redirect URIs to your Google OAuth app:

```
https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback
```

Replace `[YOUR_PROJECT_ID]` with your actual Supabase project ID.

**For local development (optional):**
```
http://localhost:5173/auth?redirect=/beats
```

#### 1.5 Save Credentials
- Copy the **Client ID** and **Client Secret**
- Keep these safe — you'll need them for Supabase

### 2. Configure Supabase

#### 2.1 Go to Supabase Dashboard
- Visit https://app.supabase.com/
- Select your Dany Beats project

#### 2.2 Enable Google Provider
- Go to "Authentication" > "Providers"
- Find "Google" in the list
- Click to enable it

#### 2.3 Add Google Credentials
- Paste the **Client ID** from Google Cloud Console
- Paste the **Client Secret** from Google Cloud Console
- Click "Save"

#### 2.4 Verify Redirect URL
- The redirect URL should be: `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
- This should already be configured in Supabase

### 3. Application Configuration

The application is already configured to use Google OAuth. The redirect flow works like this:

1. User clicks "Continue with Google"
2. Browser redirects to Supabase auth endpoint
3. Supabase redirects to Google login
4. User authenticates with Google
5. Google redirects back to Supabase callback URL
6. Supabase session is created
7. User is redirected back to `/auth?redirect=/beats`
8. Auth context automatically handles the session

No code changes are needed — Supabase handles everything.

### 4. Environment Variables

The application does **NOT** require any environment variables for Google OAuth. Supabase handles provider configuration server-side.

If you were using @lovable.dev/cloud-auth-js, you might need API keys, but we use native Supabase instead.

### 5. Testing

#### 5.1 Local Development
```bash
npm run dev
# Open http://localhost:5173/auth
# Click "Continue with Google"
```

#### 5.2 Production
```bash
# Deploy to your production URL
# Users can authenticate via Google
```

### 6. Troubleshooting

#### Issue: "Invalid OAuth configuration"
**Solution:** Verify Client ID and Client Secret are correct in Supabase Dashboard

#### Issue: "Redirect URL mismatch"
**Solution:** Ensure `https://[PROJECT_ID].supabase.co/auth/v1/callback` is added in Google Cloud Console OAuth settings

#### Issue: "Google sign-in failed"
**Solution:** Check browser console for error messages. Ensure:
- Google OAuth is enabled in Supabase
- Credentials are correctly configured
- Redirect URIs match between Google and Supabase

#### Issue: Session not persisting after Google login
**Solution:** The auth context handles this automatically. Ensure:
- `AuthProvider` wraps your app (in __root.tsx)
- You're checking `useAuth()` hook correctly
- No errors in browser console

## How It Works

### User Flow

1. **Click "Continue with Google"**
   - Function: `handleGoogleSignIn()` in auth.tsx
   - Calls: `signInWithGoogle()` from lib/auth.tsx

2. **Supabase OAuth Initiation**
   - Function: `signInWithGoogle()` calls `supabase.auth.signInWithOAuth()`
   - Provider: "google"
   - Redirect: User is sent to Google login

3. **Google Authentication**
   - User logs in with their Google account
   - User grants permission to Dany Beats app
   - Google redirects back to Supabase callback

4. **Supabase Session Creation**
   - Supabase receives the Google token
   - Supabase creates a session for the user
   - Browser is redirected back to `/auth?redirect=/beats`

5. **Application Redirect**
   - App detects authenticated user in auth context
   - User is automatically redirected to `/beats`
   - Session persists in localStorage

### Logout

Users can log out using the existing logout mechanism:
- Click "Sign out" in the header
- Session is cleared
- Redirected to home page

## Email/Password Still Works

The application still supports traditional email/password authentication:
- Users can sign up with email
- Email confirmation required for new accounts
- Existing email/password users can still log in
- Both methods work simultaneously

## Security Notes

- ✅ Never commit credentials to Git
- ✅ Use Supabase Dashboard to manage secrets
- ✅ Redirect URLs are validated by Supabase
- ✅ OAuth tokens are handled securely by Supabase
- ✅ HTTPS required for production

## API Reference

### signInWithGoogle()
```typescript
export async function signInWithGoogle(): Promise<SignInWithOAuthResult>
```

Initiates Google OAuth flow. Browser will redirect to Google login page.

**Returns:** `{ session: Session | null }`

**Throws:** Error if OAuth initiation fails

### Usage Example
```typescript
async function handleGoogleSignIn() {
  try {
    await signInWithGoogle();
    // Browser will redirect to Google login
  } catch (error) {
    console.error("Google sign-in failed:", error);
  }
}
```

## Next Steps

1. ✅ Create Google OAuth credentials in Google Cloud Console
2. ✅ Configure Supabase with Google credentials
3. ✅ Test the login flow locally
4. ✅ Deploy to production
5. ✅ Test production Google OAuth

## Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth/social-login/auth-google
2. Check browser console for error messages
3. Verify all settings in both Google Cloud Console and Supabase Dashboard
