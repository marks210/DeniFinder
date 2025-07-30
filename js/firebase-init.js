// Firebase Configuration for DeniFinder (Non-module version)
// This file can be included directly in HTML files

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhHxCNlJl_Y93Hskm5ogiiYHIhfIVIS8A",
  authDomain: "defi-finder.firebaseapp.com",
  projectId: "defi-finder",
  storageBucket: "defi-finder.firebasestorage.app",
  messagingSenderId: "665116835708",
  appId: "1:665116835708:web:11ade28588832aa3c9aef9"
};

// Initialize Firebase (this will be done after Firebase SDK is loaded)
let app, db, auth, storage;

// Firestore Collections
const COLLECTIONS = {
  USERS: 'users',
  PROPERTIES: 'properties',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  BLOG_POSTS: 'blog_posts',
  ADVANCE_ASSIST: 'advance_assist',
  VERIFICATIONS: 'verifications',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  CITIES: 'cities'
};

// Initialize Firebase services
function initializeFirebase() {
  console.log('Attempting to initialize Firebase...');
  console.log('Firebase SDK available:', typeof firebase !== 'undefined');
  
  if (typeof firebase !== 'undefined') {
    try {
      app = firebase.initializeApp(firebaseConfig);
      db = firebase.firestore(app);
      auth = firebase.auth(app);
      storage = firebase.storage(app);
      console.log('Firebase initialized successfully');
      console.log('Firebase config:', firebaseConfig);
      console.log('Auth available:', !!auth);
      console.log('Firestore available:', !!db);
      return true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      return false;
    }
  } else {
    console.error('Firebase SDK not loaded');
    return false;
  }
}

// Authentication Functions
const authService = {
  // Sign up new user
  async signUp(email, password, userData = {}) {
    try {
      console.log('Starting Firebase signup for:', email);
      console.log('User data:', userData);
      
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      console.log('User created in Firebase Auth:', user.uid);
      
      // Update profile with additional data
      await user.updateProfile({
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || ''
      });
      
      console.log('Profile updated');
      
      // Send email verification
      await user.sendEmailVerification();
      
      console.log('Email verification sent');
      
      // Save user data to Firestore
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      
      await db.collection(COLLECTIONS.USERS).doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || '',
        phone: userData.phone || '',
        userType: userData.userType || 'tenant', // tenant, landlord, admin
        emailVerified: false,
        accountStatus: 'pending_verification', // pending_verification, active, suspended
        createdAt: new Date(),
        lastLogin: new Date(),
        ...userData
      });
      
      console.log('User data saved to Firestore');
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return { success: false, error: error.message, code: error.code };
    }
  },

  // Send email verification
  async sendEmailVerification() {
    try {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        await user.sendEmailVerification();
        return { success: true };
      }
      return { success: false, error: 'No user logged in or email already verified' };
    } catch (error) {
      console.error('Send email verification error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if email is verified
  isEmailVerified() {
    const user = auth.currentUser;
    return user ? user.emailVerified : false;
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        return { 
          success: false, 
          error: 'Please verify your email address before signing in. Check your inbox for a verification link.',
          needsVerification: true,
          user: user
        };
      }
      
      // Update last login and account status
      await db.collection(COLLECTIONS.USERS).doc(user.uid).update({
        lastLogin: new Date(),
        accountStatus: 'active',
        emailVerified: true
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out user
  async signOut() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }
};

// Firestore Database Functions
const dbService = {
  // Add document to collection
  async addDocument(collectionName, data) {
    try {
      const docRef = await db.collection(collectionName).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Add document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Set document with custom ID
  async setDocument(collectionName, docId, data) {
    try {
      await db.collection(collectionName).doc(docId).set({
        ...data,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Set document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get document by ID
  async getDocument(collectionName, docId) {
    try {
      const docRef = db.collection(collectionName).doc(docId);
      const docSnap = await docRef.get();
      
      if (docSnap.exists) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      console.error('Get document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update document
  async updateDocument(collectionName, docId, data) {
    try {
      await db.collection(collectionName).doc(docId).update({
        ...data,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Update document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete document
  async deleteDocument(collectionName, docId) {
    try {
      await db.collection(collectionName).doc(docId).delete();
      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Query documents
  async queryDocuments(collectionName, conditions = [], orderByField = null, limitCount = null) {
    try {
      let query = db.collection(collectionName);
      
      // Add where conditions
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
      
      // Add order by
      if (orderByField) {
        query = query.orderBy(orderByField.field, orderByField.direction || 'asc');
      }
      
      // Add limit
      if (limitCount) {
        query = query.limit(limitCount);
      }
      
      const querySnapshot = await query.get();
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: documents };
    } catch (error) {
      console.error('Query documents error:', error);
      return { success: false, error: error.message };
    }
  },

  // Listen to collection changes
  onCollectionSnapshot(collectionName, callback, conditions = []) {
    let query = db.collection(collectionName);
    
    conditions.forEach(condition => {
      query = query.where(condition.field, condition.operator, condition.value);
    });
    
    return query.onSnapshot((snapshot) => {
      const documents = [];
      snapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      callback(documents);
    });
  }
};

// Storage Functions
const storageService = {
  // Upload file
  async uploadFile(file, path) {
    try {
      const storageRef = storage.ref().child(path);
      const snapshot = await storageRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload file error:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete file
  async deleteFile(path) {
    try {
      const storageRef = storage.ref().child(path);
      await storageRef.delete();
      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get download URL
  async getDownloadURL(path) {
    try {
      const storageRef = storage.ref().child(path);
      const url = await storageRef.getDownloadURL();
      return { success: true, url };
    } catch (error) {
      console.error('Get download URL error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Property-specific functions
const propertyService = {
  // Add new property
  async addProperty(propertyData) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'User not authenticated' };
    
    return await dbService.addDocument(COLLECTIONS.PROPERTIES, {
      ...propertyData,
      ownerId: user.uid,
      status: 'available',
      verified: false
    });
  },

  // Get properties by filters
  async getProperties(filters = {}) {
    const conditions = [];
    
    if (filters.location) {
      conditions.push({ field: 'location', operator: '==', value: filters.location });
    }
    
    if (filters.type) {
      conditions.push({ field: 'type', operator: '==', value: filters.type });
    }
    
    if (filters.status) {
      conditions.push({ field: 'status', operator: '==', value: filters.status });
    }
    
    if (filters.maxPrice) {
      conditions.push({ field: 'price', operator: '<=', value: filters.maxPrice });
    }
    
    return await dbService.queryDocuments(COLLECTIONS.PROPERTIES, conditions, 
      { field: 'createdAt', direction: 'desc' });
  },

  // Get user's properties
  async getUserProperties(userId) {
    return await dbService.queryDocuments(COLLECTIONS.PROPERTIES, 
      [{ field: 'ownerId', operator: '==', value: userId }],
      { field: 'createdAt', direction: 'desc' });
  }
};

// Messaging functions
const messagingService = {
  // Send message
  async sendMessage(messageData) {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'User not authenticated' };
    
    return await dbService.addDocument(COLLECTIONS.MESSAGES, {
      ...messageData,
      senderId: user.uid,
      timestamp: new Date(),
      read: false
    });
  },

  // Get conversation messages
  async getConversationMessages(conversationId) {
    return await dbService.queryDocuments(COLLECTIONS.MESSAGES, 
      [{ field: 'conversationId', operator: '==', value: conversationId }],
      { field: 'timestamp', direction: 'asc' });
  },

  // Mark message as read
  async markMessageAsRead(messageId) {
    return await dbService.updateDocument(COLLECTIONS.MESSAGES, messageId, { read: true });
  }
};

// Utility: Find or create a conversation between two users
window.DeniFinderFirebase = window.DeniFinderFirebase || {};
window.DeniFinderFirebase.messagingUtils = {
    async findOrCreateConversation(userA, userB, context = {}) {
        const db = window.DeniFinderFirebase.dbService;
        // 1. Try to find existing conversation
        const result = await db.queryDocuments(
            'conversations',
            [
                { field: 'participants', operator: 'array-contains', value: String(userA) }
            ]
        );
        if (result.success) {
            // Find a conversation with both participants
            const convo = result.data.find(c =>
                Array.isArray(c.participants) &&
                c.participants.includes(String(userA)) &&
                c.participants.includes(String(userB))
            );
            if (convo) return { id: convo.id, ...convo };
        }
        // 2. Create new conversation
        const convoData = {
            participants: [String(userA), String(userB)],
            lastMessage: context.initialMessage || '',
            lastTimestamp: new Date(),
            propertyId: context.propertyId || null
        };
        const createResult = await db.addDocument('conversations', convoData);
        if (createResult.success) {
            return { id: createResult.id, ...convoData };
        }
        throw new Error('Failed to create conversation');
    },
    async sendMessage(conversationId, senderId, receiverId, content) {
        const db = window.DeniFinderFirebase.dbService;
        const msgData = {
            conversationId,
            senderId,
            receiverId,
            content,
            timestamp: new Date(),
            type: 'text'
        };
        await db.addDocument('messages', msgData);
        // Update last message in conversation
        await db.updateDocument('conversations', conversationId, {
            lastMessage: content,
            lastTimestamp: new Date()
        });
    }
};

// Initialize Firebase when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if Firebase is already loaded
  if (typeof firebase !== 'undefined') {
    initializeFirebase();
  } else {
    // Wait for Firebase to load
    const checkFirebase = setInterval(() => {
      if (typeof firebase !== 'undefined') {
        initializeFirebase();
        clearInterval(checkFirebase);
      }
    }, 100);
  }
});

// Export for use in other scripts
window.DeniFinderFirebase = {
  initializeFirebase,
  authService,
  dbService,
  storageService,
  propertyService,
  messagingService,
  COLLECTIONS
}; 