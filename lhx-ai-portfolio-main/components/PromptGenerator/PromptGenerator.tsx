import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Video, 
  Image as ImageIcon, 
  Code, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Copy, 
  ArrowLeft,
  Wand2,
  FileText,
  Activity,
  Layers,
  Terminal
} from 'lucide-react';

type AnalysisMode = 'video' | 'image' | 'code';
type ProcessingStatus = 'idle' | 'extracting' | 'analyzing' | 'preview' | 'generating' | 'completed';

interface PromptGeneratorProps {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ onBack, onShowToast }) => {
  const [mode, setMode] = useState<AnalysisMode>('video');
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [customReq, setCustomReq] = useState('');
  
  // 模拟诊断数据
  const [features, setFeatures] = useState([
    { id: 1, text: '响应式侧边导航', enabled: true },
    { id: 2, text: '动态实时图表组件', enabled: true },
    { id: 3, text: 'Auth 登录验证逻辑', enabled: true }
  ]);

  const [noises, setNoises] = useState([
    { id: 1, text: 'iOS 系统电量栏', enabled: true },
    { id: 2, text: '底部悬浮占位广告', enabled: true }
  ]);

  const handleStartAnalysis = () => {
    setStatus('extracting');
    setTimeout(() => setStatus('analyzing'), 1200);
    setTimeout(() => setStatus('preview'), 2500);
  };

  const handleGenerate = () => {
    setStatus('generating');
    setTimeout(() => setStatus('completed'), 2000);
  };

  const finalPrompt = `# System Prompt: AI 辅助开发指令

## 核心功能要求
${features.filter(f => f.enabled).map(f => `- ${f.text}`).join('\n')}

## 视觉与工程规范
- 过滤干扰：${noises.filter(n => n.enabled).map(n => n.text).join(', ')}
- 开发框架：React 19 + Tailwind CSS
- 设计语言：Google Material 3 (Gemini 风格)

## 补充需求
${customReq || '按最佳实践实现'}

## 交付物
请输出高可用的 React 组件代码，包含 framer-motion 动效。`;

  return (
    <div className="relative min-h-screen bg-white overflow-hidden text-[#1d1d1f]">
      {/* 1. 装饰性动态背景 (Decorative Background) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] bg-[#4285F4]/5 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 20, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-[10%] -right-[5%] w-[60%] h-[60%] bg-[#EA4335]/5 rounded-full blur-[120px]"
        />
        
        {/* Floating Code Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <FloatingElement top="20%" left="5%" delay={0} icon={<Terminal size={24} />} />
          <FloatingElement top="65%" left="12%" delay={2} icon={<Code size={24} />} />
          <FloatingElement top="15%" right="10%" delay={4} icon={<Layers size={24} />} />
        </div>
      </div>

      {/* 2. Header with Logo */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-black/5 glass shadow-sm">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors px-4 py-2 rounded-xl hover:bg-black/5"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-bold">返回作品集</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#4285F4]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#34A853]" />
          </div>
          <span className="font-bold text-base tracking-tighter">Gemini Prompt Generator</span>
        </div>
      </nav>

      {/* 3. Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        {/* Step Indicator */}
        <div className="flex justify-center mb-16">
          <div className="flex items-center w-full max-w-lg">
            <Step circle active={status === 'idle' || status === 'extracting'} done={status !== 'idle' && status !== 'extracting'} label="上传资源" />
            <StepLine active={status !== 'idle' && status !== 'extracting'} />
            <Step circle active={status === 'preview' || status === 'generating'} done={status === 'completed'} label="诊断清单" />
            <StepLine active={status === 'completed'} />
            <Step circle active={status === 'completed'} done={false} label="生成指令" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Upload (Select) */}
          {status === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
              className="glass border border-white/80 rounded-[40px] p-10 shadow-2xl shadow-blue-500/5"
            >
              <div className="flex bg-gray-100/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto">
                <ModeTab active={mode === 'video'} onClick={() => setMode('video')} icon={<Video size={16} />} label="录屏分析" />
                <ModeTab active={mode === 'image'} onClick={() => setMode('image')} icon={<ImageIcon size={16} />} label="截图识别" />
                <ModeTab active={mode === 'code'} onClick={() => setMode('code')} icon={<Code size={16} />} label="代码重构" />
              </div>

              <div 
                onClick={handleStartAnalysis}
                className="group relative border-2 border-dashed border-gray-200 hover:border-[#4285F4] transition-all cursor-pointer rounded-[32px] p-24 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/30 overflow-hidden"
              >
                <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-[#4285F4] mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-2">点击上传 (点击此处模拟)</h3>
                <p className="text-gray-400 text-sm">支持 MP4, MOV, PNG, JPG (最大 50MB)</p>
              </div>
            </motion.div>
          )}

          {/* Processing States */}
          {(status === 'extracting' || status === 'analyzing' || status === 'generating') && (
            <motion.div key="processing" className="flex flex-col items-center py-20">
              <GoogleLoader />
              <p className="mt-10 text-lg font-bold animate-pulse">
                {status === 'extracting' ? '正在提取关键帧...' : status === 'analyzing' ? 'Gemini 正在识别核心逻辑...' : '正在编写系统级 Prompt...'}
              </p>
              <p className="text-gray-400 text-sm mt-2">基于 Gemini 1.5 Pro 多模态分析引擎</p>
            </motion.div>
          )}

          {/* Step 2: Diagnosis (Preview) */}
          {status === 'preview' && (
            <motion.div key="preview" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DiagnosisCard title="识别到核心功能" icon={<CheckCircle2 size={16} className="text-[#34A853]" />}>
                  {features.map(f => (
                    <ToggleItem key={f.id} text={f.text} enabled={f.enabled} onToggle={() => setFeatures(prev => prev.map(item => item.id === f.id ? {...item, enabled: !item.enabled} : item))} color="#34A853" />
                  ))}
                </DiagnosisCard>
                <DiagnosisCard title="过滤视觉噪音" icon={<XCircle size={16} className="text-[#EA4335]" />}>
                  {noises.map(n => (
                    <ToggleItem key={n.id} text={n.text} enabled={n.enabled} onToggle={() => setNoises(prev => prev.map(item => item.id === n.id ? {...item, enabled: !item.enabled} : item))} color="#EA4335" />
                  ))}
                </DiagnosisCard>
              </div>

              <div className="glass p-8 rounded-[32px] border border-white/80">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Sparkles size={16} className="text-[#FBBC05]" />
                    补充需求
                  </label>
                  <button className="text-[10px] font-black text-[#4285F4] uppercase tracking-widest flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full">
                    <Wand2 size={12} /> AI 润色
                  </button>
                </div>
                <textarea 
                  value={customReq}
                  onChange={(e) => setCustomReq(e.target.value)}
                  placeholder="例如：请使用 Tailwind CSS 实现，并确保适配 iPhone 灵动岛交互..."
                  className="w-full h-32 bg-gray-100/30 border border-gray-100 rounded-2xl p-5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                />
              </div>

              <button 
                onClick={handleGenerate}
                className="w-full py-6 bg-[#4285F4] text-white rounded-[24px] font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                确认并生成 Prompt
                <Sparkles size={20} className="fill-white/20" />
              </button>
            </motion.div>
          )}

          {/* Step 3: Result (Result) */}
          {status === 'completed' && (
            <motion.div key="completed" className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#34A853]/10 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-[#34A853]" />
                  </div>
                  生成成功
                </h2>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(finalPrompt);
                    onShowToast('提示词已复制到剪贴板');
                  }}
                  className="flex items-center gap-2 bg-[#4285F4] text-white font-bold px-6 py-3 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-500/10"
                >
                  <Copy size={18} /> 一键复制
                </button>
              </div>

              <div className="bg-[#1d1d1f] text-gray-300 p-10 rounded-[40px] font-mono text-sm leading-relaxed overflow-x-auto shadow-2xl border border-white/5">
                <pre className="whitespace-pre-wrap">{finalPrompt}</pre>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-10 py-4 border border-gray-200 rounded-full font-bold text-gray-400 hover:text-black hover:border-black transition-all"
                >
                  处理下一个项目
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

// --- 子组件 ---

const FloatingElement = ({ top, left, right, delay, icon }: any) => (
  <motion.div 
    animate={{ y: [0, -40, 0], rotate: [0, 10, 0] }}
    transition={{ duration: 10, repeat: Infinity, delay }}
    style={{ top, left, right }}
    className="absolute glass p-5 rounded-3xl border border-white shadow-xl"
  >
    {icon}
  </motion.div>
);

const Step = ({ active, done, label, circle }: any) => (
  <div className="flex flex-col items-center gap-3 relative z-10 min-w-[80px]">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
      done ? 'bg-[#34A853] border-[#34A853] text-white' : active ? 'border-[#4285F4] text-[#4285F4] bg-white shadow-lg' : 'border-gray-100 text-gray-300 bg-gray-50'
    }`}>
      {done ? <CheckCircle2 size={24} /> : <div className={`w-2 h-2 rounded-full ${active ? 'bg-[#4285F4]' : 'bg-gray-200'}`} />}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-widest ${active || done ? 'text-black' : 'text-gray-300'}`}>{label}</span>
  </div>
);

const StepLine = ({ active }: { active: boolean }) => (
  <div className="flex-1 h-0.5 bg-gray-100 mx-2 relative overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: active ? '100%' : '0%' }}
      className="absolute inset-0 bg-[#4285F4]"
    />
  </div>
);

const ModeTab = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs ${
      active ? 'bg-white text-black shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {icon} {label}
  </button>
);

const DiagnosisCard = ({ title, children, icon }: any) => (
  <div className="glass p-7 rounded-[32px] border border-white/80 shadow-sm">
    <div className="flex items-center gap-2 mb-6">
      {icon}
      <h3 className="text-sm font-bold tracking-tight">{title}</h3>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const ToggleItem = ({ text, enabled, onToggle, color }: any) => (
  <div 
    onClick={onToggle}
    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
      enabled ? 'bg-white border-black/5' : 'opacity-40 grayscale border-transparent'
    }`}
  >
    <span className={`text-sm font-semibold ${enabled ? 'text-black' : 'text-gray-400 line-through'}`}>{text}</span>
    <div 
      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all`}
      style={{ backgroundColor: enabled ? `${color}20` : '#f1f1f1' }}
    >
      {enabled && <div className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: color }} />}
    </div>
  </div>
);

const GoogleLoader = () => (
  <div className="relative w-20 h-20">
    <motion.svg className="w-full h-full" viewBox="0 0 100 100">
      <motion.circle 
        cx="50" cy="50" r="45" 
        fill="none" 
        strokeWidth="6" 
        strokeDasharray="80 200"
        strokeLinecap="round"
        className="stroke-[#4285F4]"
        animate={{ rotate: 360, stroke: ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#4285F4"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </motion.svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-white shadow-sm animate-pulse" />
    </div>
  </div>
);

export default PromptGenerator;