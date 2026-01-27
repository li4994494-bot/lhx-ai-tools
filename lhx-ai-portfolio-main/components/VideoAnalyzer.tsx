
import React, { useState, useRef, useEffect } from 'react';
import { VideoAnalysisResult } from '../types';

interface VideoAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [targetFps, setTargetFps] = useState<number>(30);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setFile(null);
      setResult(null);
      setLogs([]);
      setProgress(0);
      setIsAnalyzing(false);
      setTargetFps(30);
    }
  }, [isOpen]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setLogs([]);
      setProgress(0);
    }
  };

  // Replicating your python `is_frame_duplicate` logic exactly
  // NOTE: OpenCV uses integer arithmetic for BGR2GRAY. We must replicate this.
  const isFrameDuplicate = (data1: Uint8ClampedArray, data2: Uint8ClampedArray, width: number, height: number, threshold = 0.9999) => {
    let sumThresh = 0;
    const totalPixels = width * height;

    for (let i = 0; i < data1.length; i += 4) {
      // Get BGR values (Canvas is RGBA)
      const r1 = data1[i];
      const g1 = data1[i + 1];
      const b1 = data1[i + 2];

      const r2 = data2[i];
      const g2 = data2[i + 1];
      const b2 = data2[i + 2];

      // cv2.absdiff (Absolute difference)
      const diffR = Math.abs(r1 - r2);
      const diffG = Math.abs(g1 - g2);
      const diffB = Math.abs(b1 - b2);

      // cv2.cvtColor(difference, cv2.COLOR_BGR2GRAY)
      // Critical: OpenCV uses integer arithmetic. Math.floor is required to match `uint8` behavior.
      // Formula: 0.299*R + 0.587*G + 0.114*B
      const grayDiff = Math.floor(0.299 * diffR + 0.587 * diffG + 0.114 * diffB);

      // cv2.threshold(gray_diff, 30, 255, cv2.THRESH_BINARY)
      // Logic: if src(x,y) > thresh ? maxval : 0
      const threshValue = grayDiff > 30 ? 255 : 0;

      sumThresh += threshValue;
    }

    // similarity = 1 - (np.sum(thresh) / (thresh.shape[0] * thresh.shape[1] * 255))
    const similarity = 1 - (sumThresh / (totalPixels * 255));

    return similarity > threshold;
  };

  const startAnalysis = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setResult(null);
    setLogs(["正在初始化视频解码器...", "加载您的 Python 算法逻辑..."]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;

    video.onloadedmetadata = async () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      // Use the user-selected FPS
      const fps = targetFps; 
      const duration = video.duration;
      const totalEstimatedFrames = Math.floor(duration * fps); // Estimate total frames
      
      const bitrate = (file.size * 8) / duration;

      addLog(`视频信息加载成功: ${width}x${height}, ${duration.toFixed(2)}s, FPS设为: ${fps}`);
      addLog(`开始逐帧分析 (预计 ~${totalEstimatedFrames} 帧)...`);

      let frameCount = 0;
      let duplicateFrames: number[] = [];
      let previousFrameData: Uint8ClampedArray | null = null;
      
      const finishCurrentAnalysis = () => {
          finishAnalysis(frameCount, duplicateFrames, duration, fps, width, height, bitrate);
      };

      video.onseeked = () => {
        // Draw frame
        ctx.drawImage(video, 0, 0, width, height);
        const frameData = ctx.getImageData(0, 0, width, height).data;

        frameCount++;

        if (previousFrameData) {
          // Execute the Python Logic Port
          if (isFrameDuplicate(previousFrameData, frameData, width, height)) {
             duplicateFrames.push(frameCount);
          }
        }

        previousFrameData = frameData;
        
        // Update progress based on frame count rather than time to be smoother
        // We use a safe guard for progress calculation
        const currentProgress = (frameCount / (totalEstimatedFrames || 1)) * 100;
        setProgress(Math.min(99, currentProgress));

        // Calculate next time
        // Strategy: Seek to the CENTER of the next frame to avoid edge rounding errors.
        // Frame 0: [0, 1/fps). Center: 0.5/fps.
        // Frame n: [n/fps, (n+1)/fps). Center: (n + 0.5)/fps.
        const nextFrameIndex = frameCount; 
        const nextTime = (nextFrameIndex + 0.5) / fps;

        // Continue loop if we are within duration AND (important) within estimated frames
        // We buffer the duration check slightly (-0.1s) to avoid reading past end if duration is imprecise
        if (nextTime < duration && frameCount < totalEstimatedFrames + 5) { // +5 tolerance
            // Using setTimeout to allow UI updates (prevent freeze)
            setTimeout(() => {
                video.currentTime = nextTime;
            }, 0);
        } else {
            finishCurrentAnalysis();
        }
      };

      // Start the loop
      // Seek to center of first frame to be consistent
      video.currentTime = 0.5 / fps;
    };
  };

  const finishAnalysis = (
      totalFrames: number, 
      duplicates: number[], 
      duration: number, 
      fps: number, 
      width: number, 
      height: number,
      bitrate: number
    ) => {
    
    const duplicateRatio = totalFrames > 0 ? duplicates.length / totalFrames : 0;
    const duplicatesPerSecond = duration > 0 ? duplicates.length / duration : 0;

    const finalResult: VideoAnalysisResult = {
      duration,
      fps,
      resolution: `${width}x${height}`,
      bitrate,
      totalFrames,
      duplicateCount: duplicates.length,
      duplicateRatio,
      duplicatesPerSecond,
      duplicateIndices: duplicates
    };

    setResult(finalResult);
    setIsAnalyzing(false);
    setProgress(100);
    addLog("分析完成。");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
        onClick={!isAnalyzing ? onClose : undefined}
      />

      {/* Main Card */}
      <div className="relative w-full max-w-2xl glass rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 flex justify-between items-center bg-white/40">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">视频丢帧检测工具</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">Running custom Python algorithm (v1.1)</p>
          </div>
          {!isAnalyzing && (
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* 1. Upload Section */}
          {!isAnalyzing && !result && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-10 bg-white/20 hover:bg-white/40 transition-colors">
              <input 
                type="file" 
                accept="video/*" 
                onChange={handleFileChange}
                className="hidden" 
                id="video-upload"
              />
              <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-lg font-medium text-gray-700">点击上传视频文件</span>
                <span className="text-sm text-gray-500 mt-2">支持 MP4, MOV, AVI 等格式</span>
              </label>
              
              {file && (
                <div className="mt-8 flex flex-col items-center w-full space-y-4">
                  <div className="bg-white/60 px-4 py-2 rounded-lg text-sm font-medium text-gray-800 border border-gray-200">
                    已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>

                  {/* FPS Selector */}
                  <div className="w-full max-w-xs bg-white/40 p-4 rounded-xl border border-gray-200/50">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">
                      请选择视频真实帧率 (FPS)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[24, 30, 60].map(fps => (
                        <button
                          key={fps}
                          onClick={() => setTargetFps(fps)}
                          className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                            targetFps === fps 
                              ? 'bg-blue-600 text-white shadow-md scale-105' 
                              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {fps}
                        </button>
                      ))}
                      <div className="relative">
                        <input
                          type="number"
                          value={targetFps}
                          onChange={(e) => setTargetFps(Number(e.target.value))}
                          className={`w-full h-full py-2 px-1 rounded-lg text-sm font-medium text-center border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            ![24, 30, 60].includes(targetFps)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-200'
                          }`}
                          placeholder="Custom"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      *浏览器无法准确读取文件原始帧率，请务必设置正确以确保不漏帧。
                    </p>
                  </div>

                  <button 
                    onClick={startAnalysis}
                    className="w-full sm:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all active:scale-95 mt-4"
                  >
                    立即运行分析
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Processing State */}
          {isAnalyzing && (
            <div className="space-y-6 py-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <h4 className="text-lg font-medium text-gray-800">正在分析每一帧...</h4>
                <p className="text-sm text-gray-500">请勿关闭窗口，大文件可能需要几分钟</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <span>Progress</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-black/80 rounded-xl p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i}>&gt; {log}</div>
                ))}
                <div className="animate-pulse">&gt; Processing...</div>
              </div>
            </div>
          )}

          {/* 3. Results State */}
          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">分辨率</div>
                  <div className="text-lg font-semibold text-gray-900">{result.resolution}</div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">时长</div>
                  <div className="text-lg font-semibold text-gray-900">{result.duration.toFixed(2)}s</div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">FPS (设定)</div>
                  <div className="text-lg font-semibold text-gray-900">{result.fps}</div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">码率</div>
                  <div className="text-lg font-semibold text-gray-900">{(result.bitrate / 1000).toFixed(0)} kbps</div>
                </div>
              </div>

              <div className="bg-red-50/80 p-6 rounded-2xl border border-red-100">
                <h4 className="text-red-800 font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  重复帧分析结果
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-red-100 pb-2">
                    <span className="text-red-700/70">总帧数</span>
                    <span className="font-mono font-medium text-red-900">{result.totalFrames}</span>
                  </div>
                  <div className="flex justify-between border-b border-red-100 pb-2">
                    <span className="text-red-700/70">重复帧数量</span>
                    <span className="font-mono font-bold text-red-600">{result.duplicateCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-red-100 pb-2">
                    <span className="text-red-700/70">重复帧占比</span>
                    <span className="font-mono font-medium text-red-900">{(result.duplicateRatio * 100).toFixed(4)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700/70">每秒重复帧数</span>
                    <span className="font-mono font-medium text-red-900">{result.duplicatesPerSecond.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {result.duplicateIndices.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-2">重复帧索引 (前100个)</div>
                  <div className="font-mono text-xs text-gray-600 break-all leading-relaxed">
                    [{result.duplicateIndices.slice(0, 100).join(', ')}{result.duplicateIndices.length > 100 ? '...' : ''}]
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-green-900">太棒了！</div>
                        <div className="text-xs text-green-700">未检测到任何重复帧，视频质量良好。</div>
                    </div>
                </div>
              )}

              <button 
                onClick={() => { setResult(null); setFile(null); }}
                className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-medium transition-colors"
              >
                分析另一个视频
              </button>
            </div>
          )}
        </div>

        {/* Hidden Technical Elements */}
        <video ref={videoRef} className="hidden" muted playsInline crossOrigin="anonymous" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default VideoAnalyzer;
