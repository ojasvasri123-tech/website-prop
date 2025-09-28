const webpush = require('web-push');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.isConfigured = false;
    this.init();
  }

  init() {
    try {
      const vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
        email: process.env.VAPID_EMAIL
      };

      if (vapidKeys.publicKey && vapidKeys.privateKey && vapidKeys.email) {
        webpush.setVapidDetails(
          `mailto:${vapidKeys.email}`,
          vapidKeys.publicKey,
          vapidKeys.privateKey
        );
        this.isConfigured = true;
        console.log('✅ Web Push notifications configured');
      } else {
        console.log('⚠️ Web Push notifications not configured (missing VAPID keys)');
      }
    } catch (error) {
      console.error('❌ Web Push configuration error:', error);
    }
  }

  // Send alert notifications to affected users
  async sendAlertNotifications(alert) {
    try {
      if (!this.isConfigured) {
        console.log('📱 Push notifications not configured, skipping...');
        return { sent: 0, failed: 0 };
      }

      // Get affected users
      const affectedUsers = await alert.getAffectedUsers();
      
      if (affectedUsers.length === 0) {
        console.log('📱 No affected users found for alert');
        return { sent: 0, failed: 0 };
      }

      const notification = {
        title: `🚨 ${alert.severity.toUpperCase()} ALERT: ${alert.type.toUpperCase()}`,
        body: alert.title,
        icon: '/icons/alert-icon.png',
        badge: '/icons/badge-icon.png',
        data: {
          alertId: alert._id,
          type: alert.type,
          severity: alert.severity,
          url: `/alerts/${alert._id}`
        },
        actions: [
          {
            action: 'view',
            title: 'View Details'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        requireInteraction: alert.severity === 'critical',
        silent: false
      };

      let sent = 0;
      let failed = 0;

      // Send notifications to all affected users
      for (const user of affectedUsers) {
        if (user.pushSubscription) {
          try {
            await webpush.sendNotification(
              user.pushSubscription,
              JSON.stringify(notification)
            );
            sent++;
          } catch (error) {
            console.error(`Failed to send notification to user ${user._id}:`, error);
            
            // If subscription is invalid, remove it
            if (error.statusCode === 410 || error.statusCode === 404) {
              user.pushSubscription = null;
              await user.save();
            }
            failed++;
          }
        }
      }

      // Update alert with notification count
      alert.notificationsSent = sent;
      await alert.save();

      console.log(`📱 Alert notifications sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };

    } catch (error) {
      console.error('Notification sending error:', error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  // Send quiz reminder notifications
  async sendQuizReminder(quizId, title, targetUsers = []) {
    try {
      if (!this.isConfigured) {
        console.log('📱 Push notifications not configured, skipping quiz reminder...');
        return { sent: 0, failed: 0 };
      }

      const notification = {
        title: '📚 New Quiz Available!',
        body: `Take the "${title}" quiz and earn points!`,
        icon: '/icons/quiz-icon.png',
        badge: '/icons/badge-icon.png',
        data: {
          quizId,
          type: 'quiz',
          url: `/quiz/${quizId}`
        },
        actions: [
          {
            action: 'take-quiz',
            title: 'Take Quiz'
          }
        ]
      };

      let users;
      if (targetUsers.length > 0) {
        users = await User.find({
          _id: { $in: targetUsers },
          'notifications.quizzes': true,
          pushSubscription: { $ne: null }
        });
      } else {
        users = await User.find({
          role: 'student',
          'notifications.quizzes': true,
          pushSubscription: { $ne: null }
        });
      }

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify(notification)
          );
          sent++;
        } catch (error) {
          console.error(`Failed to send quiz notification to user ${user._id}:`, error);
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            user.pushSubscription = null;
            await user.save();
          }
          failed++;
        }
      }

      console.log(`📚 Quiz notifications sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };

    } catch (error) {
      console.error('Quiz notification error:', error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  // Send drill reminder notifications
  async sendDrillReminder(drill, reminderType = '24h') {
    try {
      if (!this.isConfigured) {
        console.log('📱 Push notifications not configured, skipping drill reminder...');
        return { sent: 0, failed: 0 };
      }

      const timeText = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
      
      const notification = {
        title: `🚨 Drill Reminder: ${drill.type.toUpperCase()}`,
        body: `${drill.title} is scheduled ${timeText} at ${drill.venue}`,
        icon: '/icons/drill-icon.png',
        badge: '/icons/badge-icon.png',
        data: {
          drillId: drill._id,
          type: 'drill',
          url: `/drills/${drill._id}`
        },
        actions: [
          {
            action: 'view-drill',
            title: 'View Details'
          }
        ]
      };

      // Get users from the same institution
      const users = await User.find({
        institution: drill.institution,
        'notifications.drills': true,
        pushSubscription: { $ne: null }
      });

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify(notification)
          );
          sent++;
        } catch (error) {
          console.error(`Failed to send drill notification to user ${user._id}:`, error);
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            user.pushSubscription = null;
            await user.save();
          }
          failed++;
        }
      }

      console.log(`🚨 Drill notifications sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };

    } catch (error) {
      console.error('Drill notification error:', error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  // Send general notification to specific users
  async sendNotificationToUsers(userIds, notification) {
    try {
      if (!this.isConfigured) {
        console.log('📱 Push notifications not configured, skipping...');
        return { sent: 0, failed: 0 };
      }

      const users = await User.find({
        _id: { $in: userIds },
        pushSubscription: { $ne: null }
      });

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          await webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify(notification)
          );
          sent++;
        } catch (error) {
          console.error(`Failed to send notification to user ${user._id}:`, error);
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            user.pushSubscription = null;
            await user.save();
          }
          failed++;
        }
      }

      console.log(`📱 Custom notifications sent: ${sent} successful, ${failed} failed`);
      return { sent, failed };

    } catch (error) {
      console.error('Custom notification error:', error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }

  // Test notification
  async sendTestNotification(userId) {
    try {
      if (!this.isConfigured) {
        throw new Error('Push notifications not configured');
      }

      const user = await User.findById(userId);
      if (!user || !user.pushSubscription) {
        throw new Error('User not found or no push subscription');
      }

      const notification = {
        title: '🧪 Test Notification',
        body: 'This is a test notification from The Beacon!',
        icon: '/icons/test-icon.png',
        badge: '/icons/badge-icon.png',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      };

      await webpush.sendNotification(
        user.pushSubscription,
        JSON.stringify(notification)
      );

      return { success: true, message: 'Test notification sent successfully' };

    } catch (error) {
      console.error('Test notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured,
      vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      emailConfigured: !!process.env.VAPID_EMAIL
    };
  }

  // Generate VAPID keys (utility function)
  static generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }
}

module.exports = new NotificationService();
