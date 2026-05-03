import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Heart, Shield, User, MapPin, Calendar, Check, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { differenceInYears } from 'date-fns';
import CountrySelector from '../components/onboarding/CountrySelector';
import DOBSelector from '../components/onboarding/DOBSelector';

const genders = [
  { id: 'female', label: 'Female', icon: '🌸' },
  { id: 'male', label: 'Male', icon: '👔' },
  { id: 'other', label: 'Other', icon: '✨' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🔒' }
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    displayName: '',
    gender: 'female',
    dob: undefined as Date | undefined,
    country: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        gender: profile.gender || 'female',
        dob: profile.dob ? new Date(profile.dob) : undefined,
        country: profile.country || '',
      });
    }
  }, [profile]);

  const calculateAge = (dob: Date) => {
    return differenceInYears(new Date(), dob);
  };

  const handleNext = async () => {
    setError('');
    
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!formData.displayName.trim()) {
        setError('Please enter your name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.dob) {
        setError('Please select your date of birth');
        return;
      }
      const age = calculateAge(formData.dob);
      if (age < 13) {
        setError('You must be at least 13 years old');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.country) {
        setError('Please select your country');
        return;
      }
      
      setIsSubmitting(true);
      try {
        if (user) {
          const age = calculateAge(formData.dob!);
          await updateDoc(doc(db, 'users', user.uid), {
            displayName: formData.displayName,
            gender: formData.gender,
            dob: formData.dob!.toISOString().split('T')[0],
            country: formData.country,
            age: age,
            isOnboarded: true,
            updatedAt: serverTimestamp(),
          });
          navigate('/');
        }
      } catch (err) {
        setError('Failed to save profile. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col pt-10"
          >
            <div className="h-[45%] overflow-hidden relative rounded-[3rem] mb-10 shadow-2xl shadow-rose-200">
              <img src="https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?auto=format&fit=crop&q=80&w=400" alt="welcome" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-400/40 to-transparent flex items-end p-8">
                <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 border border-white">
                  <Shield size={14} className="text-rose-400" />
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">100% Private & Secure</span>
                </div>
              </div>
            </div>
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-rose-400 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-rose-200">
                <Activity size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-gray-800 leading-tight">Your Digital Cycle Sanctuary</h2>
                <div className="flex items-center justify-center gap-2">
                   <Sparkles size={16} className="text-rose-400" />
                   <p className="text-rose-400 font-bold uppercase tracking-[0.2em] text-[10px]">AI-Powered Insights</p>
                </div>
              </div>
              <p className="text-gray-500 leading-relaxed font-medium text-lg">
                Precision tracking for your body, soul, and relationship. Let's build your profile.
              </p>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 pt-10"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-rose-100 rounded-[2.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-lg shadow-rose-100 mb-6">
                <User size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">What's your name?</h2>
              <p className="text-gray-500 font-medium tracking-wide">Let's start with the basics</p>
            </div>

            <div className="space-y-6">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full h-16 bg-white rounded-[24px] px-6 text-lg font-bold text-gray-800 shadow-xl shadow-rose-100/30 border-2 border-rose-50 focus:border-rose-200 outline-none transition-all placeholder:text-gray-200"
              />

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Your Orientation</p>
                <div className="grid grid-cols-2 gap-3">
                  {genders.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setFormData({ ...formData, gender: g.id })}
                      className={`h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all ${
                        formData.gender === g.id 
                        ? 'bg-rose-400 text-white shadow-lg shadow-rose-200 scale-105' 
                        : 'bg-white text-gray-400 border border-rose-50 shadow-sm'
                      }`}
                    >
                      <span className="text-lg">{g.icon}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 pt-10"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-purple-100 rounded-[2.5rem] flex items-center justify-center text-purple-500 mx-auto shadow-lg shadow-purple-100 mb-6">
                <Calendar size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">When is your birthday?</h2>
              <p className="text-gray-500 font-medium tracking-wide">Essential for accurate health insights</p>
            </div>

            <DOBSelector 
              value={formData.dob} 
              onChange={(date) => setFormData({ ...formData, dob: date })} 
            />
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 pt-10"
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-100 rounded-[2.5rem] flex items-center justify-center text-blue-500 mx-auto shadow-lg shadow-blue-100 mb-6">
                <MapPin size={32} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">What's your country?</h2>
              <p className="text-gray-500 font-medium tracking-wide">For personalized insights and community</p>
            </div>

            <CountrySelector 
              value={formData.country} 
              onChange={(country) => setFormData({ ...formData, country })} 
            />
          </motion.div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#FFF9F9] overflow-hidden max-w-lg mx-auto">
      <div className="flex-1 px-10 pt-10 pb-12 flex flex-col">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-red-500 font-bold text-sm"
            >
              {error}
            </motion.p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-rose-400' : 'w-2 bg-rose-100'}`}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`flex-1 h-20 bg-rose-400 text-white rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl shadow-rose-300 active:scale-95 transition-all px-8 ${
                isSubmitting ? 'opacity-50' : ''
              }`}
            >
              <span className="font-black uppercase tracking-widest text-sm">
                {step === 0 ? 'Start Setup' : isSubmitting ? 'Finalizing...' : 'Continue'}
              </span>
              {isSubmitting ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight size={28} strokeWidth={3} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
