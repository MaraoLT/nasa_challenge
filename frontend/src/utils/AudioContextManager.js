class AudioContextManager {
  constructor() {
    this.audioEnabled = false;
    this.pendingTracks = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Add click listener to enable audio on any click
    const enableAudio = () => {
      if (!this.audioEnabled) {
        this.audioEnabled = true;
        console.log('Audio enabled through user interaction');
        
        // Show brief notification
        this.showAudioEnabledNotification();
        
        // Play any pending tracks
        this.playPendingTracks();
        
        // Remove the listener after first activation
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('keydown', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
      }
    };

    // Listen for any user interaction
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    this.initialized = true;
    console.log('AudioContextManager initialized - waiting for user interaction');
  }

  showAudioEnabledNotification() {
    // Create a brief notification that audio is enabled
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 150, 0, 0.9);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    notification.textContent = '🔊 Audio Enabled';
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  isAudioEnabled() {
    return this.audioEnabled;
  }

  addPendingTrack(trackInfo) {
    if (this.audioEnabled) {
      // If audio is already enabled, play immediately
      return trackInfo.playFunction();
    } else {
      // Store for later
      this.pendingTracks.push(trackInfo);
      return false;
    }
  }

  playPendingTracks() {
    if (this.pendingTracks.length > 0) {
      console.log(`Playing ${this.pendingTracks.length} pending tracks`);
      this.pendingTracks.forEach(trackInfo => {
        trackInfo.playFunction();
      });
      this.pendingTracks = [];
    }
  }
}

// Create global instance
const audioContextManager = new AudioContextManager();

export default audioContextManager;
