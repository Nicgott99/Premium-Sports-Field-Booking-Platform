/**
 * bookingReminderService.js
 * Automated Booking Reminder Scheduler
 * Premium Sports Booking Platform
 *
 * Uses node-cron to run scheduled jobs that send booking reminders
 * to users at configured intervals before their booked session.
 *
 * Reminder schedule (configurable):
 *   - 24 hours before the booking start time
 *   - 2 hours before the booking start time
 *   - 30 minutes before the booking start time (check-in available)
 *
 * Usage:
 *   import { startBookingReminderScheduler } from './bookingReminderService.js';
 *   startBookingReminderScheduler(); // call once on server start
 */

import cron from 'node-cron';
import Booking from '../models/Booking.js';
import { sendBookingNotification } from './notificationService.js';

// ─── Configuration ──────────────────────────────────────────────────────────

const REMINDER_WINDOWS = [
  {
    label: '24h reminder',
    minutesBefore: 24 * 60,   // 24 hours
    status: 'reminder',
    message: '24 hours',
  },
  {
    label: '2h reminder',
    minutesBefore: 2 * 60,    // 2 hours
    status: 'reminder',
    message: '2 hours',
  },
  {
    label: '30m check-in alert',
    minutesBefore: 30,         // 30 minutes
    status: 'checkin',
    message: '30 minutes',
  },
];

// ─── Core Logic ─────────────────────────────────────────────────────────────

/**
 * Find confirmed bookings whose start time falls within a reminder window
 * and that have not yet received that particular reminder.
 *
 * @param {number} minutesBefore   - How many minutes before startTime to trigger
 * @param {string} reminderFlag    - The boolean flag on Booking that marks sent state
 * @returns {Promise<Array>}       - Matching bookings
 */
const getBookingsDueForReminder = async (minutesBefore, reminderFlag) => {
  const now = new Date();
  const windowStart = new Date(now.getTime() + (minutesBefore - 5) * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + (minutesBefore + 5) * 60 * 1000);

  return Booking.find({
    status: 'confirmed',
    startTime: { $gte: windowStart, $lte: windowEnd },
    [reminderFlag]: { $ne: true },
  })
    .populate('user', '_id name email')
    .populate('field', 'name city sport')
    .lean();
};

/**
 * Mark a booking's reminder flag to prevent duplicate sends.
 * @param {string} bookingId
 * @param {string} flagName
 */
const markReminderSent = async (bookingId, flagName) => {
  await Booking.updateOne({ _id: bookingId }, { [flagName]: true });
};

/**
 * Process one reminder window — find due bookings and dispatch notifications.
 * @param {object} window  - { minutesBefore, status, label, message }
 */
const processReminderWindow = async (window) => {
  const flagName = `reminder_${window.minutesBefore}m_sent`;

  let bookings;
  try {
    bookings = await getBookingsDueForReminder(window.minutesBefore, flagName);
  } catch (err) {
    console.error(`[BookingReminder] Failed to query bookings for ${window.label}:`, err.message);
    return;
  }

  if (bookings.length === 0) return;

  console.log(`[BookingReminder] Processing ${bookings.length} booking(s) for ${window.label}`);

  const results = await Promise.allSettled(
    bookings.map(async (booking) => {
      try {
        const enrichedBooking = {
          ...booking,
          fieldName: booking.field?.name || 'the field',
        };

        await sendBookingNotification(
          booking.user._id.toString(),
          window.status,
          enrichedBooking
        );

        await markReminderSent(booking._id.toString(), flagName);
      } catch (err) {
        console.error(
          `[BookingReminder] Failed to send ${window.label} for booking ${booking._id}:`,
          err.message
        );
      }
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed    = results.length - succeeded;
  console.log(`[BookingReminder] ${window.label}: ${succeeded} sent, ${failed} failed`);
};

// ─── Scheduler ───────────────────────────────────────────────────────────────

let scheduledJobs = [];

/**
 * Start the booking reminder scheduler.
 * Runs every 5 minutes and checks all reminder windows.
 *
 * @param {string} [cronExpression='*\/5 * * * *']  - Cron expression for the schedule
 */
export const startBookingReminderScheduler = (cronExpression = '*/5 * * * *') => {
  if (scheduledJobs.length > 0) {
    console.warn('[BookingReminder] Scheduler already running. Skipping duplicate start.');
    return;
  }

  const job = cron.schedule(cronExpression, async () => {
    for (const window of REMINDER_WINDOWS) {
      await processReminderWindow(window);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Dhaka',
  });

  scheduledJobs.push(job);
  console.log(`[BookingReminder] Scheduler started. Running every 5 minutes (Asia/Dhaka).`);
};

/**
 * Stop all running scheduler jobs (for graceful shutdown).
 */
export const stopBookingReminderScheduler = () => {
  scheduledJobs.forEach((job) => job.stop());
  scheduledJobs = [];
  console.log('[BookingReminder] Scheduler stopped.');
};

/**
 * Manually trigger all reminder windows (useful for testing).
 * @returns {Promise<void>}
 */
export const triggerRemindersNow = async () => {
  console.log('[BookingReminder] Manual trigger initiated...');
  for (const window of REMINDER_WINDOWS) {
    await processReminderWindow(window);
  }
  console.log('[BookingReminder] Manual trigger complete.');
};

export default {
  startBookingReminderScheduler,
  stopBookingReminderScheduler,
  triggerRemindersNow,
};
