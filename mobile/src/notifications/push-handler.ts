import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from '@/api/client';
import { navigateFromNotification } from './navigation';

const isExpoGo = Constants.appOwnership === 'expo';
const canUseRemotePushNotifications = !(isExpoGo && Platform.OS === 'android');

/**
 * Register the device's Expo push token with the backend
 */
export async function registerPushToken() {
  try {
    // Skip on web platform—Expo notifications only work on native
    if (Platform.OS === 'web') {
      console.log('[Push] Skipping push token registration on web platform');
      return null;
    }

    // Expo Go on Android (SDK 53+) does not support remote push token APIs.
    if (!canUseRemotePushNotifications) {
      console.log('[Push] Skipping remote push registration in Expo Go on Android');
      return null;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');

    // Request permissions on both platforms
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied for notifications');
      return null;
    }

    // On Android, ensure a notification channel is created
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Get the push token (pass projectId for EAS-managed projects)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const expoPushToken = token.data;

    console.log('[Push] Expo push token:', expoPushToken);

    // Register with backend
    await apiFetch('/push-tokens', {
      method: 'POST',
      body: {
        expoPushToken,
        platform: Platform.OS,
        deviceName: undefined,
      },
    });

    console.log('[Push] Token registered with backend');
    return expoPushToken;
  } catch (error) {
    console.log('[Push] Push notification setup skipped:', error);
    return null;
  }
}

/**
 * Set up notification handler for incoming push notifications
 */
export function setupNotificationHandler() {
  if (!canUseRemotePushNotifications) {
    return () => {};
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('[Push] Notification received:', notification.request.content);
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });

  // Listen for notifications when app is in foreground
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Push] Foreground notification:', notification);
  });

  // Listen for notification responses (user tapped the notification)
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) void navigateFromNotification(response.notification.request.content.data as Record<string, unknown>);
    })
    .catch(() => undefined);

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[Push] Notification response:', response);
    const data = response.notification.request.content.data;
    void navigateFromNotification(data as Record<string, unknown>);
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}
