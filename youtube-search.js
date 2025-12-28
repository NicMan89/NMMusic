/**
 * YouTube Search Utility
 * 
 * NOTA: Per usare la ricerca YouTube hai bisogno di una API key.
 * Ottienila da: https://console.cloud.google.com/
 * 
 * Alternative:
 * 1. Usa un backend proxy (consigliato per produzione)
 * 2. Inserisci la key qui (NON commitarla su Git!)
 * 3. Usa ricerca manuale (copia ID video da YouTube)
 */

// âš ï¸ NON committare la tua API key reale su GitHub!
// Usa variabili d'ambiente o backend proxy
const YOUTUBE_API_KEY = 'AIzaSyD3sB4GmmbFvVjUKsa6c0TxEItHU7lvE4M';

export class YouTubeSearchService {
  constructor(apiKey = YOUTUBE_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Cerca video su YouTube
   */
  async search(query, maxResults = 20) {
    if (!this.apiKey || this.apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
      console.warn('âš ï¸ YouTube API key non configurata');
      return this.mockSearchResults(query);
    }

    try {
      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('q', query);
      url.searchParams.append('maxResults', maxResults);
      url.searchParams.append('type', 'video');
      url.searchParams.append('videoCategoryId', '10'); // Music
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSearchResults(data);

    } catch (error) {
      console.error('âŒ YouTube search error:', error);
      throw error;
    }
  }

  /**
   * Ottieni dettagli video (durata, statistiche)
   */
  async getVideoDetails(videoId) {
    if (!this.apiKey || this.apiKey === 'AIzaSyD3sB4GmmbFvVjUKsa6c0TxEItHU7lvE4M') {
      return null;
    }

    try {
      const url = new URL(`${this.baseUrl}/videos`);
      url.searchParams.append('part', 'contentDetails,snippet,statistics');
      url.searchParams.append('id', videoId);
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          videoId: video.id,
          title: video.snippet.title,
          artist: video.snippet.channelTitle,
          thumbnail: this.getBestThumbnail(video.snippet.thumbnails),
          duration: this.parseDuration(video.contentDetails.duration),
          views: parseInt(video.statistics.viewCount)
        };
      }

      return null;

    } catch (error) {
      console.error('âŒ Error getting video details:', error);
      return null;
    }
  }

  /**
   * Parse risultati ricerca
   */
  parseSearchResults(data) {
    if (!data.items) return [];

    return data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: this.getBestThumbnail(item.snippet.thumbnails),
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt
    }));
  }

  /**
   * Ottieni migliore thumbnail disponibile
   */
  getBestThumbnail(thumbnails) {
    if (thumbnails.maxres) return thumbnails.maxres.url;
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    return thumbnails.default.url;
  }

  /**
   * Parse durata ISO 8601 (es: PT4M13S = 253 secondi)
   */
  parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Mock results per testing (quando API key non configurata)
   */
  mockSearchResults(query) {
    console.log('ðŸ“ Using mock search results (API key not configured)');
    
    return [
      {
        videoId: 'dQw4w9WgXcQ',
        title: `Mock Result: ${query}`,
        artist: 'Test Artist',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        description: 'Questo Ã¨ un risultato di esempio. Configura la YouTube API key per risultati reali.'
      }
    ];
  }

  /**
   * Valida video ID
   */
  isValidVideoId(videoId) {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  }

  /**
   * Estrai video ID da URL YouTube
   */
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // Se Ã¨ giÃ  un ID valido
    if (this.isValidVideoId(url)) {
      return url;
    }

    return null;
  }
}

// Esporta istanza singleton
export const youtubeSearch = new YouTubeSearchService();

/*
SETUP YOUTUBE API:

1. Vai su https://console.cloud.google.com/
2. Crea progetto o seleziona esistente
3. Abilita "YouTube Data API v3"
4. Crea credenziali > API Key
5. Opzionale: Restrizioni
   - Application restrictions: HTTP referrers
   - Aggiungi: https://tuo-username.github.io/*
   - API restrictions: YouTube Data API v3

COSTI:
- Quota gratuita: 10,000 unitÃ /giorno
- Ricerca: ~100 unitÃ 
- ~100 ricerche gratis al giorno

ALTERNATIVE SICURE:

1. Backend Proxy (consigliato):
   - Crea Cloud Function o Vercel API endpoint
   - Chiama YouTube API server-side
   - Key nascosta, piÃ¹ sicura

2. Ricerca manuale:
   - Utente cerca su YouTube
   - Copia URL video
   - App estrae ID e lo aggiunge

3. Usa altre API:
   - SoundCloud API
   - Spotify Web API
   - Deezer API
*/
