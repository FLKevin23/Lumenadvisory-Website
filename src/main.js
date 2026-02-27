import { en } from './en.js';
import { de } from './de.js';

// ── Translation ────────────────────────────────────
let currentLang = localStorage.getItem('lang') || 'en';

function getTranslation(lang, keyPath) {
  const keys = keyPath.split('.');
  let value = lang === 'de' ? de : en;
  for (const key of keys) {
    if (value == null) return keyPath;
    value = value[key];
  }
  return value ?? keyPath;
}

function translatePage(lang) {
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    const value = getTranslation(lang, key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = value;
    } else {
      el.innerHTML = value;
    }
  });
}

// ── Language switcher ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  translatePage(currentLang);

  // Sync button label on load
  const langToggle = document.getElementById('langToggle');
  if (langToggle) langToggle.textContent = currentLang.toUpperCase() + ' ▾';

  // Lang dropdown click handler (replaces inline handler)
  const langDropdown = document.getElementById('langDropdown');
  if (langDropdown) {
    langDropdown.addEventListener('click', (e) => {
      const opt = e.target.closest('.lang-opt');
      if (!opt) return;
      e.preventDefault();
      currentLang = opt.dataset.lang;
      localStorage.setItem('lang', currentLang);
      langToggle.textContent = currentLang.toUpperCase() + ' ▾';
      langDropdown.querySelectorAll('.lang-opt').forEach(a => a.classList.remove('active'));
      opt.classList.add('active');
      translatePage(currentLang);
      langDropdown.classList.remove('open');
      langToggle.classList.remove('open');
    });
  }
});
