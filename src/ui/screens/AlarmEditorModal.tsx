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
            <Pressable accessibilityRole="button" accessibilityLabel="Editor schließen" onPress={onClose} style={styles.closeButton}><Text style={styles.backText}>←</Text></Pressable>
            <Text style={styles.modalTitle}>{editingId ? 'ALARM BEARBEITEN' : 'NEUER ALARM'}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.typeField}>
            <Text style={styles.fieldIcon}>♟</Text>
            <Text style={styles.typeValue}>{alarmTypeLabel(editor.type)}</Text>
          </View>

          <Text style={styles.sectionTitle}>VORWARNUNGEN</Text>
          <View style={styles.warningCard}>
            {[60, 30, 15].map((minutes) => (
              <Pressable key={minutes} onPress={() => onChange((current) => ({ ...current, warnings: current.warnings.includes(minutes) ? current.warnings.filter((item) => item !== minutes) : [...current.warnings, minutes] }))} accessibilityRole="button" accessibilityLabel={`Vorwarnung ${minutes} Minuten`} style={styles.warningRow}>
                <View style={[styles.radio, editor.warnings.includes(minutes) && styles.radioActive]}>{editor.warnings.includes(minutes) ? <View style={styles.radioDot} /> : null}</View>
                <Text style={styles.warningText}>{minutes} Min.</Text>
                <Text style={styles.warningBell}>♩</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>ALARMTYP</Text>
          <View style={styles.fieldCard}>
            <Text style={styles.fieldIcon}>♟</Text>
            <View style={styles.flex}>
              <Text style={styles.fieldValue}>{alarmTypeLabel(editor.type)}</Text>
              <View style={styles.choiceRow}>
                {templateKeys.map((key) => <Pressable key={key} onPress={() => onChange((current) => ({ ...current, ...defaultEditor(TEMPLATES[key]), title: current.title }))} style={[styles.choice, editor.type === TEMPLATES[key].type && styles.choiceActive]}><Text style={styles.choiceText}>{alarmTypeLabel(TEMPLATES[key].type)}</Text></Pressable>)}
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>TON</Text>
          <View style={styles.fieldCard}>
            <Text style={styles.fieldIcon}>◖</Text>
            <View style={styles.flex}>
              <Text style={styles.fieldValue}>{editor.sound === 'siren' ? 'Standard' : editor.sound === 'chime' ? 'Chime' : 'Pulse'}</Text>
              <View style={styles.choiceRow}>
                {(['pulse', 'siren', 'chime'] as Alarm['sound'][]).map((sound) => <Pressable key={sound} onPress={() => onChange((current) => ({ ...current, sound }))} style={[styles.choice, editor.sound === sound && styles.choiceActive]}><Text style={styles.choiceText}>{sound === 'siren' ? 'Standard' : sound}</Text></Pressable>)}
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>DETAILS</Text>
          <View style={styles.detailsCard}>
            <Text style={styles.fieldLabel}>BEZEICHNUNG</Text>
            <TextInput accessibilityLabel="Alarmbezeichnung" value={editor.title} onChangeText={(title) => onChange((current) => ({ ...current, title }))} placeholder="z. B. Samstagabend Bubble Alarm" placeholderTextColor="#777E80" maxLength={80} style={styles.input} returnKeyType="done" />
            <View style={styles.twoColumns}>
              <View style={styles.column}><Text style={styles.fieldLabel}>DATUM</Text><TextInput accessibilityLabel="Alarmdatum" value={editor.date} onChangeText={(date) => onChange((current) => ({ ...current, date }))} placeholder="JJJJ-MM-TT" placeholderTextColor="#777E80" keyboardType="numbers-and-punctuation" style={styles.input} /></View>
              <View style={styles.column}><Text style={styles.fieldLabel}>UHRZEIT</Text><TextInput accessibilityLabel="Alarmuhrzeit" value={editor.time} onChangeText={(time) => onChange((current) => ({ ...current, time }))} placeholder="HH:MM" placeholderTextColor="#777E80" keyboardType="numbers-and-punctuation" style={styles.input} /></View>
            </View>
            <Text style={styles.fieldLabel}>WIEDERHOLUNG</Text>
            <View style={styles.choiceRow}>{(['once', 'daily', 'gw5d'] as Alarm['repeat'][]).map((repeat) => <Pressable key={repeat} onPress={() => onChange((current) => ({ ...current, repeat }))} style={[styles.choice, editor.repeat === repeat && styles.choiceActive]}><Text style={styles.choiceText}>{repeatLabel(repeat)}</Text></Pressable>)}</View>
            <View style={styles.switchLine}><Text style={styles.switchLabel}>Als geschützt markieren</Text><Switch value={editor.protected} onValueChange={(value) => onChange((current) => ({ ...current, protected: value }))} trackColor={{ false: '#303A3D', true: '#1E7850' }} thumbColor={editor.protected ? '#41D28B' : '#C8CECA'} /></View>
          </View>

          <Pressable accessibilityRole="button" onPress={onSave} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}><Text style={styles.primaryIcon}>▣</Text>{editingId ? 'Änderungen speichern' : 'Alarm speichern'}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  modalWrap: { flex: 1, justifyContent: 'flex-end' as const, backgroundColor: 'rgba(0,0,0,0.88)' },
  modalCard: { backgroundColor: '#0B1011', borderColor: '#202B2D', borderWidth: 1.5, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 18, paddingBottom: 30, maxHeight: '92%' as const, shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 30, elevation: 20 },
  modalHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: 14 },
  closeButton: { width: 44, height: 44, alignItems: 'center' as const, justifyContent: 'center' as const },
  backText: { color: '#E8B946', fontSize: 36, lineHeight: 36 },
  headerSpacer: { width: 44 },
  modalTitle: { flex: 1, color: '#E7B84C', fontSize: 19, fontWeight: '900' as const, textAlign: 'center' as const, letterSpacing: 1.2 },
  typeField: { flexDirection: 'row' as const, alignItems: 'center' as const, minHeight: 58, paddingHorizontal: 13, borderColor: '#394548', borderWidth: 1, borderRadius: 13, backgroundColor: '#151B1D' },
  fieldIcon: { width: 38, color: '#E7B84C', fontSize: 25, textAlign: 'center' as const },
  typeValue: { color: '#F0F0EB', fontSize: 17, fontWeight: '700' as const },
  sectionTitle: { color: '#2FC17B', fontSize: 15, fontWeight: '900' as const, letterSpacing: 0.7, marginTop: 20, marginBottom: 9 },
  warningCard: { overflow: 'hidden' as const, borderColor: '#344043', borderWidth: 1, borderRadius: 13, backgroundColor: '#101617' },
  warningRow: { position: 'relative' as const, flexDirection: 'row' as const, alignItems: 'center' as const, minHeight: 62, paddingHorizontal: 14, borderBottomColor: '#293335', borderBottomWidth: 1 },
  radio: { width: 27, height: 27, borderColor: '#1B8D67', borderWidth: 2, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 14 },
  radioActive: { borderColor: '#31D894', shadowColor: '#31D894', shadowOpacity: 0.28, shadowRadius: 7 },
  radioDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#31D894' },
  warningText: { flex: 1, color: '#F2F2ED', fontSize: 17, fontWeight: '600' as const },
  warningBell: { color: '#E5B541', fontSize: 25 },
  fieldCard: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 10, minHeight: 60, padding: 12, borderColor: '#344043', borderWidth: 1, borderRadius: 13, backgroundColor: '#101617' },
  flex: { flex: 1 },
  fieldValue: { color: '#F2F2ED', fontSize: 16, fontWeight: '700' as const, marginBottom: 9 },
  choiceRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
  choice: { minHeight: 44, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9, borderColor: '#3A4649', borderWidth: 1, backgroundColor: '#151B1D' },
  choiceActive: { borderColor: '#E7B84C', backgroundColor: '#251E10' },
  choiceText: { color: '#D2D7D2', fontSize: 10, fontWeight: '800' as const },
  detailsCard: { borderColor: '#344043', borderWidth: 1, borderRadius: 13, padding: 12, backgroundColor: '#101617' },
  fieldLabel: { color: '#899290', fontSize: 9, fontWeight: '900' as const, letterSpacing: 1, marginTop: 4, marginBottom: 6 },
  input: { backgroundColor: '#0B1011', color: '#F1F0EA', borderColor: '#374346', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, minHeight: 43 },
  twoColumns: { flexDirection: 'row' as const, gap: 9 },
  column: { flex: 1 },
  switchLine: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, minHeight: 51, marginTop: 10, borderTopColor: '#293335', borderTopWidth: 1 },
  switchLabel: { color: '#EAEDE8', fontSize: 14, fontWeight: '700' as const },
  primaryButton: { alignItems: 'center' as const, justifyContent: 'center' as const, minHeight: 48, marginTop: 20, borderColor: '#E6B943', borderWidth: 1, borderRadius: 13, backgroundColor: '#B98217', shadowColor: '#E6B943', shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  primaryButtonText: { color: '#130F06', fontSize: 19, fontWeight: '900' as const },
  primaryIcon: { marginRight: 10, fontSize: 24 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
} as const;
