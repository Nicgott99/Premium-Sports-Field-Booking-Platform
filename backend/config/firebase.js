import admin from 'firebase-admin';
import logger from '../utils/logger.js';

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