export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // youtube.com/watch?v=VIDEO_ID 形式
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    
    // youtu.be/VIDEO_ID 形式
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  const videoId = extractYouTubeVideoId(url);
  return videoId !== null && videoId.length > 0;
} 