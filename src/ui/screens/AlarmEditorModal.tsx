import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import type { Alarm, AlarmTemplate } from '../../domain/alarm';
import { TEMPLATES, alarmTypeLabel, repeatLabel } from '../../domain/alarm';

export type EditorValues = {
  type: Alarm['type'];
  title: string;
  date: string;
  time: string;
  warnings: number[];
  repeat: Alarm['repeat'];
  sound: Alarm['sound'];
  protected: boolean;
};

export const defaultEditor = (template: AlarmTemplate): EditorValues => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  return {
    type: template.type,
    title: template.title,
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    warnings: [...template.warnings],
    repeat: template.repeat,
    sound: template.sound,
    protected: template.protected,
  };
};

type AlarmEditorModalProps = {
  visible: boolean;
  editingId: string | null;
  editor: EditorValues;
  onChange: React.Dispatch<React.SetStateAction<EditorValues>>;
  onClose: () => void;
  onSave: () => void;
};

type TemplateKey = keyof typeof TEMPLATES;
const templateKeys = ['bubble', 'gwBubble', 'custom', 'individual', 'rss'] as TemplateKey[];

export function AlarmEditorModal({ visible, editingId, editor, onChange, onClose, onSave }: AlarmEditorModalProps): React.ReactElement {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Alarm bearbeiten' : 'Neuer Alarm'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Editor schließen" onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <Text style={styles.fieldLabel}>SCHNELLSTART-TYP</Text>
          <View style={styles.choiceRow}>
            {templateKeys.map((key) => <Pressable key={key} onPress={() => onChange((current) => ({ ...current, ...defaultEditor(TEMPLATES[key]), title: current.title }))} style={[styles.choice, editor.type === TEMPLATES[key].type && styles.choiceActive]}><Text style={styles.choiceText}>{alarmTypeLabel(TEMPLATES[key].type)}</Text></Pressable>)}
          </View>
          <Text style={styles.fieldLabel}>BEZEICHNUNG</Text>
          <TextInput accessibilityLabel="Alarmbezeichnung" value={editor.title} onChangeText={(title) => onChange((current) => ({ ...current, title }))} placeholder="z. B. Samstagabend Bubble Alarm" placeholderTextColor="#9BA0A5" maxLength={80} style={styles.input} returnKeyType="done" />
          <View style={styles.twoColumns}>
            <View style={styles.column}><Text style={styles.fieldLabel}>DATUM</Text><TextInput accessibilityLabel="Alarmdatum" value={editor.date} onChangeText={(date) => onChange((current) => ({ ...current, date }))} placeholder="JJJJ-MM-TT" placeholderTextColor="#9BA0A5" keyboardType="numbers-and-punctuation" style={styles.input} /></View>
            <View style={styles.column}><Text style={styles.fieldLabel}>UHRZEIT</Text><TextInput accessibilityLabel="Alarmuhrzeit" value={editor.time} onChangeText={(time) => onChange((current) => ({ ...current, time }))} placeholder="HH:MM" placeholderTextColor="#9BA0A5" keyboardType="numbers-and-punctuation" style={styles.input} /></View>
          </View>
          <Text style={styles.fieldLabel}>VORWARNUNGEN</Text>
          <View style={styles.choiceRow}>{[60, 30, 15].map((minutes) => <Pressable key={minutes} onPress={() => onChange((current) => ({ ...current, warnings: current.warnings.includes(minutes) ? current.warnings.filter((item) => item !== minutes) : [...current.warnings, minutes] }))} accessibilityRole="button" accessibilityLabel={`Vorwarnung ${minutes} Minuten`} style={[styles.choice, editor.warnings.includes(minutes) && styles.choiceActive]}><Text style={styles.choiceText}>{minutes} Min.</Text></Pressable>)}</View>
          <Text style={styles.fieldLabel}>WIEDERHOLUNG</Text>
          <View style={styles.choiceRow}>{(['once', 'daily', 'gw5d'] as Alarm['repeat'][]).map((repeat) => <Pressable key={repeat} onPress={() => onChange((current) => ({ ...current, repeat }))} accessibilityRole="button" accessibilityLabel={`Wiederholung ${repeatLabel(repeat)}`} style={[styles.choice, editor.repeat === repeat && styles.choiceActive]}><Text style={styles.choiceText}>{repeatLabel(repeat)}</Text></Pressable>)}</View>
          <View style={styles.switchLine}><Text style={styles.switchLabel}>Als geschützt markieren</Text><Switch value={editor.protected} onValueChange={(value) => onChange((current) => ({ ...current, protected: value }))} trackColor={{ false: '#38414A', true: '#60783D' }} thumbColor={editor.protected ? '#79C95B' : '#D0D6DB'} /></View>
          <Pressable accessibilityRole="button" onPress={onSave} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{editingId ? 'Änderungen speichern' : 'Alarm speichern'}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  modalWrap: { flex: 1, justifyContent: 'flex-end' as const, backgroundColor: 'rgba(0,0,0,0.78)' },
  modalCard: { backgroundColor: '#181D24', borderColor: '#414B55', borderWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 30, maxHeight: '94%' as const },
  modalHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 12 },
  modalTitle: { color: '#EAE6D8', fontSize: 22, fontWeight: '900' as const },
  closeButton: { width: 44, height: 44, borderRadius: 10, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: '#252C34' },
  closeText: { color: '#9BA0A5', fontSize: 25 },
  fieldLabel: { color: '#CDD3D8', fontSize: 10, fontWeight: '900' as const, letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#0F1419', color: '#FFF', borderColor: '#3C4650', borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, minHeight: 45 },
  twoColumns: { flexDirection: 'row' as const, gap: 10 },
  column: { flex: 1 },
  choiceRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 7 },
  choice: { backgroundColor: '#12171D', borderColor: '#38414A', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, minHeight: 44 },
  choiceActive: { borderColor: '#F0C76A', backgroundColor: '#2B2416' },
  choiceText: { color: '#EAE6D8', fontSize: 11, fontWeight: '800' as const },
  switchLine: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 14, marginBottom: 12 },
  switchLabel: { color: '#EAE6D8', fontSize: 14, fontWeight: '700' as const },
  primaryButton: { backgroundColor: '#F0C76A', borderRadius: 12, alignItems: 'center' as const, paddingVertical: 14, minHeight: 48, marginTop: 10 },
  primaryButtonText: { color: '#1B160D', fontSize: 15, fontWeight: '900' as const },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
} as const;
