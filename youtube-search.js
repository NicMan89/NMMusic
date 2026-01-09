/**
 * YouTube Search Service
 */
const YOUTUBE_API_KEY = 'AIzaSyD3sB4GmmbFvVjUKsa6c0TxEItHU7lvE4M';

export class YouTubeSearchService {
  constructor(apiKey = YOUTUBE_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  async search(query, maxResults = 20) {
    if (!this.apiKey || this.apiKey === 'YOUR_YOUTUBE_API_KEY_HERE') {
      return this.mockSearchResults(query);
    }

    try {
      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('q', query);
      url.searchParams.append('maxResults', maxResults);
      url.searchParams.append('type', 'video');
      url.searchParams.append('videoCategoryId', '10');
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

      const data = await response.json();
      const results = this.parseSearchResults(data);
      
      // Ottieni durata per tutti i video
      const videoIds = results.map(r => r.videoId).join(',');
      if (videoIds) {
        const durations = await this.getVideosDuration(videoIds);
        results.forEach(r => r.duration = durations[r.videoId] || 0);
      }
      
      return results;
    } catch (error) {
      console.error('YouTube search error:', error);
      throw error;
    }
  }

  async getVideosDuration(videoIds) {
    try {
      const url = new URL(`${this.baseUrl}/videos`);
      url.searchParams.append('part', 'contentDetails');
      url.searchParams.append('id', videoIds);
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url);
      const data = await response.json();
      
      const durations = {};
      if (data.items) {
        data.items.forEach(item => {
          durations[item.id] = this.parseDuration(item.contentDetails.duration);
        });
      }
      return durations;
    } catch (error) {
      return {};
    }
  }

  parseSearchResults(data) {
    if (!data.items) return [];
    return data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: this.getBestThumbnail(item.snippet.thumbnails),
      description: item.snippet.description,
      duration: 0
    }));
  }

  getBestThumbnail(thumbnails) {
    if (thumbnails.high) return thumbnails.high.url;
    if (thumbnails.medium) return thumbnails.medium.url;
    return thumbnails.default.url;
  }

  parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  mockSearchResults(query) {
    return [{
      videoId: 'dQw4w9WgXcQ',
      title: `Mock: ${query}`,
      artist: 'Test Artist',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration: 212
    }];
  }

  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    return null;
  }
}

export const youtubeSearch = new YouTubeSearchService();
