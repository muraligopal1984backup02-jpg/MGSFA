import { useState } from 'react';
import { Smartphone, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [mobileNo, setMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!mobileNo || !password) {
      setError('Please enter mobile number and password');
      setLoading(false);
      return;
    }

    if (mobileNo.length !== 10) {
      setError('Mobile number must be 10 digits');
      setLoading(false);
      return;
    }

    const result = await login(mobileNo, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-500 p-3 rounded-md">
              <MapPin size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-1">MG-Sales Force</h1>
          <p className="text-orange-400 text-center text-sm font-medium">Field Staff Management System</p>
        </div>

        <div className="p-8">

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="mobile" className="block text-sm font-semibold text-gray-800 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Smartphone size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  id="mobile"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Enter 10 digit mobile number"
                  maxLength={10}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center font-semibold">Demo Credentials:</p>
            <p className="text-xs text-gray-600 text-center mt-1">Admin: 9999999999 / admin123</p>
            <p className="text-xs text-gray-600 text-center">Field Staff: 9876543210 / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
