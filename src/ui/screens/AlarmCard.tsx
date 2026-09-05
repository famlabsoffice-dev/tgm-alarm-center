import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Alarm } from '../../domain/alarm';
import { alarmTypeLabel, momentLabel, nextOccurrence, occurrenceKey, repeatLabel, upcomingMoments } from '../../domain/alarm';

type AlarmCardProps = {
  alarm: Alarm;
  now: number;
  onEdit: (alarm: Alarm) => void;
  onToggle: (alarmId: string) => void;
  onComplete: (alarm: Alarm) => void;
  onDelete: (alarm: Alarm) => void;
};

const formatDateTime = (date: Date): string => date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const formatCountdown = (date: Date, now: number): string => {
  const remaining = Math.max(0, date.getTime() - now);
  if (remaining < 60_000) return `${Math.max(0, Math.floor(remaining / 1000))} Sek.`;
  const minutes = Math.floor(remaining / 60_000);
  if (minutes < 60) return `${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} Std. · ${minutes % 60} Min.`;
  return `${Math.floor(hours / 24)} Tage · ${hours % 24} Std.`;
};

export function AlarmCard({ alarm, now, onEdit, onToggle, onComplete, onDelete }: AlarmCardProps): React.ReactElement {
  const event = useMemo(() => nextOccurrence(alarm, new Date(now)), [alarm, now]);
  const moments = useMemo(() => upcomingMoments(alarm, new Date(now)), [alarm, now]);
  const completed = event ? alarm.completedOccurrences[occurrenceKey(alarm.id, event)] === true : false;
  return (
    <View style={styles.alarmCard}>
      <View style={styles.alarmHeader}>
        <View style={styles.flex}>
          <Text style={styles.alarmTitle}>{alarm.title}</Text>
          <Text style={styles.muted}>{alarmTypeLabel(alarm.type)} · {repeatLabel(alarm.repeat)}</Text>
        </View>
        <View style={[styles.statusPill, alarm.active ? styles.activePill : styles.pausedPill]}>
          <Text style={styles.statusText}>{alarm.active ? 'AKTIV' : 'PAUSIERT'}</Text>
        </View>
      </View>
      <View style={styles.badgeRow}>
        {alarm.protected ? <Text style={styles.badgeGold}>GESCHÜTZT</Text> : null}
        {alarm.repeat === 'gw5d' ? <Text style={styles.badgeBlue}>24 STD. BUBBLE</Text> : null}
        {moments[0] ? <Text style={styles.badgeNeutral}>{momentLabel(moments[0])}</Text> : null}
      </View>
      <View style={styles.alarmTimeBox}>
        <Text style={styles.muted}>NÄCHSTER TERMIN</Text>
        <Text style={styles.alarmTime}>{event ? formatDateTime(event) : completed ? 'Für diesen Zyklus erledigt' : 'Kein zukünftiger Termin'}</Text>
        {event ? <Text style={styles.goldText}>{formatCountdown(event, now)}</Text> : null}
      </View>
      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${alarm.title} bearbeiten`} onPress={() => onEdit(alarm)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Bearbeiten</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${alarm.title} ${alarm.active ? 'pausieren' : 'aktivieren'}`} onPress={() => onToggle(alarm.id)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{alarm.active ? 'Pausieren' : 'Aktivieren'}</Text></Pressable>
        {event ? <Pressable accessibilityRole="button" accessibilityLabel={`${alarm.title} erledigen`} onPress={() => onComplete(alarm)} style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}><Text style={styles.doneButtonText}>Erledigt</Text></Pressable> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={`${alarm.title} löschen`} onPress={() => onDelete(alarm)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Text style={styles.iconButtonText}>×</Text></Pressable>
      </View>
    </View>
  );
}

const styles = {
  alarmCard: { backgroundColor: '#171B21', borderColor: '#38414A', borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 10 },
  alarmHeader: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10 },
  flex: { flex: 1 },
  alarmTitle: { color: '#EAE6D8', fontSize: 17, fontWeight: '900' as const },
  muted: { color: '#9BA0A5', fontSize: 12, lineHeight: 18 },
  statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  activePill: { backgroundColor: '#17351B' },
  pausedPill: { backgroundColor: '#2A3036' },
  statusText: { color: '#79C95B', fontSize: 9, fontWeight: '900' as const },
  badgeRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: 12 },
  badgeGold: { color: '#F8D889', backgroundColor: '#231E13', borderColor: '#67532D', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' as const },
  badgeBlue: { color: '#ABE0FB', backgroundColor: '#131F29', borderColor: '#2A5470', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' as const },
  badgeNeutral: { color: '#EAE6D8', backgroundColor: '#141A20', borderColor: '#38414A', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' as const },
  alarmTimeBox: { backgroundColor: '#12171D', borderRadius: 12, padding: 12, marginTop: 12 },
  alarmTime: { color: '#EAE6D8', fontSize: 15, fontWeight: '800' as const, marginTop: 4 },
  goldText: { color: '#F0C76A', fontSize: 14, fontWeight: '900' as const, marginTop: 4 },
  actionRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 13 },
  secondaryButton: { backgroundColor: '#252C34', borderColor: '#444C55', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, minHeight: 44 },
  secondaryButtonText: { color: '#EAE6D8', fontSize: 12, fontWeight: '800' as const },
  doneButton: { backgroundColor: '#79C95B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, minHeight: 44 },
  doneButtonText: { color: '#10150D', fontSize: 12, fontWeight: '900' as const },
  iconButton: { backgroundColor: '#3B1D20', borderColor: '#66312E', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6, minHeight: 44 },
  iconButtonText: { color: '#FFB5AB', fontSize: 18, fontWeight: '700' as const },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
} as const;
