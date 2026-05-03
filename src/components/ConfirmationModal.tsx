import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Check } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl relative"
          >
             <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium mb-8 px-4">
                {message}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className="w-full py-4 bg-rose-400 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Check size={18} strokeWidth={3} />
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl border border-gray-100 active:scale-[0.98] transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
