# Firebase Setup Guide for DeniFinder

## Current Firebase Configuration

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDhHxCNlJl_Y93Hskm5ogiiYHIhfIVIS8A",
  authDomain: "defi-finder.firebaseapp.com",
  projectId: "defi-finder",
  storageBucket: "defi-finder.firebasestorage.app",
  messagingSenderId: "665116835708",
  appId: "1:665116835708:web:11ade28588832aa3c9aef9"
};
```

## Required Firebase Setup Steps

### 1. Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `defi-finder`
3. Go to **Authentication** in the left sidebar
4. Click **Get started**
5. Go to **Sign-in method** tab
6. Enable **Email/Password** provider
7. Make sure **Email link (passwordless sign-in)** is also enabled for email verification

### 2. Create Firestore Database
1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (preferably close to your users)
5. Click **Done**

### 3. Set Firestore Security Rules
Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Properties can be read by all, written by owners
    match /properties/{propertyId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.ownerId;
    }
    
    // Messages can be read/written by participants
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.senderId || 
         request.auth.uid == resource.data.receiverId);
    }
    
    // Test collection for debugging
    match /test/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 4. Enable Storage (Optional)
1. Go to **Storage** in the left sidebar
2. Click **Get started**
3. Choose **Start in test mode**
4. Select a location

### 5. Test the Setup
1. Open `firebase-test.html` in your browser
2. Check the console for any errors
3. Try the test signup functionality

## Common Issues and Solutions

### Issue: "Firebase SDK not loaded"
**Solution**: Check internet connection and refresh the page

### Issue: "Firebase configuration failed"
**Solution**: Verify the Firebase config in `js/firebase-init.js`

### Issue: "Permission denied" in Firestore
**Solution**: Update Firestore security rules to allow test mode

### Issue: "Email already in use"
**Solution**: This is normal - the email is already registered

### Issue: "Weak password"
**Solution**: Use a password with at least 6 characters

## Testing Steps

1. **Open the test page**: `firebase-test.html`
2. **Check SDK loading**: Should show "✅ Firebase SDK loaded successfully"
3. **Check configuration**: Should show "✅ Firebase configuration successful"
4. **Test signup**: Use a test email and password
5. **Check Firebase Console**: Verify user appears in Authentication section
6. **Check Firestore**: Verify user data appears in Firestore Database

## Debugging

If signup still doesn't work:

1. **Open browser console** (F12)
2. **Look for error messages**
3. **Check the test page** for detailed status
4. **Verify Firebase project settings**
5. **Check if Authentication is enabled**

## Alternative: Use Firebase Hosting

For production, consider deploying to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

This will ensure all Firebase services work correctly. 