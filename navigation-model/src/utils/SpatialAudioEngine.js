/**
 * SpatialAudioEngine.js
 * Implements 3D spatial audio using the Web Audio API's PannerNode with HRTF.
 */

let audioCtx = null;
const activePanners = new Map(); // id -> { source, panner, gain }

const initAudioContext = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      console.log("🔊 Web Audio Context Initialized:", audioCtx.state);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.warn("AudioContext resume failed:", e));
    }
    return audioCtx;
  } catch (e) {
    console.error("Failed to initialize AudioContext:", e);
    return null;
  }
};

// Simple beep synth to avoid external dependencies for basic obstacle feedback
const createBeepBuffer = (ctx, duration = 0.1, freq = 440) => {
  const sampleRate = ctx.sampleRate;
  const frameCount = sampleRate * duration;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    // Sine wave with exponential decay
    data[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * Math.exp(-3 * i / frameCount);
  }
  return buffer;
};

/**
 * Play a beep sound at a specific 3D coordinate.
 * @param {number} x - Left/Right (-5 to 5)
 * @param {number} y - Up/Down (-2 to 2) 
 * @param {number} z - Distance (0.1 to 20)
 * @param {string} id - Unique ID for the object (to update position)
 */
export const playSpatialSound = (x, y, z, id = 'default') => {
  const ctx = initAudioContext();
  if (!ctx) return;

  // Cleanup existing sound for this ID if any
  if (activePanners.has(id)) {
    const { source, panner } = activePanners.get(id);
    // Instead of stopping, we just update the panner if it's already playing?
    // Actually, for beeps, we fire a new one, but for continuous we'd move it.
    // For now, let's keep it simple: fire one-shot beeps but place them spatially.
  }

  const panner = ctx.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 20;
  panner.rolloffFactor = 1;
  
  // Set position
  if (panner.positionX) {
    panner.positionX.value = x;
    panner.positionY.value = y;
    panner.positionZ.value = z * -1; // Z is negative in Web Audio for 'ahead'
  } else {
    panner.setPosition(x, y, z * -1);
  }

  const gainNode = ctx.createGain();
  // Volume based on distance (inverse model handles some of this, but we can nudge it)
  gainNode.gain.value = Math.max(0.1, Math.min(1.0, 1 / (z + 0.1)));

  const source = ctx.createBufferSource();
  // Frequency based on horizontal position (higher = right, lower = left) as an extra cue
  const freq = 440 + (x * 20); 
  source.buffer = createBeepBuffer(ctx, 0.15, freq);
  
  source.connect(panner);
  panner.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start();
  
  // Auto cleanup
  source.onended = () => {
    source.disconnect();
    panner.disconnect();
    gainNode.disconnect();
  };
};

/**
 * Update the user's orientation (Listener). 
 * Usually fixed at (0,0,0) facing forward (0,0,-1).
 */
export const updateListener = (forward = [0, 0, -1], up = [0, 1, 0]) => {
  const ctx = initAudioContext();
  if (!ctx || !ctx.listener) return;
  
  if (ctx.listener.forwardX) {
    ctx.listener.forwardX.value = forward[0];
    ctx.listener.forwardY.value = forward[1];
    ctx.listener.forwardZ.value = forward[2];
    ctx.listener.upX.value = up[0];
    ctx.listener.upY.value = up[1];
    ctx.listener.upZ.value = up[2];
  } else {
    ctx.listener.setOrientation(forward[0], forward[1], forward[2], up[0], up[1], up[2]);
  }
};

const SpatialAudioEngine = () => {
  return null;
};

export default SpatialAudioEngine;
