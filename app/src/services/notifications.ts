import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Notification Service ─────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const granted = await requestNotificationPermission();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('flashcart', {
      name: 'FlashCart Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9900',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'flashcart-project-id',
  });
  return token.data;
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void,
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function removeNotificationListener(
  subscription: Notifications.Subscription,
): void {
  subscription.remove();
}
