export interface Project {
  id: string;
  name: string;
  tagline: string;
  coverImage: string;
  promptText: string;
  githubUrl: string;
  geminiShareUrl: string;
  demoUrl?: string;
  type: 'static' | 'interactive' | 'video-analyzer';
}



export type ToastType = 'success' | 'info';
export type ViewMode = 'home' | 'prompt-generator';

export interface ToastState {
  message: string;
  isVisible: boolean;
}

// 新增了整个 Result 接口，用于在 UI 中展示详细报告
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