import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Moon, Sun, Wind, Activity, Zap, ThumbsDown, Trash2 } from 'lucide-react';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import ConfirmationModal from '../components/ConfirmationModal';

const Logger = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  
  const dateFromQuery = searchParams.get('date');
  const initialDate = dateFromQuery || new Date().toISOString().split('T')[0];
  
  const [mood, setMood] = useState('calm');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [flow, setFlow] = useState('none');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(!!dateFromQuery);

  useEffect(() => {
    const fetchExistingLog = async () => {
      if (!user) return;
      const relationshipId = profile?.relationshipId;
      const logId = relationshipId ? `${relationshipId}_${initialDate}` : `${user.uid}_${initialDate}`;
      
      try {
        const snap = await getDoc(doc(db, 'dailyLogs', logId));
        if (snap.exists()) {
          const data = snap.data();
          setMood(data.mood || 'calm');
          setSymptoms(data.symptoms || []);
          setFlow(data.flow || 'none');
          setNotes(data.notes || '');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'dailyLogs/' + logId);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingLog();
  }, [user, profile?.relationshipId, initialDate]);

  const moods = [
    { id: 'happy', icon: Sun, label: 'Happy' },
    { id: 'calm', icon: Wind, label: 'Calm' },
    { id: 'tired', icon: Moon, label: 'Tired' },
    { id: 'tense', icon: Zap, label: 'Tense' },
    { id: 'sad', icon: ThumbsDown, label: 'Low' },
  ];

  const commonSymptoms = [
    { id: 'cramps', label: 'Cramps', icon: Activity },
    { id: 'headache', label: 'Headache', icon: Activity },
    { id: 'bloating', label: 'Bloating', icon: Activity },
    { id: 'acne', label: 'Acne', icon: Activity },
  ];

  const flows = ['None', 'Light', 'Medium', 'Heavy'];

  const toggleSymptom = (id: string) => {
    setSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSaveAttempt = () => {
    if (flow !== 'none') {
      setShowConfirm(true);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    // If part of a relationship, use relationshipId for shared log
    const relationshipId = profile?.relationshipId;
    const logId = relationshipId ? `${relationshipId}_${initialDate}` : `${user.uid}_${initialDate}`;
    
    try {
      await setDoc(doc(db, 'dailyLogs', logId), {
        userId: user.uid,
        relationshipId: relationshipId || null,
        date: initialDate,
        mood,
        symptoms,
        flow,
        notes,
        updatedAt: serverTimestamp()
      });

      // If flow is active, update the lastPeriodDate in settings
      if (flow !== 'none') {
        const updates = {
          'cycleSettings.lastPeriodDate': initialDate,
          'cycleSettings.isUncertain': false,
          'cycleSettings.possibleDates': [initialDate],
          'cycleSettings.updatedAt': serverTimestamp()
        };
        await updateDoc(doc(db, 'users', user.uid), updates);
        
        if (relationshipId) {
          await updateDoc(doc(db, 'relationships', relationshipId), {
            'sharedCycleSettings.lastPeriodDate': initialDate,
            'sharedCycleSettings.isUncertain': false,
            'sharedCycleSettings.possibleDates': [initialDate],
            'sharedCycleSettings.updatedAt': serverTimestamp()
          });
        }
      }

      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'dailyLogs/' + logId);
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const relationshipId = profile?.relationshipId;
    const logId = relationshipId ? `${relationshipId}_${initialDate}` : `${user.uid}_${initialDate}`;
    
    try {
      setSaving(true);
      await deleteDoc(doc(db, 'dailyLogs', logId));
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'dailyLogs/' + logId);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F9] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F9] flex flex-col pt-12 max-w-lg mx-auto overflow-hidden">
      <ConfirmationModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="Confirm Period Active"
        message={`Are you sure you want to log flow for ${initialDate}? This will mark it as your period start date.`}
        confirmText="Confirm & Save"
        cancelText="Cancel"
      />

      <div className="px-6 flex items-center justify-between mb-10">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white shadow-md border border-rose-50 flex items-center justify-center text-rose-300">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center text-gray-800">
          <h2 className="text-2xl font-bold">Logger</h2>
          <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">{initialDate}</p>
        </div>
        {dateFromQuery ? (
          <button onClick={handleDelete} className="w-12 h-12 rounded-2xl bg-white shadow-md border border-rose-50 flex items-center justify-center text-rose-300">
            <Trash2 size={24} />
          </button>
        ) : (
          <div className="w-12 h-12"></div>
        )}
      </div>

      <div className="flex-1 px-8 pb-32 space-y-10 overflow-y-auto no-scrollbar">
        {/* Mood */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">How do you feel?</h3>
          <div className="grid grid-cols-5 gap-3">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-[20px] transition-all duration-300 ${
                  mood === m.id ? 'bg-rose-400 text-white shadow-xl shadow-rose-200 scale-105' : 'bg-white text-gray-400 shadow-sm border border-rose-50'
                }`}
              >
                <m.icon size={24} strokeWidth={mood === m.id ? 3 : 2} />
                <span className="text-[9px] font-bold uppercase">{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Symptoms */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Any symptoms?</h3>
          <div className="grid grid-cols-2 gap-4">
            {commonSymptoms.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSymptom(s.id)}
                className={`flex items-center gap-4 p-5 rounded-[24px] transition-all duration-300 border ${
                  symptoms.includes(s.id) ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-lg shadow-rose-100' : 'bg-white border-rose-50 text-gray-500'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${symptoms.includes(s.id) ? 'bg-rose-400 text-white' : 'bg-gray-50 text-gray-300'}`}>
                  <s.icon size={20} />
                </div>
                <span className="text-sm font-bold">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Flow */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Flow Intensity</h3>
          <div className="flex bg-white p-2 rounded-[24px] shadow-lg shadow-rose-100/50 border border-rose-50">
            {flows.map((f) => (
              <button
                key={f}
                onClick={() => setFlow(f.toLowerCase())}
                className={`flex-1 py-4 text-[10px] font-bold rounded-[18px] transition-all ${
                  flow === f.toLowerCase() ? 'bg-rose-400 text-white shadow-md' : 'text-gray-400'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            Journal Entry
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write down how your heart is doing..."
            className="w-full h-40 bg-white rounded-[24px] p-6 text-sm text-gray-600 shadow-xl shadow-rose-100/30 border border-rose-50 focus:ring-4 focus:ring-rose-100/50 focus:outline-none placeholder:text-gray-300 resize-none font-medium"
          />
        </section>
        
        <button
          onClick={handleSaveAttempt}
          disabled={saving}
          className="w-full h-16 bg-rose-400 text-white font-bold rounded-[24px] shadow-2xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 text-sm uppercase tracking-widest"
        >
          {saving ? 'Saving...' : 'Complete Log'}
          {!saving && <Check size={20} strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
};

export default Logger;
