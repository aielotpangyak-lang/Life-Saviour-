import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider } from './lib/LanguageContext';
import Navbar from './components/layout/Navbar';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Histories = React.lazy(() => import('./pages/Histories'));
const Coffee = React.lazy(() => import('./pages/Coffee'));
const Couple = React.lazy(() => import('./pages/Couple'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Logger = React.lazy(() => import('./pages/Logger'));
const Splash = React.lazy(() => import('./pages/Splash'));

const Notifications = React.lazy(() => import('./pages/Notifications'));
const Profile = React.lazy(() => import('./pages/Profile'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (profile && !profile.isOnboarded) return <Navigate to="/onboarding" />;
  
  return (
    <div className="pb-20 min-h-screen bg-[#FFF9F9]">
      {children}
      <Navbar />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <React.Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#FFF9F9] font-bold text-rose-400">Softly loading...</div>}>
            <Routes>
              <Route path="/splash" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/histories" element={<ProtectedRoute><Histories /></ProtectedRoute>} />
              <Route path="/coffee" element={<ProtectedRoute><Coffee /></ProtectedRoute>} />
              <Route path="/logger" element={<ProtectedRoute><Logger /></ProtectedRoute>} />
              <Route path="/couple" element={<ProtectedRoute><Couple /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
