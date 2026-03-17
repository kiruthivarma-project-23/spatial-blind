import { getMessage, LANG_CODES } from './i18n';

const activeUtterances = new Set();
let currentLang = 'en-US'; // Default BCP-47 locale

export const setLanguage = (lang) => {
  // Accepts either short code ('en'/'ta') or full BCP-47 ('en-US'/'ta-IN')
  currentLang = LANG_CODES[lang] || lang;
};

/**
 * Speak a message looked up from the i18n dictionary.
 * @param {string} key    - Message key (e.g. 'navStart')
 * @param {'en'|'ta'} lang - Short language code
 * @param {...any} args   - Extra args for function-based messages
 */
export const speakMsg = (key, lang = 'en', ...args) => {
  const text = getMessage(key, lang, ...args);
  const locale = LANG_CODES[lang] || currentLang;
  speak(text, locale);
};

export const speak = (text, forcedLang = null) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text) return;
  
  const synth = window.speechSynthesis;
  const lang = forcedLang || currentLang;
  
  // Urgent alerts bypass everything
  const isUrgent = text.includes("URGENT") || text.includes("HOLD") || text.includes("STOP");
  
  if (isUrgent) {
    synth.cancel();
    // Tiny timeout to let the hardware/browser clear
    setTimeout(() => performSpeak(text, true, lang), 50);
  } else {
    performSpeak(text, false, lang);
  }
};

const performSpeak = (text, urgent, lang) => {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang || currentLang;
  
  // High availability settings
  utterance.volume = 1;
  utterance.rate = urgent ? 1.7 : 1.5; 
  utterance.pitch = 1;

  // Track utterance to prevent Garbage Collection
  activeUtterances.add(utterance);

  utterance.onstart = () => {
    console.log("🗣️ Speech started:", text);
    if (synth.paused) synth.resume();
  };

  utterance.onend = () => {
    console.log("✅ Speech ended:", text);
    activeUtterances.delete(utterance);
  };

  utterance.onerror = (e) => {
    console.error("❌ Speech Error for text:", text, e);
    activeUtterances.delete(utterance);
    if (e.error === 'not-allowed') {
        console.warn("🚫 Speech blocked by browser. Interaction required.");
    }
  };

  // Some browsers need a resume before speak
  if (synth.paused) synth.resume();
  console.log("📢 Attempting to speak:", text);
  synth.speak(utterance);
};

export const stopSpeaking = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  activeUtterances.clear();
  console.log("🛑 SPEECH CANCELLED");
};
