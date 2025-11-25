import { useState, useEffect } from 'react';
import { Save, Users, MapPin, X, Plus, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Route {
  id: string;
  route_code: string;
  route_name: string;
}

interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  city: string;
}

interface RouteCustomerMapping {
  id?: string;
  route_id: string;
  customer_id: string;
  visit_sequence: number;
  customer?: Customer;
}

export default function RouteCustomerMapping() {
  const { user, isAdmin, isManager } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [mappedCustomers, setMappedCustomers] = useState<RouteCustomerMapping[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchRouteMappings(selectedRoute);
    } else {
      setMappedCustomers([]);
    }
  }, [selectedRoute]);

  useEffect(() => {
    updateAvailableCustomers();
  }, [customers, mappedCustomers]);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('route_master_tbl')
        .select('id, route_code, route_name')
        .eq('is_active', true)
        .order('route_name');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_master_tbl')
        .select('id, customer_code, customer_name, city')
        .eq('is_active', true)
        .order('customer_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchRouteMappings = async (routeId: string) => {
    try {
      const { data, error } = await supabase
        .from('route_customer_mapping_tbl')
        .select(`
          id,
          route_id,
          customer_id,
          visit_sequence,
          customer:customer_master_tbl(id, customer_code, customer_name, city)
        `)
        .eq('route_id', routeId)
        .eq('is_active', true)
        .order('visit_sequence');

      if (error) throw error;

      const mappings = data?.map(item => ({
        id: item.id,
        route_id: item.route_id,
        customer_id: item.customer_id,
        visit_sequence: item.visit_sequence,
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
      })) || [];

      setMappedCustomers(mappings);
    } catch (error) {
      console.error('Error fetching route mappings:', error);
    }
  };

  const updateAvailableCustomers = () => {
    const mappedCustomerIds = new Set(mappedCustomers.map(m => m.customer_id));
    const available = customers.filter(c => !mappedCustomerIds.has(c.id));
    setAvailableCustomers(available);
  };

  const handleAddCustomer = async () => {
    if (!selectedRoute || !selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    setLoading(true);
    try {
      const maxSequence = mappedCustomers.length > 0
        ? Math.max(...mappedCustomers.map(m => m.visit_sequence))
        : 0;

      const { error } = await supabase.from('route_customer_mapping_tbl').insert([
        {
          route_id: selectedRoute,
          customer_id: selectedCustomer,
          visit_sequence: maxSequence + 1,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      await fetchRouteMappings(selectedRoute);
      setSelectedCustomer('');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer to route');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCustomer = async (mappingId: string) => {
    if (!confirm('Are you sure you want to remove this customer from the route?')) return;

    try {
      const { error } = await supabase
        .from('route_customer_mapping_tbl')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      await fetchRouteMappings(selectedRoute);
    } catch (error) {
      console.error('Error removing customer:', error);
      alert('Failed to remove customer');
    }
  };

  const handleSequenceChange = async (mappingId: string, newSequence: number) => {
    if (newSequence < 1) return;

    try {
      const { error } = await supabase
        .from('route_customer_mapping_tbl')
        .update({ visit_sequence: newSequence, updated_at: new Date().toISOString() })
        .eq('id', mappingId);

      if (error) throw error;
      await fetchRouteMappings(selectedRoute);
    } catch (error) {
      console.error('Error updating sequence:', error);
      alert('Failed to update sequence');
    }
  };

  if (!isAdmin && !isManager) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You don't have permission to manage route-customer mappings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Route Customer Mapping</h2>
        <p className="text-gray-600 mt-1">Assign customers to routes with visit sequence</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Route <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          >
            <option value="">Choose a route...</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.route_name} ({r.route_code})
              </option>
            ))}
          </select>
        </div>

        {selectedRoute && (
          <div className="flex gap-3">
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              <option value="">Choose a customer to add...</option>
              {availableCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} - {c.customer_code} ({c.city})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddCustomer}
              disabled={loading || !selectedCustomer}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              <Plus size={18} />
              Add
            </button>
          </div>
        )}
      </div>

      {selectedRoute && mappedCustomers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Mapped Customers ({mappedCustomers.length})
          </h3>
          <div className="space-y-2">
            {mappedCustomers.map((mapping, index) => (
              <div
                key={mapping.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <GripVertical className="text-gray-400" size={20} />
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={mapping.visit_sequence}
                    onChange={(e) => handleSequenceChange(mapping.id!, parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{mapping.customer?.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    {mapping.customer?.customer_code} • {mapping.customer?.city}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveCustomer(mapping.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRoute && mappedCustomers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers assigned yet</h3>
          <p className="text-gray-600">Select customers from the dropdown above to add them to this route</p>
        </div>
      )}
    </div>
  );
}
