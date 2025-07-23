# DeniFinder - Firebase Integration

DeniFinder is a property finding platform for Africa that helps users find available rooms, hostels, and houses. This project now includes Firebase integration for authentication, real-time messaging, and data storage.

## Firebase Services Used

- **Firebase Authentication**: User signup, signin, and session management
- **Firestore Database**: Real-time data storage for properties, messages, users, and more
- **Firebase Storage**: File uploads for property images and message attachments

## Project Structure

```
DeniFinder/
├── index.html              # Main landing page
├── signup.html             # User registration with Firebase Auth
├── signin.html             # User login with Firebase Auth
├── dashboard.html          # User dashboard
├── messages.html           # Real-time messaging with Firestore
├── payment.html            # Payment processing
├── js/
│   ├── firebase-config.js  # Firebase module configuration
│   ├── firebase-init.js    # Firebase non-module initialization
│   ├── messaging.js        # Messaging functionality
│   ├── dashboard.js        # Dashboard functionality
│   ├── search.js           # Property search
│   ├── payment.js          # Payment processing
│   ├── analytics.js        # Analytics tracking
│   └── notifications.js    # Notification system
├── css/                    # Stylesheets
├── images/                 # Static images
└── sw.js                   # Service worker for PWA
```

## Firebase Configuration

The Firebase configuration is set up in `js/firebase-init.js` with the following services:

### Collections Structure

- **users**: User profiles and authentication data
- **properties**: Property listings with details
- **messages**: Real-time messaging between users
- **notifications**: User notifications and alerts
- **blog_posts**: Blog content and articles
- **advance_assist**: Advance booking requests
- **verifications**: Property verification records
- **payments**: Payment transaction records
- **reviews**: Property and user reviews
- **cities**: City and area information

### Authentication Flow

1. **Sign Up**: Users create accounts with email/password
2. **Sign In**: Users authenticate with Firebase Auth
3. **Session Management**: Automatic session persistence
4. **Password Reset**: Email-based password recovery

### Real-time Features

- **Live Messaging**: Real-time chat using Firestore listeners
- **Property Updates**: Live property status updates
- **Notifications**: Real-time notification delivery

## Setup Instructions

### 1. Firebase Project Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Update the Firebase config in `js/firebase-init.js`

### 2. Security Rules

Set up Firestore security rules:

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
  }
}
```

### 3. Storage Rules

Set up Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Usage

### Authentication

```javascript
// Sign up
const result = await window.DeniFinderFirebase.authService.signUp(
  email, 
  password, 
  { displayName: 'John Doe', userType: 'tenant' }
);

// Sign in
const result = await window.DeniFinderFirebase.authService.signIn(email, password);

// Sign out
await window.DeniFinderFirebase.authService.signOut();
```

### Database Operations

```javascript
// Add a property
const result = await window.DeniFinderFirebase.propertyService.addProperty({
  title: 'Beautiful 3-bedroom apartment',
  location: 'Nairobi',
  price: 50000,
  type: 'apartment'
});

// Get properties with filters
const properties = await window.DeniFinderFirebase.propertyService.getProperties({
  location: 'Nairobi',
  maxPrice: 100000
});
```

### Messaging

```javascript
// Send a message
await window.DeniFinderFirebase.messagingService.sendMessage({
  receiverId: 'user123',
  content: 'Hello, is this property still available?',
  propertyId: 'property456'
});

// Listen for messages
window.DeniFinderFirebase.dbService.onCollectionSnapshot(
  'messages',
  (messages) => {
    console.log('New messages:', messages);
  }
);
```

## Features

### Core Features
- ✅ User authentication and registration
- ✅ Property search and filtering
- ✅ Real-time messaging system
- ✅ Property listings management
- ✅ User profiles and preferences
- ✅ File upload and storage
- ✅ Responsive design

### Advanced Features
- ✅ Advance booking assistance
- ✅ Property verification service
- ✅ Payment processing (backend separate)
- ✅ Notification system
- ✅ Review and rating system
- ✅ Virtual tours support

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development

### Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. For Firebase features, ensure you have internet connection

### Testing

- Test user registration and login
- Test property search functionality
- Test real-time messaging
- Test file uploads
- Test responsive design on mobile devices

## Deployment

### Static Hosting

The project can be deployed to any static hosting service:

- Firebase Hosting
- Netlify
- Vercel
- GitHub Pages

### Firebase Hosting (Recommended)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

## Security Considerations

- All sensitive operations require authentication
- User data is protected by Firestore security rules
- File uploads are restricted to authenticated users
- API keys are client-side (consider environment variables for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: info@denifinder.com
- Phone: +254 700 000 000

---

**Note**: This project uses Firebase for frontend services (chatting, blog, etc.) while keeping transactions backend separate as per the project requirements. 