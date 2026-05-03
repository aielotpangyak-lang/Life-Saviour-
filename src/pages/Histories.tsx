import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, differenceInDays } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Sun, 
  Moon, 
  History,
  TrendingUp,
  Clock,
  PieChart,
  Download,
  Plus
} from 'lucide-react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ConfirmationModal from '../components/ConfirmationModal';
import { useTranslation } from '../lib/LanguageContext';

const Histories = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { t } = useTranslation();
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);

  // Listen to partner profile if exists
  useEffect(() => {
    if (profile?.partnerId) {
      const unsub = onSnapshot(doc(db, 'users', profile.partnerId), (doc) => {
        if (doc.exists()) {
          setPartnerProfile(doc.data());
        }
      });
      return () => unsub();
    }
  }, [profile?.partnerId]);

  const isFemale = profile?.gender === 'female';
  const displaySettings = (isFemale ? profile?.cycleSettings : partnerProfile?.cycleSettings) || profile?.cycleSettings || {};
  const periods = displaySettings.periods || [];

  const downloadHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(periods, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `cycle_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Dynamic Average Calculation
  const calculatedAvgCycle = React.useMemo(() => {
    if (periods.length < 2) return displaySettings.avgCycleDays || 28;
    
    // Sort ascending to calculate gaps
    const sorted = [...periods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const gaps: number[] = [];
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i].startDate);
      const next = new Date(sorted[i+1].startDate);
      gaps.push(Math.abs(differenceInDays(next, current)));
    }
    
    const sum = gaps.reduce((a, b) => a + b, 0);
    return Math.round(sum / gaps.length);
  }, [periods, displaySettings.avgCycleDays]);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');

  const handleManualAdd = async () => {
    if (!user || !manualStart || !manualEnd || !isFemale) return;
    
    const start = new Date(manualStart);
    const end = new Date(manualEnd);
    if (end < start) {
      alert("End date cannot be before start date");
      return;
    }

    const duration = differenceInDays(end, start) + 1;
    const newPeriod = { startDate: manualStart, endDate: manualEnd, duration, status: 'completed' };
    
    // Check for duplicates
    if (periods.some((p: any) => p.startDate === manualStart)) {
      alert("A period record already exists for this date.");
      return;
    }

    const updatedPeriods = [newPeriod, ...periods].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 50);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'cycleSettings.periods': updatedPeriods,
        'cycleSettings.updatedAt': serverTimestamp()
      });
      setShowManualEntry(false);
      setManualStart('');
      setManualEnd('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + user.uid);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedPeriod || !isFemale) return;
    
    const newPeriods = periods.filter((p: any) => p.startDate !== selectedPeriod.startDate);
    let mainLastDate = displaySettings.lastPeriodDate;
    if (mainLastDate === selectedPeriod.startDate) {
      mainLastDate = newPeriods[0]?.startDate || null;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'cycleSettings.lastPeriodDate': mainLastDate,
        'cycleSettings.periods': newPeriods,
        'cycleSettings.updatedAt': serverTimestamp()
      });
      setShowConfirm(false);
      setSelectedPeriod(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users/' + user.uid);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 space-y-8 pb-32">
      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Period record"
        message="Are you sure you want to remove this period entry from your history?"
        confirmText="Delete"
        cancelText="Cancel"
      />

      <AnimatePresence>
        {showManualEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">Add Record</h3>
                <button 
                  onClick={() => setShowManualEntry(false)}
                  className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"
                >
                  <Calendar className="opacity-40" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Start Date</label>
                  <input 
                    type="date"
                    value={manualStart}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setManualStart(e.target.value)}
                    className="w-full h-14 bg-gray-50 rounded-2xl px-6 font-bold text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">End Date</label>
                  <input 
                    type="date"
                    value={manualEnd}
                    min={manualStart}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setManualEnd(e.target.value)}
                    className="w-full h-14 bg-gray-50 rounded-2xl px-6 font-bold text-gray-800"
                  />
                </div>
              </div>

              <button
                onClick={handleManualAdd}
                className="w-full py-5 bg-rose-400 text-white font-black rounded-3xl shadow-xl shadow-rose-200"
              >
                Add to History
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white text-gray-400 rounded-2xl shadow-sm border border-rose-50">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-800">{t('history_title')}</h2>
            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Cycle Record Log</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isFemale && (
            <button 
              onClick={() => setShowManualEntry(true)}
              className="w-12 h-12 bg-white border border-rose-100 rounded-2xl flex items-center justify-center text-rose-400 shadow-sm"
              title="Add past period"
            >
              <Plus size={24} />
            </button>
          )}
          <button 
            onClick={downloadHistory}
            className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400 hover:bg-rose-100 transition-all"
            title={t('download_json')}
          >
            <Download size={24} />
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <section className="space-y-4">
        <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-2xl shadow-rose-100/20 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-sky-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-400 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div className="bg-rose-50 px-4 py-1.5 rounded-full text-[10px] font-black text-rose-400 uppercase tracking-widest">
                {periods.length < 2 ? 'Initial Guess' : 'Smart Analysis'}
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">Predicted Average Cycle</span>
              <div className="flex items-baseline gap-2">
                {periods.length === 0 ? (
                  <p className="text-2xl font-black text-gray-400 tracking-tighter uppercase whitespace-nowrap">No recent periods</p>
                ) : (
                  <>
                    <p className="text-5xl font-black text-gray-800 tracking-tighter">{calculatedAvgCycle}</p>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Days</p>
                  </>
                )}
              </div>
            </div>

            <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-[80%]">
              {periods.length < 2 
                ? "Add more history to refine your precision cycle analysis."
                : `Based on your last ${periods.length} period logs, your body is showing a fairly consistent rhythm.`
              }
            </p>
          </div>
        </div>
      </section>

      {/* Logs List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">Historical Timeline</h3>
        </div>

        <div className="space-y-3">
          {displaySettings.isPeriodActive && displaySettings.periodStartDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 rounded-[32px] p-6 border-2 border-rose-200 shadow-xl shadow-rose-100/50 flex items-center justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-400" />
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-rose-400 text-white flex items-center justify-center shadow-lg animate-pulse">
                  <Activity size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">
                    {format(new Date(displaySettings.periodStartDate), 'MMMM do')}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-ping" />
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                      Currently Running...
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {periods.length === 0 && !displaySettings.isPeriodActive ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-gray-200 mx-auto mb-4">
                <History size={32} />
              </div>
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No past records yet</p>
            </div>
          ) : (
            periods.map((period: any, idx: number) => (
              <motion.div
                key={period.startDate}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-xl shadow-gray-100/50 flex items-center justify-between group hover:border-rose-100 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-100 relative overflow-hidden">
                    <Activity size={24} />
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {format(new Date(period.startDate), 'MMMM do')}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {period.endDate 
                        ? `${format(new Date(period.endDate), 'MMM do, yyyy')} • ${Math.floor((new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Days`
                        : 'Currently active flow'}
                    </p>
                  </div>
                </div>

                {isFemale && (
                  <button 
                    onClick={() => {
                      setSelectedPeriod(period);
                      setShowConfirm(true);
                    }}
                    className="w-12 h-12 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-400 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Tip Card */}
      <section className="bg-rose-400 rounded-[40px] p-10 shadow-2xl shadow-rose-200 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/30">
            <Sparkles size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Why track logs?</h3>
            <p className="text-sm font-medium opacity-90 leading-relaxed italic">
              "Keeping accurate records of your past cycles helps our AI predict your future rhythms with precision, making it easier for you and your partner to plan ahead."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Histories;
