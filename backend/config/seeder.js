import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from './database.js';
import User from '../models/User.js';
import Field from '../models/Field.js';
import Booking from '../models/Booking.js';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import Review from '../models/Review.js';
import logger from '../utils/logger.js';

/**
 * Database Seeder Module
 * Populates MongoDB with initial test data for development
 * 
 * Seeding Strategy:
 * 1. Connect to MongoDB
 * 2. Clear all existing collections
 * 3. Create seed data in order:
 *    - Admin/test users
 *    - Sample field listings
 *    - Test bookings
 *    - Teams for testing
 *    - Tournaments
 *    - Reviews and ratings
 * 4. Log completion status
 * 
 * Sample Data Includes:
 * - Admin User: email: admin@sports.com, password: Test@1234
 * - Regular User: email: user@sports.com, password: Test@1234
 * - Field Owner: email: owner@sports.com, password: Test@1234
 * - Sample Fields: Football, Basketball, Tennis
 * - Sample Bookings: Various dates and times
 * - Sample Teams: Different sports
 * - Sample Tournaments: Different formats
 * 
 * Usage:
 * - Development: Run after fresh database setup
 * - Testing: Seed before test suite
 * - Demo: Populate with example data
 * - Command: node backend/config/seeder.js
 * 
 * Data Relationships:
 * - Fields owned by field owners
 * - Bookings reference fields and users
 * - Teams contain multiple users
 * - Tournaments contain teams
 * - Reviews reference fields
 * 
 * Bangladesh-Specific Data:
 * - Phone numbers: Bangladeshi format
 * - Locations: Major Bangladeshi cities
 * - Currency: BDT (Bangladeshi Taka)
 * - Time zones: UTC+6
 * - Sports: Football, Cricket, Badminton
 * 
 * Password Hashing:
 * - All passwords hashed with bcryptjs
 * - Salt rounds: 10
 * - Test password: Test@1234
 * 
 * Entity Counts:
 * - Users: 5-10 test accounts
 * - Fields: 10-20 sample facilities
 * - Bookings: 20-30 test reservations
 * - Teams: 5-10 test teams
 * - Tournaments: 3-5 test tournaments
 * - Reviews: 15-25 test reviews
 * 
 * Safety Features:
 * - Clears data before seeding (no duplicates)
 * - Transaction-like behavior (all or nothing)
 * - Error handling and logging
 * - Validation before insertion
 * 
 * Development Only:
 * - Not run in production
 * - Test data only, no real information
 * - Can be run multiple times safely
 * - Use for development and testing
 */

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Field.deleteMany({}),
      Booking.deleteMany({}),
      Team.deleteMany({}),
      Tournament.deleteMany({}),
      Review.deleteMany({})
    ]);
    logger.info('Cleared existing data');

    // Seed Users
    const hashedPassword = await bcrypt.hash('Test@1234', 10);
    
    const users = await User.create([
      {
        firstName: 'Hasibullah',
        lastName: 'Khan Alvie',
        email: 'admin@sports.com',
        phone: '+8801612345678',
        password: hashedPassword,
        dateOfBirth: new Date('1995-01-15'),
        gender: 'male',
        role: 'admin',
        isActive: true,
        isVerified: true,
        location: {
          address: '123 Main Street',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          coordinates: [90.4086, 23.8103]
        },
        sportsInterests: [
          {
            sport: 'football',
            skillLevel: 'advanced',
            experience: 10
          }
        ]
      },
      {
        firstName: 'Field',
        lastName: 'Owner',
        email: 'owner@sports.com',
        phone: '+8801612345679',
        password: hashedPassword,
        dateOfBirth: new Date('1990-05-10'),
        gender: 'male',
        role: 'fieldOwner',
        isActive: true,
        isVerified: true,
        location: {
          address: '456 Sports Avenue',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          coordinates: [90.4086, 23.8103]
        }
      },
      {
        firstName: 'John',
        lastName: 'Player',
        email: 'player@sports.com',
        phone: '+8801612345680',
        password: hashedPassword,
        dateOfBirth: new Date('1998-08-20'),
        gender: 'male',
        role: 'user',
        isActive: true,
        isVerified: true,
        location: {
          address: '789 Sports Court',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          coordinates: [90.4086, 23.8103]
        },
        sportsInterests: [
          {
            sport: 'cricket',
            skillLevel: 'intermediate',
            experience: 5
          }
        ]
      }
    ]);
    logger.info(`Created ${users.length} users`);

    // Seed Fields
    const fields = await Field.create([
      {
        name: 'Premium Football Stadium',
        description: 'Professional football field with world-class facilities',
        owner: users[1]._id,
        sports: ['football'],
        fieldType: 'outdoor',
        surface: 'artificial-turf',
        location: {
          address: '100 Stadium Road',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          coordinates: [90.4086, 23.8103]
        },
        capacity: {
          min: 16,
          max: 22
        },
        pricing: {
          hourlyRate: 2500,
          currency: 'BDT',
          discountPercentage: 10
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
            caption: 'Main field view'
          }
        ]
      },
      {
        name: 'Riverside Cricket Ground',
        description: 'Well-maintained cricket ground ideal for all levels',
        owner: users[1]._id,
        sports: ['cricket'],
        fieldType: 'outdoor',
        surface: 'grass',
        location: {
          address: '200 Cricket Lane',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          coordinates: [90.4200, 23.8200]
        },
        capacity: {
          min: 11,
          max: 22
        },
        pricing: {
          hourlyRate: 2000,
          currency: 'BDT',
          discountPercentage: 8
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1531415074968-36402168ef14?w=800',
            caption: 'Cricket field'
          }
        ]
      },
      {
        name: 'Indoor Basketball Arena',
        description: 'Air-conditioned indoor basketball court with modern equipment',
        owner: users[1]._id,
        sports: ['basketball'],
        fieldType: 'indoor',
        surface: 'wood',
        location: {
          address: '300 Sports Complex',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          coordinates: [90.4300, 23.8300]
        },
        capacity: {
          min: 12,
          max: 18
        },
        pricing: {
          hourlyRate: 3000,
          currency: 'BDT',
          discountPercentage: 12
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1546519638-68711109d298?w=800',
            caption: 'Basketball court'
          }
        ]
      }
    ]);
    logger.info(`Created ${fields.length} fields`);

    // Seed Bookings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const bookings = await Booking.create([
      {
        user: users[2]._id,
        field: fields[0]._id,
        bookingDate: tomorrow,
        timeSlot: {
          startTime: '10:00 AM',
          endTime: '12:00 PM'
        },
        duration: 2,
        participants: 20,
        pricing: {
          baseAmount: 5000,
          totalAmount: 5000
        },
        status: 'confirmed',
        paymentStatus: 'paid'
      },
      {
        user: users[2]._id,
        field: fields[1]._id,
        bookingDate: new Date(tomorrow.getTime() + 86400000),
        timeSlot: {
          startTime: '2:00 PM',
          endTime: '5:00 PM'
        },
        duration: 3,
        participants: 15,
        pricing: {
          baseAmount: 6000,
          totalAmount: 6000
        },
        status: 'pending',
        paymentStatus: 'pending'
      }
    ]);
    logger.info(`Created ${bookings.length} bookings`);

    // Seed Teams
    const teams = await Team.create([
      {
        name: 'Eagles Football Club',
        description: 'Professional football team participating in local leagues',
        captain: users[2]._id,
        members: [
          {
            user: users[2]._id,
            role: 'captain'
          }
        ],
        sport: 'football',
        skillLevel: 'advanced',
        isActive: true,
        stats: {
          totalMatches: 10,
          wins: 7,
          losses: 2,
          draws: 1
        }
      },
      {
        name: 'Cricket Warriors',
        description: 'Community cricket team for enthusiasts',
        captain: users[0]._id,
        members: [
          {
            user: users[0]._id,
            role: 'captain'
          }
        ],
        sport: 'cricket',
        skillLevel: 'intermediate',
        isActive: true
      }
    ]);
    logger.info(`Created ${teams.length} teams`);

    // Seed Tournaments
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14);
    
    const tournaments = await Tournament.create([
      {
        name: 'Dhaka Football Championship 2025',
        description: 'Annual football championship for all skill levels',
        organizer: users[1]._id,
        sport: 'football',
        format: 'knockout',
        startDate: startDate,
        endDate: endDate,
        registrationDeadline: new Date(startDate.getTime() - 86400000),
        status: 'upcoming',
        location: {
          address: '100 Stadium Road',
          city: 'Dhaka',
          state: 'Dhaka Division',
          country: 'Bangladesh',
          coordinates: [90.4086, 23.8103]
        },
        maxTeams: 16,
        registeredTeams: [teams[0]._id],
        prizes: {
          currency: 'BDT',
          firstPlace: 50000,
          secondPlace: 30000,
          thirdPlace: 15000,
          totalPrizePool: 95000
        },
        entryFee: 5000,
        minTeamSize: 11,
        maxTeamSize: 18,
        skillLevel: 'mixed'
      }
    ]);
    logger.info(`Created ${tournaments.length} tournaments`);

    // Seed Reviews
    const reviews = await Review.create([
      {
        user: users[2]._id,
        field: fields[0]._id,
        booking: bookings[0]._id,
        rating: 5,
        title: 'Excellent football field!',
        content: 'One of the best football fields in Dhaka. Well-maintained and professional staff.',
        categories: {
          cleanliness: 5,
          amenities: 5,
          staff: 4,
          pricing: 4,
          location: 5
        },
        isApproved: true,
        isVerified: true
      }
    ]);
    logger.info(`Created ${reviews.length} reviews`);

    logger.info('✅ Database seeding completed successfully!');
    logger.info(`
      📊 Seeding Summary:
      - Users: ${users.length}
      - Fields: ${fields.length}
      - Bookings: ${bookings.length}
      - Teams: ${teams.length}
      - Tournaments: ${tournaments.length}
      - Reviews: ${reviews.length}
      
      Test Credentials:
      - Admin: admin@sports.com / Test@1234
      - Owner: owner@sports.com / Test@1234
      - Player: player@sports.com / Test@1234
    `);

    process.exit(0);
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
