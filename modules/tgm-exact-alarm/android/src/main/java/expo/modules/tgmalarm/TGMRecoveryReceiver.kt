package expo.modules.tgmalarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

private const val PREFS_NAME = "tgm_alarm_center_recovery"
private const val KEY_BOOT = "boot_reconciliation_needed"
private const val KEY_PERMISSION = "exact_alarm_permission_changed"

class TGMRecoveryReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      Intent.ACTION_PACKAGE_REPLACED -> preferences.edit().putBoolean(KEY_BOOT, true).apply()
      "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED" -> preferences.edit().putBoolean(KEY_PERMISSION, true).apply()
    }
  }
}

internal fun consumeRecoverySignals(context: Context): Map<String, Boolean> {
  val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
  val boot = preferences.getBoolean(KEY_BOOT, false)
  val permission = preferences.getBoolean(KEY_PERMISSION, false)
  preferences.edit().remove(KEY_BOOT).remove(KEY_PERMISSION).apply()
  return mapOf("bootReconciliationNeeded" to boot, "exactAlarmPermissionChanged" to permission)
}
