import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

type CommandCenterScreenProps = { children: React.ReactNode };

export function CommandCenterScreen({ children }: CommandCenterScreenProps): React.ReactElement {
  return <SafeAreaView style={styles.root}><View style={styles.content}>{children}</View></SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090C12' },
  content: { flex: 1 },
});
