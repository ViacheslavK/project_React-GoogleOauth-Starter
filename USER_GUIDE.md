# User Guide: Session Management & Security

## About Your Account Session

When you sign in with Google, the app creates a session that keeps you logged in while you use the application. Like all secure sessions, your session has a limited lifetime for security reasons.

## How Long Does a Session Last?

Your session automatically lasts for approximately **1 hour** of authenticated use. After this time, the app automatically requests a new session without interrupting your work.

## What Happens Automatically (Behind the Scenes)

The app handles session renewal automatically:

1. **Scheduled Refresh** — About 60 seconds before your session expires, the app quietly asks Google to refresh your authentication.
2. **Silent Refresh** — This happens without you seeing any dialog or popup — it all happens in the background.
3. **New Session** — A new session is created, and you stay logged in.

**In most cases, you won't notice anything.** Your work continues uninterrupted.

## Session Expired Banner

If something prevents automatic refresh (such as a network issue or if you haven't authorized the app to use your Google account), you'll see a message:

> 🔒 Your session has expired. Please sign in again.

This is a notification banner that appears at the top of the app. When you see this:

1. **Don't worry** — Your work and data are **not** lost
2. Click the **Sign in with Google** button (or the × to dismiss the banner)
3. You'll be taken through a quick Google sign-in (which may be instant if Google already knows you're logged in)
4. You're back in the app and can continue where you left off

## Why Does Session Expiry Happen?

Session expiry is a security feature:

- **Protects your account** — If you step away from your computer, someone else can't use your logged-in session
- **Limits exposure** — If there's a security issue, the impact is limited to a 1-hour window
- **Industry standard** — All secure web applications use session expiration

## Common Questions

### Will I lose my work if my session expires?

**No.** Your work on the server is safe. Session expiry only means you need to sign in again to continue. Any data you created before the expiration remains intact.

### Can I prevent session expiry?

Not permanently, but you can minimize interruptions:

- **Keep the browser tab active** — The app checks your session only when you interact with it
- **Allow popups and notifications** — This ensures the silent refresh can happen smoothly
- **Keep a stable internet connection** — Network interruptions can prevent automatic refresh

### Why did I see the session expired banner?

Possible causes:

1. **Network disconnection** — Your internet was temporarily unavailable during refresh
2. **Popup blocked** — Your browser blocked the silent refresh popup (check your browser's security settings)
3. **Long idle time** — You didn't interact with the app for a while after your session timed out
4. **Browser setting** — A security setting is preventing session renewal

### What if I keep seeing the expired message?

1. Check that you've allowed the browser to show popups from this site
2. Check your internet connection
3. Try signing out and signing back in
4. Clear your browser cookies and try again
5. Use a different browser to test

### How do I sign out?

Click your profile picture/name in the top right and select "Sign out". This immediately ends your session for security.

### Is my personal data shared with the app?

Only your basic profile information (name, email, profile picture) is shared with the app. Your passwords and sensitive account details remain with Google and are never shared with this app.
