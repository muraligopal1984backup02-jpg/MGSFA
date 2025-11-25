import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Route {
  id?: string;
  route_code: string;
  route_name: string;
  route_description?: string;
  is_active: boolean;
}

interface Props {
  route: Route | null;
  onClose: (refresh: boolean) => void;
}

export default function RouteForm({ route, onClose }: Props) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Route>({
    route_code: '',
    route_name: '',
    route_description: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (route) {
      setFormData(route);
    }
  }, [route]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (route) {
        const { error: updateError } = await supabase
          .from('route_master_tbl')
          .update({
            route_name: formData.route_name,
            route_description: formData.route_description,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', route.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('route_master_tbl').insert([
          {
            ...formData,
            created_by: user?.id,
          },
        ]);

        if (insertError) throw insertError;
      }

      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {route ? 'Edit Route' : 'Add New Route'}
        </h2>
        <button
          onClick={() => onClose(false)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Route Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={!!route}
            value={formData.route_code}
            onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none disabled:bg-gray-100"
            placeholder="e.g., R001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Route Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.route_name}
            onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            placeholder="e.g., Downtown Route"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Route Description
          </label>
          <textarea
            value={formData.route_description}
            onChange={(e) => setFormData({ ...formData, route_description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            placeholder="Describe the route coverage area..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Route'}
          </button>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
