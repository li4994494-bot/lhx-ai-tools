import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Send, 
  BookMarked, 
  BrainCircuit, 
  ArrowLeft, 
  Keyboard, 
  Volume2, 
  Sparkles, 
  Bookmark,
  Check,
  RotateCcw,
  Repeat
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { LingoLog, ReviewItem } from '../types';

/* --- Type Definitions for Web Speech API --- */
interface IWindow extends Window {
  webkitSpeechRecognition: any;
}
declare const window: IWindow;

interface LingoMemoProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

// ⚡️ Revised Prompt: Strictly enforces the User's requested Chinese Headers
const SYSTEM_PROMPT = `
Task: Translate & Explain. Return JSON.

Logic:
1. If Input is Chinese -> Translate to English.
2. If Input is English -> Translate to Chinese.

Mandatory Output Format for "translated" string (Markdown):

**简洁常用版（推荐）**
[The most direct and natural translation]

**地道英文**
[Alternative native expression (or Native Chinese if target is Chinese)]

**关键说明**
[Key grammar, vocabulary points, or nuances]

Output JSON format:
{
  "translated": "String containing the Headers above",
  "expansions": ["keyword1", "keyword2"]
}
`;

/* --- Fuzzy Matching Helpers --- */
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const getSimilarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
};

const normalizeText = (text: string) => {
  return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()？。，！\s]/g, "");
};

const LingoMemo: React.FC<LingoMemoProps> = ({ onBack, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'speak' | 'collect' | 'review'>('speak');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [currentLog, setCurrentLog] = useState<LingoLog | null>(null);
  const [logs, setLogs] = useState<LingoLog[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  
  // Direct Edit State
  const [cardOriginalText, setCardOriginalText] = useState('');
  
  // Review Session State
  const [sessionQueue, setSessionQueue] = useState<ReviewItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Audio Ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const savedLogs = localStorage.getItem('lingo_logs');
    const savedReviews = localStorage.getItem('lingo_reviews');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedReviews) setReviews(JSON.parse(savedReviews));
  }, []);

  useEffect(() => {
    if (currentLog) {
      setCardOriginalText(currentLog.original);
    }
  }, [currentLog]);

  useEffect(() => {
    localStorage.setItem('lingo_logs', JSON.stringify(logs));
    localStorage.setItem('lingo_reviews', JSON.stringify(reviews));
  }, [logs, reviews]);

  /* --- Logic: Speech (Optimized for Real-time Display) --- */
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      onShowToast("您的浏览器不支持语音识别");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false; // Stop after one sentence for faster interaction
    recognition.interimResults = true; // ⚡️ Enable real-time typing effect
    recognition.lang = 'zh-CN'; // Default

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // ⚡️ Sync input immediately for "typing" effect
      if (finalTranscript) {
        const cleanFinal = finalTranscript.trim();
        setInputText(cleanFinal);
        if (cleanFinal) {
           handleInputAnalysis(cleanFinal); // Trigger EXACTLY the same logic as text input
        }
      } else {
        setInputText(interimTranscript);
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  /* --- Logic: AI & Deduplication --- */
  const handleInputAnalysis = async (text: string) => {
    if (!text.trim()) return;
    
    const normalizedInput = normalizeText(text);

    // Skip deduplication check if it's extremely short to avoid false positives
    if (normalizedInput.length > 2) {
        const existingLogIndex = logs.findIndex(l => {
        const normalizedLog = normalizeText(l.original);
        return normalizedLog === normalizedInput || getSimilarity(normalizedLog, normalizedInput) > 0.8; 
        });

        if (existingLogIndex !== -1) {
        const existingLog = logs[existingLogIndex];
        const updatedLog = {
            ...existingLog,
            count: (existingLog.count || 1) + 1,
            timestamp: Date.now()
        };
        
        const newLogs = [...logs];
        newLogs.splice(existingLogIndex, 1);
        setLogs([updatedLog, ...newLogs]);
        setCurrentLog(updatedLog);
        setInputText('');
        onShowToast(`已存在，查询次数 +1`);
        return;
        }
    }

    handleAIAnalysis(text);
  };
  
  const handleAIAnalysis = async (text: string) => {
    setIsLoading(true);
    setCurrentLog(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: text,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });

      const result = JSON.parse(response.text || '{}');
      
      const newLog: LingoLog = {
        id: Date.now().toString(),
        original: text,
        translated: result.translated || "翻译失败，请重试",
        expansions: result.expansions || [],
        timestamp: Date.now(),
        count: 1
      };

      setCurrentLog(newLog);
      setLogs(prev => [newLog, ...prev]);

    } catch (error) {
      console.error(error);
      onShowToast("AI 服务繁忙，请重试");
    } finally {
      setIsLoading(false);
      setInputText('');
    }
  };

  /* --- Logic: Direct Edit on Card --- */
  const handleCardTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCardOriginalText(e.target.value);
  };

  const handleCardTextSubmit = () => {
    if (!currentLog) return;
    const cleanText = cardOriginalText.trim();
    
    if (cleanText && cleanText !== currentLog.original) {
      handleInputAnalysis(cleanText);
    } else {
      setCardOriginalText(currentLog.original);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  /* --- Logic: TTS --- */
  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // Simple heuristic: if text contains Chinese characters, use zh-CN, else en-US
    const isChinese = /[\u4e00-\u9fa5]/.test(text);
    utterance.lang = isChinese ? 'zh-CN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  /* --- Logic: SRS / Collection --- */
  const toggleCollection = (log: LingoLog) => {
    const existing = reviews.find(r => r.logId === log.id);
    if (existing) {
      setReviews(prev => prev.filter(r => r.logId !== log.id));
      onShowToast("已从复习本移除");
    } else {
      const newItem: ReviewItem = {
        id: Date.now().toString(),
        logId: log.id,
        stage: 0,
        nextReview: Date.now()
      };
      setReviews(prev => [...prev, newItem]);
      onShowToast("已加入复习计划");
    }
  };

  const startReviewSession = () => {
    const now = Date.now();
    const due = reviews
      .filter(r => r.nextReview <= now)
      .sort((a, b) => {
        const logA = logs.find(l => l.id === a.logId);
        const logB = logs.find(l => l.id === b.logId);
        const countA = logA?.count || 1;
        const countB = logB?.count || 1;
        
        if (countB !== countA) return countB - countA;
        return a.nextReview - b.nextReview;
      });

    setSessionQueue(due);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleReviewResult = (known: boolean) => {
    const currentItem = sessionQueue[currentCardIndex];
    if (!currentItem) return;

    const intervals = [1, 3, 7, 14, 30];
    let nextStage = currentItem.stage;
    
    if (known) {
      nextStage = Math.min(nextStage + 1, intervals.length - 1);
    } else {
      nextStage = 0;
    }

    const nextReviewTime = Date.now() + (intervals[nextStage] * 24 * 60 * 60 * 1000);
    
    setReviews(prev => prev.map(r => r.id === currentItem.id ? {
      ...r,
      stage: nextStage,
      nextReview: nextReviewTime
    } : r));

    if (currentCardIndex < sessionQueue.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentCardIndex(prev => prev + 1), 300);
    } else {
      setSessionQueue([]);
    }
  };

  const isBookmarked = (id: string) => reviews.some(r => r.logId === id);

  /* --- Render Helpers --- */
  // Strictly extracts the first section of text (Concise) for the Blue Card
  const getConciseContent = (text: string) => {
    const lines = text.split('\n');
    let content = [];
    let capture = false;
    let headerCount = 0;

    for (const line of lines) {
        const t = line.trim();
        // Start capturing at "Concise" or first header
        if (t.startsWith('**')) {
            headerCount++;
            if (headerCount > 1) break; // Stop as soon as we hit the second header
            capture = true; 
            continue;
        }
        if (capture && t) {
            content.push(t);
        }
    }
    
    // Fallback: if no headers found, return everything
    if (content.length === 0) {
        const firstPara = text.split('\n').find(l => l.trim().length > 0 && !l.trim().startsWith('**'));
        return firstPara || text;
    }
    return content.join(' ');
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;
      
      if (trimmed.startsWith('**')) {
        const title = trimmed.replace(/\*\*/g, '').replace(':', '');
        return (
          <div key={i} className="mt-4 first:mt-0 mb-2 flex items-center gap-2">
            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
            <h4 className="text-indigo-900 font-bold text-sm tracking-wide">{title}</h4>
          </div>
        );
      }
      return (
        <p 
          key={i} 
          className="text-slate-700 text-sm leading-relaxed mb-1 pl-3 cursor-pointer hover:text-indigo-600 transition-colors" 
          onClick={() => speakText(trimmed)}
        >
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#e5e5f7] flex items-center justify-center p-0 md:p-6 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-indigo-300/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-amber-200/40 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full h-full md:w-[420px] md:h-[85vh] bg-[#f5f2eb] md:rounded-[40px] shadow-2xl relative flex flex-col overflow-hidden border-[8px] border-white/50"
      >
        <div className="pt-6 pb-4 px-6 flex items-center justify-between bg-[#f5f2eb] z-20">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-semibold text-slate-800 tracking-tight flex items-center gap-2">
            LingoMemo
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          </span>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto pb-24 relative scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'speak' && (
              <motion.div 
                key="speak"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="px-6 min-h-full flex flex-col justify-end pb-6"
              >
                <div className="flex-1 flex flex-col justify-center gap-6 mb-8">
                  {!currentLog && !isLoading && (
                    <div className="text-center text-slate-400 mt-20">
                      <Sparkles size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Tap the mic to start learning</p>
                    </div>
                  )}

                  {currentLog && (
                    <>
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 relative group/card"
                      >
                        {currentLog.count && currentLog.count > 1 && (
                          <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Repeat size={10} />
                            x{currentLog.count}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => speakText(currentLog.original)} className="text-slate-400 hover:text-indigo-500">
                              <Volume2 size={16} />
                            </button>
                          </div>
                        </div>

                        <textarea
                          value={cardOriginalText}
                          onChange={handleCardTextChange}
                          onBlur={handleCardTextSubmit}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-transparent resize-none outline-none text-xl text-slate-800 font-medium placeholder-slate-300"
                          rows={Math.min(3, Math.max(1, Math.ceil(cardOriginalText.length / 20)))} 
                          placeholder="Type here..."
                        />
                      </motion.div>

                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-indigo-500 p-6 rounded-3xl shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <Sparkles size={64} />
                        </div>
                        <div className="relative z-10">
                           <p className="text-white/90 text-2xl leading-snug font-light">
                             {getConciseContent(currentLog.translated)}
                           </p>
                        </div>
                        
                        <div className="mt-6 flex flex-wrap gap-2">
                          {currentLog.expansions.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <button 
                          onClick={() => toggleCollection(currentLog)}
                          className={`absolute bottom-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all ${isBookmarked(currentLog.id) ? 'text-amber-300' : 'text-white'}`}
                        >
                          <Bookmark size={20} fill={isBookmarked(currentLog.id) ? "currentColor" : "none"} />
                        </button>
                      </motion.div>

                       <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/60 p-6 rounded-3xl border border-stone-100/50 backdrop-blur-sm"
                      >
                        {renderFormattedText(currentLog.translated)}
                      </motion.div>
                    </>
                  )}

                  {isLoading && (
                    <div className="w-full h-40 bg-white/50 rounded-3xl animate-pulse flex flex-col items-center justify-center text-indigo-400">
                      <div className="flex gap-2 mb-3">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}/>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}/>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}/>
                      </div>
                      <span className="text-xs font-bold tracking-widest uppercase opacity-60">AI Thinking...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
                    className="p-3 bg-white rounded-2xl shadow-sm text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    {inputMode === 'voice' ? <Keyboard size={20} /> : <Mic size={20} />}
                  </button>
                  
                  {inputMode === 'voice' ? (
                     <button
                      onClick={isListening ? stopListening : startListening}
                      className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg ${
                        isListening 
                          ? 'bg-amber-400 text-amber-900 shadow-amber-400/30' 
                          : 'bg-indigo-600 text-white shadow-indigo-500/30'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <div className="w-2 h-2 bg-amber-900 rounded-full animate-ping" />
                          {inputText || "Listening..."} 
                        </>
                      ) : (
                        <>
                          <Mic size={20} />
                          Tap to Speak
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 bg-white rounded-2xl shadow-sm flex items-center pr-2 pl-4 h-14 border border-transparent focus-within:border-indigo-500 transition-colors">
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInputAnalysis(inputText)}
                        placeholder="Type to translate..."
                        className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                      />
                      <button 
                        onClick={() => handleInputAnalysis(inputText)}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'collect' && (
              <motion.div 
                key="collect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 pt-4 space-y-4"
              >
                 <h3 className="text-xl font-bold text-slate-800 mb-6">Notebook ({logs.length})</h3>
                 {logs.length === 0 && (
                   <div className="text-center text-slate-400 mt-20">
                     <BookMarked size={48} className="mx-auto mb-4 opacity-20" />
                     <p>Your collection is empty.</p>
                   </div>
                 )}
                 {logs.map(log => (
                   <div key={log.id} className="bg-white/80 p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow relative group">
                      {log.count && log.count > 1 && (
                        <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold border-b border-l border-white">
                          已查 {log.count} 次
                        </div>
                      )}
                      
                      <p className="font-medium text-slate-800 mb-1 pr-8">{log.original}</p>
                      <p className="text-sm text-slate-500 line-clamp-2">{getConciseContent(log.translated)}</p>
                      
                      <div className="flex gap-2 mt-3">
                        {log.expansions.slice(0,3).map((t,i) => (
                           <span key={i} className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">{t}</span>
                        ))}
                      </div>

                      <button 
                         onClick={() => toggleCollection(log)}
                         className="absolute bottom-4 right-4 text-slate-300 hover:text-amber-400 transition-colors"
                      >
                         <Bookmark size={18} fill={isBookmarked(log.id) ? "#fbbf24" : "none"} className={isBookmarked(log.id) ? "text-amber-400" : ""} />
                      </button>
                   </div>
                 ))}
              </motion.div>
            )}

            {activeTab === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 pt-4 h-full flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-slate-800">Flashcards</h3>
                   <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                     Due: {reviews.filter(r => r.nextReview <= Date.now()).length}
                   </div>
                </div>

                {sessionQueue.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
                      {reviews.filter(r => r.nextReview <= Date.now()).length > 0 ? (
                        <>
                          <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-500">
                             <BrainCircuit size={48} />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Review?</h2>
                          <p className="text-slate-500 mb-8 max-w-[200px]">Priority given to frequent items.</p>
                          <button 
                            onClick={startReviewSession}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all"
                          >
                            Start Session
                          </button>
                        </>
                      ) : (
                        <>
                           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500">
                             <Check size={40} />
                          </div>
                          <h2 className="text-xl font-bold text-slate-800 mb-2">All Caught Up!</h2>
                          <p className="text-slate-500">Great job. Check back later.</p>
                        </>
                      )}
                   </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center pb-10 perspective-1000">
                    <div className="w-full relative aspect-[3/4] max-h-[400px]">
                      <motion.div
                        className="w-full h-full absolute preserve-3d cursor-pointer"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        onClick={() => setIsFlipped(!isFlipped)}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border-2 border-stone-100 flex flex-col items-center justify-center p-8 text-center">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tap to reveal</span>
                           <h2 className="text-3xl font-bold text-slate-800">
                             {logs.find(l => l.id === sessionQueue[currentCardIndex].logId)?.original}
                           </h2>
                           <div className="mt-8 flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i <= sessionQueue[currentCardIndex].stage ? 'bg-indigo-500' : 'bg-stone-200'}`} />
                              ))}
                           </div>
                        </div>

                        <div 
                          className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center text-white"
                          style={{ transform: 'rotateY(180deg)' }}
                        >
                           <div className="overflow-y-auto max-h-full scrollbar-hide w-full flex flex-col items-center justify-center">
                             <p className="text-xl font-medium mb-4 leading-relaxed">
                               {getConciseContent(logs.find(l => l.id === sessionQueue[currentCardIndex].logId)?.translated || "")}
                             </p>
                             <p className="text-sm opacity-80 italic mb-8">
                               {logs.find(l => l.id === sessionQueue[currentCardIndex].logId)?.expansions.join(', ')}
                             </p>
                           </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="flex gap-4 mt-8 w-full max-w-[300px]">
                       <button 
                         onClick={() => handleReviewResult(false)}
                         className="flex-1 py-4 rounded-2xl bg-white text-red-500 font-bold shadow-sm border border-red-50 hover:bg-red-50 transition-colors flex flex-col items-center"
                       >
                         <RotateCcw size={20} className="mb-1" />
                         <span className="text-xs">Forget</span>
                       </button>
                       <button 
                         onClick={() => handleReviewResult(true)}
                         className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors flex flex-col items-center"
                       >
                         <Check size={20} className="mb-1" />
                         <span className="text-xs">Known</span>
                       </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 font-medium tracking-widest">{currentCardIndex + 1} / {sessionQueue.length}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-2 flex justify-around items-center z-30">
          <TabButton active={activeTab === 'speak'} onClick={() => setActiveTab('speak')} icon={<Mic size={20} />} label="Speak" />
          <TabButton active={activeTab === 'collect'} onClick={() => setActiveTab('collect')} icon={<BookMarked size={20} />} label="Collect" />
          <TabButton active={activeTab === 'review'} onClick={() => setActiveTab('review')} icon={<BrainCircuit size={20} />} label="Review" />
        </div>
      </motion.div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default LingoMemo;