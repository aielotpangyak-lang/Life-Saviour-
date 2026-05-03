import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Copy, Check, UserPlus, Users, MessageSquareHeart, Timer, XCircle, ShieldCheck } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, onSnapshot, Timestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../lib/LanguageContext';

const Couple = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [activeInvite, setActiveInvite] = useState<any>(null);
  const [targetCode, setTargetCode] = useState('');
  const [copying, setCopying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [relationship, setRelationship] = useState<any>(null);

  // Listen for relationship
  useEffect(() => {
    if (profile?.relationshipId) {
      const unsub = onSnapshot(doc(db, 'relationships', profile.relationshipId), (snap) => {
        if (snap.exists()) {
          setRelationship(snap.data());
        }
      });
      return () => unsub();
    }
  }, [profile?.relationshipId]);

  // Listen for my own active invites
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'invites'), 
      where('senderId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pending = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter((inv: any) => inv.expiresAt.toDate() > new Date());
      
      if (pending.length > 0) {
        setActiveInvite(pending[0]);
      } else {
        setActiveInvite(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Countdown timer logic
  useEffect(() => {
    if (activeInvite && activeInvite.expiresAt) {
      const expiry = activeInvite.expiresAt.toDate().getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(diff);
        
        if (diff <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setActiveInvite(null);
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setTimeLeft(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeInvite]);

  const generateInvite = async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    // Generate 6-digit uppercase alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
      await addDoc(collection(db, 'invites'), {
        code,
        senderId: user.uid,
        senderName: profile?.displayName,
        status: 'pending',
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invites');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!activeInvite?.code) return;
    navigator.clipboard.writeText(activeInvite.code);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const acceptInvite = async () => {
    if (!user || !targetCode) return;
    setError('');
    setLoading(true);
    try {
      const q = query(
        collection(db, 'invites'), 
        where('code', '==', targetCode), 
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError("Invalid or expired code");
        setLoading(false);
        return;
      }

      const inviteDoc = snapshot.docs[0];
      const inviteData = inviteDoc.data();

      if (inviteData.expiresAt.toDate() < new Date()) {
        setError("Code has expired");
        setLoading(false);
        return;
      }

      if (inviteData.senderId === user.uid) {
        setError("You cannot bond with yourself");
        setLoading(false);
        return;
      }

      // Create relationship
      const relId = `rel_${Math.random().toString(36).substring(2, 12)}`;
      const batch = writeBatch(db);

      // Create Relationship Doc
      batch.set(doc(db, 'relationships', relId), {
        partners: [user.uid, inviteData.senderId],
        status: 'active',
        createdAt: serverTimestamp(),
        sharedCycleSettings: profile.cycleSettings || {
          avgCycleDays: 28,
          avgPeriodDays: 5,
          lastPeriodDate: new Date().toISOString().split('T')[0]
        }
      });

      // Update Users
      batch.update(doc(db, 'users', user.uid), { 
        partnerId: inviteData.senderId,
        relationshipId: relId
      });
      batch.update(doc(db, 'users', inviteData.senderId), { 
        partnerId: user.uid,
        relationshipId: relId
      });

      // Mark invite as used
      batch.update(doc(db, 'invites', inviteDoc.id), { status: 'accepted' });

      await batch.commit();
      setTargetCode('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'invites');
    } finally {
      setLoading(false);
    }
  };

  const breakBond = async () => {
    if (!user || !profile?.relationshipId) return;
    if (!window.confirm("Are you sure you want to break this bond? Shared tracking will stop immediately.")) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);
      const partnerId = profile.partnerId;

      batch.update(doc(db, 'users', user.uid), { 
        partnerId: null,
        relationshipId: null 
      });
      if (partnerId) {
        batch.update(doc(db, 'users', partnerId), { 
          partnerId: null,
          relationshipId: null 
        });
      }
      batch.update(doc(db, 'relationships', profile.relationshipId), { status: 'ended' });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setLoading(false);
    }
  };

  const [showSupportModal, setShowSupportModal] = useState(false);

  const supportMessages = [
    "I'm here for you, no matter what. ❤️",
    "You're doing amazing, take it easy today. ✨",
    "Sending you all the love and strength. 💪",
    "Rest well, you deserve it. 🌸",
    "Just a little reminder that you're loved. ✨",
    "Can I bring you something? Tea, chocolate, or a hug? ☕️",
    "Breathe deeply. This phase will pass soon. 🧘‍♀️",
    "I'm so proud of how you handle everything. 🌟"
  ];

  const sendSupport = async (message: string) => {
    if (!profile?.relationshipId || !user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'relationships', profile.relationshipId), {
        lastSupportAt: serverTimestamp(),
        lastSupportFrom: user.uid,
        lastSupportType: 'message',
        lastSupportMessage: message
      });
      setShowSupportModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'relationships/' + profile.relationshipId);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 pt-12 space-y-10 max-w-lg mx-auto pb-32">
      <header className="text-center">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
          <Heart className="text-rose-400 fill-current" size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Couple Connect</h2>
        <p className="text-rose-300 font-medium text-sm max-w-[300px] mx-auto mt-3 italic leading-relaxed">
          "Link your hearts to provide care and support through every rhythm."
        </p>
      </header>

      {profile?.relationshipId ? (
        <section className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-10 space-y-10 shadow-2xl shadow-rose-100 border border-rose-50 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-rose-200"></div>
            
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="flex items-center gap-10 relative">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 p-1 border-2 border-rose-200 shadow-xl overflow-hidden transform -rotate-3 transition-transform group-hover:rotate-0">
                    <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="me" className="w-full h-full rounded-[2rem] object-cover" />
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rose-400 text-[10px] text-white font-bold px-3 py-1 rounded-full shadow-md">YOU</span>
                </div>

                <div className="w-12 h-12 bg-rose-400 rounded-2xl flex items-center justify-center text-white shadow-lg z-20 animate-pulse">
                  <Heart size={20} fill="currentColor" />
                </div>

                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 p-1 border-2 border-rose-200 shadow-xl overflow-hidden transform rotate-3 transition-transform group-hover:rotate-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.partnerId}`} alt="partner" className="w-full h-full rounded-[2rem] object-cover" />
                  </div>
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rose-300 text-[10px] text-white font-bold px-3 py-1 rounded-full shadow-md">PARTNER</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-rose-400">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Bond Active</span>
                </div>
                <h3 className="font-bold text-2xl text-gray-800">Perfectly Synced</h3>
                <p className="text-sm text-gray-400 font-medium">Real-time health & mood synchronization</p>
              </div>

              <div className="w-full grid grid-cols-1 gap-3">
                <button 
                  onClick={() => setShowSupportModal(true)}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-rose-50 text-rose-500 font-bold rounded-2xl text-sm active:scale-95 transition-all shadow-sm border border-rose-100 hover:bg-rose-100 transition-colors"
                >
                  <MessageSquareHeart size={20} />
                  Send Emotional Support
                </button>
              </div>
            </div>
          </motion.div>

          <button 
            onClick={breakBond}
            disabled={loading}
            className="w-full py-5 text-gray-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-red-400 transition-colors"
          >
            <XCircle size={14} />
            Break Secure Bond
          </button>
        </section>
      ) : (
        <div className="space-y-8">
          <section className="bg-white rounded-[32px] p-8 space-y-8 shadow-xl shadow-rose-100/50 border border-rose-50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700 flex items-center gap-3 uppercase text-[10px] tracking-widest">
                <Send size={16} className="text-rose-400" />
                Generate Bond Code
              </h3>
            </div>
            
            <AnimatePresence mode="wait">
              {activeInvite ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-6"
                >
                  <div className="bg-rose-50 rounded-[28px] p-8 flex flex-col items-center justify-center border-2 border-dashed border-rose-200 relative group">
                    <div className="flex items-center gap-6 mb-4">
                      <span className="text-3xl font-bold text-rose-500 tracking-[0.3em] font-mono select-all">
                        {activeInvite.code}
                      </span>
                      <button 
                        onClick={copyCode}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          copying ? 'bg-green-500 text-white' : 'bg-white text-rose-400 shadow-md'
                        }`}
                      >
                        {copying ? <Check size={20} /> : <Copy size={20} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-widest">
                      <Timer size={14} className="animate-spin-slow" />
                      Expires in {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-gray-400 font-medium px-4 leading-relaxed">
                    Share this code with your partner. It will expire soon for security.
                  </p>
                </motion.div>
              ) : (
                <motion.button
                  key="generate-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={generateInvite}
                  disabled={loading}
                  className="w-full h-20 bg-rose-400 rounded-[28px] flex items-center justify-center gap-4 text-white font-bold shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50 transition-all text-lg"
                >
                  <UserPlus size={28} strokeWidth={2.5} />
                  {loading ? 'Securing...' : 'Generate Bond Code'}
                </motion.button>
              )}
            </AnimatePresence>
          </section>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rose-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#FFF9F9] px-6 text-[10px] font-extrabold text-rose-200 uppercase tracking-[0.4em]">Bonding Terminal</span>
            </div>
          </div>

          <section className="bg-white rounded-[32px] p-8 space-y-6 shadow-xl shadow-rose-100/50 border border-rose-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-gray-700 flex items-center gap-3 uppercase text-[10px] tracking-widest">
                  <Users size={16} className="text-rose-400" />
                  Connect to Partner
                </h3>
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={targetCode}
                  onChange={(e) => setTargetCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={6}
                  className="flex-1 h-16 bg-rose-50/50 rounded-[24px] px-6 font-mono font-bold text-center text-xl tracking-[0.4em] border-2 border-transparent focus:border-rose-200 outline-none shadow-inner transition-all placeholder:text-rose-200"
                />
                <button
                  onClick={acceptInvite}
                  disabled={loading || targetCode.length < 6}
                  className="w-16 h-16 bg-rose-400 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-rose-200 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check size={32} strokeWidth={3} />
                  )}
                </button>
              </div>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-red-400 text-[10px] font-bold uppercase tracking-widest pt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </section>
        </div>
      )}
      {/* Support Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-lg p-10 space-y-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Support Her</h3>
                <button onClick={() => setShowSupportModal(false)} className="bg-gray-50 p-2 rounded-2xl text-gray-400">
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">Choose a heart-warming message to send to your partner instantly.</p>
              
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide pb-4">
                {supportMessages.map((msg, i) => (
                  <button 
                    key={i}
                    disabled={loading}
                    onClick={() => sendSupport(msg)}
                    className="w-full p-6 text-left bg-rose-50/50 hover:bg-rose-50 rounded-3xl border border-rose-100 text-sm font-bold text-gray-700 transition-all active:scale-[0.98] flex items-center justify-between"
                  >
                    <span>{msg}</span>
                    <Send size={16} className="text-rose-300" />
                  </button>
                ))}
              </div>

              <div className="pt-4">
                 <button 
                  onClick={() => sendSupport("❤️")}
                  className="w-full py-5 bg-rose-400 text-white font-bold rounded-[28px] shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                 >
                   <Heart size={20} fill="currentColor" />
                   Just Send a Heart
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Couple;
