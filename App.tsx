import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Alarm, AppState, TEMPLATES, nextOccurrence, occurrenceKey } from './src/domain/alarm';
import { emptyState, loadState, saveState } from './src/storage/store';
import { initializeNotifications, registerCategories, scheduleAlarm } from './src/native/notifications';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });

const nowIso = () => new Date().toISOString();
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function App() {
  const [state, setState] = useState<AppState>(emptyState());
  const [ready, setReady] = useState(false);
  const [native, setNative] = useState({ supported: false, permission: false, exactAlarm: false, channel: false });

  useEffect(() => { (async () => { const loaded = await loadState(); setState(loaded); await registerCategories(); setNative(await initializeNotifications()); setReady(true); })().catch(e => Alert.alert('Startfehler', e instanceof Error ? e.message : 'Daten konnten nicht geladen werden.')); }, []);
  useEffect(() => { if (ready) saveState(state).catch(() => Alert.alert('Speicherfehler', 'Die Änderungen konnten nicht dauerhaft gespeichert werden.')); }, [state, ready]);

  const next = useMemo(() => state.alarms.filter(a => a.active).map(a => ({ alarm: a, time: nextOccurrence(a) })).filter(x => x.time).sort((a,b) => a.time!.getTime()-b.time!.getTime())[0], [state]);

  async function addTemplate(type: keyof typeof TEMPLATES) {
    if (!state.activeAccountId) { const account = { id: id(), name: 'Mein TGM-Kommando', color: '#F0C76A', createdAt: nowIso() }; setState(s => ({ ...s, accounts: [account], activeAccountId: account.id })); return; }
    const limits = { free: 1, streetBoss: 2, caporegime: 3, godfather: Infinity }[state.tier];
    if (state.alarms.filter(a => a.accountId === state.activeAccountId).length >= limits) { Alert.alert('Limit erreicht', 'Wähle einen höheren Plan.'); return; }
    const t = TEMPLATES[type]; const d = new Date(Date.now() + 3600000); const date = d.toISOString().slice(0,10); const time = d.toTimeString().slice(0,5);
    const alarm: Alarm = { id: id(), accountId: state.activeAccountId, title: t.title, type, date, time, warnings: t.warnings, repeat: t.repeat, sound: t.sound, active: true, protected: type !== 'custom', completedOccurrences: {}, createdAt: nowIso(), updatedAt: nowIso() };
    setState(s => ({ ...s, alarms: [...s.alarms, alarm] }));
    const event = nextOccurrence(alarm); if (event) await scheduleAlarm(alarm, event, alarm.warnings, sPreview(state), state.notificationPreferences.vibration);
  }
  const sPreview = (s: AppState) => s.notificationPreferences.preview;

  function complete(alarm: Alarm) { const event = nextOccurrence(alarm); if (!event) return; setState(s => ({ ...s, alarms: s.alarms.map(a => a.id === alarm.id ? { ...a, completedOccurrences: { ...a.completedOccurrences, [occurrenceKey(a.id, event)]: true }, updatedAt: nowIso() } : a) })); }

  if (!ready) return <SafeAreaView style={styles.root}><Text style={styles.title}>TGM ALARM CENTER</Text><Text style={styles.muted}>Wird geladen …</Text></SafeAreaView>;
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.brand}>TGM ALARM CENTER</Text>
    <Text style={styles.subtitle}>Persönliche Alarmzentrale</Text>
    <View style={styles.card}><Text style={styles.label}>ALS NÄCHSTES</Text>{next ? <><Text style={styles.next}>{next.alarm.title}</Text><Text style={styles.time}>{next.time!.toLocaleString()}</Text></> : <Text style={styles.muted}>Kein aktiver Termin</Text>}</View>
    <View style={styles.row}><View style={styles.smallCard}><Text style={styles.label}>ALARME</Text><Text style={styles.value}>{state.alarms.length}</Text></View><View style={styles.smallCard}><Text style={styles.label}>ACCOUNTS</Text><Text style={styles.value}>{state.accounts.length}</Text></View><View style={styles.smallCard}><Text style={styles.label}>NATIVE</Text><Text style={styles.value}>{native.permission ? 'OK' : '—'}</Text></View></View>
    <Text style={styles.section}>Schnellstart</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Bubble erstellen" style={styles.button} onPress={() => addTemplate('bubble')}><Text style={styles.buttonText}>Bubble</Text><Text style={styles.muted}>60 · 15 min · Pulse</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="GW Bubble erstellen" style={styles.button} onPress={() => addTemplate('gwBubble')}><Text style={styles.buttonText}>GW Bubble</Text><Text style={styles.muted}>60 · 30 · 15 min · Siren</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Eigenes Event erstellen" style={styles.button} onPress={() => addTemplate('custom')}><Text style={styles.buttonText}>Eigenes Event</Text><Text style={styles.muted}>15 min · Chime</Text></TouchableOpacity>
    <Text style={styles.section}>Alarme</Text>
    {state.alarms.map(a => <View key={a.id} style={styles.alarm}><View style={{flex:1}}><Text style={styles.buttonText}>{a.title}</Text><Text style={styles.muted}>{a.type} · {a.repeat === 'daily' ? 'täglich' : 'einmalig'} · {a.active ? 'aktiv' : 'pausiert'}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${a.title} erledigen`} onPress={() => complete(a)} style={styles.done}><Text style={styles.doneText}>Erledigt</Text></TouchableOpacity></View>)}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ root:{flex:1,backgroundColor:'#090C12'},content:{padding:24,gap:12},brand:{color:'#F0C76A',fontSize:26,fontWeight:'900',letterSpacing:1},subtitle:{color:'#9BA0A5',marginBottom:8},card:{backgroundColor:'#171B21',borderColor:'#38414A',borderWidth:1,borderRadius:18,padding:22},label:{color:'#9BA0A5',fontSize:11,fontWeight:'800',letterSpacing:1},next:{color:'#EAE6D8',fontSize:23,fontWeight:'900',marginTop:8},time:{color:'#F0C76A',fontSize:18,marginTop:5},muted:{color:'#9BA0A5'},row:{flexDirection:'row',gap:10},smallCard:{flex:1,backgroundColor:'#1E242B',borderColor:'#38414A',borderWidth:1,borderRadius:14,padding:15},value:{color:'#EAE6D8',fontSize:22,fontWeight:'900',marginTop:6},section:{color:'#EAE6D8',fontSize:20,fontWeight:'900',marginTop:10},button:{backgroundColor:'#1E242B',borderColor:'#38414A',borderWidth:1,borderRadius:14,padding:17},buttonText:{color:'#EAE6D8',fontWeight:'900',fontSize:16},alarm:{flexDirection:'row',alignItems:'center',backgroundColor:'#171B21',borderColor:'#38414A',borderWidth:1,borderRadius:14,padding:15},done:{backgroundColor:'#79C95B',borderRadius:10,paddingVertical:10,paddingHorizontal:12},doneText:{color:'#10150d',fontWeight:'900'}});
