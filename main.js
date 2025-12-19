// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import services (file nella root)
import { firebaseConfig } from './firebase-config.js';
import { AuthService } from './auth.js';
import { PlaylistService } from './playlist.js';
import { YouTubePlayer } from './youtube-player.js';
import { UIManager } from './ui-manager.js';

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Inizializza servizi
const authService = new AuthService(auth);
const playlistService = new PlaylistService(db);
const youtubePlayer = new YouTubePlayer();
const uiManager = new UIManager();

// App State
const appState = {
  currentUser: null,
  currentPlaylist: null,
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isBlackScreen: false
};

// ===== INIZIALIZZAZIONE =====
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🎵 NM Music PWA starting...');
  
  // Registra Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('✅ Service Worker registered:', registration);
      
      // Check per aggiornamenti
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
  
  // Setup auth listener
  onAuthStateChanged(auth, async (user) => {
    hideLoading();
    
    if (user) {
      // User logged in
      appState.currentUser = user;
      await handleUserLogin(user);
    } else {
      // User logged out
      appState.currentUser = null;
      showAuthScreen();
    }
  });
  
  // Setup UI event listeners
  setupEventListeners();
  
  // Inizializza YouTube Player
  youtubePlayer.init();
});

// ===== AUTH MANAGEMENT =====
function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

function hideAuthScreen() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'grid';
}

async function handleUserLogin(user) {
  hideAuthScreen();
  
  // Update UI con info utente
  const userName = user.displayName || user.email.split('@')[0];
  document.getElementById('user-name').textContent = userName;
  
  // Carica playlist utente
  await loadUserPlaylists();
  
  // Setup Media Session
  setupMediaSession();
}

// ===== PLAYLIST MANAGEMENT =====
async function loadUserPlaylists() {
  try {
    const playlists = await playlistService.getUserPlaylists(appState.currentUser.uid);
    uiManager.renderPlaylists(playlists, handlePlaylistClick);
  } catch (error) {
    console.error('Error loading playlists:', error);
    uiManager.showError('Errore nel caricamento delle playlist');
  }
}

async function handlePlaylistClick(playlistId) {
  try {
    const playlist = await playlistService.getPlaylist(playlistId);
    appState.currentPlaylist = playlist;
    
    // Carica tracce
    const tracks = playlist.tracks || [];
    appState.queue = tracks;
    appState.queueIndex = 0;
    
    // Mostra playlist view
    uiManager.showPlaylistView(playlist, tracks, handleTrackClick, handleDeleteTrack);
    
  } catch (error) {
    console.error('Error loading playlist:', error);
    uiManager.showError('Errore nel caricamento della playlist');
  }
}

function handleTrackClick(trackIndex) {
  appState.queueIndex = trackIndex;
  const track = appState.queue[trackIndex];
  playTrack(track);
}

async function handleDeleteTrack(trackId) {
  if (!confirm('Rimuovere questa canzone dalla playlist?')) return;
  
  try {
    await playlistService.removeTrackFromPlaylist(
      appState.currentPlaylist.id,
      trackId
    );
    
    // Ricarica playlist
    await handlePlaylistClick(appState.currentPlaylist.id);
    uiManager.showSuccess('Canzone rimossa');
    
  } catch (error) {
    console.error('Error removing track:', error);
    uiManager.showError('Errore nella rimozione');
  }
}

// ===== PLAYBACK CONTROL =====
function playTrack(track) {
  if (!track) return;
  
  appState.currentTrack = track;
  appState.isPlaying = true;
  
  // Update UI
  uiManager.updatePlayerUI(track, true);
  
  // Update black screen se attivo
  if (appState.isBlackScreen) {
    uiManager.updateBlackScreen(track, true);
  }
  
  // Play su YouTube
  youtubePlayer.loadVideo(track.videoId);
  
  // Update Media Session
  updateMediaSession(track);
  
  // Highlight track in list
  uiManager.highlightCurrentTrack(appState.queueIndex);
}

function togglePlayPause() {
  if (appState.isPlaying) {
    youtubePlayer.pause();
    appState.isPlaying = false;
    uiManager.updatePlayerUI(appState.currentTrack, false);
    
    if (appState.isBlackScreen) {
      uiManager.updateBlackScreen(appState.currentTrack, false);
    }
  } else {
    youtubePlayer.play();
    appState.isPlaying = true;
    uiManager.updatePlayerUI(appState.currentTrack, true);
    
    if (appState.isBlackScreen) {
      uiManager.updateBlackScreen(appState.currentTrack, true);
    }
  }
  
  updateMediaSessionPlaybackState();
}

function playNext() {
  if (appState.queueIndex < appState.queue.length - 1) {
    appState.queueIndex++;
    playTrack(appState.queue[appState.queueIndex]);
  }
}

function playPrevious() {
  if (appState.queueIndex > 0) {
    appState.queueIndex--;
    playTrack(appState.queue[appState.queueIndex]);
  }
}

// ===== MEDIA SESSION API =====
function setupMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
      togglePlayPause();
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      togglePlayPause();
    });
    
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPrevious();
    });
    
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext();
    });
    
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) {
        youtubePlayer.seekTo(details.seekTime);
      }
    });
  }
}

function updateMediaSession(track) {
  if ('mediaSession' in navigator && track) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'Sconosciuto',
      album: appState.currentPlaylist?.name || 'NM Music',
      artwork: [
        { src: track.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '128x128', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '192x192', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '384x384', type: 'image/jpeg' },
        { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
  }
}

function updateMediaSessionPlaybackState() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = appState.isPlaying ? 'playing' : 'paused';
  }
}

// ===== SEARCH YOUTUBE =====
async function searchYouTube(query) {
  if (!query.trim()) return;
  
  try {
    uiManager.showLoading();
    
    // Usa YouTube Data API tramite backend o fetch diretto
    // Per semplicità, qui usiamo una ricerca base
    // In produzione, implementa chiamata API corretta
    
    const results = await fetchYouTubeResults(query);
    uiManager.renderSearchResults(results, handleAddToPlaylist);
    
  } catch (error) {
    console.error('Search error:', error);
    uiManager.showError('Errore nella ricerca');
  } finally {
    uiManager.hideLoading();
  }
}

async function fetchYouTubeResults(query) {
  // TODO: Implementa chiamata API YouTube
  // Per ora ritorna risultati mock
  return [];
}

async function handleAddToPlaylist(videoData) {
  // Mostra modal per scegliere playlist
  const playlists = await playlistService.getUserPlaylists(appState.currentUser.uid);
  uiManager.showPlaylistSelector(playlists, async (playlistId) => {
    try {
      await playlistService.addTrackToPlaylist(playlistId, videoData);
      uiManager.showSuccess('Aggiunto alla playlist!');
    } catch (error) {
      console.error('Error adding track:', error);
      uiManager.showError('Errore nell\'aggiunta');
    }
  });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Auth
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabType = e.target.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      if (tabType === 'login') {
        document.getElementById('login-form').style.display = 'flex';
        document.getElementById('register-form').style.display = 'none';
      } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'flex';
      }
    });
  });
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      await authService.login(email, password);
    } catch (error) {
      document.getElementById('login-error').textContent = error.message;
    }
  });
  
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
      await authService.register(email, password, name);
    } catch (error) {
      document.getElementById('register-error').textContent = error.message;
    }
  });
  
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await authService.logout();
  });
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.currentTarget.dataset.view;
      
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      uiManager.showView(view);
    });
  });
  
  // Player controls
  document.getElementById('btn-play').addEventListener('click', togglePlayPause);
  document.getElementById('btn-next').addEventListener('click', playNext);
  document.getElementById('btn-prev').addEventListener('click', playPrevious);
  
  // Black screen controls
  document.getElementById('black-play').addEventListener('click', togglePlayPause);
  document.getElementById('black-next').addEventListener('click', playNext);
  document.getElementById('black-prev').addEventListener('click', playPrevious);
  
  // Black screen toggle
  document.getElementById('btn-screen-lock').addEventListener('click', () => {
    appState.isBlackScreen = !appState.isBlackScreen;
    
    if (appState.isBlackScreen) {
      document.getElementById('black-screen').classList.add('active');
      uiManager.updateBlackScreen(appState.currentTrack, appState.isPlaying);
      
      // Previeni sleep su mobile
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(err => {
          console.log('Wake Lock error:', err);
        });
      }
    } else {
      document.getElementById('black-screen').classList.remove('active');
    }
  });
  
  document.getElementById('black-exit').addEventListener('click', () => {
    appState.isBlackScreen = false;
    document.getElementById('black-screen').classList.remove('active');
  });
  
  // Volume
  document.getElementById('volume-slider').addEventListener('input', (e) => {
    youtubePlayer.setVolume(e.target.value);
  });
  
  // Progress
  document.getElementById('progress-slider').addEventListener('input', (e) => {
    const duration = youtubePlayer.getDuration();
    const seekTime = (e.target.value / 100) * duration;
    youtubePlayer.seekTo(seekTime);
  });
  
  // New playlist
  document.getElementById('btn-new-playlist').addEventListener('click', async () => {
    const name = prompt('Nome della nuova playlist:');
    if (!name) return;
    
    try {
      await playlistService.createPlaylist(appState.currentUser.uid, name);
      await loadUserPlaylists();
      uiManager.showSuccess('Playlist creata!');
    } catch (error) {
      console.error('Error creating playlist:', error);
      uiManager.showError('Errore nella creazione');
    }
  });
  
  // Delete playlist
  document.getElementById('btn-delete-playlist').addEventListener('click', async () => {
    if (!confirm('Eliminare questa playlist?')) return;
    
    try {
      await playlistService.deletePlaylist(appState.currentPlaylist.id);
      await loadUserPlaylists();
      uiManager.showView('home');
      uiManager.showSuccess('Playlist eliminata');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      uiManager.showError('Errore nell\'eliminazione');
    }
  });
  
  // Search
  let searchTimeout;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchYouTube(e.target.value);
    }, 500);
  });
  
  // YouTube player events
  window.onYouTubePlayerStateChange = (state) => {
    if (state === 0) { // ENDED
      playNext();
    }
  };
  
  window.onYouTubePlayerTimeUpdate = (currentTime, duration) => {
    uiManager.updateProgress(currentTime, duration);
  };
}

// ===== UTILITY =====
function hideLoading() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
}

// Esporta per debug
window.appState = appState;
window.youtubePlayer = youtubePlayer;
