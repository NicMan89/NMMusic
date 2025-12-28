export class UIManager {
  constructor() {
    this.currentView = 'home';
  }

  /**
   * Mostra una view specifica
   */
  showView(viewName) {
    // Nascondi tutte le view
    document.querySelectorAll('.content-view').forEach(view => {
      view.style.display = 'none';
    });

    // Mostra la view richiesta
    const viewElement = document.getElementById(`${viewName}-view`);
    if (viewElement) {
      viewElement.style.display = 'block';
      this.currentView = viewName;
    }
  }

  /**
   * Renderizza lista playlist
   */
  renderPlaylists(playlists, onPlaylistClick) {
    // Sidebar list
    const sidebarList = document.getElementById('playlists-list');
    sidebarList.innerHTML = '';

    playlists.forEach(playlist => {
      const item = this.createPlaylistSidebarItem(playlist);
      item.addEventListener('click', () => onPlaylistClick(playlist.id));
      sidebarList.appendChild(item);
    });

    // Home grid
    const homeGrid = document.getElementById('home-playlists');
    homeGrid.innerHTML = '';

    if (playlists.length === 0) {
      homeGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class="fas fa-music" style="font-size: 60px; margin-bottom: 20px; opacity: 0.3;"></i>
          <p>Nessuna playlist. Creane una!</p>
        </div>
      `;
      return;
    }

    playlists.forEach(playlist => {
      const card = this.createPlaylistCard(playlist);
      card.addEventListener('click', () => onPlaylistClick(playlist.id));
      homeGrid.appendChild(card);
    });
  }

  /**
   * Crea item sidebar playlist
   */
  createPlaylistSidebarItem(playlist) {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    item.dataset.playlistId = playlist.id;

    const trackCount = playlist.tracks?.length || 0;
    
    item.innerHTML = `
      <div class="playlist-icon">
        <i class="fas fa-music"></i>
      </div>
      <div class="playlist-info">
        <h4>${this.escapeHtml(playlist.name)}</h4>
        <p>${trackCount} brani</p>
      </div>
    `;

    return item;
  }

  /**
   * Crea card playlist
   */
  createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';

    const trackCount = playlist.tracks?.length || 0;
    
    card.innerHTML = `
      <div class="playlist-card-cover">
        <i class="fas fa-music"></i>
      </div>
      <h3>${this.escapeHtml(playlist.name)}</h3>
      <p>${trackCount} brani</p>
    `;

    return card;
  }

  /**
   * Mostra playlist view con tracce
   */
  showPlaylistView(playlist, tracks, onTrackClick, onDeleteTrack) {
    this.showView('playlist');

    // Update header
    document.getElementById('current-playlist-name').textContent = playlist.name;
    document.getElementById('current-playlist-count').textContent = 
      `${tracks.length} ${tracks.length === 1 ? 'brano' : 'brani'}`;

    // Render tracks
    const tracksList = document.getElementById('playlist-tracks');
    tracksList.innerHTML = '';

    if (tracks.length === 0) {
      tracksList.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <i class="fas fa-compact-disc" style="font-size: 80px; margin-bottom: 20px; opacity: 0.3;"></i>
          <h3 style="margin-bottom: 10px;">Playlist vuota</h3>
          <p>Cerca canzoni e aggiungile a questa playlist</p>
        </div>
      `;
      return;
    }

    tracks.forEach((track, index) => {
      const trackElement = this.createTrackItem(track, index + 1);
      
      // Click per riprodurre
      trackElement.addEventListener('click', (e) => {
        if (!e.target.closest('.track-actions')) {
          onTrackClick(index);
        }
      });

      // Bottone delete
      const deleteBtn = trackElement.querySelector('.btn-delete-track');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onDeleteTrack(track.id);
        });
      }

      tracksList.appendChild(trackElement);
    });
  }

  /**
   * Crea elemento traccia
   */
  createTrackItem(track, number) {
    const item = document.createElement('div');
    item.className = 'track-item';
    item.dataset.trackId = track.id;

    const duration = this.formatDuration(track.duration);
    
    item.innerHTML = `
      <div>
        <span class="track-number">${number}</span>
        <button class="track-play-btn">
          <i class="fas fa-play"></i>
        </button>
      </div>
      <div class="track-content">
        <img src="${track.thumbnail}" alt="${this.escapeHtml(track.title)}" class="track-thumbnail" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231a1a24%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2230%22>♪</text></svg>'">
        <div class="track-text">
          <h4>${this.escapeHtml(track.title)}</h4>
          <p>${this.escapeHtml(track.artist || 'Sconosciuto')}</p>
        </div>
      </div>
      <span class="track-duration">${duration}</span>
      <div class="track-actions">
        <button class="btn-delete-track" title="Rimuovi">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    return item;
  }

  /**
   * Evidenzia traccia corrente
   */
  highlightCurrentTrack(index) {
    document.querySelectorAll('.track-item').forEach((item, i) => {
      if (i === index) {
        item.classList.add('playing');
        const playBtn = item.querySelector('.track-play-btn i');
        if (playBtn) playBtn.className = 'fas fa-volume-up';
      } else {
        item.classList.remove('playing');
        const playBtn = item.querySelector('.track-play-btn i');
        if (playBtn) playBtn.className = 'fas fa-play';
      }
    });
  }

  /**
   * Update player UI
   */
  updatePlayerUI(track, isPlaying) {
    if (!track) return;

    // Update info
    const thumbnail = document.getElementById('player-thumbnail');
    thumbnail.src = track.thumbnail;
    thumbnail.onerror = () => {
      thumbnail.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1a24" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="30">♪</text></svg>';
    };
    document.getElementById('player-title').textContent = track.title;
    document.getElementById('player-artist').textContent = track.artist || 'Sconosciuto';

    // Update play button
    const playBtn = document.getElementById('btn-play');
    const playIcon = playBtn.querySelector('i');
    
    if (isPlaying) {
      playIcon.className = 'fas fa-pause';
    } else {
      playIcon.className = 'fas fa-play';
    }
  }

  /**
   * Update black screen
   */
  updateBlackScreen(track, isPlaying) {
    if (!track) return;

    const thumbnail = document.getElementById('black-screen-thumbnail');
    thumbnail.src = track.thumbnail;
    thumbnail.onerror = () => {
      thumbnail.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1a24" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="30">♪</text></svg>';
    };
    document.getElementById('black-screen-title').textContent = track.title;
    document.getElementById('black-screen-artist').textContent = track.artist || 'Sconosciuto';

    const playBtn = document.getElementById('black-play');
    const playIcon = playBtn.querySelector('i');
    
    if (isPlaying) {
      playIcon.className = 'fas fa-pause';
    } else {
      playIcon.className = 'fas fa-play';
    }
  }

  /**
   * Update black screen progress
   */
  updateBlackScreenProgress(currentTime, duration) {
    if (duration === 0) return;

    const percentage = (currentTime / duration) * 100;
    
    const progressFill = document.getElementById('black-progress-fill');
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    const currentTimeEl = document.getElementById('black-current-time');
    const durationTimeEl = document.getElementById('black-duration-time');
    
    if (currentTimeEl) currentTimeEl.textContent = this.formatTime(currentTime);
    if (durationTimeEl) durationTimeEl.textContent = this.formatTime(duration);
  }

  /**
   * Update progress bar (desktop + mobile)
   */
  updateProgress(currentTime, duration) {
    if (duration === 0) return;

    const percentage = (currentTime / duration) * 100;
    
    // Desktop progress
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    const progressSlider = document.getElementById('progress-slider');
    if (progressSlider) {
      progressSlider.value = percentage;
    }
    
    const currentTimeEl = document.getElementById('current-time');
    const durationTimeEl = document.getElementById('duration-time');
    if (currentTimeEl) currentTimeEl.textContent = this.formatTime(currentTime);
    if (durationTimeEl) durationTimeEl.textContent = this.formatTime(duration);
    
    // Mobile progress bar
    const mobileProgressFill = document.getElementById('mobile-progress-fill');
    if (mobileProgressFill) {
      mobileProgressFill.style.width = `${percentage}%`;
    }
  }

  /**
   * Renderizza risultati ricerca
   */
  renderSearchResults(results, onAddToPlaylist) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';

    if (results.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <i class="fas fa-search" style="font-size: 80px; margin-bottom: 20px; opacity: 0.3;"></i>
          <p>Cerca canzoni, artisti o album</p>
        </div>
      `;
      return;
    }

    results.forEach(result => {
      const item = this.createSearchResultItem(result);
      
      item.addEventListener('click', () => {
        onAddToPlaylist(result);
      });

      container.appendChild(item);
    });
  }

  /**
   * Crea item risultato ricerca
   */
  createSearchResultItem(result) {
    const item = document.createElement('div');
    item.className = 'search-result-item';

    item.innerHTML = `
      <img src="${result.thumbnail}" alt="${this.escapeHtml(result.title)}" class="search-result-thumbnail" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231a1a24%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2230%22>♪</text></svg>'">
      <div class="search-result-info">
        <h4>${this.escapeHtml(result.title)}</h4>
        <p>${this.escapeHtml(result.artist || 'Sconosciuto')}</p>
      </div>
      <button class="btn-icon">
        <i class="fas fa-plus"></i>
      </button>
    `;

    return item;
  }

  /**
   * Mostra modal per selezionare playlist
   */
  showPlaylistSelector(playlists, onSelect) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = 'Aggiungi a playlist';
    
    modalBody.innerHTML = '';
    
    if (playlists.length === 0) {
      modalBody.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nessuna playlist disponibile</p>';
    } else {
      playlists.forEach(playlist => {
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.style.marginBottom = '12px';
        btn.textContent = playlist.name;
        
        btn.addEventListener('click', () => {
          onSelect(playlist.id);
          this.hideModal();
        });
        
        modalBody.appendChild(btn);
      });
    }

    modal.classList.add('active');
    
    // Close handlers
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => this.hideModal();
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.hideModal();
      }
    };
  }

  /**
   * Nascondi modal
   */
  hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  /**
   * Mostra loading
   */
  showLoading() {
    // Implementa se necessario
  }

  /**
   * Nascondi loading
   */
  hideLoading() {
    // Implementa se necessario
  }

  /**
   * Mostra messaggio successo
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * Mostra messaggio errore
   */
  showError(message) {
    this.showToast(message, 'error');
  }

  /**
   * Mostra toast notification
   */
  showToast(message, type = 'info') {
    // Rimuovi toast esistente
    const existingToast = document.getElementById('toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 180px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'error' ? '#f44336' : '#00E5FF'};
      color: ${type === 'error' ? 'white' : 'black'};
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
      max-width: 90%;
      text-align: center;
    `;
    document.body.appendChild(toast);

    toast.textContent = message;
    
    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Formatta durata in secondi a MM:SS
   */
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    return this.formatTime(seconds);
  }

  /**
   * Formatta tempo in MM:SS
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Escape HTML per prevenire XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
