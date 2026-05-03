import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 48, showText = false, className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        style={{ width: size, height: size }} 
        className="relative flex items-center justify-center bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl shadow-lg shadow-rose-200 overflow-hidden"
      >
        {/* Abstract "Bone" / Connection Shape */}
        <svg 
          viewBox="0 0 100 100" 
          width="70%" 
          height="70%" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M30 50 Q 50 20 70 50 T 30 50" 
            stroke="white" 
            strokeWidth="8" 
            strokeLinecap="round" 
            className="opacity-40"
          />
          <path 
            d="M30 50 Q 50 80 70 50 T 30 50" 
            stroke="white" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
          <circle cx="30" cy="50" r="6" fill="white" />
          <circle cx="70" cy="50" r="6" fill="white" />
        </svg>
        
        {/* Subtle decorative dot */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-white/40 rounded-full" />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-black text-gray-800 uppercase tracking-tighter leading-none">Lunar</span>
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Sync</span>
        </div>
      )}
    </div>
  );
};
