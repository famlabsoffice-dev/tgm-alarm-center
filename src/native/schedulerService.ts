import { Alarm, NotificationPreferences } from '../domain/alarm';
import { reconcileScheduledNotifications } from './notifications';

/**
 * Single application-facing scheduler boundary. The native notification module owns
 * platform details; the app only supplies the complete local alarm state.
 */
export async function reconcileAlarmNotifications(
  alarms: readonly Alarm[],
  preferences: NotificationPreferences,
): Promise<void> {
  await reconcileScheduledNotifications(alarms, preferences);
}
