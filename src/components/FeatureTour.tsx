import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, Activity, Info, Heart, ArrowRight, X } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  buttonColor: string;
}

const steps: TourStep[] = [
  {
    title: 'Daily Rhythm',
    description: 'Log your mood and symptoms in seconds. We use this to track your unique biological patterns.',
    icon: Activity,
    color: 'bg-rose-100 text-rose-500',
    buttonColor: 'bg-rose-400'
  },
  {
    title: 'Precision Calendar',
    description: 'Visualize your cycle window. Use "Unsure Mode" if you\'re not exactly certain about your start dates.',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-500',
    buttonColor: 'bg-blue-400'
  },
  {
    title: 'AI Bio-Insights',
    description: 'Get personalized health tips and cycle explanations powered by our smart analytics engine.',
    icon: Info,
    color: 'bg-purple-100 text-purple-500',
    buttonColor: 'bg-purple-400'
  },
  {
    title: 'Couple Connect',
    description: 'Securely link with a partner to share care and support. Sync your heartbeats in real-time.',
    icon: Heart,
    color: 'bg-rose-100 text-rose-500',
    buttonColor: 'bg-rose-400'
  }
];

interface FeatureTourProps {
  onComplete: () => void;
}

const FeatureTour: React.FC<FeatureTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-rose-950/20 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl relative border border-white"
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full flex h-1.5 px-6 pt-4 gap-1.5">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 h-full rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-rose-400' : 'bg-gray-100'}`}
            />
          ))}
        </div>

        <button 
          onClick={onComplete}
          className="absolute top-8 right-8 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-10 pt-16 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className={`w-24 h-24 ${step.color} rounded-[2.5rem] flex items-center justify-center mx-auto shadow-lg`}>
                <step.icon size={44} strokeWidth={2} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles size={14} className="text-rose-300" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300">Guide</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-800">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium px-4">
                  {step.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="w-full mt-12">
            <button
              onClick={handleNext}
              className={`w-full py-5 ${step.buttonColor} text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-xs`}
            >
              {currentStep === steps.length - 1 ? 'Start Your Journey' : 'Next Discovery'}
              <ArrowRight size={18} strokeWidth={3} />
            </button>
            
            <button 
              onClick={onComplete}
              className="mt-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-rose-300 transition-colors"
            >
              Skip Introduction
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureTour;
