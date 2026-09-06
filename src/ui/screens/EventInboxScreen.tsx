import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Alarm, Tier } from '../../domain/alarm';
import { normalizeExternalEvent } from '../../platform/alarmableEvent';
import type { EventInboxItem } from '../../platform/eventInbox';
import { recommendEvents } from '../../platform/eventInbox';

type Props = {
  items: EventInboxItem[];
  alarms: Alarm[];
  tier: Tier;
  accountId: string | null;
  onReceiveEvent: (item: EventInboxItem) => void;
  onAddToAlarm: (item: EventInboxItem) => void;
  onDismiss: (eventId: string) => void;
};

const COLORS = {
  panel: '#171B21',
  card: '#1E242B',
  cardAlt: '#252C34',
  border: '#38414A',
  text: '#EAE6D8',
  muted: '#9BA0A5',
  gold: '#F0C76A',
  mint: '#79C95B',
  blue: '#58B7E8',
  danger: '#D65A50',
};

const pad = (value: number): string => String(value).padStart(2, '0');
const defaultDate = (): string => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const defaultTime = (): string => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const formatEventTime = (value: string): string => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export function EventInboxScreen({ items, alarms, tier, accountId, onReceiveEvent, onAddToAlarm, onDismiss }: Props) {
  const [composerVisible, setComposerVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [priority, setPriority] = useState<'normal' | 'high' | 'critical'>('high');
  const [warnings, setWarnings] = useState('60,15');
  const [error, setError] = useState<string | null>(null);

  const recommendations = useMemo(() => recommendEvents(items, alarms), [items, alarms]);
  const resetComposer = (): void => {
    setTitle('');
    setDescription('');
    setCategory('general');
    setDate(defaultDate());
    setTime(defaultTime());
    setPriority('high');
    setWarnings('60,15');
    setError(null);
  };

  const submit = (): void => {
    if (!accountId) {
      setError('Zuerst einen Account anlegen.');
      return;
    }
    try {
      const parsedWarnings = warnings.split(',').map((value) => Number(value.trim())).filter((value) => value > 0);
      const event = normalizeExternalEvent({
        source: 'manual',
        sourceId: 'device',
        sourceEventId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        title,
        description,
        category,
        startAtUtc: new Date(`${date}T${time}:00`).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        priority,
        warningMinutes: parsedWarnings,
        action: 'notify',
      });
      onReceiveEvent({ event, status: 'new', receivedAt: new Date().toISOString() });
      setComposerVisible(false);
      resetComposer();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Event konnte nicht übernommen werden.');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>EVENT INBOX</Text>
          <Text style={styles.title}>Neue Ereignisse</Text>
          <Text style={styles.muted}>Empfangen → bewerten → als Alarm übernehmen.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => { resetComposer(); setComposerVisible(true); }} style={({ pressed }) => [styles.receiveButton, pressed && styles.pressed]}>
          <Text style={styles.receiveButtonText}>Event erfassen</Text>
        </Pressable>
      </View>

      {recommendations.length > 0 && (
        <View style={styles.recommendationCard}>
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationTitle}>Empfohlene Alarme</Text>
            <Text style={styles.scoreText}>{recommendations.length} offen</Text>
          </View>
          {recommendations.slice(0, 3).map((recommendation) => (
            <View key={recommendation.event.id} style={styles.recommendationRow}>
              <View style={styles.flex}>
                <Text style={styles.eventTitle}>{recommendation.event.title}</Text>
                <Text style={styles.muted}>{formatEventTime(recommendation.event.startAtUtc)} · Score {recommendation.score}</Text>
                <Text style={styles.reasonText}>{recommendation.reasons.slice(0, 2).join(' · ')}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => { const item = items.find((candidate) => candidate.event.id === recommendation.event.id); if (item) onAddToAlarm(item); }} style={styles.addButton}>
                <Text style={styles.addButtonText}>Als Alarm</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {items.filter((item) => item.status !== 'dismissed').length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Inbox ist leer</Text>
          <Text style={styles.muted}>Events aus Partnerquellen, Importen oder manuellem Empfang erscheinen hier.</Text>
        </View>
      ) : (
        items.filter((item) => item.status !== 'dismissed').map((item) => (
          <View key={item.event.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <View style={styles.flex}>
                <Text style={styles.eventTitle}>{item.event.title}</Text>
                <Text style={styles.muted}>{item.event.source} · {item.event.category} · {item.event.priority}</Text>
              </View>
              <View style={[styles.statusPill, item.status === 'added' ? styles.addedPill : styles.newPill]}>
                <Text style={styles.statusText}>{item.status === 'added' ? 'ÜBERNOMMEN' : 'NEU'}</Text>
              </View>
            </View>
            <Text style={styles.eventTime}>{formatEventTime(item.event.startAtUtc)}</Text>
            {item.event.description ? <Text style={styles.description}>{item.event.description}</Text> : null}
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{item.event.warningMinutes.join(' / ')} Min.</Text>
              <Text style={styles.badge}>{item.event.repeat === 'once' ? 'Einmalig' : 'Wiederkehrend'}</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable accessibilityRole="button" onPress={() => onAddToAlarm(item)} disabled={item.status === 'added'} style={[styles.secondaryButton, item.status === 'added' && styles.disabledButton]}>
                <Text style={styles.secondaryButtonText}>{item.status === 'added' ? 'Alarm vorhanden' : 'Als Alarm übernehmen'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => onDismiss(item.event.id)} style={styles.dismissButton}>
                <Text style={styles.dismissButtonText}>Verwerfen</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Modal visible={composerVisible} animationType="slide" transparent onRequestClose={() => setComposerVisible(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.flex}>
                <Text style={styles.modalTitle}>Event erfassen</Text>
                <Text style={styles.muted}>Lokaler Eingang für manuelle oder importierte Ereignisse.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Schließen" onPress={() => setComposerVisible(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
              <Text style={styles.fieldLabel}>TITEL</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="z. B. Super Weapon" placeholderTextColor={COLORS.muted} style={styles.input} />
              <Text style={styles.fieldLabel}>BESCHREIBUNG</Text>
              <TextInput value={description} onChangeText={setDescription} placeholder="Zusätzliche Information" placeholderTextColor={COLORS.muted} style={[styles.input, styles.multiline]} multiline />
              <Text style={styles.fieldLabel}>KATEGORIE</Text>
              <TextInput value={category} onChangeText={setCategory} placeholder="general" placeholderTextColor={COLORS.muted} style={styles.input} />
              <View style={styles.twoColumns}>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>DATUM</Text>
                  <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.muted} style={styles.input} autoCapitalize="none" />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>ZEIT</Text>
                  <TextInput value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor={COLORS.muted} style={styles.input} autoCapitalize="none" />
                </View>
              </View>
              <Text style={styles.fieldLabel}>PRIORITÄT</Text>
              <View style={styles.choiceRow}>
                {(['normal', 'high', 'critical'] as const).map((value) => <Pressable key={value} onPress={() => setPriority(value)} style={[styles.choice, priority === value && styles.choiceActive]}><Text style={styles.choiceText}>{value.toUpperCase()}</Text></Pressable>)}
              </View>
              <Text style={styles.fieldLabel}>VORWARNUNGEN · MINUTEN</Text>
              <TextInput value={warnings} onChangeText={setWarnings} placeholder="60,15" placeholderTextColor={COLORS.muted} style={styles.input} keyboardType="numbers-and-punctuation" />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>Event in Inbox übernehmen</Text></Pressable>
              <Text style={styles.tierNote}>Aktueller Plan: {tier}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 12, marginBottom: 12 },
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '900', marginTop: 3 },
  muted: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },
  receiveButton: { backgroundColor: COLORS.gold, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  receiveButtonText: { color: '#1B160D', fontSize: 11, fontWeight: '900' },
  recommendationCard: { backgroundColor: '#1B2118', borderColor: '#476236', borderWidth: 1, borderRadius: 15, padding: 13, marginBottom: 10 },
  recommendationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  recommendationTitle: { color: COLORS.mint, fontSize: 14, fontWeight: '900' },
  scoreText: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
  recommendationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopColor: '#33452A', borderTopWidth: StyleSheet.hairlineWidth },
  reasonText: { color: '#B8CEA6', fontSize: 10, marginTop: 2 },
  addButton: { backgroundColor: COLORS.mint, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 9 },
  addButtonText: { color: '#10150D', fontSize: 10, fontWeight: '900' },
  emptyCard: { backgroundColor: COLORS.panel, borderColor: COLORS.border, borderWidth: 1, borderRadius: 15, padding: 18, marginBottom: 10 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  eventCard: { backgroundColor: COLORS.panel, borderColor: COLORS.border, borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 9 },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eventTitle: { color: COLORS.text, fontSize: 15, fontWeight: '900' },
  statusPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  newPill: { backgroundColor: '#2B2416' },
  addedPill: { backgroundColor: '#18351C' },
  statusText: { color: COLORS.gold, fontSize: 8, fontWeight: '900' },
  eventTime: { color: COLORS.gold, fontSize: 14, fontWeight: '800', marginTop: 9 },
  description: { color: '#CDD3D8', fontSize: 12, lineHeight: 18, marginTop: 7 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  badge: { color: '#ABE0FB', backgroundColor: '#131F29', borderColor: '#2A5470', borderWidth: 1, borderRadius: 11, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  secondaryButton: { backgroundColor: COLORS.cardAlt, borderColor: '#444C55', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, minHeight: 44 },
  secondaryButtonText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  disabledButton: { opacity: 0.55 },
  dismissButton: { backgroundColor: '#3B1D20', borderColor: '#66312E', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, minHeight: 44 },
  dismissButtonText: { color: '#FFB5AB', fontSize: 11, fontWeight: '800' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.78)' },
  modalCard: { backgroundColor: '#181D24', borderColor: '#414B55', borderWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 28, maxHeight: '94%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  modalTitle: { color: COLORS.text, fontSize: 21, fontWeight: '900' },
  closeButton: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardAlt },
  closeText: { color: COLORS.muted, fontSize: 25 },
  formContent: { paddingBottom: 10 },
  fieldLabel: { color: '#CDD3D8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#0F1419', color: '#FFF', borderColor: '#3C4650', borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, minHeight: 45 },
  multiline: { minHeight: 78, textAlignVertical: 'top' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { backgroundColor: '#12171D', borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, minHeight: 44 },
  choiceActive: { borderColor: COLORS.gold, backgroundColor: '#2B2416' },
  choiceText: { color: COLORS.text, fontSize: 10, fontWeight: '900' },
  errorText: { color: '#FFB5AB', fontSize: 12, fontWeight: '700', marginTop: 10 },
  primaryButton: { backgroundColor: COLORS.gold, borderRadius: 12, alignItems: 'center', paddingVertical: 14, minHeight: 48, marginTop: 12 },
  primaryButtonText: { color: '#1B160D', fontSize: 14, fontWeight: '900' },
  tierNote: { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 8 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
