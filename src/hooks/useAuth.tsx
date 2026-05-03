import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      if (authenticatedUser) {
        const userRef = doc(db, 'users', authenticatedUser.uid);
        
        // Use onSnapshot for real-time updates
        unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data());
          } else {
            // Profile doesn't exist yet, create it (one-time)
            const newProfile = {
              uid: authenticatedUser.uid,
              email: authenticatedUser.email,
              displayName: authenticatedUser.displayName || '',
              photoURL: authenticatedUser.photoURL || '',
              dob: '',
              country: '',
              gender: 'female',
              age: 0,
              isOnboarded: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              cycleSettings: {
                avgCycleDays: 28,
                avgPeriodDays: 5,
                lastPeriodDate: new Date().toISOString().split('T')[0]
              },
              role: 'owner'
            };
            await setDoc(userRef, newProfile);
            // The snapshot listener will trigger again after setDoc
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile listen error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
