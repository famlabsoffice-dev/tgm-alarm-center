(() => {
  'use strict';

  const MARKETING_COPY = new Set([
    'Dein nächster Alarm, immer im Blick',
    'DEIN GAMING-ALARM CENTER',
    'Bubble Alarm und Massacre Alarm im Blick.',
    'Bereit für deine nächste Spielzeit.',
    'Your next alarm, always in view',
    'YOUR GAMING ALARM CENTER',
    'Keep Bubble and Massacre Alarms in view.',
    'Ready for your next gaming session.',
  ]);

  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  const removeMarketingCopy = () => {
    const elements = document.querySelectorAll('#app *');
    for (const element of elements) {
      const text = normalize(element.textContent);
      if (!MARKETING_COPY.has(text)) continue;
      element.remove();
    }
  };

  const observer = new MutationObserver(removeMarketingCopy);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  removeMarketingCopy();
})();
