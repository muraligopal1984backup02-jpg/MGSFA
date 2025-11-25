import { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface UserLocation {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy: number;
  battery_level: number;
  user_master_tbl: {
    full_name: string;
    mobile_no: string;
    role: string;
  };
}

export default function LocationTracking() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tracking) {
      startTracking();
    }
  }, [tracking]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_location_tbl')
        .select(`
          *,
          user_master_tbl:user_master_tbl (full_name, mobile_no, role)
        `)
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const latestLocations = new Map<string, UserLocation>();
      (data || []).forEach((loc: UserLocation) => {
        if (!latestLocations.has(loc.user_master_tbl.mobile_no)) {
          latestLocations.set(loc.user_master_tbl.mobile_no, loc);
        }
      });

      setLocations(Array.from(latestLocations.values()));
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            await supabase.from('user_location_tbl').insert([
              {
                user_id: user?.id,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                battery_level: 100,
              },
            ]);
          } catch (err) {
            console.error('Error saving location:', err);
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  };

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading location data...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Field Staff Location Tracking</h2>
          <p className="text-gray-600">{locations.length} staff members tracked</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTracking(!tracking)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              tracking
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Navigation size={20} />
            {tracking ? 'Tracking On' : 'Start Tracking'}
          </button>
          <button
            onClick={fetchLocations}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No location data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{loc.user_master_tbl.full_name}</h3>
                  <p className="text-sm text-gray-600">{loc.user_master_tbl.mobile_no}</p>
                  <p className="text-xs text-gray-500 capitalize">{loc.user_master_tbl.role.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-gray-900">{getTimeSince(loc.recorded_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium text-gray-900">{Math.round(loc.accuracy)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Battery:</span>
                  <span className="font-medium text-gray-900">{loc.battery_level}%</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View on Map
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
