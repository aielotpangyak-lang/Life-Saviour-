import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageCircleHeart, Heart, Users, History, Activity, Calendar, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { format, differenceInDays, addDays } from 'date-fns';
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import FeatureTour from '../components/FeatureTour';

import { useTranslation } from '../lib/LanguageContext';

const Home = () => {
  const { profile, user } = useAuth();
  const { t } = useTranslation();
  const [todayLog, setTodayLog] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [relationship, setRelationship] = useState<any>(null);
  const [showSupportToast, setShowSupportToast] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Check tour status
  useEffect(() => {
    const tourStatus = localStorage.getItem('life_saviour_tour');
    if (!tourStatus && user) {
      setTimeout(() => setShowTour(true), 1000);
    }
  }, [user]);

  const completeTour = () => {
    localStorage.setItem('life_saviour_tour', 'completed');
    setShowTour(false);
  };

  // Listen to partner profile if exists
  useEffect(() => {
    if (profile?.partnerId) {
      const unsub = onSnapshot(doc(db, 'users', profile.partnerId), (doc) => {
        if (doc.exists()) {
          setPartnerProfile(doc.data());
        }
      });
      return () => unsub();
    } else {
      setPartnerProfile(null);
    }
  }, [profile?.partnerId]);

  // Use either own settings or tracker's settings if we are a supporter
  const isFemale = profile?.gender === 'female';
  const cycleSettings = profile?.cycleSettings || {};
  const setupCompleted = !!cycleSettings.lastPeriodDate;

  const displaySettings = (isFemale ? profile?.cycleSettings : partnerProfile?.cycleSettings) || profile?.cycleSettings || {
    avgCycleDays: 28,
    avgPeriodDays: 5,
    lastPeriodDate: null,
    isPeriodActive: false,
    periodStartDate: null
  };

  const hasData = !!displaySettings.lastPeriodDate;
  const lastPeriodDate = hasData ? new Date(displaySettings.lastPeriodDate) : new Date();
  const daysSinceLast = differenceInDays(new Date(), lastPeriodDate);
  const nextPeriodDate = addDays(lastPeriodDate, displaySettings.avgCycleDays || 28);
  const daysUntilNext = differenceInDays(nextPeriodDate, new Date());

  const [isLoggingPeriod, setIsLoggingPeriod] = useState(false);
  const [isStoppingPeriod, setIsStoppingPeriod] = useState(false);
  const [selectedPeriodDate, setSelectedPeriodDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEndDate, setSelectedEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [elapsed, setElapsed] = useState({ d: 0, h: 0, m: 0, s: 0 });

  // Listen to today's log for insights
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const relationshipId = profile?.relationshipId;
    const logId = relationshipId ? `${relationshipId}_${today}` : `${user.uid}_${today}`;
    
    const unsub = onSnapshot(doc(db, 'dailyLogs', logId), (snap) => {
      if (snap.exists()) {
        setTodayLog(snap.data());
      } else {
        setTodayLog(null);
      }
    });
    return () => unsub();
  }, [user, profile?.relationshipId]);

  const handleLogPeriod = async () => {
    if (!user) return;
    try {
      const targetUserId = isFemale ? user.uid : profile?.partnerId;
      if (!targetUserId) {
        if (!isFemale) alert("Please link with your partner first to track their cycle.");
        return;
      }

      const updatesByPath = {
        'cycleSettings.lastPeriodDate': selectedPeriodDate,
        'cycleSettings.isPeriodActive': true,
        'cycleSettings.periodStartDate': selectedPeriodDate,
        'cycleSettings.isUncertain': false,
        'cycleSettings.updatedAt': serverTimestamp()
      };

      await updateDoc(doc(db, 'users', targetUserId), updatesByPath);
      
      if (profile?.relationshipId) {
        await updateDoc(doc(db, 'relationships', profile.relationshipId), {
          'sharedCycleSettings.lastPeriodDate': selectedPeriodDate,
          'sharedCycleSettings.isPeriodActive': true,
          'sharedCycleSettings.periodStartDate': selectedPeriodDate,
          'sharedCycleSettings.isUncertain': false,
          'sharedCycleSettings.updatedAt': serverTimestamp()
        });
      }
      setIsLoggingPeriod(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + user.uid);
    }
  };

  const handleStopPeriod = async () => {
    if (!user) return;
    try {
      const targetUserId = isFemale ? user.uid : profile?.partnerId;
      if (!targetUserId) return;

      const startDate = displaySettings.periodStartDate;
      const endDate = selectedEndDate;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const duration = differenceInDays(end, start) + 1;

      const newPeriod = { startDate, endDate, duration, status: 'completed' };
      const updatedPeriods = [newPeriod, ...(displaySettings.periods || [])].slice(0, 50);

      await updateDoc(doc(db, 'users', targetUserId), {
        'cycleSettings.isPeriodActive': false,
        'cycleSettings.lastPeriodDate': endDate,
        'cycleSettings.periods': updatedPeriods,
        'cycleSettings.updatedAt': serverTimestamp()
      });

      if (profile?.relationshipId) {
        await updateDoc(doc(db, 'relationships', profile.relationshipId), {
          'sharedCycleSettings.isPeriodActive': false,
          'sharedCycleSettings.lastPeriodDate': endDate,
          'sharedCycleSettings.periods': updatedPeriods,
          'sharedCycleSettings.updatedAt': serverTimestamp()
        });
      }

      setIsStoppingPeriod(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + user.uid);
    }
  };

  useEffect(() => {
    if (!displaySettings.isPeriodActive || !displaySettings.periodStartDate) return;
    
    const timer = setInterval(() => {
      const start = new Date(displaySettings.periodStartDate).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      
      if (diff > 0) {
        setElapsed({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [displaySettings.isPeriodActive, displaySettings.periodStartDate]);

  // Listen to relationship
  useEffect(() => {
    if (profile?.relationshipId) {
      const unsub = onSnapshot(doc(db, 'relationships', profile.relationshipId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // Check if partner sent support recently (within last 30 seconds)
          if (data.lastSupportFrom === profile.partnerId && 
              data.lastSupportAt && 
              Math.abs(Date.now() - data.lastSupportAt.toMillis()) < 30000) {
            setShowSupportToast(true);
            setTimeout(() => setShowSupportToast(false), 8000);
          }
          setRelationship(data);
        }
      });
      return () => unsub();
    }
  }, [profile?.relationshipId, profile?.partnerId]);

  const sendSupport = async (type: string = 'heart', message?: string) => {
    if (!profile?.relationshipId || !user) return;
    try {
      await updateDoc(doc(db, 'relationships', profile.relationshipId), {
        lastSupportAt: serverTimestamp(),
        lastSupportFrom: user.uid,
        lastSupportType: type,
        lastSupportMessage: message || (type === 'heart' ? null : `sent you some ${type}`)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'relationships/' + profile.relationshipId);
    }
  };

  const hasPartner = !!profile?.partnerId;

  // Emotional Support Messaging & Role UI
  const supportType = isFemale ? 'receiver' : 'sender';
  
  return (
    <div className="max-w-lg mx-auto p-8 space-y-10 pb-32 relative">
      {/* "Bone" Connection Visual / Synchronization Link */}
      {hasPartner && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M200 50 Q 250 200 200 400 T 200 750" 
              fill="none" 
              stroke="#fb7185" 
              strokeWidth="4" 
              strokeDasharray="10 10"
              className="animate-dash"
            />
            <circle cx="200" cy="50" r="10" fill="#fb7185" />
            <circle cx="200" cy="750" r="10" fill="#fb7185" />
          </svg>
        </div>
      )}

      <AnimatePresence>
        {showTour && <FeatureTour onComplete={completeTour} />}
        
        {showSupportToast && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-8 left-0 right-0 z-50 flex justify-center px-8"
          >
            <div className="bg-rose-400 text-white px-8 py-4 rounded-[32px] shadow-2xl flex items-center gap-4 border-4 border-white">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Heart size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest">Received Love!</p>
                <p className="text-[10px] font-bold opacity-90">
                  {relationship?.lastSupportMessage || `${partnerProfile?.displayName || 'Partner'} sent you emotional support`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('greeting')}, {profile?.displayName?.split(' ')?.[0] || 'User'}</h1>
          <p className="text-rose-400 font-medium">Today is {format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white shadow-md border-2 border-white overflow-hidden">
          <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="avatar" />
        </div>
      </header>

      {/* Role-Specific Support Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        {isFemale ? (
          <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-8 rounded-[40px] text-white shadow-2xl shadow-rose-200 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <MessageCircleHeart size={24} />
              </div>
              <h3 className="font-black text-xl uppercase tracking-widest">Wellness Tip</h3>
            </div>
            <p className="text-lg font-medium leading-relaxed opacity-90">
              {displaySettings.isPeriodActive 
                ? "Your body is working hard. Dark chocolate and warm herbal teas can help ease discomfort today." 
                : "You're in your high-energy phase. A great time for new ideas and creative projects!"}
            </p>
            {hasPartner && relationship?.lastSupportType === 'heart' && (
              <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                <Heart size={16} fill="white" className="text-white animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest">Partner just sent you a heart</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-rose-100 border border-rose-50 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center">
                  <Heart size={24} />
                </div>
                <h3 className="font-black text-xl text-gray-800 uppercase tracking-widest">Support Her</h3>
              </div>
              <button 
                onClick={sendSupport}
                className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-400 active:scale-90 transition-all hover:bg-rose-100"
              >
                <Heart size={20} fill={relationship?.lastSupportAt ? "currentColor" : "none"} />
              </button>
            </div>
            
            <p className="text-gray-500 font-medium leading-relaxed italic">
              {displaySettings.isPeriodActive 
                ? "She's menstruating right now. Small gestures like a hot water bag or her favorite snack mean the world." 
                : "She's feeling steady. A great time for a date or a long walk together."}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => sendSupport('tea', 'sent you some warm tea 🍵')}
                className="py-3 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Warm Tea
              </button>
              <button 
                onClick={() => sendSupport('chocolate', 'sent you some dark chocolate 🍫')}
                className="py-3 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Dark Choco
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Connection Banner */}
      {hasPartner && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-100 p-4 rounded-[20px] flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} className="w-8 h-8 rounded-full border-2 border-white" />
              <img src={partnerProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.partnerId}`} className="w-8 h-8 rounded-full border-2 border-white" />
            </div>
            <p className="text-xs font-bold text-rose-500">Connected to {partnerProfile?.displayName || 'Partner'}</p>
          </div>
          <Link to="/couple" className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Manage</Link>
        </motion.div>
      )}

      {/* Main Cycle Card / Onboarding */}
      {(!hasData || !displaySettings.isPeriodActive) && isFemale && !displaySettings.isPeriodActive ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-2xl shadow-rose-100 border border-rose-50 p-10 flex flex-col items-center text-center space-y-8 relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
           <div className="w-24 h-24 bg-rose-100 rounded-[2.5rem] flex items-center justify-center text-rose-500 shadow-xl shadow-rose-100/50">
              <History size={44} strokeWidth={2.5} />
           </div>
           
           <div className="space-y-3">
              <h3 className="text-3xl font-black text-gray-800">{!hasData ? t('welcome') : t('no_periods')}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium px-4">
                {!hasData ? t('track_prompt') : 'Your last period ended. Start tracking the next one when it begins.'}
              </p>
           </div>

           <button 
            onClick={() => setIsLoggingPeriod(true)}
            className="w-full py-5 bg-rose-400 text-white font-black rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
           >
             {t('log_period')}
             <Plus size={18} strokeWidth={3} />
           </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] shadow-2xl shadow-rose-100 border border-rose-50 flex flex-col items-center justify-center relative p-12 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-50">
            {displaySettings.isPeriodActive && (
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (elapsed.d / (displaySettings.avgPeriodDays || 5)) * 100)}%` }}
                className="h-full bg-rose-400"
              />
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-32 h-32 bg-rose-50 rounded-[40px] flex items-center justify-center shadow-inner">
              <Heart size={48} className={`text-rose-400 fill-rose-100 ${displaySettings.isPeriodActive ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          
          <div className="mt-8 text-center space-y-4">
            {!isFemale && partnerProfile && (
              <p className="text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Users size={12} />
                {partnerProfile.displayName}'s Cycle
              </p>
            )}

            {displaySettings.isPeriodActive ? (
              <div className="space-y-6 w-full relative">
                <div className="absolute top-0 right-0 -mr-4 -mt-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center animate-pulse">
                     <Activity size={20} className="text-rose-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{t('period_in_progress')}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic opacity-70">
                    Auto-saving to History...
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center group">
                    <p className="text-3xl font-black text-rose-500 transition-transform group-hover:scale-110">{elapsed.d}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('days')}</p>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <p className="text-3xl font-black text-rose-500">{elapsed.h}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('hours')}</p>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <p className="text-3xl font-black text-rose-500">{elapsed.m}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('mins')}</p>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <p className="text-3xl font-black text-rose-500">{elapsed.s}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('secs')}</p>
                  </div>
                </div>
                
                <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100/50">
                  <p className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em] mb-1">Expected End Date</p>
                  <p className="text-sm font-bold text-rose-500">
                    {format(addDays(new Date(displaySettings.periodStartDate), (displaySettings.avgPeriodDays || 5) - 1), 'MMMM do, yyyy')}
                  </p>
                </div>

                <button
                  onClick={() => setIsStoppingPeriod(true)}
                  className="w-full py-5 bg-rose-400 text-white font-black rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  <Check size={20} strokeWidth={3} />
                  {t('stop_period')}
                </button>
              </div>
            ) : !hasData ? (
              <div className="space-y-4 w-full">
                <div className="space-y-1">
                  <p className="text-gray-500 text-sm font-medium">{t('no_periods')}</p>
                  <p className="text-xl font-medium text-gray-400 italic">Start your journey today</p>
                </div>
                
                <button
                  onClick={() => setIsLoggingPeriod(true)}
                  className="mt-6 w-full py-5 bg-rose-400 text-white font-black rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  <Calendar size={20} />
                  {t('log_period')}
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="space-y-1">
                  <p className="text-gray-500 text-sm font-medium">{daysUntilNext <= 0 ? t('overdue') : t('free')}</p>
                  <p className="text-xl font-medium text-gray-400 italic">{t('rhythm_synced')}</p>
                </div>
                
                <button
                  onClick={() => setIsLoggingPeriod(true)}
                  className="mt-6 w-full py-5 bg-rose-400 text-white font-black rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                  <Calendar size={20} />
                  {t('log_period')}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Period Logging Modal (Start) */}
      <AnimatePresence>
        {isLoggingPeriod && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <div className="relative space-y-6">
                <div className="flex justify-between items-center">
                   <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 shadow-lg shadow-rose-100">
                      <History size={24} />
                   </div>
                   <button 
                    onClick={() => setIsLoggingPeriod(false)}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-800">{t('log_period')}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select period start date</p>
                </div>

                <input 
                  type="date"
                  value={selectedPeriodDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedPeriodDate(e.target.value)}
                  className="w-full h-16 bg-gray-50 rounded-3xl px-6 text-lg font-bold text-gray-800 focus:ring-4 focus:ring-rose-50 focus:outline-none border-none transition-all"
                />

                <button
                  onClick={handleLogPeriod}
                  className="w-full py-5 bg-rose-400 text-white font-black rounded-3xl shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                >
                  <Check size={18} strokeWidth={3} />
                  Confirm Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Period Stopping Modal (End) */}
      <AnimatePresence>
        {isStoppingPeriod && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50" />
              <div className="relative space-y-6">
                <div className="flex justify-between items-center">
                   <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 shadow-lg shadow-gray-100">
                      <X size={24} />
                   </div>
                   <button 
                    onClick={() => setIsStoppingPeriod(false)}
                    className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-800">{t('stop_period')}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select period end date</p>
                </div>

                <input 
                  type="date"
                  value={selectedEndDate}
                  min={displaySettings.periodStartDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedEndDate(e.target.value)}
                  className="w-full h-16 bg-gray-50 rounded-3xl px-6 text-lg font-bold text-gray-800 focus:ring-4 focus:ring-rose-50 focus:outline-none border-none transition-all"
                />

                <button
                  onClick={handleStopPeriod}
                  className="w-full py-5 bg-gray-800 text-white font-black rounded-3xl shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                >
                  <Check size={18} strokeWidth={3} />
                  Finish Period
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role-Specific Actions */}
      <div className="space-y-4">
        {isFemale ? (
          <Link to="/logger" className="block group">
            <div className="bg-white rounded-[28px] p-6 shadow-lg shadow-rose-100/30 border border-rose-50 flex items-center justify-between transition-all group-hover:shadow-rose-200/50 group-hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-400 text-white flex items-center justify-center shadow-xl shadow-rose-200">
                  <Plus size={28} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800">Logger Daily</h3>
                  <p className="text-xs text-slate-400 font-medium">Record symptoms & mood</p>
                </div>
              </div>
              <Activity size={24} className="text-rose-200 group-hover:text-rose-400 transition-colors" />
            </div>
          </Link>
        ) : (
          <div className="bg-white rounded-[28px] p-8 border border-rose-100 shadow-xl shadow-rose-100/50 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400 shadow-inner">
                <MessageCircleHeart size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-800">Supporter Dashboard</h3>
                <p className="text-xs text-rose-300 font-medium tracking-wide">Syncing heartbeats in realtime</p>
              </div>
            </div>
            {!hasData && (
               <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-center space-y-2">
                  <Heart className="mx-auto text-rose-300" size={32} />
                  <p className="text-sm font-bold text-rose-500">Awaiting Data</p>
                  <p className="text-[10px] text-rose-400 font-medium">Once {partnerProfile?.displayName || 'Partner'} starts tracking, you'll see their rhythm here.</p>
               </div>
            )}
            {hasData && (
              <p className="text-sm text-gray-500 leading-relaxed font-medium italic">
                "Stay tuned to {partnerProfile?.displayName || 'Partner'}'s mood and health. Your support makes every cycle easier."
              </p>
            )}
            {hasPartner && (
              <button 
                onClick={sendSupport}
                className="w-full py-5 bg-gradient-to-r from-rose-400 to-rose-300 text-white font-black rounded-[24px] shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
              >
                <Heart size={20} fill="currentColor" />
                Send Support Love
              </button>
            )}
            {!hasPartner && (
              <Link to="/couple" className="block w-full py-5 bg-rose-400 text-white font-bold rounded-2xl shadow-xl shadow-rose-200 text-center">
                Link with Partner
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button - History */}
      {isFemale && (
        <Link 
          to="/histories" 
          className="fixed bottom-28 right-8 w-16 h-16 bg-rose-400 text-white rounded-full shadow-2xl shadow-rose-200 flex items-center justify-center z-40 active:scale-90 transition-all hover:bg-rose-500"
        >
          <History size={28} strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
};

export default Home;
