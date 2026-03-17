import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import jsQR from "jsqr";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { triggerVibration } from "../utils/HapticFeedback";
import { speak } from "../utils/speech";
import { playSpatialSound } from "../utils/SpatialAudioEngine";
import { getMessage, LANG_CODES } from "../utils/i18n";

const TamilLabels = {
  'person': 'மனிதர்', 'chair': 'நாற்காலி', 'dining table': 'சாப்பாட்டு மேசை',
  'couch': 'சோபா', 'bed': 'படுக்கை', 'tv': 'தொலைக்காட்சி', 'laptop': 'மடிக்கணினி',
  'bottle': 'புட்டி', 'cup': 'கோப்பை', 'potted plant': 'செடி', 'cell phone': 'பேசி',
  'backpack': 'பை', 'handbag': 'கைப்பை', 'suitcase': 'பெட்டி', 'clock': 'கடிகாரம்',
  'door': 'கதவு', 'window': 'ஜன்னல்', 'stairs': 'படிக்கட்டு', 'sink': 'சின்க்',
  'toilet': 'கழிப்பறை', 'refrigerator': 'குளிர்சாதனப் பெட்டி', 'microwave': 'மைக்ரோவேவ்',
  'oven': 'அடுப்பு', 'car': 'கார்', 'bus': 'பேருந்து', 'truck': 'லாரி', 'motorcycle': 'பைக்'
};

// Object Heights mapping remains for distance estimation


const objectHeights = { // heights in meters
  'person': 1.7, 'chair': 0.8, 'dining table': 0.75, 'couch': 0.9, 'bed': 0.6,
  'tv': 0.6, 'laptop': 0.25, 'bottle': 0.25, 'cup': 0.12, 'potted plant': 0.4,
  'cell phone': 0.15, 'backpack': 0.5, 'handbag': 0.3, 'suitcase': 0.7,
  'clock': 0.3, 'door': 2.0, 'window': 1.2, 'stairs': 1.0, 'sink': 0.8,
  'toilet': 0.4, 'refrigerator': 1.7, 'microwave': 0.3, 'oven': 0.8
};

const formatDistance = (distInMeters) => {
  if (distInMeters < 1) {
    return `${Math.round(distInMeters * 100)} centimeters`;
  }
  const meters = Math.floor(distInMeters);
  const cm = Math.round((distInMeters - meters) * 100);
  return cm > 0 ? `${meters} meter ${cm} centimeters` : `${meters} meters`;
};

const CameraDetection = ({ isActive, onStatusChange, onHeartbeat, zoomOut = true, emergencyActive = false, targetObject = null, lang = 'en', findDoorTrigger = 0, pathCheckTrigger = 0, isScanningPayment = false, onQrDetected = null }) => {
  // Keep a ref so detection callbacks always see the latest lang without re-mounting
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [internalLowLight, setInternalLowLight] = useState(false);

  const animationRef = useRef(null);
  const streamRef = useRef(null);
  const objectAlertStates = useRef({}); // Tracks { id: { lastAlertTime, position, distance } }
  const lastPathClearAlertTime = useRef(0);
  const isMounted = useRef(true);

  // Mount/Unmount tracking for forceful loop termination
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopCamera();
    };
  }, []);
  
  // Advanced Tracking State
  const prevPredictions = useRef([]);
  const lastProcessTime = useRef(0);
  const scanInterval = useRef(100); 
  const lastSpeakTime = useRef(0);
  const doorSearchActive = useRef(false);
  const pathCheckRequested = useRef(false);
  const findDoorAttemptCount = useRef(0);
  
  // eslint-disable-next-line no-unused-vars
  const targetClasses = [
    'person', 'chair', 'dining table', 'couch', 'bed', 'tv', 'laptop',
    'motorcycle', 'bicycle', 'car', 'bus', 'truck', 'bottle', 'cup',
    'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
    'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut',
    'cake', 'potted plant', 'vase', 'scissors', 'teddy bear',
    'hair drier', 'toothbrush', 'sink', 'toilet', 'book', 'clock',
    'door', 'window', 'stairs', 'cell phone', 'backpack', 'handbag', 'suitcase'
  ];

  // HANDLE VOICE COMMAND TRIGGERS
  useEffect(() => {
    if (findDoorTrigger > 0) {
      console.log("🔍 VOICE CMD: Find Door requested");
      doorSearchActive.current = true;
      findDoorAttemptCount.current = 0;
    }
  }, [findDoorTrigger]);

  useEffect(() => {
    if (pathCheckTrigger > 0) {
      console.log("🔍 VOICE CMD: Path Clear check for 10m requested");
      pathCheckRequested.current = true;
    }
  }, [pathCheckTrigger]);

  // LOAD MODEL
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("🚀 Initializing AI model...");
        setLoading(true);
        setError(null);
        onStatusChange?.("Initializing AI...");
        
        await tf.ready();
        console.log("✅ TensorFlow ready");
        
        const loadedModel = await cocossd.load({
          base: 'lite_mobilenet_v2' 
        });
        
        if (!loadedModel) throw new Error("Model failed to load - Object is null");
        
        setModel(loadedModel);
        console.log("✅ AI model loaded successfully");
        onStatusChange?.("AI Ready - System standby");
      } catch (err) {
        console.error("❌ Model load error:", err);
        setError(`Model Error: ${err.message}`);
        onStatusChange?.(`Error: ${err.message}`);
        speak(getMessage('modelFail', langRef.current), LANG_CODES[langRef.current]);
      }
      setLoading(false);
    };
    loadModel();
  }, []); // Run on mount

  // ZOOM CONTROL (Prop driven)
  useEffect(() => {
    if (streamRef.current && zoomOut !== undefined) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      if (capabilities?.zoom) {
        track.applyConstraints({ 
          advanced: [{ zoom: zoomOut ? capabilities.zoom.min : capabilities.zoom.max / 2 }] 
        }).catch(e => console.error("Zoom apply error:", e));
      }
    }
  }, [zoomOut]);

  // CAMERA + DETECTION
  useEffect(() => {
    if (!isActive || !model) {
      if (isActive && !model) {
        console.warn("⚠️ Activation requested but model not ready");
      }
      return;
    }
    console.log("🎥 Activation: Starting Camera...");
    startCamera();
    return () => {
      console.log("🛑 Deactivation: Stopping Camera...");
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, model]);

  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = async () => {
    try {
      setCameraReady(false);
      onStatusChange?.("Starting camera...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Attempt zoom-out strictly via advanced constraints
      try {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        if (capabilities?.zoom) {
          await track.applyConstraints({ advanced: [{ zoom: capabilities.zoom.min }] });
        }
      } catch (e) {
        console.warn("Advanced zoom constraint failed:", e);
      }
      streamRef.current = stream;
      
      const video = videoRef.current;
      if (!video) return;
      
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      const handlePlay = async () => {
        try {
          console.log("🎥 Video started playing, width:", video.videoWidth);
          await video.play();
          setCameraReady(true);
          onStatusChange?.("AI Vision Active");
          resizeCanvas();
          detectFrame();
        } catch (e) {
          console.error("Playback failed:", e);
          onStatusChange?.("Video playback failed");
        }
      };

      video.onloadedmetadata = handlePlay;
      // Fallback for metadata event
      setTimeout(() => {
        if (video.videoWidth > 0 && !cameraReady) handlePlay();
      }, 1000);

    } catch (err) {
      console.error("Camera error:", err);
      onStatusChange?.("Camera access failed");
    }
  };

  const resizeCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  };

  const detectFrame = async () => {
    if (!isMounted.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.readyState === 4) {
      console.log("🔄 Detection Loop Heartbeat...");
    }
    
    const now = Date.now();
    if (now - lastProcessTime.current < scanInterval.current) {
      if (isMounted.current) {
         animationRef.current = requestAnimationFrame(detectFrame);
      }
      return;
    }

    if (video.readyState !== 4) {
      if (isMounted.current) {
         animationRef.current = requestAnimationFrame(detectFrame);
      }
      return;
    }

    try {
      const predictions = await model.detect(video);
      if (!isMounted.current) return; // Post-await check

      lastProcessTime.current = now;
      onHeartbeat?.(); // Signal that detection is running

      // ── UPI QR SCANNING ──
      if (isScanningPayment && onQrDetected) {
        const vidW = video.videoWidth;
        const vidH = video.videoHeight;
        if (vidW > 0 && vidH > 0) {
          const qrCtx = canvas.getContext('2d', { willReadFrequently: true });
          const imageData = qrCtx.getImageData(0, 0, vidW, vidH);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code && code.data && code.data.startsWith('upi://pay')) {
            console.log("💳 QR DETECTED:", code.data);
            onQrDetected(code.data);
          }
        }
      }
      
      if (predictions.length > 0) {
        console.log(`🎯 Detected ${predictions.length} objects`);
      }
      
      drawBoxes(predictions);
      processPredictions(predictions);
      
      if (predictions.length === 0) {
        scanInterval.current = Math.min(scanInterval.current + 50, 300); 
      } else {
        scanInterval.current = 100; 
      }

    } catch (err) {
      console.error("🚫 Detection error:", err);
    }
    if (isMounted.current) {
      animationRef.current = requestAnimationFrame(detectFrame);
    }
  };

  const drawBoxes = (predictions) => {
    if (!isMounted.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Filters are now applied to the video element via CSS for better visibility

    let personIndex = 1;

    predictions.forEach(pred => {
      if (pred.score < 0.3) return;
      const [x, y, width, height] = pred.bbox;
      
      const realHeight = objectHeights[pred.class] || 0.5;
      // Refined focal length for common mobile sensors (approx 70-80 degrees FOV)
      const focalLength = (canvas.height / 2) / Math.tan((75 * Math.PI) / 360);
      const dist = (focalLength * realHeight) / height;
      const dStr = dist < 1 ? `${Math.round(dist * 100)}cm` : `${dist.toFixed(1)}m`;

      let label = pred.class;
      if (label === 'person') {
        label = `Person ${personIndex++}`;
      }
      
      const fullLabel = `${label} (${dStr})`;

      ctx.strokeStyle = label.includes('Person') ? "#FF00FF" : "#00FFFF";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(x, y - 22, 210, 22);
      ctx.fillStyle = "white";
      ctx.font = "bold 16px Arial";
      ctx.fillText(fullLabel, x + 5, y - 5);
    });
  };


  // AUTO-NIGHT MODE SENSING
  const analyzeLuminance = (video) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      ctx.drawImage(video, 0, 0, 40, 40);
      const data = ctx.getImageData(0, 0, 40, 40).data;
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        brightness += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
      }
      const avg = brightness / (40 * 40);
      if (avg < 40 && !internalLowLight) setInternalLowLight(true);
      else if (avg > 60 && internalLowLight) setInternalLowLight(false);
    } catch (e) { /* silent fail for canvas ops */ }
  };

  // GROUND HAZARD (PIT/HOLE) DETECTION

  // GROUND HAZARD (PIT/HOLE) DETECTION
  const analyzeGroundHazard = (video) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      // Sample the ground zone (bottom-center)
      const vW = video.videoWidth;
      const vH = video.videoHeight;
      if (vW === 0 || vH === 0) return false;
      ctx.drawImage(video, vW * 0.35, vH * 0.7, vW * 0.3, vH * 0.2, 0, 0, 100, 100);
      
      const data = ctx.getImageData(0, 0, 100, 100).data;
      let totalBrightness = 0;
      let darkPixels = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const bright = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
        totalBrightness += bright;
        if (bright < 30) darkPixels++; // Dark threshold for hole/pit
      }
      
      const avgBrightness = totalBrightness / (100 * 100);
      const darknessRatio = darkPixels / (100 * 100);
      
      // If the center path has a sudden dark gap (>40% dark) indicating a pit or hole
      return darknessRatio > 0.4 && avgBrightness < 50;
    } catch (e) { return false; }
  };

  const processPredictions = (predictions) => {
    const now = Date.now();
    const video = videoRef.current;
    if (!video) return;

    if (predictions.length > 0) {
       console.log(`🤖 Model detected ${predictions.length} objects:`, predictions.map(p => p.class));
    }
    
    // Targeted Detection Filter
    let activePredictions = predictions;
    if (targetObject) {
       const searchTarget = targetObject.toLowerCase();
       // Try direct match first, then partial match
       activePredictions = predictions.filter(p => {
         const pClass = p.class.toLowerCase();
         // e.g., if user says "chair", match "chair". If they say "table", match "dining table"
         return pClass === searchTarget || pClass.includes(searchTarget) || searchTarget.includes(pClass);
       });

       // Periodic background announcement that we are still searching
       if (activePredictions.length === 0 && (now - lastSpeakTime.current > 8000)) {
           const activeLang = langRef.current;
           console.log(`🔍 Still searching for: ${targetObject}...`);
           speak(getMessage('searching', activeLang, targetObject), LANG_CODES[activeLang]);
           lastSpeakTime.current = now;
       }
    }

    analyzeLuminance(video);

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const totalArea = videoWidth * videoHeight;

    const hasGroundHazard = analyzeGroundHazard(video);
    
    const activeLang = langRef.current;
    const locale = LANG_CODES[activeLang];
    let alerts = [];
    if (hasGroundHazard) {
      alerts.push(getMessage('groundHazard', activeLang));
    }
    
    let obstacleNear = false;
    let personCountInFrame = 0;

    // 1. Security Scan Logic
    if (emergencyActive && !targetObject) {
      const nearbyPeople = activePredictions.filter(p => p.class === 'person' && p.score > 0.3);
      if (nearbyPeople.length > 0) {
        speak(getMessage('securityPeople', activeLang, nearbyPeople.length), locale);
      } else {
        speak(getMessage('securityClear', activeLang), locale);
      }
    }

    // 2. Smart Path Guidance (3-Zone Analysis)
    const getZoneClearance = (minX, maxX, range) => {
      // We check ALL predictions for path clearance, not just the filtered ones
      const zoneObjects = predictions.filter(p => {
        const centerX = p.bbox[0] + p.bbox[2]/2;
        return centerX > videoWidth * minX && centerX < videoWidth * maxX;
      });
      return zoneObjects.every(p => {
        const dist = (videoHeight * 0.8 * (objectHeights[p.class] || 0.5)) / p.bbox[3];
        return dist > range;
      });
    };

    const centerClearArr = getZoneClearance(0.33, 0.66, 10);
    const leftClearArr = getZoneClearance(0, 0.33, 5);
    const rightClearArr = getZoneClearance(0.66, 1, 5);

      if (centerClearArr) {
        if (now - lastPathClearAlertTime.current > 7000 || pathCheckRequested.current) { 
          console.log("✅ CENTER PATH CLEAR (10M)");
          const msg = getMessage('pathClear10m', activeLang);
          alerts.push(msg);
          lastPathClearAlertTime.current = now;
          pathCheckRequested.current = false;
        }
      } else {
        // Path is blocked in center, suggest a turn
        if (pathCheckRequested.current) {
            // Find the closest obstacle for the status report
            const closest = predictions.filter(p => {
                const centerX = p.bbox[0] + p.bbox[2]/2;
                return centerX > videoWidth * 0.33 && centerX < videoWidth * 0.66;
            }).sort((a,b) => b.bbox[3] - a.bbox[3])[0]; // Largest height = closest

            if (closest) {
                const d = (videoHeight * 0.8 * (objectHeights[closest.class] || 0.5)) / closest.bbox[3];
                alerts.push(getMessage('obstacleAt', activeLang, d.toFixed(1)));
            }
            pathCheckRequested.current = false;
        }

        if (now - lastPathClearAlertTime.current > 3000) { 
          if (rightClearArr) {
            alerts.push(getMessage('moveRight', activeLang)); 
          } else if (leftClearArr) {
            alerts.push(getMessage('moveLeft', activeLang));
          } else {
            alerts.push(getMessage('hold', activeLang));
          }
          lastPathClearAlertTime.current = now;
        }
      }
    
    // 1. Identify "In-Hand" objects (small objects near persons)
    const persons = activePredictions.filter(p => p.class === 'person' && p.score > 0.3);
    const smallObjects = activePredictions.filter(p => 
      ['cell phone', 'bottle', 'cup', 'spoon', 'fork', 'knife'].includes(p.class) && p.score > 0.3
    );

    const inHandMapping = new Map();
    smallObjects.map(obj => {
      const [ox, oy, ow, oh] = obj.bbox;
      persons.forEach((per, idx) => {
        const [px, py, pw, ph] = per.bbox;
        const isNear = !(ox + ow < px || ox > px + pw || oy + oh < py || oy > py + ph);
        if (isNear) inHandMapping.set(obj, idx + 1);
      });
      return obj;
    });

    activePredictions.forEach(p => {
      // Increase confidence threshold to 0.65 to reduce misclassification
      if (p.score < 0.65) return;

      // DOOR CORRECTION LOGIC:
      // COCO-SSD often misses doors or mislabels them as refrigerators/TVs.
      // If we see a vertical rectangle (height > width * 1.5) that isn't a person, 
      // bias it towards being a door.
      const [x, y, width, height] = p.bbox;
      const ratio = height / width;
      if (ratio > 1.8 && !['person', 'standing person'].includes(p.class)) {
          console.log(`🚪 DOOR CORRECTION: Re-labeled ${p.class} as door due to vertical aspect ratio.`);
          p.class = 'door';
      }
      const realHeight = objectHeights[p.class] || 0.5; 
      const focalLength = videoHeight * 0.8; 
      const dist = (focalLength * realHeight) / height;
      
      const positionLabel = x + width / 2 < videoWidth * 0.35 ? "left" : (x + width / 2 > videoWidth * 0.65 ? "right" : "center");

      let label = p.class;
      if (label === 'person') {
        personCountInFrame++;
        label = `Person ${personCountInFrame}`;
      }

      // Check for "In Hand" status
      const personIdx = inHandMapping.get(p);
      const inHandSuffix = personIdx ? ` in Person ${personIdx}'s hand` : "";

      // INTELLIGENT DEDUPLICATION (Optimized for speed)
      const objKey = `${p.class}_${positionLabel}`; 
      const prevState = objectAlertStates.current[objKey];
      
      let shouldAnnounce = false;
      const distChanged = !prevState || Math.abs(dist - prevState.distance) > 0.3; // 30cm threshold
      const posChanged = !prevState || positionLabel !== prevState.position;
      const timeElapsed = !prevState || (now - prevState.lastAlertTime > 3000); // 3s heartbeat

      if (distChanged || posChanged || timeElapsed) {
        shouldAnnounce = true;
      }

      if (shouldAnnounce) {
        let distanceLabel = formatDistance(dist);
        if (dist < 1.0) obstacleNear = true;

        let spatialContext = "";
        const yCenter = y + height / 2;
        if (['clock', 'tv', 'window'].includes(p.class) && yCenter < videoHeight * 0.4) {
          spatialContext = "mounted on the wall ";
        } else if (yCenter > videoHeight * 0.7 && !['table', 'chair', 'couch'].includes(p.class)) {
          spatialContext = "on the floor ";
        }

        const isEmergency = ['car', 'bus', 'truck', 'motorcycle'].includes(p.class);
        let instruction = "";
        
        // Active Guidance Heuristics — language-aware
        if (dist < 3.0) {
            if (positionLabel === "center") instruction = activeLang === 'ta' ? "Niruthunga. Ner munadi thadai irukku. " : "HOLD. Obstacle directly ahead. ";
            else if (positionLabel === "left") instruction = activeLang === 'ta' ? "Valadu puramaga po. " : "Move right. ";
            else if (positionLabel === "right") instruction = activeLang === 'ta' ? "Idadu puramaga po. " : "Move left. ";
        } else if (isEmergency && dist < 7.0) {
            instruction = activeLang === 'ta' ? "ECHARIKKAI. Vaahan arukilae irukku. " : "CAUTION. Vehicle nearby. ";
        }

        // Build language-specific alert message
        let alertMsg;
        if (activeLang === 'ta') {
          const tamilLabel = TamilLabels[p.class] || label;
          const tamilPos = positionLabel === "left" ? "இடது" : (positionLabel === "right" ? "வலது" : "நேராக");
          alertMsg = `${isEmergency ? 'URGENT ECHARIKKAI: ' : ''}${instruction}${tamilLabel} ${tamilPos} பக்கம், ${distanceLabel}`;
        } else {
          alertMsg = `${isEmergency ? 'URGENT ALERT: ' : ''}${instruction}${label}${inHandSuffix} ${spatialContext}${positionLabel}, ${distanceLabel}`;
        }

        alerts.push(alertMsg);
        
        // 3D AUDIO MAPPING
        // X: Normalized screen position mapped to -5 (left) to 5 (right)
        // Y: Normalized screen height mapped to 2 (top) to -2 (bottom) 
        // Z: Calculated depth (dist)
        const nx = ((x + width / 2) / videoWidth - 0.5) * 10;
        const ny = (0.5 - (y + height / 2) / videoHeight) * 4;
        playSpatialSound(nx, ny, dist, label);
        
        // Update state
        objectAlertStates.current[objKey] = {
          lastAlertTime: now,
          position: positionLabel,
          distance: dist
        };

        // SMART GUIDANCE: MOVEMENT SUGGESTIONS
        if (dist < 3.0 && positionLabel === "center") {
           if (rightClearArr) {
             alerts.push(getMessage('moveRight', activeLang));
           } else if (leftClearArr) {
             alerts.push(getMessage('moveLeft', activeLang));
           } else {
             alerts.push(getMessage('stopClose', activeLang));
           }
        }
      }
    });

    // Handle Targeted "Find Door" scan
    if (doorSearchActive.current) {
        findDoorAttemptCount.current++;
        const foundDoor = activePredictions.find(p => p.class === 'door');
        if (foundDoor) {
            const [x, , width] = foundDoor.bbox;
            const pos = x + width / 2 < videoWidth * 0.35 ? "left" : (x + width / 2 > videoWidth * 0.65 ? "right" : "center");
            const sideLabel = activeLang === 'ta' ? (pos === "left" ? "இடது" : pos === "right" ? "வலது" : "நேராக") : pos;
            speak(getMessage('doorDetected', activeLang, sideLabel), locale);
            doorSearchActive.current = false;
        } else if (findDoorAttemptCount.current > 15) { // Try for ~1.5 seconds
            speak(getMessage('doorNotFound', activeLang), locale);
            doorSearchActive.current = false;
        }
    }

    if (alerts.length > 0) {
      console.log("📢 QUEUING ALERTS:", alerts);
      const urgentKeywords = ["URGENT", "HOLD", "Niruthunga", "ECHARIKKAI"];
      const isUrgent = alerts.some(a => urgentKeywords.some(kw => a.includes(kw)));
      const timeSinceLastSpeak = now - lastSpeakTime.current;
      
      // 1.2 seconds minimum between non-urgent speaks
      if (isUrgent || timeSinceLastSpeak > 1200) {
        const message = alerts.join(". ");
        speak(message, locale);
        onStatusChange?.(message);
        lastSpeakTime.current = now;

        if (obstacleNear) {
          triggerVibration([400, 100, 400]);
        } else {
          triggerVibration(150);
        }
      }
    }

    prevPredictions.current = predictions;
  };

  const stopCamera = () => {
    console.log("🛑 STOP ACTION: CameraDetection unmounting.");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("🛑 Track stopped:", track.kind);
      });
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      console.log("🛑 Animation frame cancelled.");
    }
    if (videoRef.current) {
       videoRef.current.srcObject = null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative w-full aspect-video rounded-3xl overflow-hidden border-2 ${cameraReady ? 'border-[var(--color-neon)]' : 'border-red-500'} ${!isActive && "hidden"}`}
    >
      {(!cameraReady || loading || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-6 text-center">
          {error ? (
            <div className="text-red-500">
               <p className="text-2xl font-bold mb-2">System Error</p>
               <p className="text-sm font-mono">{error}</p>
               <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full">Reload App</button>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-[var(--color-neon)] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white text-xl font-bold">
                {loading ? "Optimizing AI Vision..." : "Waking up Camera..."}
              </p>
              {!cameraReady && !loading && (
                <p className="text-gray-400 text-xs mt-2 italic">
                  Please allow camera access if prompted
                </p>
              )}
            </>
          )}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: internalLowLight ? "brightness(1.6) contrast(1.3) saturate(1.2)" : "none",
          backgroundColor: "#000"
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
      
      {cameraReady && (
        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full border border-[var(--color-neon)] text-[var(--color-neon)] text-xs font-mono z-30 animate-pulse">
          LIVE AI
        </div>
      )}
    </motion.div>
  );
};

export default CameraDetection;
