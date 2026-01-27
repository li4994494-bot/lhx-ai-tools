import React, { useState, useCallback, useEffect } from 'react';
import Hero from './components/Hero';
import ProjectCard from './components/ProjectCard';
import Toast from './components/Toast';
import Modal from './components/Modal';
import PromptGenerator from './components/PromptGenerator/PromptGenerator';
import VideoAnalyzer from './components/VideoAnalyzer';   // ✅ 新增
import { projects as initialProjects } from './data/projects';
import { Project, ViewMode } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [items, setItems] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('home');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  /* ---------- 丢帧检测独立状态 ---------- */
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(initialProjects);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (text === '#' || !text) {
        showToast('内容正在准备中...');
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板');
    } catch {
      showToast('复制失败，请重试');
    }
  }, []);

  /* ---------- 统一处理项目卡片点击 ---------- */
  const handleProjectAction = (project: Project) => {
    /* 1. 丢帧检测入口 */
    if (project.type === 'video-analyzer') {
      setIsAnalyzerOpen(true);
      return;
    }
    /* 2. Prompt 生成器入口（保持原逻辑） */
    if (project.type === 'interactive') {
      if (project.id === 'prompt-generator') {
        window.scrollTo({ top: 0, behavior: 'instant' });
        setView('prompt-generator');
      } else {
        showToast('该交互项目正在部署中...');
      }
      return;
    }
    /* 3. Gemini 分享链接 */
    if (project.geminiShareUrl === '#' || !project.geminiShareUrl) {
      showToast('该项目暂未开放分享');
      return;
    }
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#FBFBFD] selection:bg-apple-blue/10 selection:text-apple-blue overflow-x-hidden">
      {/* 全局轻提示 */}
      <Toast
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />

      {/* Gemini 分享弹窗（保持原样） */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="项目分享链接"
        content={selectedProject?.geminiShareUrl || ''}
        onCopy={() => {
          if (selectedProject) copyToClipboard(selectedProject.geminiShareUrl);
        }}
      />

      {/* 丢帧检测弹窗（新增） */}
      <VideoAnalyzer
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
      />

      <AnimatePresence mode="wait">
        {view === 'home' ? (
          <motion.div
            key="home-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* 顶栏、Hero、项目网格、页脚完全保持原样 */}
            <nav className="fixed top-0 left-0 w-full glass z-40 border-b border-black/5">
              <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl ios-shadow overflow-hidden bg-white border border-white/50 p-0.5">
                    <img
                      src="https://i.postimg.cc/c1Kt6vWX/BE89C50B-8C90-4F77-9240-A3A08DC69C1C.png"
                      alt="lhx Logo"
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                  </div>
                  <span className="font-semibold text-lg tracking-tight text-apple-dark">lhx.AI</span>
                </motion.div>

                <div className="hidden sm:flex gap-8 items-center text-sm font-medium">
                  <a href="#projects" className="text-apple-gray hover:text-apple-dark transition-colors">我的作品</a>
                  <div className="w-px h-4 bg-black/10"></div>
                  <div className="text-[10px] font-bold text-apple-blue bg-apple-blue/5 px-3 py-1 rounded-full uppercase tracking-widest border border-apple-blue/10">
                    PRO VERSION
                  </div>
                </div>
              </div>
            </nav>

            <Hero />

            <section id="projects" className="max-w-7xl mx-auto px-6 py-32">
              <div className="mb-24">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-5xl font-semibold tracking-tight text-apple-dark mb-6"
                >
                  AI 工具
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-apple-gray text-xl font-light max-w-2xl leading-relaxed"
                >
                  探索 AI 与人类交互的无限可能，打造更直观的智能工具。
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-[4/3] rounded-[48px] bg-white border border-black/5 animate-pulse" />
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map((project, index) => (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, duration: 0.8 }}
                      >
                        <ProjectCard
                          project={project}
                          onCopyPrompt={copyToClipboard}
                          onCopyGithub={copyToClipboard}
                          onOpenGemini={handleProjectAction}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </section>

            <footer className="py-24 border-t border-black/5 bg-white/50">
              <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                <div>
                  <div className="text-2xl font-bold mb-3 tracking-tighter text-apple-dark">lhx.AI</div>
                  <p className="text-apple-gray text-sm font-light italic">"追求极致简洁，定义未来体验。"</p>
                </div>
                <div className="flex gap-10 text-sm font-medium text-apple-gray">
                  <a href="#" className="hover:text-apple-blue transition-colors">GitHub</a>
                  <a href="#" className="hover:text-apple-blue transition-colors">Twitter</a>
                  <a href="#" className="hover:text-apple-blue transition-colors">Contact</a>
                </div>
              </div>
              <div className="text-center mt-20 text-[10px] text-apple-gray/30 uppercase tracking-[0.4em] font-medium">
                &copy; 2025 LHX &bull; DESIGNED FOR THE FUTURE
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="tool-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            <PromptGenerator
              onBack={() => setView('home')}
              onShowToast={showToast}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;