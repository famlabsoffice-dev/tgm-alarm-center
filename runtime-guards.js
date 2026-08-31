(function enforceProductionGuards(){
  'use strict';

  window.selectTier=function(){
    window.toast('Store-Aktivierung ist noch nicht verifiziert.');
  };

  window.runLocalTest=function(){
    if(!('Notification' in window))return window.toast('Benachrichtigungen sind auf diesem Gerät nicht verfügbar.');
    if(Notification.permission==='default'){
      Notification.requestPermission().then(permission=>window.toast(permission==='granted'?'Browser-Berechtigung erteilt.':'Benachrichtigungszugriff nicht erteilt.'));
      return;
    }
    if(Notification.permission==='denied')return window.toast('Benachrichtigungen sind verweigert. Öffne die Systemeinstellungen des Browsers.');
    const n=new Notification('TGM ALARM CENTER · Browser-Test',{body:'Browser-Benachrichtigung erfolgreich ausgelöst.',tag:`tgm-browser-test-${Date.now()}`});
    n.onclick=()=>window.focus();
    window.toast('Browser-Test ausgelöst.');
  };
})();
