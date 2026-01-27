
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onCopy: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, content, onCopy }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          />
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-md glass z-[60] rounded-t-[32px] md:rounded-[24px] overflow-hidden ios-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-6">
                <p className="text-sm text-gray-600 break-all line-clamp-3 leading-relaxed">
                  {content}
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={onCopy}
                  className="w-full py-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                >
                  <Copy size={18} />
                  复制分享链接
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-transparent text-gray-500 hover:text-gray-800 rounded-2xl font-medium transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
            {/* Safe area for mobile */}
            <div className="h-4 md:hidden" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
