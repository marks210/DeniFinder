// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, updateProfile } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhHxCNlJl_Y93Hskm5ogiiYHIhfIVIS8A",
  authDomain: "defi-finder.firebaseapp.com",
  projectId: "defi-finder",
  storageBucket: "defi-finder.firebasestorage.app",
  messagingSenderId: "665116835708",
  appId: "1:665116835708:web:11ade28588832aa3c9aef9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  PROPERTIES: 'properties',
  MESSAGES: 'messages',
  INQUIRIES: 'inquiries',
  NOTIFICATIONS: 'notifications',
  PAYMENTS: 'payments'
};

// Authentication Service
export const authService = {
  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Sign up new user
  async signUp(email, password, userData = {}) {
    try {
      console.log('Starting Firebase signup for:', email);
      console.log('User data:', userData);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created in Firebase Auth:', user.uid);
      
      // Update profile with additional data
      await updateProfile(user, {
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || ''
      });
      
      console.log('Profile updated');
      
      // Send email verification
      await sendEmailVerification(user);
      
      console.log('Email verification sent');
      
      // Save user data to Firestore
      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
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

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        lastLogin: new Date()
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message, code: error.code };
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      const { sendPasswordResetEmail: sendReset } = await import("firebase/auth");
      await sendReset(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if email is verified
  async isEmailVerified() {
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      return user.emailVerified;
    }
    return false;
  },

  // Send email verification
  async sendEmailVerification() {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        return { success: true };
      }
      return { success: false, error: 'No user logged in' };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Database Service
export const dbService = {
  // Add document
  async addDocument(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Add document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get document
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
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
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
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
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return { success: false, error: error.message };
    }
  },

  // Query documents
  async queryDocuments(collectionName, conditions = [], orderByClause = null, limitCount = null) {
    try {
      let q = collection(db, collectionName);
      
      // Add where conditions
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      // Add order by
      if (orderByClause) {
        q = query(q, orderBy(orderByClause.field, orderByClause.direction));
      }
      
      // Add limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: documents };
    } catch (error) {
      console.error('Query documents error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Property Service
export const propertyService = {
  // Get user properties
  async getUserProperties(userId) {
    return await dbService.queryDocuments(COLLECTIONS.PROPERTIES, [
      { field: 'ownerId', operator: '==', value: userId }
    ]);
  },

  // Add property
  async addProperty(propertyData) {
    return await dbService.addDocument(COLLECTIONS.PROPERTIES, propertyData);
  },

  // Update property
  async updateProperty(propertyId, propertyData) {
    return await dbService.updateDocument(COLLECTIONS.PROPERTIES, propertyId, propertyData);
  },

  // Delete property
  async deleteProperty(propertyId) {
    return await dbService.deleteDocument(COLLECTIONS.PROPERTIES, propertyId);
  }
};

// Storage Service
export const storageService = {
  // Upload file
  async uploadFile(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Upload file error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export the main Firebase object
export const DeniFinderFirebase = {
  app,
  auth,
  db,
  storage,
  authService,
  dbService,
  propertyService,
  storageService,
  COLLECTIONS
};

export default DeniFinderFirebase; 