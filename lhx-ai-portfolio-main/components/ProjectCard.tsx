import React from 'react';
import { Project } from '../types';
import { motion } from 'framer-motion';
import { Copy, Github, ExternalLink, Sparkles, Video } from 'lucide-react'; // ✅ 仅新增一个图标

interface ProjectCardProps {
  project: Project;
  onCopyPrompt: (text: string) => void;
  onCopyGithub: (text: string) => void;
  onOpenGemini: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onCopyPrompt,
  onCopyGithub,
  onOpenGemini,
}) => {
  /* ✅ 新增：识别丢帧检测类型 */
  const isInteractive = project.type === 'interactive';
  const isVideoAnalyzer = project.type === 'video-analyzer';

  return (
    <motion.div
      whileHover={{ y: -12 }}
      transition={{ type: 'spring', stiffness: 260, damping: 25 }}
      className="group relative flex flex-col h-full bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[48px] overflow-hidden ios-shadow hover:ios-shadow-hover transition-all duration-700"
    >
      {/* 封面图 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F2F2F7]">
        <img
          src={project.coverImage}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-1000 ease-[0.23,1,0.32,1] group-hover:scale-105"
          loading="lazy"
        />
        {/* ✅ 徽章：interactive 保持原样，video-analyzer 新增 */}
        {(isInteractive || isVideoAnalyzer) && (
          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/50 ios-shadow-sm">
            {isInteractive ? (
              <>
                <Sparkles size={12} className="text-[#0071e3] fill-[#0071e3]" />
                <span className="text-[10px] font-bold tracking-widest text-[#1d1d1f] uppercase">AI Beta</span>
              </>
            ) : (
              <>
                <Video size={12} className="text-[#0071e3]" />
                <span className="text-[10px] font-bold tracking-widest text-[#1d1d1f] uppercase">Tool</span>
              </>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* 详情内容 */}
      <div className="p-10 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold mb-4 tracking-tight text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors duration-300">
          {project.name}
        </h3>
        <p className="text-base text-[#86868b] leading-relaxed mb-10 flex-grow font-light">
          {project.tagline}
        </p>

        {/* 按钮组 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onCopyPrompt(project.promptText)}
              className="flex items-center justify-center gap-2 py-4 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1d1d1f] rounded-[20px] text-[13px] font-semibold transition-all active:scale-95"
            >
              <Copy size={16} />
              Prompt
            </button>
            <button
              onClick={() => onCopyGithub(project.githubUrl)}
              className="flex items-center justify-center gap-2 py-4 bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1d1d1f] rounded-[20px] text-[13px] font-semibold transition-all active:scale-95"
            >
              <Github size={16} />
              GitHub
            </button>
          </div>

          {/* ✅ 主按钮：interactive / video-analyzer / 普通项目 三选一 */}
          <button
            onClick={() => onOpenGemini(project)}
            className={`w-full flex items-center justify-center gap-2 py-4.5 rounded-[22px] text-[13px] font-bold transition-all ios-shadow active:scale-95 ${
              isInteractive
                ? 'bg-gradient-to-r from-[#0071e3] to-[#40a9ff] text-white hover:brightness-110'
                : isVideoAnalyzer
                ? 'bg-gradient-to-r from-[#34d399] to-[#10b981] text-white hover:brightness-110' // 绿色渐变
                : 'bg-[#1d1d1f] text-white hover:bg-black'
            }`}
          >
            <ExternalLink size={16} />
            {isInteractive ? '立即在线体验' : isVideoAnalyzer ? '打开丢帧检测工具' : '获取项目链接'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;