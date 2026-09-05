import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { BillingPanel } from '../../billing/BillingPanel';
import type { Tier } from '../../domain/alarm';

type NotificationPreferences = {
  warningSound: boolean;
  eventSound: boolean;
  vibration: boolean;
  criticalAlerts: boolean;
};

type SettingsScreenProps = {
  storageError: string | null;
  notificationPreferences: NotificationPreferences;
  currentTier: Tier;
  showBilling: boolean;
  onUpdatePreference: <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => void;
  onTierConfirmed: (tier: Tier) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onDeviceTest: () => void;
};

export function SettingsScreen({ storageError, notificationPreferences, currentTier, showBilling, onUpdatePreference, onTierConfirmed, onExportBackup, onImportBackup, onDeviceTest }: SettingsScreenProps): React.ReactElement {
  return (
    <View>
      {storageError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{storageError}</Text></View> : null}
      <Text style={styles.sectionTitle}>Benachrichtigungen</Text>
      <View style={styles.settingsCard}>
        <SettingRow label="Vorwarnungen mit Ton" value={notificationPreferences.warningSound} onValueChange={(value) => onUpdatePreference('warningSound', value)} />
        <SettingRow label="Hauptereignisse mit Ton" value={notificationPreferences.eventSound} onValueChange={(value) => onUpdatePreference('eventSound', value)} />
        <SettingRow label="Vibration" value={notificationPreferences.vibration} onValueChange={(value) => onUpdatePreference('vibration', value)} />
        <SettingRow label="Zeitkritische Hinweise" value={notificationPreferences.criticalAlerts} onValueChange={(value) => onUpdatePreference('criticalAlerts', value)} />
      </View>
      {showBilling ? <BillingPanel currentTier={currentTier} onTierConfirmed={onTierConfirmed} /> : null}
      <View style={styles.actionRowFooter}>
        <Pressable accessibilityRole="button" accessibilityLabel="Backup exportieren" hitSlop={8} onPress={onExportBackup} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Backup exportieren</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Backup importieren" hitSlop={8} onPress={onImportBackup} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Backup importieren</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Gerätetest starten" hitSlop={8} onPress={onDeviceTest} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Gerätetest</Text></Pressable>
      </View>
      <Text style={styles.footer}>UTC wird intern gespeichert · Anzeige in lokaler Gerätezeit · Schema 1</Text>
    </View>
  );
}

function SettingRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }): React.ReactElement {
  return <View style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{ false: '#38414A', true: '#60783D' }} thumbColor={value ? '#79C95B' : '#D0D6DB'} /></View>;
}

const styles = {
  sectionTitle: { color: '#EAE6D8', fontSize: 20, fontWeight: '900' as const, marginTop: 10, marginBottom: 10 },
  settingsCard: { backgroundColor: '#171B21', borderColor: '#38414A', borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, marginBottom: 10 },
  settingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: 54, borderBottomColor: '#38414A', borderBottomWidth: 0.5 },
  settingLabel: { color: '#EAE6D8', fontSize: 14, fontWeight: '700' as const },
  actionRowFooter: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 2 },
  secondaryButton: { backgroundColor: '#252C34', borderColor: '#444C55', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, minHeight: 44 },
  secondaryButtonText: { color: '#EAE6D8', fontSize: 12, fontWeight: '800' as const },
  errorBanner: { backgroundColor: '#3B1D20', borderColor: '#66312E', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  errorText: { color: '#FFB5AB', fontSize: 12, fontWeight: '700' as const },
  footer: { color: '#6F7880', fontSize: 10, textAlign: 'center' as const, marginTop: 25 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
} as const;
