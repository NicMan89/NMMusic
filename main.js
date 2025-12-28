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

// Wake Lock
let wakeLock = null;

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

// ===== WAKE LOCK =====
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock active');
      wakeLock.addEventListener('release', () => {
        console.log('🔓 Wake Lock released');
      });
    } catch (err) {
      console.log('Wake Lock error:', err);
    }
  }
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && appState.isPlaying) {
    await requestWakeLock();
  }
});

// ===== MOBILE NAVIGATION =====
function openSidebar() {
  document.getElementById('sidebar').classList.add('active');
  document.getElementById('sidebar-overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

function navigateToView(view) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');
  document.querySelector(`.bottom-nav-item[data-view="${view}"]`)?.classList.add('active');
  uiManager.showView(view);
  closeSidebar();
}

// ===== INIZIALIZZAZIONE =====
window.addEventListener('DOMContentLoaded', async () => {
  console.log('🎵 NM Music starting...');
  
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log('✅ Service Worker registered');
    } catch (error) {
      console.error('❌ SW registration failed:', error);
    }
  }
  
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
  
  setupEventListeners();
  youtubePlayer.init();
});

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

async function loadUserPlaylists() {
  try {
    const playlists = await playlistService.getUserPlaylists(appState.currentUser.uid);
    uiManager.renderPlaylists(playlists, handlePlaylistClick);
  } catch (error) {
    console.error('Error loading playlists:', error);
  }
}

async function handlePlaylistClick(playlistId) {
  try {
    const playlist = await playlistService.getPlaylist(playlistId);
    appState.currentPlaylist = playlist;
    appState.queue = playlist.tracks || [];
    appState.queueIndex = 0;
    uiManager.showPlaylistView(playlist, appState.queue, handleTrackClick, handleDeleteTrack);
    closeSidebar();
  } catch (error) {
    console.error('Error loading playlist:', error);
  }
}

function handleTrackClick(trackIndex) {
  appState.queueIndex = trackIndex;
  playTrack(appState.queue[trackIndex]);
}

async function handleDeleteTrack(trackId) {
  if (!confirm('Rimuovere questa canzone?')) return;
  try {
    await playlistService.removeTrackFromPlaylist(appState.currentPlaylist.id, trackId);
    await handlePlaylistClick(appState.currentPlaylist.id);
  } catch (error) {
    console.error('Error removing track:', error);
  }
}

async function playTrack(track) {
  if (!track) return;
  appState.currentTrack = track;
  appState.isPlaying = true;
  await requestWakeLock();
  uiManager.updatePlayerUI(track, true);
  if (appState.isBlackScreen) uiManager.updateBlackScreen(track, true);
  youtubePlayer.loadVideo(track.videoId);
  updateMediaSession(track);
  uiManager.highlightCurrentTrack(appState.queueIndex);
}

function togglePlayPause() {
  if (appState.isPlaying) {
    youtubePlayer.pause();
    appState.isPlaying = false;
    releaseWakeLock();
  } else {
    youtubePlayer.play();
    appState.isPlaying = true;
    requestWakeLock();
  }
  uiManager.updatePlayerUI(appState.currentTrack, appState.isPlaying);
  if (appState.isBlackScreen) uiManager.updateBlackScreen(appState.currentTrack, appState.isPlaying);
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

function setupMediaSession() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', togglePlayPause);
    navigator.mediaSession.setActionHandler('pause', togglePlayPause);
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
  }
}

function updateMediaSession(track) {
  if ('mediaSession' in navigator && track) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'Sconosciuto',
      album: appState.currentPlaylist?.name || 'NM Music',
      artwork: [{ src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
    });
  }
}

function updateMediaSessionPlaybackState() {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = appState.isPlaying ? 'playing' : 'paused';
  }
}

async function searchYouTube(query) {
  if (!query.trim()) return;
  try {
    const results = await fetchYouTubeResults(query);
    uiManager.renderSearchResults(results, handleAddToPlaylist);
  } catch (error) {
    console.error('Search error:', error);
  }
}

async function fetchYouTubeResults(query) {
  return [];
}

async function handleAddToPlaylist(videoData) {
  const playlists = await playlistService.getUserPlaylists(appState.currentUser.uid);
  uiManager.showPlaylistSelector(playlists, async (playlistId) => {
    try {
      await playlistService.addTrackToPlaylist(playlistId, videoData);
    } catch (error) {
      console.error('Error adding track:', error);
    }
  });
}

function setupEventListeners() {
  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const isLogin = e.target.dataset.tab === 'login';
      document.getElementById('login-form').style.display = isLogin ? 'flex' : 'none';
      document.getElementById('register-form').style.display = isLogin ? 'none' : 'flex';
    });
  });
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await authService.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
    } catch (error) {
      document.getElementById('login-error').textContent = error.message;
    }
  });
  
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await authService.register(document.getElementById('register-email').value, document.getElementById('register-password').value, document.getElementById('register-name').value);
    } catch (error) {
      document.getElementById('register-error').textContent = error.message;
    }
  });
  
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await authService.logout();
    releaseWakeLock();
  });
  
  // Mobile
  document.getElementById('btn-menu')?.addEventListener('click', openSidebar);
  document.getElementById('btn-close-sidebar')?.addEventListener('click', closeSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
  document.getElementById('btn-mobile-search')?.addEventListener('click', () => {
    navigateToView('search');
    setTimeout(() => document.getElementById('search-input').focus(), 100);
  });
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToView(e.currentTarget.dataset.view);
    });
  });
  
  document.querySelectorAll('.bottom-nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => navigateToView(item.dataset.view));
  });
  
  document.getElementById('btn-bottom-playlists')?.addEventListener('click', openSidebar);
  document.getElementById('btn-bottom-sleep')?.addEventListener('click', toggleBlackScreen);
  
  // Player
  document.getElementById('btn-play').addEventListener('click', togglePlayPause);
  document.getElementById('btn-next').addEventListener('click', playNext);
  document.getElementById('btn-prev').addEventListener('click', playPrevious);
  document.getElementById('black-play').addEventListener('click', togglePlayPause);
  document.getElementById('black-next').addEventListener('click', playNext);
  document.getElementById('black-prev').addEventListener('click', playPrevious);
  document.getElementById('btn-screen-lock').addEventListener('click', toggleBlackScreen);
  document.getElementById('black-exit').addEventListener('click', () => {
    appState.isBlackScreen = false;
    document.getElementById('black-screen').classList.remove('active');
  });
  
  document.getElementById('volume-slider')?.addEventListener('input', (e) => youtubePlayer.setVolume(e.target.value));
  document.getElementById('progress-slider')?.addEventListener('input', (e) => {
    youtubePlayer.seekTo((e.target.value / 100) * youtubePlayer.getDuration());
  });
  
  document.getElementById('btn-new-playlist').addEventListener('click', async () => {
    const name = prompt('Nome della nuova playlist:');
    if (!name) return;
    try {
      await playlistService.createPlaylist(appState.currentUser.uid, name);
      await loadUserPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  });
  
  document.getElementById('btn-delete-playlist').addEventListener('click', async () => {
    if (!confirm('Eliminare questa playlist?')) return;
    try {
      await playlistService.deletePlaylist(appState.currentPlaylist.id);
      await loadUserPlaylists();
      uiManager.showView('home');
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  });
  
  let searchTimeout;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchYouTube(e.target.value), 500);
  });
  
  window.onYouTubePlayerStateChange = (state) => { if (state === 0) playNext(); };
  window.onYouTubePlayerTimeUpdate = (currentTime, duration) => {
    uiManager.updateProgress(currentTime, duration);
    const percent = (currentTime / duration) * 100;
    const mf = document.getElementById('mobile-progress-fill');
    const bf = document.getElementById('black-progress-fill');
    if (mf) mf.style.width = percent + '%';
    if (bf) bf.style.width = percent + '%';
  };
}

function toggleBlackScreen() {
  appState.isBlackScreen = !appState.isBlackScreen;
  if (appState.isBlackScreen) {
    document.getElementById('black-screen').classList.add('active');
    uiManager.updateBlackScreen(appState.currentTrack, appState.isPlaying);
  } else {
    document.getElementById('black-screen').classList.remove('active');
  }
}

function hideLoading() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
}

window.appState = appState;
window.youtubePlayer = youtubePlayer;
