import { useEffect, useRef } from 'react';
import { speak, speakMsg } from '../utils/speech';
import { LANG_CODES } from '../utils/i18n';

// ─── Command keyword banks (EN + TA) ────────────────────────────────────────

const CMD_KEYWORDS = {
  START: {
    en: ['start navigation', 'start', 'begin', 'begin navigation', 'go'],
    ta: ['navigation start pannunga', 'thodangunga', 'aarambi', 'navigation aarambi', 'thodangu', 'தொடங்கு', 'ஆரம்பி', 'வழிசெலுத்தலைத் தொடங்கு'],
  },
  STOP: {
    en: ['stop navigation', 'stop', 'end navigation', 'end', 'finish'],
    ta: ['niruthunga', 'mudikka', 'nil', 'navigation niruthu', 'niruthu', 'நிறுத்து', 'நில்', 'முடி'],
  },
  HELP_ME: {
    en: ['help me', 'save me', 'emergency', 'sos', 'i need help'],
    ta: ['udhavi venum', 'udhavi', 'aapathdu', 'kaappaatrunga', 'enakku udhavi venum', 'உதவி', 'ஆபத்து', 'காப்பாற்றுங்கள்'],
  },
  STATUS: {
    en: ['status', "what's around", 'what is around', 'tell me status', 'surroundings'],
    ta: ['enna irukku', 'status sollu', 'suttramulamae sollu', 'vazhi sollu', 'என்ன இருக்கு', 'நிலைமை சொல்லு', 'சுற்றுப்புறம்'],
  },
  REPEAT: {
    en: ['repeat', 'say again', 'repeat that'],
    ta: ['meendum sollu', 'thirumba sollu', 'meendum', 'மீண்டும் சொல்லு', 'திரும்பச் சொல்லு'],
  },
  ZOOM_OUT: {
    en: ['zoom out', 'wider view', 'wide view', 'zoom'],
    ta: ['perithaga katunga', 'vizutha paarkkanum', 'zoom out pannunga', 'பெரிதாக்கு', 'பெரிதாகக் காட்டு'],
  },
  OPEN_SETTINGS: {
    en: ['open settings', 'settings', 'preferences', 'go to settings'],
    ta: ['amaipu thirandu', 'settings tirandu', 'amaipu katunga', 'அமைப்புகள்', 'அமைப்புகளைத் திற'],
  },
  AMBULANCE: {
    en: ['ambulance', 'call ambulance'],
    ta: ['ambulance', 'ambulance azhaikkunga', 'ஆம்புலன்ஸ்'],
  },
  NAVIGATE_DEST: {
    en: ['navigate to', 'take me to', 'go to destination'],
    ta: ['ange selvom', 'ilaaki sellu', 'navigate pannunga', 'செல்ல வேண்டும்', 'இலக்குக்குச் செல்'],
  },
  FIND_DOOR: {
    en: ['find door', 'where is the door', 'find entrance', 'find exit'],
    ta: ['door enga irukku', 'door kandupidi', 'kadhavu enga', 'door எங்க இருக்கு', 'கதவைத் தேடு'],
  },
  PATH_CLEAR_CHECK: {
    en: ['is the path clear for 10 meters', 'is path clear', 'path check', '10 meters clear'],
    ta: ['10 meter varai path clear aa', 'padhai clear aa', 'vazhi clear aa', 'பாதை தெளிவாக இருக்கிறதா'],
  },
  OPEN_PAYMENT: {
    en: ['open payment', 'payment open', 'open scanner', 'scanner open', 'make payment', 'start payment', 'pay', 'open gpay', 'gpay', 'google pay'],
    ta: ['payment open pannunga', 'scanner open pannunga', 'kaasu anuppu', 'gpay open pannunga', 'பணம் அனுப்பு', 'பேமெண்ட் செய்', 'ஜி பே திற'],
  },
  YES: {
    en: ['yes', 'confirm', 'correct', 'okay', 'proceed', 'yeah', 'yep'],
    ta: ['aama', 'confirm', 'sari', 'sariya irukku', 'உறுதிப்படுத்து', 'ஆம்', 'சரி', 'ஆமாம்'],
  },
  NO: {
    en: ['no', 'cancel', 'stop payment', 'wrong', 'nope'],
    ta: ['illai', 'vendaam', 'cancal pannu', 'இல்லை', 'வேண்டாம்', 'ரத்து செய்'],
  },
  BALANCE: {
    en: ['balance', 'check balance', 'how much money', 'available balance'],
    ta: ['balance evalo', 'meetham evalo', 'இருப்பு எவ்வளவு', 'பேலன்ஸ் சொல்லு'],
  },
};

/**
 * Check if the transcript matches any keyword for a given command + lang.
 * Uses word-boundary regex for better matching.
 */
const matchesCommand = (transcript, cmd, lang) => {
  const keywords = CMD_KEYWORDS[cmd]?.[lang] ?? [];
  return keywords.some((kw) => {
    // Escape special characters for regex
    const escaped = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    // Look for the keyword as a substring anywhere in the transcript
    const regex = new RegExp(escaped, 'i');
    return regex.test(transcript);
  });
};

/**
 * Try to extract a target object from a FIND command.
 */
const extractFindTarget = (transcript, lang) => {
  const enPhrases = ['find ', 'where is ', 'locate '];
  const taPhrases = ['enga irukku ', 'thedungo ', 'kaanunga ', 'எங்கே ', 'எங்கே உள்ளது ', 'தேடு '];
  const phrases = lang === 'ta' ? taPhrases : enPhrases;

  for (const phrase of phrases) {
    if (transcript.includes(phrase)) {
      let target = transcript.split(phrase)[1]?.trim() ?? '';
      // Strip common filler words
      target = target.replace(/^(a |an |the |my |oru |en |ஒரு |என் )/, '').trim();
      if (target) return target;
    }
  }
  return null;
};

const isClearTarget = (transcript, lang) => {
  const enKw = ['stop searching', 'clear target', 'cancel search'];
  const taKw = ['theaduvathai niruthunga', 'theadu niraathu', 'sulli niruthu', 'தேடுவதை நிறுத்து', 'தேடலை ரத்து செய்'];
  const kws = lang === 'ta' ? taKw : enKw;
  return kws.some((kw) => transcript.includes(kw));
};

/**
 * Extract an amount from a payment command.
 */
const extractAmount = (transcript) => {
  // Regex to find numbers in text. Supports "send 100", "100 rupees", "100 anuppu"
  const match = transcript.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
};

// ─── Component ───────────────────────────────────────────────────────────────

const VoiceAssistant = ({ onCommand, onListening, lang = 'en' }) => {
  // Use refs so the recognition event handlers always see the latest value
  // without needing to re-create the recognition instance every time lang changes.
  const langRef = useRef(lang);
  const recognitionRef = useRef(null);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

    let recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = LANG_CODES[lang] || 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      const activeLang = langRef.current;
      console.log(`🎤 Heard [${activeLang}]: "${transcript}"`);

      // 1. ── Named commands (Prioritize specific triggers) ──
      const namedCmds = [
        'START', 'STOP', 'HELP_ME', 'AMBULANCE', 'STATUS',
        'REPEAT', 'ZOOM_OUT', 'OPEN_SETTINGS', 'NAVIGATE_DEST',
        'FIND_DOOR', 'PATH_CLEAR_CHECK',
        'OPEN_PAYMENT', 'YES', 'NO', 'BALANCE',
      ];

      const otherLang = activeLang === 'en' ? 'ta' : 'en';
      let matched = null;
      for (const cmd of namedCmds) {
        if (matchesCommand(transcript, cmd, activeLang) ||
            matchesCommand(transcript, cmd, otherLang)) {
          matched = cmd;
          break;
        }
      }

      if (matched) {
        console.log(`✅ TRIGGER: ${matched}`);
        speakMsg('cmdRecognized', activeLang);
        onCommand(matched);
        return;
      }

      // 2. ── CLEAR TARGET ──
      if (isClearTarget(transcript, activeLang)) {
        console.log('✅ TRIGGER: CLEAR_TARGET');
        speakMsg('cmdRecognized', activeLang);
        onCommand({ type: 'CLEAR_TARGET' });
        return;
      }

      // 3. ── FIND TARGET (General Object Search) ──
      const findTarget = extractFindTarget(transcript, activeLang);
      if (findTarget) {
        console.log(`✅ TRIGGER: FIND_TARGET → ${findTarget}`);
        speakMsg('cmdRecognized', activeLang);
        onCommand({ type: 'FIND_TARGET', target: findTarget });
        return;
      }

      // 4. ── AMOUNT EXTRACTION (for Payments) ──
      const amt = extractAmount(transcript);
      if (amt && (transcript.includes('send') || transcript.includes('pay') || transcript.includes('anuppu') || transcript.includes('rupees') || transcript.includes('rupai'))) {
        console.log(`✅ TRIGGER: PAY_AMOUNT → ${amt}`);
        onCommand({ type: 'PAY_AMOUNT', amount: amt });
        return;
      }

      // Unrecognised speech
      console.log('⚠️ Unrecognised command:', transcript);
      speakMsg('notUnderstood', activeLang);
    };

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      speakMsg('listening', langRef.current);
      onListening?.(true);
    };

    recognition.onerror = (e) => {
      console.log('❌ Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        onListening?.(false);
      } else if (e.error === 'no-speech' || e.error === 'audio-capture') {
        // Non-fatal — recognition will auto-restart, just give feedback
        speakMsg('noSpeech', langRef.current);
      }
    };

    recognition.onend = () => {
      console.log('⚠️ Voice recognition ended — restarting');
      onListening?.(false);
      try {
        // Restart with the current lang setting
        recognition.lang = LANG_CODES[langRef.current] || 'en-US';
        recognition.start();
      } catch (e) {
        console.error('Speech recognition restart failed:', e);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Speech recognition start failed:', e);
      onListening?.(false);
    }

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once — lang changes are handled via langRef

  // When lang prop changes, update the live recognition instance's language
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    const newLocale = LANG_CODES[lang] || 'en-US';
    console.log(`🌐 Switching recognition language to: ${newLocale}`);

    // Stop → update lang → restart
    try {
      recognition.stop(); // onend will auto-restart with langRef.current (already updated above)
    } catch (e) {
      console.error('Recognition stop for lang switch failed:', e);
    }
  }, [lang]);

  return null;
};

export default VoiceAssistant;
