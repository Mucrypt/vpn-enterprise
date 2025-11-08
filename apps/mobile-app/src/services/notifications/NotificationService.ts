/**
 * Notification Service
 * Handles push notifications for security alerts, connection status, and achievements
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.initialize();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize() {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });

      await Notifications.setNotificationChannelAsync('security', {
        name: 'Security Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#EF4444',
      });

      await Notifications.setNotificationChannelAsync('achievements', {
        name: 'Achievements',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });
    }
  }

  /**
   * Send connection status notification
   */
  async notifyConnectionStatus(connected: boolean, serverName?: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: connected ? '🔒 VPN Connected' : '🔓 VPN Disconnected',
        body: connected
          ? `Connected to ${serverName || 'server'}. Your connection is secure.`
          : 'Your connection is no longer protected.',
        data: { type: 'connection', connected },
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Send security alert notification
   */
  async notifySecurityAlert(threat: {
    type: 'malware' | 'tracker' | 'phishing' | 'ads';
    domain: string;
  }) {
    const titles = {
      malware: '🛡️ Malware Blocked',
      tracker: '👁️ Tracker Blocked',
      phishing: '🎣 Phishing Attempt Blocked',
      ads: '🚫 Ad Blocked',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titles[threat.type],
        body: `Blocked: ${threat.domain}`,
        data: { type: 'security', threat },
        sound: true,
      },
      trigger: null,
    });
  }

  /**
   * Send achievement unlocked notification
   */
  async notifyAchievement(achievement: {
    name: string;
    description: string;
    icon: string;
  }) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${achievement.icon} Achievement Unlocked!`,
        body: `${achievement.name}: ${achievement.description}`,
        data: { type: 'achievement', achievement },
        sound: true,
      },
      trigger: null,
    });
  }

  /**
   * Send data usage warning
   */
  async notifyDataUsage(used: number, limit: number) {
    const percentage = (used / limit) * 100;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Data Usage Warning',
        body: `You've used ${percentage.toFixed(0)}% of your data limit (${(used / 1024 / 1024 / 1024).toFixed(2)} GB)`,
        data: { type: 'data_usage', used, limit },
        sound: true,
      },
      trigger: null,
    });
  }

  /**
   * Send connection quality warning
   */
  async notifyConnectionQuality(quality: 'poor' | 'unstable') {
    const messages = {
      poor: 'Connection quality is poor. Consider switching servers.',
      unstable: 'Connection is unstable. Attempting to reconnect...',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📶 Connection Quality Warning',
        body: messages[quality],
        data: { type: 'connection_quality', quality },
        sound: true,
      },
      trigger: null,
    });
  }

  /**
   * Send scheduled notification
   */
  async scheduleNotification(
    title: string,
    body: string,
    triggerSeconds: number,
    data?: any
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        type: 'timeInterval',
        seconds: triggerSeconds,
      } as any,
    });
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification permissions status
   */
  async getPermissionsStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}

// Export singleton instance
export default NotificationService.getInstance();
