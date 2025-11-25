import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import RouteForm from './RouteForm';

interface Route {
  id: string;
  route_code: string;
  route_name: string;
  route_description?: string;
  is_active: boolean;
  customer_count?: number;
}

export default function RouteManagement() {
  const { user, isAdmin, isManager } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    filterRoutes();
  }, [searchTerm, routes]);

  const fetchRoutes = async () => {
    try {
      const { data: routeData, error: routeError } = await supabase
        .from('route_master_tbl')
        .select('*')
        .order('route_name');

      if (routeError) throw routeError;

      const { data: customerCounts, error: countError } = await supabase
        .from('route_customer_mapping_tbl')
        .select('route_id, customer_id.count()')
        .eq('is_active', true);

      if (countError) throw countError;

      const countsMap = new Map();
      if (customerCounts) {
        customerCounts.forEach((item: any) => {
          countsMap.set(item.route_id, item.count || 0);
        });
      }

      const routesWithCounts = routeData?.map(route => ({
        ...route,
        customer_count: countsMap.get(route.id) || 0,
      })) || [];

      setRoutes(routesWithCounts);
      setFilteredRoutes(routesWithCounts);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRoutes = () => {
    if (!searchTerm) {
      setFilteredRoutes(routes);
      return;
    }

    const filtered = routes.filter(
      (route) =>
        route.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.route_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoutes(filtered);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setShowForm(true);
  };

  const handleDelete = async (route: Route) => {
    if (!confirm(`Are you sure you want to delete route "${route.route_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('route_master_tbl')
        .delete()
        .eq('id', route.id);

      if (error) throw error;
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route');
    }
  };

  const handleFormClose = (refresh: boolean) => {
    setShowForm(false);
    setSelectedRoute(null);
    if (refresh) fetchRoutes();
  };

  if (!isAdmin && !isManager) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You don't have permission to manage routes.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading routes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Route Management</h2>
          <p className="text-gray-600 mt-1">Manage routes for beat planning</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Route
        </button>
      </div>

      {showForm && (
        <RouteForm route={selectedRoute} onClose={handleFormClose} />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredRoutes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first route'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="text-blue-600" size={20} />
                    <h3 className="text-lg font-bold text-gray-900">{route.route_name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{route.route_code}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    route.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {route.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {route.route_description && (
                <p className="text-sm text-gray-600 mb-4">{route.route_description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm">
                  <span className="text-gray-600">Customers: </span>
                  <span className="font-semibold text-gray-900">{route.customer_count || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(route)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(route)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
