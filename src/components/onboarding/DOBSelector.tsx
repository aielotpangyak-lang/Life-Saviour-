import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronDown, Check, X, AlertCircle } from 'lucide-react';
import { format, differenceInYears, setYear, setMonth, setDate as setDayOfMonth, getYear, getMonth, getDate } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DOBSelectorProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DOBSelector: React.FC<DOBSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date(2000, 0, 1));
  const [view, setView] = useState<'main' | 'year'>('main');

  const currentYear = getYear(new Date());
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleYearSelect = (year: number) => {
    const newDate = setYear(tempDate, year);
    setTempDate(newDate);
    setView('main');
  };

  const handleMonthSelect = (monthIdx: number) => {
    setTempDate(setMonth(tempDate, monthIdx));
  };

  const handleDaySelect = (day: number) => {
    setTempDate(setDayOfMonth(tempDate, day));
  };

  const confirm = () => {
    onChange(tempDate);
    setIsOpen(false);
  };

  const age = value ? differenceInYears(new Date(), value) : 0;

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setTempDate(value || new Date(2000, 0, 1));
          setIsOpen(true);
        }}
        className="w-full h-16 bg-white rounded-[24px] px-6 flex items-center justify-between shadow-xl shadow-rose-100/30 border-2 border-rose-50 text-xl font-bold text-gray-800 transition-all hover:border-rose-200"
      >
        <div className="flex items-center gap-4">
          <CalendarIcon className="text-rose-300" size={24} />
          <span>{value ? format(value, 'MMMM do, yyyy') : 'Select Birthday'}</span>
        </div>
        {value && (
          <div className="bg-rose-50 text-rose-500 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
            {age} yrs
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 pb-6 text-center border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                   <div className="w-10 h-10" /> {/* Spacer */}
                   <div className="bg-rose-50 px-4 py-1 rounded-full">
                     <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Birth Context</span>
                   </div>
                   <button 
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"
                  >
                    <X size={18} />
                  </button>
                </div>
                <h3 className="text-2xl font-black text-gray-800">
                  {format(tempDate, 'MMM do, yyyy')}
                </h3>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mt-1">
                  Estimated Age: {differenceInYears(new Date(), tempDate)} years
                </p>
              </div>

              {/* Selector Content */}
              <div className="p-6">
                {view === 'main' ? (
                  <div className="space-y-8">
                    {/* Year Quick Selection */}
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-2">Year of Birth</label>
                       <button
                         onClick={() => setView('year')}
                         className="w-full h-14 bg-gray-50 rounded-2xl px-6 flex items-center justify-between text-lg font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                       >
                         {getYear(tempDate)}
                         <ChevronDown size={20} />
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Month Column */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Month</label>
                        <div className="h-48 overflow-y-auto no-scrollbar space-y-1 bg-gray-50/50 p-2 rounded-2xl">
                          {months.map((m, idx) => (
                            <button
                              key={m}
                              onClick={() => handleMonthSelect(idx)}
                              className={cn(
                                "w-full py-3 px-4 rounded-xl text-xs font-bold transition-all text-left",
                                getMonth(tempDate) === idx ? "bg-white text-rose-500 shadow-sm" : "text-gray-400 hover:text-gray-600"
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Day Column */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Day</label>
                        <div className="h-48 overflow-y-auto no-scrollbar grid grid-cols-3 gap-1 bg-gray-50/50 p-2 rounded-2xl">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <button
                              key={d}
                              onClick={() => handleDaySelect(d)}
                              className={cn(
                                "aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all",
                                getDate(tempDate) === d ? "bg-rose-400 text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                              )}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-2">Quick Year Select</label>
                      <button onClick={() => setView('main')} className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] px-2 py-1 bg-rose-50 rounded-lg">Back</button>
                    </div>
                    <div className="h-64 overflow-y-auto no-scrollbar grid grid-cols-3 gap-2 p-2">
                      {years.map((year) => (
                        <button
                          key={year}
                          onClick={() => handleYearSelect(year)}
                          className={cn(
                            "py-3 rounded-xl text-sm font-bold transition-all",
                            getYear(tempDate) === year ? "bg-rose-400 text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-10 mb-4 px-2">
                  <button
                    onClick={confirm}
                    className="w-full py-5 bg-rose-400 text-white font-black rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs"
                  >
                    Set Birthday
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-rose-300">
                  <AlertCircle size={12} />
                  <p className="text-[9px] font-bold uppercase tracking-widest">Tap the year to jump fast</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DOBSelector;
