import React from 'react';
import { NavLink } from 'react-router-dom';
import { Coffee, History, Home, Heart, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const navItems = [
    { to: '/coffee', icon: Coffee, label: 'Treat me' },
    { to: '/histories', icon: History, label: 'Histories' },
    { to: '/', icon: Home, label: 'Home' },
    { to: '/couple', icon: Heart, label: 'Couple' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-rose-100 px-4 pb-safe shadow-[0_-4px_20px_0_rgba(251,113,133,0.05)]">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300",
                isActive ? "bg-rose-50 text-rose-500 shadow-sm" : "text-gray-400 hover:text-rose-400"
              )
            }
          >
            <Icon size={22} strokeWidth={2.5} />
            <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
