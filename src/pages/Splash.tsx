import React from 'react';
import { motion } from 'motion/react';

export const Splash = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FFF9F9] p-8 text-center uppercase tracking-widest">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "circOut" }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-rose-400 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 mx-auto">
          <span className="text-white text-3xl font-bold">LS</span>
        </div>
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-gray-800 mb-2"
      >
        Life Saviour
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-rose-300 text-[10px] font-bold"
      >
        Your Private Sanctuary
      </motion.p>
    </div>
  );
};

export default Splash;
