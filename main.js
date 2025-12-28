// Import Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import services
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
  isBlackScreen: false,
  wakeLock: null // Riferimento al Wake Lock
};

// ===== INIZIALIZZAZIONE =====
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🎵 NM Music PWA starting...');
  
  // Registra Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('✅ Service Worker registered:', registration);
      
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
      appState.currentUser = user;
      await handleUserLogin(user);
    } else {
      appState.currentUser = null;
      showAuthScreen();
    }
  });
  
  // Setup UI event listeners
  setupEventListeners();
  
  // Inizializza YouTube Player
  youtubePlayer.init();
  
  // Gestione visibilità pagina per Wake Lock
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

// ===== WAKE LOCK MANAGEMENT =====
async function requestWakeLock() {
  if ('wakeLock' in navigator && appState.isPlaying) {
    try {
      appState.wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock acquired');
      
      appState.wakeLock.addEventListener('release', () => {
        console.log('⚠️ Wake Lock released');
        // Richiedi di nuovo se sta ancora riproducendo
        if (appState.isPlaying && document.visibilityState === 'visible') {
          requestWakeLock();
        }
      });
    } catch (err) {
      console.log('Wake Lock error:', err.name, err.message);
    }
  }
}

async function releaseWakeLock() {
  if (appState.wakeLock) {
    try {
      await appState.wakeLock.release();
      appState.wakeLock = null;
      console.log('✅ Wake Lock released manually');
    } catch (err) {
      console.log('Wake Lock release error:', err);
    }
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && appState.isPlaying) {
    // Riacquisisci il wake lock quando l'app torna visibile
    requestWakeLock();
  }
}

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
  
  const userName = user.displayName || user.email.split('@')[0];
  document.getElementById('user-name').textContent = userName;
  
  await loadUserPlaylists();
  setupMediaSession();
}

// ===== SIDEBAR MANAGEMENT =====
function openSidebar() {
  document.getElementById('sidebar').classList.add('active');
  document.getElementById('sidebar-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebar-overlay').classList.remove('active');
  document.body.style.overflow = '';
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
    
    const tracks = playlist.tracks || [];
    appState.queue = tracks;
    appState.queueIndex = 0;
    
    uiManager.showPlaylistView(playlist, tracks, handleTrackClick, handleDeleteTrack);
    
    // Chiudi sidebar su mobile
    closeSidebar();
    
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
  
  // Richiedi Wake Lock
  requestWakeLock();
}

function togglePlayPause() {
  if (!appState.currentTrack) return;
  
  if (appState.isPlaying) {
    youtubePlayer.pause();
    appState.isPlaying = false;
    uiManager.updatePlayerUI(appState.currentTrack, false);
    
    if (appState.isBlackScreen) {
      uiManager.updateBlackScreen(appState.currentTrack, false);
    }
    
    // Rilascia Wake Lock
    releaseWakeLock();
  } else {
    youtubePlayer.play();
    appState.isPlaying = true;
    uiManager.updatePlayerUI(appState.currentTrack, true);
    
    if (appState.isBlackScreen) {
      uiManager.updateBlackScreen(appState.currentTrack, true);
    }
    
    // Richiedi Wake Lock
    requestWakeLock();
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

// ===== BLACK SCREEN =====
function toggleBlackScreen() {
  appState.isBlackScreen = !appState.isBlackScreen;
  
  if (appState.isBlackScreen) {
    document.getElementById('black-screen').classList.add('active');
    uiManager.updateBlackScreen(appState.currentTrack, appState.isPlaying);
    
    // Richiedi Wake Lock
    requestWakeLock();
  } else {
    document.getElementById('black-screen').classList.remove('active');
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
  return [];
}

async function handleAddToPlaylist(videoData) {
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

// ===== NAVIGATION =====
function navigateToView(viewName) {
  // Update sidebar navigation
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (navItem) navItem.classList.add('active');
  
  // Update bottom navigation
  document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
  const bottomNavItem = document.querySelector(`.bottom-nav-item[data-view="${viewName}"]`);
  if (bottomNavItem) bottomNavItem.classList.add('active');
  
  uiManager.showView(viewName);
  closeSidebar();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Auth tabs
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
  
  // Login form
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
  
  // Register form
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
  
  // Logout
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await authService.logout();
    releaseWakeLock();
  });
  
  // Mobile header - Hamburger menu
  document.getElementById('btn-menu').addEventListener('click', openSidebar);
  document.getElementById('btn-close-sidebar').addEventListener('click', closeSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
  
  // Mobile header - Search button
  document.getElementById('btn-mobile-search').addEventListener('click', () => {
    navigateToView('search');
    // Focus sulla search bar
    setTimeout(() => {
      document.getElementById('search-input').focus();
    }, 100);
  });
  
  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.currentTarget.dataset.view;
      navigateToView(view);
    });
  });
  
  // Bottom navigation
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      navigateToView(view);
    });
  });
  
  // Bottom nav - Playlists button
  document.getElementById('btn-mobile-playlists').addEventListener('click', openSidebar);
  
  // Bottom nav - Screen lock button
  document.getElementById('btn-mobile-screen-lock').addEventListener('click', toggleBlackScreen);
  
  // Player controls
  document.getElementById('btn-play').addEventListener('click', togglePlayPause);
  document.getElementById('btn-next').addEventListener('click', playNext);
  document.getElementById('btn-prev').addEventListener('click', playPrevious);
  
  // Black screen controls
  document.getElementById('black-play').addEventListener('click', togglePlayPause);
  document.getElementById('black-next').addEventListener('click', playNext);
  document.getElementById('black-prev').addEventListener('click', playPrevious);
  
  // Black screen toggle (desktop button)
  document.getElementById('btn-screen-lock').addEventListener('click', toggleBlackScreen);
  
  // Black screen exit
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
    } else if (state === 1) { // PLAYING
      appState.isPlaying = true;
      uiManager.updatePlayerUI(appState.currentTrack, true);
      requestWakeLock();
    } else if (state === 2) { // PAUSED
      appState.isPlaying = false;
      uiManager.updatePlayerUI(appState.currentTrack, false);
    }
  };
  
  window.onYouTubePlayerTimeUpdate = (currentTime, duration) => {
    uiManager.updateProgress(currentTime, duration);
    
    // Update black screen progress
    if (appState.isBlackScreen) {
      uiManager.updateBlackScreenProgress(currentTime, duration);
    }
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
