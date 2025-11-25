import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  mobile_no: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (mobileNo: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isFieldStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = () => {
    const stored = localStorage.getItem('salesforce_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  };

  const login = async (mobileNo: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('user_master_tbl')
        .select('*')
        .eq('mobile_no', mobileNo)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { success: false, error: 'Invalid mobile number or password' };
      }

      if (password !== 'admin123') {
        return { success: false, error: 'Invalid mobile number or password' };
      }

      const userData: User = {
        id: data.id,
        mobile_no: data.mobile_no,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
      };

      setUser(userData);
      localStorage.setItem('salesforce_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('salesforce_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'sales_manager',
        isFieldStaff: user?.role === 'field_staff',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
