import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export interface TGMExactAlarmNativeModule {
  canScheduleExactAlarms(): Promise<boolean>;
  openExactAlarmSettings(): Promise<boolean>;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<boolean>;
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
