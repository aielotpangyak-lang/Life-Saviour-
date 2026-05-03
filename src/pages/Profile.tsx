import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, MapPin, Calendar, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, differenceInYears } from 'date-fns';
import { DayPicker } from 'react-day-picker';

const countries = [
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
  { name: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
].sort((a, b) => a.name.localeCompare(b.name));

const genders = [
  { id: 'female', label: 'Female', icon: '🌸' },
  { id: 'male', label: 'Male', icon: '👔' },
  { id: 'other', label: 'Other', icon: '✨' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🔒' }
];

const Profile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    displayName: '',
    gender: 'female',
    dob: undefined as Date | undefined,
    country: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleSave = async () => {
    setError('');
    setSuccess(false);

    if (!formData.displayName.trim()) return setError('Name is required');
    if (!formData.dob) return setError('Birthday is required');
    if (!formData.country) return setError('Country is required');

    setIsSubmitting(true);
    try {
      if (user) {
        const age = calculateAge(formData.dob);
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: formData.displayName,
          gender: formData.gender,
          dob: formData.dob.toISOString().split('T')[0],
          country: formData.country,
          age: age,
          updatedAt: serverTimestamp(),
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 space-y-10 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-rose-400">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-bold text-gray-800">Edit Profile</h2>
      </header>

      <div className="space-y-8">
        {/* Name & Gender */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Identity</h3>
          <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-rose-100/30 border border-rose-50 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 ml-2">Full Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full h-14 bg-rose-50/50 rounded-2xl px-5 font-bold text-gray-800 outline-none border border-rose-50 focus:border-rose-200 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 ml-2">Gender Orientation</label>
              <div className="grid grid-cols-2 gap-2">
                {genders.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setFormData({ ...formData, gender: g.id })}
                    className={`h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                      formData.gender === g.id 
                      ? 'bg-rose-400 text-white shadow-md' 
                      : 'bg-rose-50/50 text-gray-400 border border-rose-50'
                    }`}
                  >
                    <span>{g.icon}</span>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Birthday */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Biological Rhythms</h3>
          <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-rose-100/30 border border-rose-50 space-y-4">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full h-14 bg-rose-50/50 rounded-2xl px-5 flex items-center justify-between font-bold text-gray-800 border border-rose-50"
            >
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-rose-400" />
                {formData.dob ? format(formData.dob, 'MMM do, yyyy') : 'Select Birthday'}
              </div>
              <span className="text-[10px] text-rose-300 font-bold uppercase">Change</span>
            </button>

            {showDatePicker && (
              <div className="bg-white rounded-2xl border border-rose-50 p-4">
                <DayPicker
                  mode="single"
                  selected={formData.dob}
                  onSelect={(date) => {
                    setFormData({ ...formData, dob: date });
                    setShowDatePicker(false);
                  }}
                  captionLayout="dropdown"
                  fromYear={1950}
                  toYear={new Date().getFullYear()}
                  className="mx-auto"
                />
              </div>
            )}
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Location</h3>
          <div className="bg-white rounded-[32px] p-2 shadow-xl shadow-rose-100/30 border border-rose-50 max-h-60 overflow-y-auto no-scrollbar">
            {countries.map((c) => (
              <button
                key={c.code}
                onClick={() => setFormData({ ...formData, country: c.name })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  formData.country === c.name ? 'bg-rose-50 text-rose-500' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{c.flag}</span>
                <span className="font-bold text-sm flex-1 text-left">{c.name}</span>
                {formData.country === c.name && <Check size={16} />}
              </button>
            ))}
          </div>
        </section>

        <div className="pt-4">
          {error && <p className="text-center text-red-500 font-bold text-xs mb-4">{error}</p>}
          {success && <p className="text-center text-green-500 font-bold text-xs mb-4">Profile updated successfully!</p>}
          
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full h-16 bg-rose-400 text-white font-bold rounded-[24px] shadow-xl shadow-rose-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} strokeWidth={3} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
