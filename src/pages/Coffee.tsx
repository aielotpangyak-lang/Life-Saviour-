import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee as CoffeeIcon, Heart, Sparkles, ArrowRight, IndianRupee, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Coffee = () => {
  const navigate = useNavigate();
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const upiIds = [
    'aielot@airtel',
    'niggaseller@nyes',
    'aielotpangyak@ybl'
  ];

  const supportOptions = [
    { amount: '10', label: 'Chai', desc: 'A warm, comforting cup of tea.' },
    { amount: '50', label: 'Chai with Bread', desc: 'The classic morning breakfast combo.' },
    { amount: '100', label: 'Strawberry Milkshake', desc: 'A sweet treat for maximum inspiration.' },
  ];

  const handlePayment = (amount: string) => {
    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount < 10 || numericAmount > 100000) {
      alert('Please enter an amount between ₹10 and ₹1,00,000');
      return;
    }

    // Pick a random UPI ID from the list
    const randomUpi = upiIds[Math.floor(Math.random() * upiIds.length)];
    
    // Construct UPI URL: upi://pay?pa=address&pn=Name&am=Amount&cu=INR
    const upiUrl = `upi://pay?pa=${randomUpi}&pn=LifeSaviour&am=${amount}&cu=INR&tn=Support%20Life%20Saviour`;
    
    // Attempt to open the UPI app
    window.location.href = upiUrl;

    // Fallback info for non-mobile users
    console.log(`Payment triggered for ₹${amount} to ${randomUpi}`);
  };

  return (
    <div className="max-w-lg mx-auto p-8 space-y-8 pb-32">
      <header className="text-center space-y-4 pt-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-amber-100"
        >
          <CoffeeIcon size={40} strokeWidth={2.5} />
        </motion.div>
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Treat Me</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Support the Developer</p>
        </div>
      </header>

      <section className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-2xl shadow-gray-200/50 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
          <Heart size={24} fill="currentColor" />
        </div>
        <p className="text-gray-600 font-medium leading-relaxed">
          "Life Saviour is a passion project built to help couples grow together. Your support keeps me motivated and covers the cloud hosting costs."
        </p>
      </section>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] px-2 text-center">Menu Card</h3>
        {supportOptions.map((opt, idx) => (
          <motion.button
            key={opt.amount}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handlePayment(opt.amount)}
            className="w-full bg-white p-6 rounded-[32px] border border-gray-50 shadow-lg shadow-gray-100/50 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-amber-200"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center font-black">
                ₹{opt.amount}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{opt.label}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{opt.desc}</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-gray-50 text-gray-300 rounded-xl flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-600 transition-all">
              <ArrowRight size={18} />
            </div>
          </motion.button>
        ))}

        {/* Special Tip Option */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setShowCustomModal(true)}
          className="w-full bg-amber-500 p-6 rounded-[32px] shadow-xl shadow-amber-200 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div className="text-white">
              <h4 className="font-bold">Special Tip</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-80">Enter a custom amount</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center">
            <ArrowRight size={18} />
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowCustomModal(false)}
                className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 transition-all"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto">
                    <IndianRupee size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Custom Tip</h3>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-colors ${
                    (Number(customAmount) > 0 && Number(customAmount) < 10) || Number(customAmount) > 100000 
                      ? 'text-rose-500' 
                      : 'text-gray-400'
                  }`}>
                    {Number(customAmount) > 0 && Number(customAmount) < 10 
                      ? 'Type atleast 10' 
                      : Number(customAmount) > 100000 
                        ? 'Max 1,00,000 allowed' 
                        : 'Your support matters'}
                  </p>
                </div>

                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">₹</span>
                    <input 
                        type="number"
                        placeholder="0"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-3xl py-6 pl-12 pr-6 text-2xl font-black text-gray-800 focus:ring-4 focus:ring-amber-500/10 placeholder:text-gray-200"
                        autoFocus
                    />
                </div>

                <button 
                    disabled={!customAmount || Number(customAmount) < 10 || Number(customAmount) > 100000}
                    onClick={() => {
                        handlePayment(customAmount);
                        setShowCustomModal(false);
                    }}
                    className="w-full py-6 bg-amber-500 disabled:bg-gray-100 disabled:text-gray-300 text-white font-black rounded-3xl shadow-xl shadow-amber-200 disabled:shadow-none flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                >
                    <Send size={16} />
                    Send Support
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <section className="bg-gray-900 rounded-[40px] p-10 shadow-2xl shadow-gray-200 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6 items-center text-center">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <IndianRupee size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Safe & Direct</h3>
            <p className="text-sm font-medium opacity-70 leading-relaxed italic">
              Payments are handled directly via UPI. You'll be redirected to your preferred payment app (GPay, PhonePe, Paytm, etc.) to complete the transaction safely.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Coffee;
