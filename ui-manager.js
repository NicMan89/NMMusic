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
        <img src="${track.thumbnail}" alt="${this.escapeHtml(track.title)}" class="track-thumbnail">
        <div class="track-text">
          <h4>${this.escapeHtml(track.title)}</h4>
          <p>${this.escapeHtml(track.artist)}</p>
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
        item.querySelector('.track-play-btn i').className = 'fas fa-volume-up';
      } else {
        item.classList.remove('playing');
        item.querySelector('.track-play-btn i').className = 'fas fa-play';
      }
    });
  }

  /**
   * Update player UI
   */
  updatePlayerUI(track, isPlaying) {
    if (!track) return;

    // Update info
    document.getElementById('player-thumbnail').src = track.thumbnail;
    document.getElementById('player-title').textContent = track.title;
    document.getElementById('player-artist').textContent = track.artist;

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

    document.getElementById('black-screen-thumbnail').src = track.thumbnail;
    document.getElementById('black-screen-title').textContent = track.title;
    document.getElementById('black-screen-artist').textContent = track.artist;

    const playBtn = document.getElementById('black-play');
    const playIcon = playBtn.querySelector('i');
    
    if (isPlaying) {
      playIcon.className = 'fas fa-pause';
    } else {
      playIcon.className = 'fas fa-play';
    }
  }

  /**
   * Update progress bar
   */
  updateProgress(currentTime, duration) {
    if (duration === 0) return;

    const percentage = (currentTime / duration) * 100;
    
    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-slider').value = percentage;
    
    document.getElementById('current-time').textContent = this.formatTime(currentTime);
    document.getElementById('duration-time').textContent = this.formatTime(duration);
  }

  /**
   * Renderizza risultati ricerca
   */
  renderSearchResults(results, onAddToPlaylist, onPreview) {
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
      
      // Preview button
      const previewBtn = item.querySelector('.btn-preview');
      previewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onPreview) onPreview(result);
      });
      
      // Add button
      const addBtn = item.querySelector('.btn-add');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onAddToPlaylist(result);
      });

      container.appendChild(item);
    });
  }

  /**
   * Crea item risultato ricerca
   */
  createSearchResultItem(result, onPreview, onAdd) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    
    const duration = this.formatDuration(result.duration);

    item.innerHTML = `
      <img src="${result.thumbnail}" alt="${this.escapeHtml(result.title)}" class="search-result-thumbnail">
      <div class="search-result-info">
        <h4>${this.escapeHtml(result.title)}</h4>
        <p>${this.escapeHtml(result.artist || 'Sconosciuto')} • ${duration}</p>
      </div>
      <button class="btn-icon btn-preview" title="Anteprima 15s">
        <i class="fas fa-headphones"></i>
      </button>
      <button class="btn-icon btn-add" title="Aggiungi">
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
    // Crea toast se non esiste
    let toast = document.getElementById('toast');
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#f44336' : '#1db954'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.style.opacity = '0';
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
