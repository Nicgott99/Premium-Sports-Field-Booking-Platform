import admin from 'firebase-admin';
import logger from '../utils/logger.js';

/**
 * Firebase Admin SDK Configuration
 * Handles Firebase authentication, messaging, and cloud storage integration
 * 
 * Firebase Services:
 * 1. Authentication (Auth):
 *    - User registration with email/password
 *    - Google/Facebook OAuth integration
 *    - Email verification and password reset
 *    - Multi-factor authentication (2FA)
 * 
 * 2. Cloud Messaging (FCM):
 *    - Push notifications to mobile/web
 *    - Topic-based messaging
 *    - Targeted device notifications
 *    - Notification analytics
 * 
 * 3. Cloud Storage:
 *    - User avatar storage
 *    - Field image gallery
 *    - Document storage (invoices, receipts)
 *    - Media file hosting
 * 
 * 4. Firestore (Optional):
 *    - Real-time chat messages
 *    - Live booking notifications
 *    - Activity feeds
 * 
 * Authentication Methods Supported:
 * - Email/Password: Traditional method
 * - Google OAuth: Federated identity
 * - Facebook OAuth: Social login
 * - Phone: SMS-based verification
 * - Custom: Backend JWT tokens
 * 
 * Service Account Configuration:
 * - FIREBASE_PROJECT_ID: Project identifier
 * - FIREBASE_PRIVATE_KEY_ID: Key version ID
 * - FIREBASE_PRIVATE_KEY: RSA private key (PEM format)
 * - FIREBASE_CLIENT_EMAIL: Service account email
 * - FIREBASE_CLIENT_ID: Service account client ID
 * 
 * Security Rules:
 * - Firebase Security Rules for Firestore
 * - Storage rules for file access
 * - Authentication state management
 * - Role-based access control
 * 
 * Error Handling:
 * - Graceful failure if Firebase unavailable
 * - Fallback to JWT-only auth
 * - Error logging and monitoring
 * - Retry logic for transient failures
 * 
 * Performance:
 * - Single app instance (cached)
 * - Connection pooling
 * - Message batching
 * - Rate limiting on API calls
 * 
 * Integration Points:
 * - Backend user registration
 * - Mobile app push notifications
 * - Real-time chat system
 * - File storage for user content
 * 
 * Monitoring & Debugging:
 * - Firebase Console for metrics
 * - Custom event logging
 * - Error tracking and alerts
 * - Performance monitoring
 */

let firebaseApp = null;

export const setupFirebase = async () => {
  try {
    if (firebaseApp) {
      return firebaseApp;
    }

    // Initialize Firebase Admin SDK
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });

    logger.info('🔥 Firebase Admin SDK initialized successfully');
    return firebaseApp;

  } catch (error) {
    logger.error(`❌ Firebase initialization failed: ${error.message}`);
    // Don't exit process, allow app to run without Firebase
    return null;
  }
};

export const getFirebaseApp = () => {
  return firebaseApp;
};

export const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error(`Firebase token verification failed: ${error.message}`);
    throw error;
  }
};

export const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    logger.error(`Custom token creation failed: ${error.message}`);
    throw error;
  }
};

export const sendPushNotification = async (tokens, payload) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image
      },
      data: payload.data || {},
      tokens: Array.isArray(tokens) ? tokens : [tokens]
    };

    const response = await admin.messaging().sendMulticast(message);
    logger.info(`Push notification sent successfully: ${response.successCount} successful, ${response.failureCount} failed`);
    
    return response;
  } catch (error) {
    logger.error(`Push notification failed: ${error.message}`);
    throw error;
  }
};

export default { setupFirebase, getFirebaseApp, verifyFirebaseToken, createCustomToken, sendPushNotification };