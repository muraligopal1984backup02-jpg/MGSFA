import { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit2, MapPin, Upload, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CustomerForm from './CustomerForm';
import CustomerDetails from './CustomerDetails';
import BulkCustomerUpload from '../admin/BulkCustomerUpload';

interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  contact_person: string;
  mobile_no: string;
  email: string;
  customer_type: string;
  credit_limit: number;
  address_line1?: string;
  address_line2?: string;
  address_line3?: string;
  city?: string;
  state?: string;
  pincode?: string;
  owner_name?: string;
  assigned_users?: Array<{
    user_id: string;
    user: {
      full_name: string;
    };
  }>;
  is_active: boolean;
}

export default function CustomerManagement() {
  const { user, isAdmin, isManager } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      let query = supabase
        .from('customer_master_tbl')
        .select(`
          *,
          assigned_users:customer_user_assignments_tbl(
            user_id,
            user:user_master_tbl!customer_user_assignments_tbl_user_id_fkey(full_name)
          )
        `)
        .order('customer_name');

      if (!isAdmin && !isManager) {
        const { data: userAssignments } = await supabase
          .from('customer_user_assignments_tbl')
          .select('customer_id')
          .eq('user_id', user?.id);

        const customerIds = userAssignments?.map(a => a.customer_id) || [];
        if (customerIds.length > 0) {
          query = query.in('id', customerIds);
        } else {
          setCustomers([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(term) ||
        c.customer_code.toLowerCase().includes(term) ||
        c.mobile_no.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term))
    );
    setFilteredCustomers(filtered);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormClose = (refresh: boolean) => {
    setShowForm(false);
    setEditingCustomer(null);
    if (refresh) {
      fetchCustomers();
    }
  };

  const handleViewDetails = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowDetails(true);
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedCustomerId(null);
    fetchCustomers();
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading customers...</div>;
  }

  if (showForm) {
    return <CustomerForm customer={editingCustomer} onClose={handleFormClose} />;
  }

  if (showDetails && selectedCustomerId) {
    return <CustomerDetails customerId={selectedCustomerId} onBack={handleDetailsClose} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600">{customers.length} total customers</p>
        </div>
        <div className="flex gap-2">
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload size={20} />
              Bulk Upload
            </button>
          )}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, mobile or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{customer.customer_name}</h3>
                  <p className="text-sm text-gray-600">{customer.customer_code}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleViewDetails(customer.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {customer.owner_name && (
                  <div>
                    <p className="text-gray-600">Owner</p>
                    <p className="font-medium text-gray-900">{customer.owner_name}</p>
                  </div>
                )}
                {customer.assigned_users && customer.assigned_users.length > 0 && (
                  <div>
                    <p className="text-gray-600">Assigned To</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.assigned_users.map((assignment, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          {assignment.user.full_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Contact</p>
                  <p className="font-medium text-gray-900">{customer.contact_person}</p>
                </div>
                <div>
                  <p className="text-gray-600">Mobile</p>
                  <p className="font-medium text-gray-900">{customer.mobile_no}</p>
                </div>
                {customer.email && (
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900 truncate">{customer.email}</p>
                  </div>
                )}
                {(customer.city || customer.state) && (
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">
                      {[customer.city, customer.state, customer.pincode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    customer.customer_type === 'retail' ? 'bg-green-100 text-green-700' :
                    customer.customer_type === 'wholesale' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {customer.customer_type}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBulkUpload && (
        <BulkCustomerUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            fetchCustomers();
            setShowBulkUpload(false);
          }}
        />
      )}
    </div>
  );
}
