import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Check, Globe, X } from 'lucide-react';
import countriesData from 'country-flag-emoji-json';

interface Country {
  name: string;
  code: string;
  emoji: string;
}

interface CountrySelectorProps {
  value: string;
  onChange: (countryName: string) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter out duplicates and format correctly
  const allCountries = useMemo(() => {
    return (countriesData as any[]).map(c => ({
      name: c.name,
      code: c.code,
      emoji: c.emoji
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredCountries = useMemo(() => {
    if (!search) return allCountries;
    return allCountries.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [allCountries, search]);

  const selectedCountry = allCountries.find(c => c.name === value);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full h-16 bg-white rounded-[24px] px-6 flex items-center justify-between shadow-xl shadow-rose-100/30 border-2 border-rose-50 text-lg font-bold text-gray-800 transition-all hover:border-rose-200"
      >
        <div className="flex items-center gap-4">
          {selectedCountry ? (
            <>
              <span className="text-2xl">{selectedCountry.emoji}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <>
              <Globe className="text-rose-300" size={24} />
              <span className="text-gray-300">Select your country</span>
            </>
          )}
        </div>
        <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-400 font-black text-[10px]">
          {selectedCountry ? selectedCountry.code : '?'}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[40px] h-[85vh] sm:h-[70vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-8 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Global Citizen</h3>
                  <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mt-1">Select your home</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="px-8 pb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-14 bg-gray-50 rounded-2xl pl-12 pr-4 text-sm font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-rose-50 outline-none border border-transparent focus:border-rose-100 transition-all"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar">
                {filteredCountries.length > 0 ? (
                  <div className="space-y-2">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          onChange(c.name);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                          value === c.name 
                          ? 'bg-rose-50 text-rose-500 scale-[0.98]' 
                          : 'hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="text-2xl w-10 flex justify-center">{c.emoji}</span>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-sm">{c.name}</p>
                          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{c.code}</p>
                        </div>
                        {value === c.name && (
                          <div className="w-6 h-6 bg-rose-400 rounded-full flex items-center justify-center text-white">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center text-gray-200">
                      <Globe size={40} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-400">No country found</p>
                      <p className="text-xs text-gray-300 font-medium mt-1">Try another search term</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountrySelector;
