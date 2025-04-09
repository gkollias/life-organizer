// contexts/auth-context.tsx
import React, { 
  createContext, 
  useState, 
  useContext, 
  useEffect, 
  ReactNode 
} from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile, 
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

// User Profile Type
interface UserProfile {
  email: string;
  username: string;
  displayName: string;
  createdAt: any;
  updatedAt: any;
  preferences: {
    theme: string;
    notifications: {
      enabled: boolean;
      quiet_hours_start: number;
      quiet_hours_end: number;
    };
  };
  stats: {
    programsCompleted: number;
    activitiesCompleted: number;
    streakDays: number;
  };
}

// Define the type for your auth context
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string;
  setUser: (user: User | null) => void;
  signUp: (email: string, password: string, username: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  clearError: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  updateUserEmail: (newEmail: string, password: string) => Promise<boolean>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  fetchUserProfile: () => Promise<UserProfile | null>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  error: '',
  setUser: () => {},
  signUp: async () => { throw new Error('Not implemented'); },
  signIn: async () => { throw new Error('Not implemented'); },
  signOut: async () => {},
  clearError: () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => false,
  updateUserEmail: async () => false,
  updateUserPassword: async () => false,
  fetchUserProfile: async () => null
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Clear any error message
  const clearError = () => {
    setError('');
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string): Promise<User> => {
    try {
      clearError();
      setLoading(true);
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: username
      });
      
      // Create user document in Firestore
      const userProfileData: UserProfile = {
        email,
        username,
        displayName: username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        preferences: {
          theme: 'system',
          notifications: {
            enabled: true,
            quiet_hours_start: 22, // 10 PM
            quiet_hours_end: 7, // 7 AM
          }
        },
        stats: {
          programsCompleted: 0,
          activitiesCompleted: 0,
          streakDays: 0
        }
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userProfileData);
      
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      clearError();
      setLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      clearError();
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      clearError();
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!user) throw new Error('No authenticated user');

    try {
      clearError();
      setLoading(true);
      
      const userDocRef = doc(db, 'users', user.uid);
      
      // Update firestore profile
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      // Update auth profile if name is changed
      if (data.displayName) {
        await updateProfile(user, {
          displayName: data.displayName
        });
      }
      
      // Refresh user profile
      await fetchUserProfile();
      
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user email
  const updateUserEmail = async (newEmail: string, password: string): Promise<boolean> => {
    if (!user) throw new Error('No authenticated user');

    try {
      clearError();
      setLoading(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update auth email
      await updateEmail(user, newEmail);
      
      // Update Firestore email
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
      
      // Refresh user profile
      await fetchUserProfile();
      
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user password
  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) throw new Error('No authenticated user');

    try {
      clearError();
      setLoading(true);
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's profile data from Firestore
  const fetchUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setUserProfile(userData);
        return userData;
      } else {
        console.log('No user profile found');
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        fetchUserProfile();
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    setUser,
    signUp,
    signIn,
    signOut,
    clearError,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    fetchUserProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}