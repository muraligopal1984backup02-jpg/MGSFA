import { useState, useEffect } from 'react';
import { MapPin, Loader, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLocation, GeolocationData } from '../../lib/mediaUtils';

interface Props {
  customerId: string;
}

interface LocationRecord {
  id: string;
  latitude: number;
  longitude: number;
  location_accuracy: number;
  captured_at: string;
}

export default function CustomerLocationCapture({ customerId }: Props) {
  const { user } = useAuth();
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [savedLocation, setSavedLocation] = useState<LocationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSavedLocation();
  }, [customerId]);

  const fetchSavedLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_media_tbl')
        .select('id, latitude, longitude, location_accuracy, captured_at')
        .eq('customer_id', customerId)
        .eq('media_type', 'location')
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSavedLocation({
          id: data.id,
          latitude: data.latitude,
          longitude: data.longitude,
          location_accuracy: data.location_accuracy,
          captured_at: data.captured_at,
        });
      }
    } catch (err) {
      console.error('Error fetching saved location:', err);
    }
  };

  const handleCaptureLocation = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!location) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      if (savedLocation) {
        const { error } = await supabase
          .from('customer_media_tbl')
          .update({
            latitude: location.latitude,
            longitude: location.longitude,
            location_accuracy: location.accuracy,
            captured_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', savedLocation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('customer_media_tbl').insert({
          customer_id: customerId,
          media_type: 'location',
          latitude: location.latitude,
          longitude: location.longitude,
          location_accuracy: location.accuracy,
          uploaded_by: user?.id,
        });

        if (error) throw error;
      }

      setSuccess(true);
      await fetchSavedLocation();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCoordinate = (value: number, decimals: number = 6) => {
    return value.toFixed(decimals);
  };

  const displayLocation = location || savedLocation;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Customer Location</h3>
        <button
          onClick={handleCaptureLocation}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Capturing...
            </>
          ) : (
            <>
              <MapPin size={18} />
              {savedLocation ? 'Update Location' : 'Capture Location'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check size={20} className="text-green-600" />
          <p className="text-green-900 font-medium">Location saved successfully!</p>
        </div>
      )}

      {displayLocation && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Latitude</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCoordinate(displayLocation.latitude)}°
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Longitude</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCoordinate(displayLocation.longitude)}°
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-lg font-semibold text-gray-900">
                {Math.round(displayLocation.location_accuracy || displayLocation.accuracy)} meters
              </p>
            </div>
            {savedLocation && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Captured At</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(savedLocation.captured_at)}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <a
              href={`https://www.google.com/maps?q=${displayLocation.latitude},${displayLocation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <MapPin size={16} />
              View on Google Maps
            </a>
          </div>

          {location && !success && (
            <div className="mt-4">
              <button
                onClick={handleSaveLocation}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Save Location
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {!displayLocation && !loading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">No location captured yet</p>
          <p className="text-sm text-gray-500">
            Click "Capture Location" to record the customer's GPS coordinates
          </p>
        </div>
      )}
    </div>
  );
}
