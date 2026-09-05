import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const appPath = resolve(root, 'App.tsx');
let source = readFileSync(appPath, 'utf8');

const fail = (message) => { throw new Error(`UI screen refactor failed: ${message}`); };
const requireOnce = (condition, message) => { if (!condition) fail(message); };

function extractBalancedBlock(text, startIndex, openChar = '{', closeChar = '}') {
  const openIndex = text.indexOf(openChar, startIndex);
  if (openIndex < 0) fail(`missing opening ${openChar}`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === openChar) depth += 1;
    else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return { start: openIndex, end: index + 1, body: text.slice(openIndex + 1, index) };
    }
  }
  fail(`unclosed block beginning at ${startIndex}`);
}

function removeFunction(text, signature) {
  const start = text.indexOf(signature);
  if (start < 0) fail(`function signature not found: ${signature}`);
  const open = text.indexOf('{', start);
  const block = extractBalancedBlock(text, open);
  return text.slice(0, start) + text.slice(block.end);
}

const original = source;
requireOnce(!source.includes("from './src/ui/screens/AlarmCard';"), 'App.tsx is already partially refactored; refusing a non-idempotent rewrite');

source = source.replace('  KeyboardAvoidingView,\n', '').replace('  Modal,\n', '').replace('  SafeAreaView,\n', '').replace('  Switch,\n', '').replace('  TextInput,\n', '');
source = source.replace("  momentLabel,\n", '').replace("  upcomingMoments,\n", '');
source = source.replace("import { BillingPanel } from './src/billing/BillingPanel';\n", '');

const alarmImport = "import { reconcileAlarmNotifications } from './src/native/schedulerService';\n";
requireOnce(source.includes(alarmImport), 'scheduler import anchor missing');
source = source.replace(alarmImport, `${alarmImport}import { AlarmCard } from './src/ui/screens/AlarmCard';\nimport { AlarmEditorModal, defaultEditor, type EditorValues } from './src/ui/screens/AlarmEditorModal';\nimport { CommandCenterScreen } from './src/ui/screens/CommandCenterScreen';\nimport { SettingsScreen } from './src/ui/screens/SettingsScreen';\n`);

const typeStart = source.indexOf('type EditorValues = {');
requireOnce(typeStart >= 0, 'EditorValues block missing');
const typeEnd = source.indexOf('\n};', typeStart);
requireOnce(typeEnd >= 0, 'EditorValues block end missing');
source = source.slice(0, typeStart) + source.slice(typeEnd + 4);

const defaultStart = source.indexOf('const defaultEditor = (template: AlarmTemplate): EditorValues => {');
requireOnce(defaultStart >= 0, 'defaultEditor block missing');
const defaultOpen = source.indexOf('{', defaultStart);
const defaultBlock = extractBalancedBlock(source, defaultOpen);
source = source.slice(0, defaultStart) + source.slice(defaultBlock.end);

source = removeFunction(source, 'function isOccurrenceCompleted(');
source = removeFunction(source, 'function SettingRow(');

const renderStart = source.indexOf('  const renderAlarm = ({ item }: { item: Alarm }): React.ReactElement => {');
requireOnce(renderStart >= 0, 'renderAlarm block missing');
const renderOpen = source.indexOf('{', renderStart);
const renderBlock = extractBalancedBlock(source, renderOpen);
source = source.slice(0, renderStart) + source.slice(renderBlock.end);
source = source.replace('renderItem={renderAlarm}', 'renderItem={({ item }) => <AlarmCard alarm={item} now={now} onEdit={openEdit} onToggle={toggleAlarm} onComplete={completeAlarm} onDelete={deleteAlarm} />}');

const footerMarker = '        ListFooterComponent={';
const footerStart = source.indexOf(footerMarker);
requireOnce(footerStart >= 0, 'ListFooterComponent block missing');
const footerOpen = source.indexOf('{', footerStart);
const footerBlock = extractBalancedBlock(source, footerOpen);
const footerReplacement = `        ListFooterComponent={\n          <SettingsScreen\n            storageError={storageError}\n            notificationPreferences={state.notificationPreferences}\n            currentTier={state.tier}\n            showBilling={Platform.OS !== 'web'}\n            onUpdatePreference={updatePreference}\n            onTierConfirmed={confirmStoreTier}\n            onExportBackup={exportCurrentBackup}\n            onImportBackup={importBackup}\n            onDeviceTest={runDeviceTest}\n          />\n        }`;
source = source.slice(0, footerStart) + footerReplacement + source.slice(footerBlock.end);

const modalStart = source.indexOf('      <Modal visible={editorVisible}');
requireOnce(modalStart >= 0, 'editor Modal block missing');
const modalEndTag = '\n      </Modal>';
const modalEnd = source.indexOf(modalEndTag, modalStart);
requireOnce(modalEnd >= 0, 'editor Modal closing tag missing');
const modalReplacement = `      <AlarmEditorModal\n        visible={editorVisible}\n        editingId={editingId}\n        editor={editor}\n        onChange={setEditor}\n        onClose={() => setEditorVisible(false)}\n        onSave={saveEditor}\n      />`;
source = source.slice(0, modalStart) + modalReplacement + source.slice(modalEnd + modalEndTag.length);

source = source.replace('<SafeAreaView style={styles.root}><View style={styles.loading}>', '<CommandCenterScreen><View style={styles.loading}>');
source = source.replace('</View></SafeAreaView>;', '</View></CommandCenterScreen>;');
source = source.replace('    <SafeAreaView style={styles.root}>', '    <CommandCenterScreen>');
source = source.replace('    </SafeAreaView>\n  );', '    </CommandCenterScreen>\n  );');

requireOnce(source.includes('<AlarmCard '), 'AlarmCard not wired');
requireOnce(source.includes('<SettingsScreen'), 'SettingsScreen not wired');
requireOnce(source.includes('<AlarmEditorModal'), 'AlarmEditorModal not wired');
requireOnce(source.includes('<CommandCenterScreen>'), 'CommandCenterScreen not wired');
requireOnce(!source.includes('renderAlarm'), 'renderAlarm inline responsibility remains');
requireOnce(!source.includes('<Modal '), 'Modal inline responsibility remains');
requireOnce(!source.includes('function SettingRow'), 'SettingRow inline responsibility remains');

writeFileSync(appPath, source, 'utf8');
console.log(`UI screen refactor PASS: ${Buffer.byteLength(original)} -> ${Buffer.byteLength(source)} bytes`);