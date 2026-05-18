// Import all models
import User from './User.js';
import Field from './Field.js';
import Booking from './Booking.js';
import Team from './Team.js';
import Tournament from './Tournament.js';
import Review from './Review.js';
import Chat from './Chat.js';
import Notification from './Notification.js';
import Payment from './Payment.js';
import logger from '../utils/logger.js';

/**
 * Create database indexes for faster queries
 * Called on app startup to ensure indexes exist
 */
export const createIndexes = async () => {
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phone: 1 }, { sparse: true });
    await User.collection.createIndex({ createdAt: -1 });

    // Field indexes
    await Field.collection.createIndex({ owner: 1 });
    await Field.collection.createIndex({ sport: 1 });
    await Field.collection.createIndex({ 'location.city': 1 });
    await Field.collection.createIndex({ 'location.coordinates': '2dsphere' }); // Geo index
    await Field.collection.createIndex({ createdAt: -1 });
    await Field.collection.createIndex({ status: 1 });

    // Booking indexes
    await Booking.collection.createIndex({ userId: 1 });
    await Booking.collection.createIndex({ fieldId: 1 });
    await Booking.collection.createIndex({ status: 1 });
    await Booking.collection.createIndex({ startTime: 1, endTime: 1 });
    await Booking.collection.createIndex({ createdAt: -1 });
    await Booking.collection.createIndex({ 'payment.status': 1 });

    // Review indexes
    await Review.collection.createIndex({ fieldId: 1 });
    await Review.collection.createIndex({ userId: 1 });
    await Review.collection.createIndex({ rating: -1 });
    await Review.collection.createIndex({ createdAt: -1 });

    // Team indexes
    await Team.collection.createIndex({ owner: 1 });
    await Team.collection.createIndex({ members: 1 });
    await Team.collection.createIndex({ sport: 1 });

    // Tournament indexes
    await Tournament.collection.createIndex({ startDate: 1 });
    await Tournament.collection.createIndex({ status: 1 });
    await Tournament.collection.createIndex({ createdAt: -1 });

    // Payment indexes
    await Payment.collection.createIndex({ userId: 1 });
    await Payment.collection.createIndex({ status: 1 });
    await Payment.collection.createIndex({ createdAt: -1 });
    await Payment.collection.createIndex({ stripePaymentIntentId: 1 }, { sparse: true });

    // Notification indexes
    await Notification.collection.createIndex({ userId: 1 });
    await Notification.collection.createIndex({ type: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });

    // Chat indexes
    await Chat.collection.createIndex({ participants: 1 });
    await Chat.collection.createIndex({ createdAt: -1 });

    logger.info('✅ All database indexes created successfully');
  } catch (error) {
    logger.warn(`Index creation warning: ${error.message}`);
    // Don't fail app startup on index creation errors
  }
};

// Export all models as named exports
export {
  User,
  Field,
  Booking,
  Team,
  Tournament,
  Review,
  Chat,
  Notification,
  Payment
};

// Default export as object
export default {
  User,
  Field,
  Booking,
  Team,
  Tournament,
  Review,
  Chat,
  Notification,
  Payment,
  createIndexes
};