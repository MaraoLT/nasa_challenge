import audioContextManager from './AudioContextManager';

class MusicManager {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.3; // Default volume
    this.currentTrackPath = null;
    this.currentLoop = true;
    
    // Initialize audio context manager
    audioContextManager.init();
  }

  async playTrack(trackPath, loop = true) {
    // Store track info for potential retry
    this.currentTrackPath = trackPath;
    this.currentLoop = loop;

    // Check if audio is enabled
    if (!audioContextManager.isAudioEnabled()) {
      console.log('Audio not yet enabled, adding to pending tracks');
      
      // Add to pending tracks
      audioContextManager.addPendingTrack({
        playFunction: () => this._playTrackNow(trackPath, loop)
      });
      
      return false;
    }

    return this._playTrackNow(trackPath, loop);
  }

  async _playTrackNow(trackPath, loop = true) {
    // Stop current track if playing
    this.stopCurrentTrack();

    try {
      // Create new audio element
      const audio = new Audio(trackPath);
      audio.volume = this.volume;
      audio.loop = loop;
      audio.preload = 'auto';

      // Set as current track
      this.currentTrack = audio;

      // Play the track
      await audio.play();
      this.isPlaying = true;

      // Handle audio events
      audio.addEventListener('ended', () => {
        if (!loop) {
          this.isPlaying = false;
          this.currentTrack = null;
        }
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        this.isPlaying = false;
        this.currentTrack = null;
      });

      console.log(`Playing music: ${trackPath}`);
      return true;
    } catch (error) {
      console.log('Music playback prevented or failed:', error.message);
      return false;
    }
  }

  retryCurrentTrack() {
    if (this.currentTrackPath && audioContextManager.isAudioEnabled()) {
      console.log('Retrying current track after audio enablement');
      return this._playTrackNow(this.currentTrackPath, this.currentLoop);
    }
    return false;
  }

  stopCurrentTrack() {
    if (this.currentTrack) {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
      this.currentTrack.src = '';
      this.currentTrack = null;
      this.isPlaying = false;
    }
  }

  pauseCurrentTrack() {
    if (this.currentTrack && this.isPlaying) {
      this.currentTrack.pause();
      this.isPlaying = false;
    }
  }

  resumeCurrentTrack() {
    if (this.currentTrack && !this.isPlaying) {
      this.currentTrack.play().catch(e => {
        console.log('Resume failed:', e.message);
      });
      this.isPlaying = true;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentTrack) {
      this.currentTrack.volume = this.volume;
    }
  }

  fadeOut(duration = 1000) {
    if (!this.currentTrack || !this.isPlaying) return;

    const audio = this.currentTrack;
    const startVolume = audio.volume;
    const fadeStep = startVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      audio.volume = Math.max(0, audio.volume - fadeStep);
      
      if (audio.volume <= 0) {
        clearInterval(fadeInterval);
        this.stopCurrentTrack();
      }
    }, 50);
  }

  fadeIn(duration = 1000) {
    if (!this.currentTrack) return;

    const audio = this.currentTrack;
    const targetVolume = this.volume;
    audio.volume = 0;
    
    const fadeStep = targetVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      audio.volume = Math.min(targetVolume, audio.volume + fadeStep);
      
      if (audio.volume >= targetVolume) {
        clearInterval(fadeInterval);
      }
    }, 50);
  }
}

// Create global instance
const musicManager = new MusicManager();

export default musicManager;
