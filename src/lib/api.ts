const API_BASE_URL = 'http://localhost:8000';

export type WhisperModel = "tiny" | "base" | "small" | "medium" | "large";

export interface VideoInfo {
  video_id: string;
  title?: string;
  duration?: number;
  thumbnail_url?: string;
}

export interface VideoRequest {
  url: string;
  language: string;
  subtitle_position: string;
  model: WhisperModel;
}

export interface TranscriptionResponse {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  language: string;
}

export interface ProcessResponse {
  status: string;
  message: string;
  data: {
    url: string;
    language: string;
    subtitle_position: string;
    transcription: TranscriptionResponse;
  };
}

export async function getVideoInfo(request: VideoRequest): Promise<VideoInfo> {
  const response = await fetch(`${API_BASE_URL}/api/video/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get video info');
  }

  return response.json();
}

export async function transcribeVideo(request: VideoRequest): Promise<TranscriptionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/video/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to transcribe video');
  }

  return response.json();
}

export async function processVideo(request: VideoRequest): Promise<ProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/api/video/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to process video');
  }

  return response.json();
} 