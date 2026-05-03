import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Bell, Lock, Moon, LogOut, ChevronRight, Globe, ShieldCheck, Heart, Info, XCircle, Instagram, Check, Monitor, Sun } from 'lucide-react';
import { logout, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/LanguageContext';
import { LanguageCode } from '../lib/translations';

const Settings = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { t, language: currentLang } = useTranslation();
  const [showAppearance, setShowAppearance] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Language logic based on country
  const getLanguages = () => {
    const country = profile?.country?.toLowerCase() || '';
    const base = [{ name: 'English', code: 'en' }];
    if (country.includes('india')) {
      return [...base, { name: 'Hindi', code: 'hi' }, { name: 'Bengali', code: 'bn' }, { name: 'Tamil', code: 'ta' }, { name: 'Telugu', code: 'te' }];
    }
    return base;
  };

  const updateLanguage = async (code: string) => {
    if (!user || updating) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        language: code,
        updatedAt: serverTimestamp()
      });
      setShowLanguage(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users/' + user.uid);
    } finally {
      setUpdating(false);
    }
  };

  const sections = [
    {
      title: t('preferences'),
      items: [
        { icon: User, label: t('profile_details'), sub: t('edit_account'), onClick: () => navigate('/profile') },
        { icon: Moon, label: t('appearance'), sub: t('theme_sub'), onClick: () => setShowAppearance(true) },
        { icon: Globe, label: t('app_language'), sub: t('select_language'), onClick: () => setShowLanguage(true) },
      ]
    },
    {
      title: t('experience'),
      items: [
        { icon: Info, label: t('about_us'), sub: t('founder_sub'), onClick: () => setShowAbout(true) },
        { icon: ShieldCheck, label: t('partner_access'), sub: t('manage_synced'), onClick: () => navigate('/couple') },
      ]
    }
  ];

  return (
    <div className="max-w-lg mx-auto p-8 space-y-12 pb-32">
      <header className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-[2.5rem] bg-white shadow-2xl shadow-rose-100 p-1.5 border border-rose-50 overflow-hidden mx-auto">
            <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="avatar" className="w-full h-full rounded-[2rem] object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-rose-400 rounded-2xl border-4 border-[#FFF9F9] flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={20} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-800">{profile?.displayName || t('wellness_user')}</h2>
        <p className="text-rose-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">{t('premium')}</p>
      </header>

      <div className="space-y-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-5">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] px-4">{section.title}</h3>
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-rose-100/30 border border-rose-50">
              {section.items.map((item, iIdx) => (
                <button
                  key={iIdx}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-5 p-6 hover:bg-rose-50/50 transition-colors ${
                    iIdx !== section.items.length - 1 ? 'border-b border-rose-50' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 shadow-sm">
                    <item.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-800 leading-tight">{item.label}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight size={20} className="text-rose-200" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => logout()}
          className="w-full h-16 bg-rose-50/50 text-rose-400 font-bold rounded-[24px] border border-rose-100 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-sm"
        >
          <LogOut size={20} strokeWidth={3} />
          {t('logout')}
        </button>
      </div>

      <AnimatePresence>
        {/* Appearance Modal */}
        {showAppearance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="bg-white rounded-[40px] w-full max-w-lg p-10 space-y-8 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{t('appearance')}</h3>
                <button onClick={() => setShowAppearance(false)} className="bg-gray-50 p-2 rounded-2xl text-gray-400"><XCircle size={24} /></button>
              </div>
              <div className="grid grid-cols-3 gap-4 pb-4">
                {[
                  { label: 'Light', icon: Sun },
                  { label: 'Dark', icon: Moon },
                  { label: 'System', icon: Monitor }
                ].map((mode) => (
                  <button key={mode.label} className="flex flex-col items-center gap-4 p-6 bg-rose-50/50 rounded-3xl border-2 border-transparent hover:border-rose-200 transition-all">
                    <mode.icon size={24} className="text-rose-400" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{mode.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Language Modal */}
        {showLanguage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="bg-white rounded-[40px] w-full max-w-lg p-10 space-y-8 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{t('app_language')}</h3>
                <button onClick={() => setShowLanguage(false)} className="bg-gray-50 p-2 rounded-2xl text-gray-400"><XCircle size={24} /></button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide pb-4">
                {getLanguages().map((lang) => (
                  <button 
                    key={lang.code} 
                    disabled={updating}
                    onClick={() => updateLanguage(lang.code)}
                    className={`w-full p-6 text-left bg-rose-50/50 hover:bg-rose-50 rounded-3xl border ${lang.code === currentLang ? 'border-rose-300' : 'border-rose-100'} flex items-center justify-between text-sm font-bold text-gray-700 transition-all`}
                  >
                    <span>{lang.name}</span>
                    {lang.code === currentLang && <Check size={18} className="text-rose-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* About Us Modal */}
        {showAbout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="bg-white rounded-[40px] w-full max-w-lg p-10 space-y-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{t('about_us')}</h3>
                <button onClick={() => setShowAbout(false)} className="bg-gray-50 p-2 rounded-2xl text-gray-400"><XCircle size={24} /></button>
              </div>
              <div className="space-y-6 text-sm text-gray-600 leading-relaxed font-medium">
                <p>Life Saviour is more than just a cycle tracker. It's a bridge of empathy and care between partners, designed to synchronize biological rhythms and emotional support in realtime.</p>
                
                <div className="bg-rose-50/50 p-8 rounded-[32px] border border-rose-100 space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-rose-50 overflow-hidden mb-4">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Founder" alt="founder" />
                  </div>
                  <h4 className="font-black text-rose-500 uppercase tracking-widest text-[10px]">The Founder</h4>
                  <p className="text-gray-800 font-bold text-lg">Aielot Pangyak</p>
                  <p className="opacity-70 italic text-xs">"Creating digital solutions that bring hearts closer."</p>
                  <div className="pt-4 flex gap-4">
                    <a href="https://www.instagram.com/aielot.mp4" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-rose-400 font-bold">
                      <Instagram size={18} />
                      <span className="text-xs uppercase tracking-widest">Connect on Instagram</span>
                    </a>
                  </div>
                </div>

                <p className="text-[10px] text-center opacity-40 uppercase tracking-[0.2em] pt-4">Designed with ❤️ for couples everywhere</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="text-center space-y-2 opacity-30">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">
          Life Saviour • v2.5.0
        </p>
      </div>
    </div>
  );
};

export default Settings;
