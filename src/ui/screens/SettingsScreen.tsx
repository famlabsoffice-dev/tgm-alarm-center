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
    <View style={styles.screen}>
      {storageError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{storageError}</Text></View> : null}
      <View style={styles.sectionHeading}><Text style={styles.eyebrow}>KONFIGURATION</Text><Text style={styles.sectionTitle}>Einstellungen</Text></View>
      <Text style={styles.groupTitle}>ALARMVERHALTEN</Text>
      <View style={styles.settingsCard}>
        <SettingRow label="Vorwarnungen mit Ton" value={notificationPreferences.warningSound} onValueChange={(value) => onUpdatePreference('warningSound', value)} />
        <SettingRow label="Hauptereignisse mit Ton" value={notificationPreferences.eventSound} onValueChange={(value) => onUpdatePreference('eventSound', value)} />
        <SettingRow label="Vibration" value={notificationPreferences.vibration} onValueChange={(value) => onUpdatePreference('vibration', value)} />
        <SettingRow label="Zeitkritische Hinweise" value={notificationPreferences.criticalAlerts} onValueChange={(value) => onUpdatePreference('criticalAlerts', value)} />
      </View>
      {showBilling ? <BillingPanel currentTier={currentTier} onTierConfirmed={onTierConfirmed} /> : null}
      <Text style={styles.groupTitle}>DATEN AUF DIESEM GERÄT</Text>
      <View style={styles.actionCard}>
        <Pressable accessibilityRole="button" accessibilityLabel="Backup exportieren" hitSlop={8} onPress={onExportBackup} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Backup exportieren</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Backup importieren" hitSlop={8} onPress={onImportBackup} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Backup importieren</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Gerätetest starten" hitSlop={8} onPress={onDeviceTest} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Gerätetest</Text></Pressable>
      </View>
      <Text style={styles.groupTitle}>ZEITMODELL</Text>
      <View style={styles.noteCard}><Text style={styles.noteTitle}>Lokale Gerätezeit</Text><Text style={styles.noteText}>UTC wird intern gespeichert. Anzeige und Eingabe folgen der lokalen Gerätezeit.</Text></View>
      <Text style={styles.footer}>TGM ALARM CENTER · lokale Speicherung · lokale Gaming-Alarmtöne</Text>
    </View>
  );
}

function SettingRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }): React.ReactElement {
  return <View style={styles.settingRow}><Text style={styles.settingLabel}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{ false: '#303A3D', true: '#1E7850' }} thumbColor={value ? '#41D28B' : '#C8CECA'} /></View>;
}

const styles = {
  screen: { flex: 1, backgroundColor: '#050708', padding: 14 },
  sectionHeading: { marginBottom: 16 },
  eyebrow: { color: '#8F9794', fontSize: 10, fontWeight: '900' as const, letterSpacing: 1.6 },
  sectionTitle: { color: '#F0C35B', fontSize: 25, fontWeight: '900' as const, marginTop: 3 },
  groupTitle: { color: '#929A97', fontSize: 11, fontWeight: '900' as const, letterSpacing: 1.4, marginTop: 16, marginBottom: 9 },
  settingsCard: { backgroundColor: '#101617', borderColor: '#344043', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  settingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: 57, borderBottomColor: '#293335', borderBottomWidth: 0.7 },
  settingLabel: { flex: 1, color: '#EDEFEA', fontSize: 14, fontWeight: '700' as const, paddingRight: 10 },
  actionCard: { backgroundColor: '#101617', borderColor: '#344043', borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  secondaryButton: { backgroundColor: '#151B1D', borderColor: '#3B474A', borderWidth: 1, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 11, minHeight: 46 },
  secondaryButtonText: { color: '#E2E6E1', fontSize: 12, fontWeight: '800' as const },
  primaryButton: { backgroundColor: '#B98217', borderColor: '#E6B943', borderWidth: 1, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 11, minHeight: 46 },
  primaryButtonText: { color: '#140F05', fontSize: 12, fontWeight: '900' as const },
  noteCard: { backgroundColor: '#101617', borderColor: '#344043', borderWidth: 1, borderRadius: 14, padding: 14 },
  noteTitle: { color: '#E7B84C', fontSize: 14, fontWeight: '900' as const },
  noteText: { color: '#929A97', fontSize: 11, lineHeight: 17, marginTop: 4 },
  errorBanner: { backgroundColor: '#291416', borderColor: '#693039', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  errorText: { color: '#FFB8B0', fontSize: 12, fontWeight: '700' as const },
  footer: { color: '#606B68', fontSize: 9, textAlign: 'center' as const, marginTop: 22, marginBottom: 10 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
} as const;
