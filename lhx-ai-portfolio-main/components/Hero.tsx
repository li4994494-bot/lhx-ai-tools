import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden px-6 pt-12">
      {/* 动态呼吸感背景 */}
      <div className="absolute inset-0 -z-10 bg-[#FBFBFD]">
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-[#E5D5C6]/40 rounded-full blur-[140px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#D6E4E5]/30 rounded-full blur-[120px]"
        />
      </div>

      {/* 核心文案卡片 */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-4xl w-full glass ios-shadow p-12 md:p-24 rounded-[48px] md:rounded-[64px] border border-white/60 z-10"
      >
        <div className="space-y-12">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-3xl md:text-5xl font-medium leading-[1.4] text-[#1d1d1f] tracking-tight"
          >
            Hi there，我是 <span className="text-apple-blue">lhx</span>。很开心能和你分享我做的小工具，希望可以帮助到你。
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-xl md:text-2xl font-light text-apple-gray leading-relaxed"
          >
            Last but not least，希望你有美好的一天。
          </motion.p>
        </div>
      </motion.div>

      {/* 滚动提示 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 flex flex-col items-center gap-3 text-apple-gray"
      >
        <span className="text-[10px] uppercase tracking-[0.5em] font-semibold opacity-40">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;