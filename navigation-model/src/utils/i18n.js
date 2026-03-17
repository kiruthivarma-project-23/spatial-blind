/**
 * i18n.js — Centralized bilingual message system (English + Tamil)
 * All spoken and displayed messages should be sourced from here.
 */

export const MESSAGES = {
  en: {
    // Navigation lifecycle
    navStart:       "Navigation started. I am scanning your surroundings.",
    navStop:        "Navigation stopped.",
    navInit:        "Navigation system initializing. Scanning 10 metres ahead.",

    // Voice feedback
    listening:      "Listening.",
    cmdRecognized:  "Command recognized.",
    noSpeech:       "Sorry, I did not catch that. Please try again.",
    notUnderstood:  "Command not understood. Say help me for assistance.",

    // Emergency
    helpCalled:     "Emergency triggered. Fetching your location and alerting contacts.",
    emergencyLoc:   (lat, lng) => `Your location: Latitude ${lat}, Longitude ${lng}.`,
    locationDenied: "Location access denied. Performing security scan only.",
    securityPeople: (n) => `Security Scan: I detect ${n} people nearby.`,
    securityClear:  "Security Scan: No people detected in your immediate surroundings.",

    // Target search
    targetLocked:   (obj) => `Target locked. Searching for ${obj}.`,
    targetCleared:  "Target cleared. Resuming general scan.",
    searching:      (obj) => `Searching for ${obj}...`,

    // Object detection
    pathClear:      "Path clear now. You can go straight for 10 metres.",
    obstAhead:      "Obstacle ahead. Move right.",
    obstLeft:       "Obstacle ahead. Move left.",
    hold:           "HOLD. Path blocked.",
    groundHazard:   "URGENT: Possible hole or pit ahead! HOLD immediately.",

    // Status
    statusMsg:      (s) => `You are currently using the Spatial Audio Navigator. ${s}`,
    zoomOut:        "Camera zoomed out for wide view.",
    destSet:        "Destination set. Starting navigation.",
    gpsNoSupport:   "GPS is not supported on your device.",

    // Language
    langSwitched:   "Switched to English.",

    // Navigation Queries
    doorDetected: (pos) => `Door detected on the ${pos}.`,
    doorNotFound: "Door not detected nearby.",
    pathClear10m: "Path is clear for 10 meters.",
    obstacleAt: (dist) => `Obstacle ahead at ${dist} meters.`,
    moveLeft: "Move slightly left.",
    moveRight: "Move slightly right.",
    stopClose: "Stop! Obstacle very close.",

    // System
    modelFail:      "Alert. AI Vision model failed to load. Please refresh.",
    speechReset:    "System Reset Performed.",
    selfTest:       "Diagnostic test. I am checking the speech and audio systems.",
  },
  ta: {
    // Navigation lifecycle
    navStart:       "வழிசெலுத்தல் தொடங்கியது. உங்கள் சுற்றுப்புறத்தை ஸ்கேன் செய்கிறேன்.",
    navStop:        "வழிசெலுத்தல் நிறுத்தப்பட்டது.",
    navInit:        "வழிசெலுத்தல் அமைப்பு தொடங்குகிறது. 10 மீட்டர் முன்னால் ஸ்கேன் செய்கிறேன்.",

    // Voice feedback
    listening:      "கேட்கிறேன்.",
    cmdRecognized:  "கட்டளை அங்கீகரிக்கப்பட்டது.",
    noSpeech:       "மன்னிக்கவும், எனக்குப் புரியவில்லை. மீண்டும் முயலவும்.",
    notUnderstood:  "கட்டளை புரியவில்லை. உதவி என்று சொல்லுங்கள்.",

    // Emergency
    helpCalled:     "அவசரநிலை தூண்டப்பட்டது. உங்கள் இருப்பிடத்தைக் கண்டறிந்து தொடர்புகளுக்குத் தெரிவிக்கிறேன்.",
    emergencyLoc:   (lat, lng) => `உங்கள் இருப்பிடம்: அட்சரேகை ${lat}, தீர்க்கரேகை ${lng}.`,
    locationDenied: "இருப்பிட அனுமதி மறுக்கப்பட்டது. பாதுகாப்பு ஸ்கேன் மட்டும் செய்கிறேன்.",
    securityPeople: (n) => `பாதுகாப்பு ஸ்கேன்: உங்கள் அருகில் ${n} பேர் இருக்கிறார்கள்.`,
    securityClear:  "பாதுகாப்பு ஸ்கேன்: உங்கள் அருகில் யாரும் இல்லை.",

    // Target search
    targetLocked:   (obj) => `இலக்கு உறுதி செய்யப்பட்டது. ${obj}-ஐத் தேடுகிறேன்.`,
    targetCleared:  "இலக்கு நீக்கப்பட்டது. பொதுவான ஸ்கேனைத் தொடங்குகிறேன்.",
    searching:      (obj) => `${obj}-ஐத் தேடுகிறேன்...`,

    // Object detection
    pathClear:      "பாதை தெளிவாக உள்ளது. நீங்கள் 10 மீட்டர் நேராகச் செல்லலாம்.",
    obstAhead:      "முன்னால் தடை உள்ளது. வலதுபுறமாகச் செல்லவும்.",
    obstLeft:       "முன்னால் தடை உள்ளது. இடதுபுறமாகச் செல்லவும்.",
    hold:           "நிறுத்துங்கள். பாதை மறைக்கப்பட்டுள்ளது.",
    groundHazard:   "அவசரம்: முன்னால் குழி இருக்கலாம்! உடனே நிறுத்துங்கள்.",

    // Status
    statusMsg:      (s) => `நீங்கள் இப்போது ஸ்பேஷியல் ஆடியோ நேவிகேட்டரைப் பயன்படுத்துகிறீர்கள். ${s}`,
    zoomOut:        "கேமரா விரிந்த பார்வைக்காக மாற்றப்பட்டது.",
    destSet:        "இலக்கு நிர்ணயிக்கப்பட்டது. வழிசெலுத்தல் தொடங்குகிறது.",
    gpsNoSupport:   "உங்கள் சாதனத்தில் ஜி.பி.எஸ் ஆதரிக்கப்படவில்லை.",

    // Language
    langSwitched:   "தமிழ் மொழிக்கு மாற்றப்பட்டது.",

    // Navigation Queries
    doorDetected: (pos) => `${pos} பக்கம் கதவு உள்ளது.`,
    doorNotFound: "அருகில் கதவு எதுவும் கண்டறியப்படவில்லை.",
    pathClear10m: "10 மீட்டர் வரை பாதை தெளிவாக உள்ளது.",
    obstacleAt: (dist) => `முன்னால் ${dist} மீட்டரில் தடை உள்ளது.`,
    moveLeft: "கொஞ்சம் இடதுபுறம் நகருங்கள்.",
    moveRight: "கொஞ்சம் வலதுபுறம் நகருங்கள்.",
    stopClose: "நில்லுங்கள்! தடை மிக அருகில் உள்ளது.",

    // System
    modelFail:      "எச்சரிக்கை. ஏஐ விஷன் மாடல் லோட் ஆகவில்லை. புதுப்பித்துப் பாருங்கள்.",
    speechReset:    "அமைப்பு மீட்டமைக்கப்பட்டது.",
    selfTest:       "சுய பரிசோதனை. பேச்சு மற்றும் ஒலி அமைப்புகளைச் சரிபார்க்கிறேன்.",
  },
};

/**
 * Get a message by key for the given language.
 * Supports function-typed messages with arguments.
 * @param {string} key - Message key (e.g. 'navStart')
 * @param {'en'|'ta'} lang - Language code
 * @param  {...any} args - Arguments if the message is a function
 * @returns {string}
 */
export const getMessage = (key, lang = 'en', ...args) => {
  const langMap = MESSAGES[lang] || MESSAGES['en'];
  const msg = langMap[key] ?? MESSAGES['en'][key] ?? key;
  return typeof msg === 'function' ? msg(...args) : msg;
};

/**
 * Map short lang code ('en'/'ta') to BCP-47 locale for Web Speech APIs.
 */
export const LANG_CODES = {
  en: 'en-US',
  ta: 'ta-IN',
};

/**
 * Mutable singleton for non-React modules (e.g. GpsEngine) to read the active language.
 * Call setActiveLang() from Home.jsx whenever lang state changes.
 */
export const lang = { current: 'en' };

export const setActiveLang = (newLang) => {
  lang.current = newLang;
};
