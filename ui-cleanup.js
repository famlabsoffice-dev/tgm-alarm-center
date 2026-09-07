(() => {
  'use strict';

  const THEME_HREF = './reference-theme.css?v=4';
  if (!document.querySelector(`link[href="${THEME_HREF}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = THEME_HREF;
    document.head.appendChild(link);
  }

  const MARKETING_COPY = new Set([
    'Dein nächster Alarm, immer im Blick',
    'DEIN GAMING-ALARM CENTER',
    'Bubble Alarm und Massacre Alarm im Blick.',
    'Bereit für deine nächste Spielzeit.',
    'automatisch planen.',
    'Your next alarm, always in view',
    'YOUR GAMING ALARM CENTER',
    'Keep Bubble and Massacre Alarms in view.',
    'Ready for your next gaming session.',
    'Plan automatically.',
  ]);

  const MARKETING_PATTERN = /(dein|your)\s+(nächster|next)\s+alarm.*(immer im blick|always in view)/i;
  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  const removeMarketingCopy = () => {
    const elements = document.querySelectorAll('#app *');
    for (const element of elements) {
      const text = normalize(element.textContent);
      if (!text) continue;
      if (!MARKETING_COPY.has(text) && !MARKETING_PATTERN.test(text)) continue;
      element.remove();
    }
  };

  const observer = new MutationObserver(removeMarketingCopy);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  removeMarketingCopy();
})();
