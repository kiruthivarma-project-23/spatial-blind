export const triggerVibration = (pattern = 200) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  } else {
    console.warn("Vibration API not supported on this device.");
  }
};
