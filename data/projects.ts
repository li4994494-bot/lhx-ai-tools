import { Project } from '../types';

export const projects: Project[] = [
  {
    id: '1',
    name: 'video-analyzer',
    tagline: '视频丢帧检测',
    coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800&h=600',
    promptText: 'Future interactive app prompt...',
    githubUrl: '#',
    geminiShareUrl: '#',
    type: 'video-analyzer'
  },
  {
    id: 'prompt-generator',
    name: 'Gemini Prompt 生成器',
    tagline: 'Senior AI 提效工具。上传产品录屏或截图，由 Gemini 自动识别核心逻辑、过滤干扰噪音并生成专业的系统提示词。',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&h=600',
    promptText: 'You are an expert AI Prompt Engineer specialized in UI-to-Code generation...',
    githubUrl: 'https://github.com/lhx/gemini-prompt-gen',
    geminiShareUrl: 'https://aistudio.google.com/app/prompts/example-1',
    type: 'interactive'
  },
  {
    id: '3',
    name: 'Visionary Prompts',
    tagline: '创意增幅器。将模糊的念头转化为极具张力的绘图指令，让 AI 更好地理解你的想象。',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800&h=600',
    promptText: 'Expand the user input "cyberpunk cat" into a detailed prompt with lighting...',
    githubUrl: 'https://github.com/lhx/prompt-gen',
    geminiShareUrl: 'https://aistudio.google.com/app/prompts/example-3',
    type: 'static'
  },
  {
    id: '4',
    name: 'EchoFlow Voice',
    tagline: '实时共鸣。利用 Gemini Live API 打造的低延迟语音助手，探索最自然的交互边界。',
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800&h=600',
    promptText: 'You are a friendly companion assistant. Keep responses short and conversational...',
    githubUrl: 'https://github.com/lhx/voice-comp',
    geminiShareUrl: 'https://aistudio.google.com/app/prompts/example-4',
    type: 'static'
  },
  {
    id: 'lingo-memo',
    name: 'LingoMemo 灵感笔记',
    tagline: '语音优先的 AI 语言伴侣。结合实时翻译与 SRS 间隔重复记忆系统，打造最具手感的语言学习体验。',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800&h=600',
    promptText: 'Analyze this phrase for language learners...',
    githubUrl: '#',
    geminiShareUrl: '#',
    type: 'lingo-memo'
  },
  {
    id: '5',
    name: 'CodeCraft Bot',
    tagline: '性能先锋。自动识别代码中的技术债与性能瓶颈，为你提供优雅的重构建议。',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=600',
    promptText: 'Review this React code for potential memory leaks and performance anti-patterns...',
    githubUrl: 'https://github.com/lhx/code-reviewer',
    geminiShareUrl: 'https://aistudio.google.com/app/prompts/example-5',
    type: 'static'
  }
];