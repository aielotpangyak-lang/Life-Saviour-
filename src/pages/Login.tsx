import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-8 bg-[#FFF9F9]">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-rose-100 mx-auto mb-10 border border-rose-50">
            <span className="text-rose-400 text-3xl font-bold">LS</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Welcome</h1>
          <p className="text-rose-400 font-bold tracking-[0.2em] text-[10px] uppercase mb-1">Life Saviour</p>
          <p className="text-gray-400 font-medium italic">Your intelligent cycle companion</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <button
            onClick={handleGoogleSignIn}
            className="w-full h-16 bg-white text-gray-700 font-bold rounded-[24px] flex items-center justify-center gap-4 shadow-xl shadow-rose-100/50 border border-rose-50 hover:bg-rose-50/30 transition-all active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Continue with Google
          </button>
          
          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rose-100/50"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-[#FFF9F9] px-4 text-rose-200">Secure & Encrypted</span>
            </div>
          </div>

          <button
            onClick={() => {}}
            className="w-full h-16 bg-rose-400 text-white font-bold rounded-[24px] flex items-center justify-center shadow-2xl shadow-rose-200 transition-all active:scale-95"
          >
            Create Private Account
          </button>
        </motion.div>
      </div>

      <p className="text-center text-[10px] font-bold text-rose-200 mt-12 uppercase tracking-[0.2em]">
        Privacy First • Couple Focused
      </p>
    </div>
  );
};

export default Login;
