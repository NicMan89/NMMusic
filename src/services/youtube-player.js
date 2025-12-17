export class YouTubePlayer {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.currentVideoId = null;
    this.updateInterval = null;
  }

  /**
   * Inizializza il player YouTube
   */
  init() {
    // YouTube IFrame API callback
    window.onYouTubeIframeAPIReady = () => {
      this.createPlayer();
    };

    // Se API già caricata
    if (window.YT && window.YT.Player) {
      this.createPlayer();
    }
  }

  /**
   * Crea l'istanza del player
   */
  createPlayer() {
    try {
      this.player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1
        },
        events: {
          onReady: this.onPlayerReady.bind(this),
          onStateChange: this.onPlayerStateChange.bind(this),
          onError: this.onPlayerError.bind(this)
        }
      });

      console.log('✅ YouTube Player initialized');
    } catch (error) {
      console.error('❌ Error creating player:', error);
    }
  }

  /**
   * Callback quando il player è pronto
   */
  onPlayerReady(event) {
    this.isReady = true;
    console.log('✅ YouTube Player ready');
    
    // Imposta volume iniziale
    this.setVolume(100);
  }

  /**
   * Callback quando cambia lo stato del player
   */
  onPlayerStateChange(event) {
    const states = {
      '-1': 'UNSTARTED',
      '0': 'ENDED',
      '1': 'PLAYING',
      '2': 'PAUSED',
      '3': 'BUFFERING',
      '5': 'CUED'
    };

    const state = states[event.data];
    console.log('🎵 Player state:', state);

    // Notifica app
    if (window.onYouTubePlayerStateChange) {
      window.onYouTubePlayerStateChange(event.data);
    }

    // Start/stop update interval
    if (event.data === 1) { // PLAYING
      this.startTimeUpdate();
    } else {
      this.stopTimeUpdate();
    }
  }

  /**
   * Callback errori player
   */
  onPlayerError(event) {
    const errors = {
      2: 'Parametri non validi',
      5: 'Errore HTML5 player',
      100: 'Video non trovato o privato',
      101: 'Embedding non permesso',
      150: 'Embedding non permesso'
    };

    const error = errors[event.data] || 'Errore sconosciuto';
    console.error('❌ YouTube Player error:', error);

    // Notifica app
    if (window.onYouTubePlayerError) {
      window.onYouTubePlayerError(event.data, error);
    }

    // Prova a saltare al prossimo video
    if (event.data === 100 || event.data === 150) {
      setTimeout(() => {
        if (window.onYouTubePlayerStateChange) {
          window.onYouTubePlayerStateChange(0); // Trigger ENDED
        }
      }, 1000);
    }
  }

  /**
   * Carica e riproduci un video
   */
  loadVideo(videoId) {
    if (!this.isReady) {
      console.warn('⚠️ Player not ready yet');
      setTimeout(() => this.loadVideo(videoId), 500);
      return;
    }

    if (!videoId) {
      console.error('❌ No video ID provided');
      return;
    }

    try {
      this.currentVideoId = videoId;
      this.player.loadVideoById(videoId);
      console.log('✅ Loading video:', videoId);
    } catch (error) {
      console.error('❌ Error loading video:', error);
    }
  }

  /**
   * Play
   */
  play() {
    if (this.isReady && this.player) {
      this.player.playVideo();
    }
  }

  /**
   * Pause
   */
  pause() {
    if (this.isReady && this.player) {
      this.player.pauseVideo();
    }
  }

  /**
   * Stop
   */
  stop() {
    if (this.isReady && this.player) {
      this.player.stopVideo();
    }
  }

  /**
   * Seek a un tempo specifico
   */
  seekTo(seconds) {
    if (this.isReady && this.player) {
      this.player.seekTo(seconds, true);
    }
  }

  /**
   * Imposta volume (0-100)
   */
  setVolume(volume) {
    if (this.isReady && this.player) {
      this.player.setVolume(volume);
    }
  }

  /**
   * Ottieni volume corrente
   */
  getVolume() {
    if (this.isReady && this.player) {
      return this.player.getVolume();
    }
    return 100;
  }

  /**
   * Ottieni durata video
   */
  getDuration() {
    if (this.isReady && this.player) {
      return this.player.getDuration();
    }
    return 0;
  }

  /**
   * Ottieni tempo corrente
   */
  getCurrentTime() {
    if (this.isReady && this.player) {
      return this.player.getCurrentTime();
    }
    return 0;
  }

  /**
   * Ottieni stato player
   */
  getPlayerState() {
    if (this.isReady && this.player) {
      return this.player.getPlayerState();
    }
    return -1;
  }

  /**
   * Check se sta riproducendo
   */
  isPlaying() {
    return this.getPlayerState() === 1;
  }

  /**
   * Start time update interval
   */
  startTimeUpdate() {
    this.stopTimeUpdate();
    
    this.updateInterval = setInterval(() => {
      if (this.isPlaying()) {
        const currentTime = this.getCurrentTime();
        const duration = this.getDuration();
        
        if (window.onYouTubePlayerTimeUpdate) {
          window.onYouTubePlayerTimeUpdate(currentTime, duration);
        }
      }
    }, 1000);
  }

  /**
   * Stop time update interval
   */
  stopTimeUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Mute/Unmute
   */
  toggleMute() {
    if (this.isReady && this.player) {
      if (this.player.isMuted()) {
        this.player.unMute();
        return false;
      } else {
        this.player.mute();
        return true;
      }
    }
    return false;
  }

  /**
   * Check se è muted
   */
  isMuted() {
    if (this.isReady && this.player) {
      return this.player.isMuted();
    }
    return false;
  }

  /**
   * Ottieni informazioni video
   */
  getVideoData() {
    if (this.isReady && this.player) {
      try {
        return {
          title: this.player.getVideoData().title,
          author: this.player.getVideoData().author,
          videoId: this.player.getVideoData().video_id
        };
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  /**
   * Distruggi player
   */
  destroy() {
    this.stopTimeUpdate();
    
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    
    this.isReady = false;
    this.currentVideoId = null;
  }
}
