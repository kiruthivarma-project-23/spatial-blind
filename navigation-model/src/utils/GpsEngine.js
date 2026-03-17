/**
 * GPSEngine.js
 * Handles location tracking and provides voice-guided directions.
 */
import { speakMsg } from './speech';
import { lang as langState } from './i18n';

export class GPSEngine {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.targetPosition = null;
  }

  startTracking(onLocationUpdate) {
    if (!navigator.geolocation) {
      speakMsg('gpsNoSupport', langState.current);
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = position.coords;
        onLocationUpdate?.(position.coords);
        this.processNavigation();
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  processNavigation() {
    if (!this.targetPosition || !this.currentPosition) return;
    // Basic turn-by-turn placeholder logic
    // In a real app, this would query OSRM/Google Maps API
    console.log("GPS: Calculating route...");
  }

  setDestination(lat, lng) {
    this.targetPosition = { lat, lng };
    speakMsg('destSet', langState.current);
  }
}

export const gpsEngine = new GPSEngine();
