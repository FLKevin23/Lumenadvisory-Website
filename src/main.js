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
function syncLangUI(lang) {
  const langToggle = document.getElementById('langToggle');
  const langDropdown = document.getElementById('langDropdown');
  if (langToggle) langToggle.textContent = lang.toUpperCase() + ' ▾';
  if (langDropdown) {
    langDropdown.querySelectorAll('.lang-opt').forEach(a => {
      a.classList.toggle('active', a.dataset.lang === lang);
    });
  }
  document.documentElement.lang = lang;
}

document.addEventListener('DOMContentLoaded', () => {
  translatePage(currentLang);
  syncLangUI(currentLang);

  // ── FAQ accordion ──────────────────────────────────
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  const langDropdown = document.getElementById('langDropdown');
  const langToggle = document.getElementById('langToggle');
  if (langDropdown) {
    langDropdown.addEventListener('click', (e) => {
      const opt = e.target.closest('.lang-opt');
      if (!opt) return;
      e.preventDefault();
      currentLang = opt.dataset.lang;
      localStorage.setItem('lang', currentLang);
      translatePage(currentLang);
      syncLangUI(currentLang);
      langDropdown.classList.remove('open');
      if (langToggle) langToggle.classList.remove('open');
    });
  }
});
