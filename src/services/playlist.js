import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export class PlaylistService {
  constructor(db) {
    this.db = db;
    this.playlistsCollection = 'playlists';
  }

  /**
   * Crea una nuova playlist
   */
  async createPlaylist(userId, name, description = '') {
    try {
      const playlist = {
        name,
        description,
        userId,
        tracks: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(
        collection(this.db, this.playlistsCollection),
        playlist
      );

      console.log('✅ Playlist created:', docRef.id);
      return { id: docRef.id, ...playlist };
    } catch (error) {
      console.error('❌ Error creating playlist:', error);
      throw error;
    }
  }

  /**
   * Ottieni tutte le playlist di un utente
   */
  async getUserPlaylists(userId) {
    try {
      const q = query(
        collection(this.db, this.playlistsCollection),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const playlists = [];

      querySnapshot.forEach((doc) => {
        playlists.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Loaded ${playlists.length} playlists`);
      return playlists;
    } catch (error) {
      console.error('❌ Error loading playlists:', error);
      throw error;
    }
  }

  /**
   * Ottieni una playlist specifica
   */
  async getPlaylist(playlistId) {
    try {
      const docRef = doc(this.db, this.playlistsCollection, playlistId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Playlist non trovata');
      }
    } catch (error) {
      console.error('❌ Error getting playlist:', error);
      throw error;
    }
  }

  /**
   * Aggiorna una playlist
   */
  async updatePlaylist(playlistId, updates) {
    try {
      const docRef = doc(this.db, this.playlistsCollection, playlistId);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Playlist updated:', playlistId);
    } catch (error) {
      console.error('❌ Error updating playlist:', error);
      throw error;
    }
  }

  /**
   * Elimina una playlist
   */
  async deletePlaylist(playlistId) {
    try {
      const docRef = doc(this.db, this.playlistsCollection, playlistId);
      await deleteDoc(docRef);

      console.log('✅ Playlist deleted:', playlistId);
    } catch (error) {
      console.error('❌ Error deleting playlist:', error);
      throw error;
    }
  }

  /**
   * Aggiungi una traccia alla playlist
   */
  async addTrackToPlaylist(playlistId, trackData) {
    try {
      const track = {
        id: `track_${Date.now()}`,
        videoId: trackData.videoId,
        title: trackData.title,
        artist: trackData.artist || 'Sconosciuto',
        thumbnail: trackData.thumbnail,
        duration: trackData.duration || 0,
        addedAt: new Date().toISOString()
      };

      const docRef = doc(this.db, this.playlistsCollection, playlistId);
      
      await updateDoc(docRef, {
        tracks: arrayUnion(track),
        updatedAt: serverTimestamp()
      });

      console.log('✅ Track added to playlist:', track.title);
      return track;
    } catch (error) {
      console.error('❌ Error adding track:', error);
      throw error;
    }
  }

  /**
   * Rimuovi una traccia dalla playlist
   */
  async removeTrackFromPlaylist(playlistId, trackId) {
    try {
      // Prima ottieni la playlist
      const playlist = await this.getPlaylist(playlistId);
      
      // Trova e rimuovi la traccia
      const updatedTracks = playlist.tracks.filter(
        track => track.id !== trackId
      );

      // Aggiorna il documento
      const docRef = doc(this.db, this.playlistsCollection, playlistId);
      
      await updateDoc(docRef, {
        tracks: updatedTracks,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Track removed from playlist');
    } catch (error) {
      console.error('❌ Error removing track:', error);
      throw error;
    }
  }

  /**
   * Riordina tracce nella playlist
   */
  async reorderTracks(playlistId, newTracksOrder) {
    try {
      const docRef = doc(this.db, this.playlistsCollection, playlistId);
      
      await updateDoc(docRef, {
        tracks: newTracksOrder,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Tracks reordered');
    } catch (error) {
      console.error('❌ Error reordering tracks:', error);
      throw error;
    }
  }

  /**
   * Cerca playlist per nome
   */
  async searchPlaylists(userId, searchTerm) {
    try {
      const q = query(
        collection(this.db, this.playlistsCollection),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const playlists = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          playlists.push({
            id: doc.id,
            ...data
          });
        }
      });

      return playlists;
    } catch (error) {
      console.error('❌ Error searching playlists:', error);
      throw error;
    }
  }
}
