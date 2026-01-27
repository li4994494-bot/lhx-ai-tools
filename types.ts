export interface Project {
  id: string;
  name: string;
  tagline: string;
  coverImage: string;
  promptText: string;
  githubUrl: string;
  geminiShareUrl: string;
  demoUrl?: string;
  type: 'static' | 'interactive' | 'video-analyzer' | 'lingo-memo';
}

export type ToastType = 'success' | 'info';
export type ViewMode = 'home' | 'prompt-generator' | 'lingo-memo';

export interface ToastState {
  message: string;
  isVisible: boolean;
}

export interface VideoAnalysisResult {
  duration: number;
  fps: number;
  resolution: string;
  bitrate: number;
  totalFrames: number;
  duplicateCount: number;
  duplicateRatio: number;
  duplicatesPerSecond: number;
  duplicateIndices: number[];
}

/* --- LingoMemo Types --- */
export interface LingoLog {
  id: string;
  original: string;
  translated: string; // Markdown format: **Header** content
  expansions: string[];
  timestamp: number;
  count?: number; // Frequency count for deduplication
}

export interface ReviewItem {
  id: string;
  logId: string;
  stage: number; // 0-5
  nextReview: number; // Timestamp
}