/* eslint-disable no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCamera, FaVolumeUp, FaMicrophone, FaMobileAlt, FaLanguage } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import RadarScanner from '../components/RadarScanner';
import FeatureCard from '../components/FeatureCard';
import CameraDetection from '../components/CameraDetection';
import VoiceAssistant from '../components/VoiceAssistant';
import { speak, speakMsg, stopSpeaking, setLanguage } from '../utils/speech';
import { gpsEngine } from '../utils/GpsEngine';
import { LANG_CODES, setActiveLang } from '../utils/i18n';

const Home = () => {
  const navigate = useNavigate();

  const [lang, setLang] = useState('en'); // 'en' | 'ta'
  const [navigating, setNavigating] = useState(false);
  const [statusText, setStatusText] = useState("System standby - Ready to assist");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [zoomOut, setZoomOut] = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [aiHeartbeat, setAiHeartbeat] = useState(0);
  const [voiceCount, setVoiceCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [targetObject, setTargetObject] = useState(null);
  const [findDoorTrigger, setFindDoorTrigger] = useState(0);
  const [pathCheckTrigger, setPathCheckTrigger] = useState(0);

  // UPI Payment State
  const [mockBalance, setMockBalance] = useState(10000);
  const [paymentState, setPaymentState] = useState('IDLE'); // IDLE, SCANNING, CONFIRMING_PAYEE, ASKING_AMOUNT, CONFIRMING_AMOUNT
  const [payeeData, setPayeeData] = useState(null); // { name, vpa }
  const [pendingAmount, setPendingAmount] = useState(null);

  // Use refs for values needed in the stable callback
  const langRef = useRef(lang);
  const paymentStateRef = useRef(paymentState);
  const payeeDataRef = useRef(payeeData);
  const mockBalanceRef = useRef(mockBalance);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { paymentStateRef.current = paymentState; }, [paymentState]);
  useEffect(() => { payeeDataRef.current = payeeData; }, [payeeData]);
  useEffect(() => { mockBalanceRef.current = mockBalance; }, [mockBalance]);

  useEffect(() => {
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setVoiceCount(voices.length);
    };
    checkVoices();
    window.speechSynthesis.onvoiceschanged = checkVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Language Toggle ─────────────────────────────────────────────────────────
  // Keep the non-React lang singleton (used by GpsEngine etc.) in sync
  useEffect(() => {
    setActiveLang(lang);
  }, [lang]);

  const handleLangToggle = () => {
    const newLang = lang === 'en' ? 'ta' : 'en';
    setLang(newLang);
    setLanguage(newLang); // Update the speech engine locale
    // Announce in the newly selected language
    speakMsg('langSwitched', newLang);
  };

  // ── Navigation Controls ─────────────────────────────────────────────────────
  const startNavigation = () => {
    window.speechSynthesis.cancel();
    setAudioEnabled(true);
    setNavigating(true);
    setStatusText("Initializing camera access...");

    gpsEngine.startTracking((coords) => {
      console.log("📍 GPS Tracking Active:", coords.latitude, coords.longitude);
    });

    setTimeout(() => {
      speakMsg('navInit', lang);
    }, 200);
  };

  const stopNavigation = () => {
    console.log("🛑 Click: Manual STOP triggered");
    stopSpeaking();
    speakMsg('navStop', lang);
    gpsEngine.stopTracking();
    setNavigating(false);
    setStatusText("System standby - Ready to assist");
  };

  const statusTextRef = useRef(statusText);
  useEffect(() => {
    statusTextRef.current = statusText;
  }, [statusText]);

  // ── Command Handler ─────────────────────────────────────────────────────────
  const handleCommand = useCallback((command) => {
    console.log("Voice Command Triggered:", command);

    // Handle specific object targeting
    if (typeof command === 'object' && command !== null) {
      if (command.type === "FIND_TARGET") {
        setTargetObject(command.target);
        speakMsg('targetLocked', langRef.current, command.target);
        setStatusText(`Searching for: ${command.target.toUpperCase()}`);
        return;
      }
      if (command.type === "CLEAR_TARGET") {
        setTargetObject(null);
        speakMsg('targetCleared', langRef.current);
        setStatusText("System standby - Ready to assist");
        return;
      }
    }

    switch (command) {
      case "START":
        setNavigating(prev => {
          if (!prev) {
            speakMsg('navStart', langRef.current);
            setStatusText("Initializing camera access...");
            setAudioEnabled(true);
            gpsEngine.startTracking((coords) => {
              console.log("📍 GPS Active:", coords.latitude, coords.longitude);
            });
            return true;
          }
          return prev;
        });
        break;
      case "STOP":
        console.log("🛑 Voice Command: STOP triggered");
        stopSpeaking();
        setNavigating(prev => {
          if (prev) {
            speakMsg('navStop', langRef.current);
            gpsEngine.stopTracking();
            setTargetObject(null);
            setStatusText("System standby - Ready to assist");
            return false;
          }
          return prev;
        });
        break;
      case "OPEN_SETTINGS":
        navigate('/settings');
        break;
      case "STATUS":
        speakMsg('statusMsg', langRef.current, statusTextRef.current);
        break;
      case "REPEAT":
        speak(statusTextRef.current, LANG_CODES[langRef.current]);
        break;
      case "ZOOM_OUT":
        setZoomOut(true);
        speakMsg('zoomOut', langRef.current);
        break;
      case "HELP_ME":
      case "AMBULANCE":
        speakMsg('helpCalled', langRef.current);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            speakMsg('emergencyLoc', lang, latitude.toFixed(4), longitude.toFixed(4));

            const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            const smsMessage = `EMERGENCY! I need help. My location: ${googleMapsUrl}`;
            console.log("🚨 EMERGENCY DATA:", smsMessage);
            window.open(`sms:?body=${encodeURIComponent(smsMessage)}`, '_blank');

            setEmergencyActive(true);
            setTimeout(() => setEmergencyActive(false), 8000);
          }, () => {
            speakMsg('locationDenied', lang);
            setEmergencyActive(true);
            setTimeout(() => setEmergencyActive(false), 5000);
          });
        }
        break;
      case "NAVIGATE_DEST":
        gpsEngine.setDestination(13.0827, 80.2707);
        break;
      case "FIND_DOOR":
        setFindDoorTrigger(prev => prev + 1);
        setStatusText("Scanning for door...");
        break;
      case "PATH_CLEAR_CHECK":
        setPathCheckTrigger(prev => prev + 1);
        setStatusText("Analyzing path for 10 meters...");
        break;
      case "OPEN_PAYMENT":
        setPaymentState('SCANNING');
        speakMsg('payInit', langRef.current);
        setStatusText("Payment: Scanning QR Code...");
        break;
      case "BALANCE":
        speakMsg('balanceReport', langRef.current, mockBalanceRef.current);
        break;
      case "YES":
        handlePaymentConfirm();
        break;
      case "NO":
        handlePaymentCancel();
        break;
      default:
        // Handle Object-based Commands
        if (typeof command === 'object' && command.type === 'PAY_AMOUNT') {
          handleAmountEntry(command.amount);
        }
        break;
    }
  }, []); // Stable callback ref

  const handleAmountEntry = (amt) => {
    if (paymentState !== 'ASKING_AMOUNT') return;
    if (amt > mockBalance) {
      speakMsg('insufficientFunds', lang);
      return;
    }
    setPendingAmount(amt);
    setPaymentState('CONFIRMING_AMOUNT');
    speakMsg('confirmAmount', lang, amt);
    setStatusText(`Confirm payment of ₹${amt}?`);
  };

  const handlePaymentConfirm = () => {
    if (paymentState === 'CONFIRMING_PAYEE') {
      setPaymentState('ASKING_AMOUNT');
      speakMsg('askAmount', lang);
      setStatusText(`Payee: ${payeeData.name}. Enter Amount.`);
    } else if (paymentState === 'CONFIRMING_AMOUNT') {
      triggerPaymentRedirect();
    }
  };

  const handlePaymentCancel = () => {
    setPaymentState('IDLE');
    setPayeeData(null);
    setPendingAmount(null);
    speakMsg('payCancel', lang);
    setStatusText("System standby - Ready to assist");
  };

  const triggerPaymentRedirect = () => {
    const upiUrl = `upi://pay?pa=${payeeData.vpa}&pn=${encodeURIComponent(payeeData.name)}&am=${pendingAmount}&cu=INR`;
    speakMsg('payRedirect', lang, pendingAmount, payeeData.name);
    
    // Simulate balance deduction for demo
    setMockBalance(prev => prev - pendingAmount);
    
    setTimeout(() => {
      window.location.href = upiUrl;
      // Reset state after a delay (assuming user comes back or app switches)
      setPaymentState('IDLE');
      setPayeeData(null);
      setPendingAmount(null);
    }, 2000);
  };

  const handleQrDetected = (data) => {
    if (paymentState !== 'SCANNING') return;
    // data usually upi://pay?pa=...&pn=...
    const url = new URL(data.replace('upi://pay', 'http://upi'));
    const pa = url.searchParams.get('pa');
    const pn = url.searchParams.get('pn') || pa; // Use VPA as name if PN is missing
    
    setPayeeData({ name: pn, vpa: pa });
    setPaymentState('CONFIRMING_PAYEE');
    speakMsg('qrDetected', lang, pn);
    setTimeout(() => {
      speakMsg('confirmPayee', lang, pn);
    }, 1500);
    setStatusText(`Payee detected: ${pn}. Confirm?`);
  };

  const performSelfTest = () => {
    console.log("🧪 Diagnostic: Performing Self Test...");
    speakMsg('selfTest', lang);
    import('../utils/SpatialAudioEngine').then(module => {
      module.playSpatialSound('center', 1.0);
    });
  };

  // ── Prompt text (bilingual) ─────────────────────────────────────────────────
  const promptText = isListening
    ? (lang === 'en' ? 'LISTENING...' : 'KETKIREIN...')
    : (lang === 'en'
        ? "SAY 'START NAVIGATION'"
        : "SOLLUNGA 'NAVIGATION START PANNUNGA'");

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto flex flex-col gap-10">
      <VoiceAssistant
        onCommand={handleCommand}
        onListening={setIsListening}
        lang={lang}
      />

      {/* Top Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-8 flex flex-col items-center text-center gap-4"
      >
        {!navigating ? <RadarScanner /> : <div className="h-8"></div>}

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-widest neon-text mb-2">
          SPATIAL AUDIO NAVIGATOR
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl font-light">
          {lang === 'en'
            ? '"AI-powered navigation assistant for visually impaired individuals."'
            : '"பார்வையற்றோருக்கான AI வழிசெலுத்தல் உதவியாளர்."'}
        </p>

        {navigating && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="text-xl font-mono text-[var(--color-neon)] bg-[rgba(0,224,255,0.05)] p-4 rounded-xl border border-[rgba(0,224,255,0.2)]">
              {statusText}
            </div>
            {!audioEnabled && (
              <p className="text-red-400 text-sm animate-pulse">
                ⚠️ {lang === 'en' ? 'Audio may be blocked. Tap screen to enable.' : 'ஆடியோ தடுக்கப்பட்டிருக்கலாம். திரையை தட்டவும்.'}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Navigation Feature (Core Function) */}
      {navigating && (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
          <CameraDetection
            isActive={navigating}
            onStatusChange={(msg) => setStatusText(msg)}
            onHeartbeat={() => setAiHeartbeat(h => h + 1)}
            zoomOut={zoomOut}
            emergencyActive={emergencyActive}
            targetObject={targetObject}
            lang={lang}
            findDoorTrigger={findDoorTrigger}
            pathCheckTrigger={pathCheckTrigger}
            isScanningPayment={paymentState === 'SCANNING'}
            onQrDetected={handleQrDetected}
          />

          {/* PAYMENT UI OVERLAY */}
          {paymentState !== 'IDLE' && (
            <div className="absolute bottom-10 right-10 w-full max-w-sm bg-black/80 backdrop-blur-xl border-2 border-green-500 rounded-3xl p-6 z-50 shadow-[0_0_40px_rgba(34,197,94,0.3)] motion-safe:animate-bounce-subtle">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500">
                  <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-400 tracking-tighter uppercase">
                    UPI Payment Mode
                  </h2>
                  <p className="text-gray-300 mt-2 font-mono">
                    {statusText}
                  </p>
                </div>
                {paymentState === 'CONFIRMING_PAYEE' && payeeData && (
                  <div className="bg-white/5 p-4 rounded-xl w-full border border-white/10">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Receiver</p>
                    <p className="text-xl font-bold text-white">{payeeData.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">{payeeData.vpa}</p>
                  </div>
                )}
                {paymentState === 'CONFIRMING_AMOUNT' && pendingAmount && (
                    <div className="bg-green-500/10 p-4 rounded-xl w-full border border-green-500/30">
                        <p className="text-xs text-green-500 uppercase tracking-widest">Amount to Send</p>
                        <p className="text-4xl font-black text-white">₹{pendingAmount}</p>
                    </div>
                )}
                <div className="flex gap-4 w-full mt-2">
                  <button 
                    onClick={handlePaymentCancel}
                    className="flex-1 py-3 bg-red-900/30 border border-red-500/50 text-red-500 rounded-xl font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  { (paymentState === 'CONFIRMING_PAYEE' || paymentState === 'CONFIRMING_AMOUNT') && (
                    <button 
                      onClick={handlePaymentConfirm}
                      className="flex-1 py-3 bg-green-500 text-black rounded-xl font-black hover:bg-green-400 transition-all uppercase tracking-widest text-xs"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-4 w-full md:w-auto justify-center">
            <button
              onClick={stopNavigation}
              className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110' : 'bg-red-900/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/30'}`}
              aria-label={lang === 'en' ? 'Stop Navigation' : 'Navigation நிறுத்து'}
            >
              {isListening && (
                <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-50"></div>
              )}
              <div className="text-red-500 text-3xl">
                <FaMicrophone />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Feature Cards Section */}
      {!navigating && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <FeatureCard
            icon={FaCamera}
            title={lang === 'en' ? "Camera Detection" : "கேமரா கண்டறிதல்"}
            description={lang === 'en' ? "Detect obstacles and objects using real-time computer vision." : "நிகழ்நேர AI மூலம் தடைகளை கண்டறியுங்கள்."}
            delay={0.1}
          />
          <FeatureCard
            icon={FaVolumeUp}
            title={lang === 'en' ? "Spatial Audio" : "இட ஒலி வழிகாட்டல்"}
            description={lang === 'en' ? "Provide directional audio guidance to help users move safely." : "திசை-சார்ந்த ஒலி மூலம் பாதுகாப்பான இயக்கம்."}
            delay={0.2}
          />
          <FeatureCard
            icon={FaMicrophone}
            title={lang === 'en' ? "Voice Commands" : "குரல் கட்டளைகள்"}
            description={lang === 'en' ? "Navigate using simple voice instructions." : "எளிய குரல் கட்டளைகளால் சென்றடையுங்கள்."}
            delay={0.3}
          />
          <FeatureCard
            icon={FaMobileAlt}
            title={lang === 'en' ? "Haptic Alerts" : "அதிர்வு எச்சரிக்கைகள்"}
            description={lang === 'en' ? "Phone vibration feedback when obstacles are detected." : "தடை கண்டறிந்தால் தொலைபேசி அதிர்வு."}
            delay={0.4}
          />
        </div>
      )}

      {/* Action Buttons Section */}
      {!navigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col md:flex-row gap-6 justify-center mt-8 pb-12 items-center"
        >
          {/* Microphone Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => {
                if (!isListening) speakMsg('listening', lang);
              }}
              className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 z-10 ${isListening ? 'bg-[var(--color-neon)]/20 shadow-[0_0_50px_var(--color-neon)] scale-110' : 'bg-gray-800/40 border border-gray-700 hover:border-[var(--color-neon)] hover:shadow-[0_0_30px_rgba(0,224,255,0.3)]'}`}
              aria-label={lang === 'en' ? 'Voice Command Microphone' : 'குரல் கட்டளை மைக்ரோஃபோன்'}
            >
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full border border-[var(--color-neon)] animate-ping opacity-75"></div>
                  <div className="absolute inset-[-10px] rounded-full border border-[var(--color-neon)] animate-ping opacity-30 delay-150"></div>
                </>
              )}
              <div className={`text-5xl transition-colors duration-300 ${isListening ? 'text-[var(--color-neon)]' : 'text-gray-400'}`}>
                <FaMicrophone />
              </div>
            </button>

            <p className="text-gray-400 font-mono text-sm tracking-widest text-center">
              {promptText}
            </p>
          </div>

          {/* Language Toggle Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleLangToggle}
              className="relative flex items-center justify-center gap-2 px-6 py-4 rounded-full transition-all duration-300 bg-gray-800/40 border border-gray-700 hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:bg-purple-900/20"
              aria-label={lang === 'en' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாறு'}
            >
              <FaLanguage className="text-purple-400 text-2xl" />
              <span className="text-white font-bold text-lg">
                {lang === 'en' ? 'EN → தமிழ்' : 'தமிழ் → EN'}
              </span>
            </button>
            <p className="text-gray-500 font-mono text-xs tracking-wider">
              {lang === 'en' ? 'CURRENT: ENGLISH' : 'தற்போது: தமிழ்'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Debug Diagnostic Overlay */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
        <div className="bg-black/80 border border-gray-700 p-3 rounded-lg text-[10px] font-mono text-gray-400 pointer-events-auto">
          <p className="text-[var(--color-neon)] mb-1 font-bold flex justify-between">
            SYSTEM DIAGNOSTICS
            {navigating && (
              <span className="flex items-center gap-1">
                AI <span className={aiHeartbeat % 2 === 0 ? "text-green-500" : "text-gray-700"}>●</span>
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-x-4">
            <span>Navigating:</span> <span className={navigating ? "text-green-500" : "text-red-500"}>{navigating ? "ACTIVE" : "OFF"}</span>
            <span>Lang:</span> <span className="text-purple-400 font-bold">{lang === 'en' ? 'ENGLISH' : 'தமிழ்'}</span>
            <span>Target:</span> <span className={targetObject ? "text-yellow-400 font-bold" : "text-gray-500"}>{targetObject ? targetObject.toUpperCase() : "NONE"}</span>
            <span>Audio Unlock:</span> <span className={audioEnabled ? "text-green-500" : "text-red-500"}>{audioEnabled ? "YES" : "NO"}</span>
            <span>Listening:</span> <span className={isListening ? "text-green-500" : "text-red-500"}>{isListening ? "YES" : "NO"}</span>
            <span>Voices:</span> <span className={voiceCount > 0 ? "text-green-500" : "text-red-500"}>{voiceCount} Available</span>
            <span>Emergency:</span> <span className={emergencyActive ? "text-red-500 animate-pulse" : "text-gray-500"}>{emergencyActive ? "ACTIVE" : "OFF"}</span>
            <span>Mock Balance:</span> <span className="text-green-400 font-bold">₹{mockBalance}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                window.speechSynthesis.cancel();
                speakMsg('speechReset', lang);
                console.log("🛠️ Diagnostic: Force Speech Reset Triggered");
              }}
              className="text-[8px] bg-gray-800 px-2 py-1 rounded border border-gray-600 hover:bg-gray-700 flex-1"
            >
              RESET SPEECH
            </button>
            <button
              onClick={performSelfTest}
              className="text-[8px] bg-sky-900/50 px-2 py-1 rounded border border-sky-600 hover:bg-sky-800 flex-1 text-sky-200"
            >
              SELF TEST
            </button>
            <button
              onClick={() => {
                console.log("🛠️ Diagnostic: Simulating 'Find Chair'");
                handleCommand({ type: "FIND_TARGET", target: "chair" });
              }}
              className="text-[8px] bg-yellow-900/50 px-2 py-1 rounded border border-yellow-600 hover:bg-yellow-800 flex-1 text-yellow-200"
            >
              TEST TARGET
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
