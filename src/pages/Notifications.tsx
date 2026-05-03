import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Calendar, Droplets, Pill, MessageSquareHeart } from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    periodReminder: true,
    ovulationAlert: true,
    pillReminder: false,
    partnerNudges: true,
    moodCheckIn: true
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationList = [
    { key: 'periodReminder', label: 'Upcoming Period', sub: 'Receive a gentle nudge 2 days before', icon: Calendar },
    { key: 'ovulationAlert', label: 'Ovulation Alert', sub: 'Stay informed about your fertile window', icon: Droplets },
    { key: 'pillReminder', label: 'Medicine Reminder', sub: 'Daily reminder for your daily wellness', icon: Pill },
    { key: 'partnerNudges', label: 'Partner Nudges', sub: 'Receive supportive messages from partner', icon: MessageSquareHeart },
    { key: 'moodCheckIn', label: 'Daily Mood Check', sub: 'Remind me to log how I feel', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-12 p-6">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-serif font-bold text-slate-800">Notifications</h2>
        <div className="w-10 h-10"></div>
      </div>

      <div className="space-y-4 pb-24">
        {notificationList.map((item) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 flex items-center gap-4 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400`}>
              <item.icon size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              <p className="text-[10px] text-slate-400">{item.sub}</p>
            </div>
            <button
              onClick={() => toggle(item.key as keyof typeof settings)}
              className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                settings[item.key as keyof typeof settings] ? 'bg-brand-soft-red' : 'bg-slate-200'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                  settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </motion.div>
        ))}

        <div className="bg-brand-lavender/10 p-6 rounded-2xl border border-brand-lavender/20 mt-8">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Did you know?</p>
          <p className="text-xs text-slate-500 leading-relaxed italic">
            "Gentle reminders help reduce stress and keep you in tune with your body's natural clock."
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
