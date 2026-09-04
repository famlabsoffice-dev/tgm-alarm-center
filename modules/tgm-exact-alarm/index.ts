import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

export interface RecoverySignals {
  bootReconciliationNeeded: boolean;
  exactAlarmPermissionChanged: boolean;
}

export interface TGMExactAlarmNativeModule {
  canScheduleExactAlarms(): Promise<boolean>;
  openExactAlarmSettings(): Promise<boolean>;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<boolean>;
  consumeRecoverySignals(): Promise<RecoverySignals>;
}

const NativeTGMExactAlarm: TGMExactAlarmNativeModule | null = Platform.OS === 'android'
  ? requireNativeModule<TGMExactAlarmNativeModule>('TGMExactAlarm')
  : null;

export async function canScheduleExactAlarms(): Promise<boolean> {
  if (!NativeTGMExactAlarm) return true;
  return NativeTGMExactAlarm.canScheduleExactAlarms();
}

export async function openExactAlarmSettings(): Promise<boolean> {
  if (!NativeTGMExactAlarm) return false;
  return NativeTGMExactAlarm.openExactAlarmSettings();
}

export async function isIgnoringBatteryOptimizations(): Promise<boolean> {
  if (!NativeTGMExactAlarm) return true;
  return NativeTGMExactAlarm.isIgnoringBatteryOptimizations();
}

export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (!NativeTGMExactAlarm) return false;
  return NativeTGMExactAlarm.openBatteryOptimizationSettings();
}

export async function consumeRecoverySignals(): Promise<RecoverySignals> {
  if (!NativeTGMExactAlarm) return { bootReconciliationNeeded: false, exactAlarmPermissionChanged: false };
  return NativeTGMExactAlarm.consumeRecoverySignals();
}
