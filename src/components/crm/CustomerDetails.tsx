import { useState, useEffect } from 'react';
import { ArrowLeft, User, MapPin, Image, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CustomerLocationCapture from './CustomerLocationCapture';
import CustomerImageUpload from './CustomerImageUpload';

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

interface Props {
  customerId: string;
  onBack: () => void;
}

type Tab = 'info' | 'media' | 'activity';

export default function CustomerDetails({ customerId, onBack }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_master_tbl')
        .select(`
          *,
          assigned_users:customer_user_assignments_tbl(
            user_id,
            user:user_master_tbl!customer_user_assignments_tbl_user_id_fkey(full_name)
          )
        `)
        .eq('id', customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading customer details...</div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Customer not found</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: 'info', label: 'Basic Info', icon: User },
    { id: 'media', label: 'Location & Images', icon: MapPin },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{customer.customer_name}</h2>
          <p className="text-gray-600">{customer.customer_code}</p>
        </div>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {customer.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div>
        {activeTab === 'info' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Owner Name</p>
                <p className="font-medium text-gray-900">{customer.owner_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Contact Person</p>
                <p className="font-medium text-gray-900">{customer.contact_person || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Mobile Number</p>
                <p className="font-medium text-gray-900">{customer.mobile_no}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900">{customer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer Type</p>
                <span
                  className={`inline-block px-2 py-1 text-sm rounded ${
                    customer.customer_type === 'retail'
                      ? 'bg-green-100 text-green-700'
                      : customer.customer_type === 'wholesale'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {customer.customer_type}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Credit Limit</p>
                <p className="font-medium text-gray-900">₹{customer.credit_limit.toLocaleString()}</p>
              </div>
              {customer.assigned_users && customer.assigned_users.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-2">Assigned To</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.assigned_users.map((assignment, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                      >
                        {assignment.user.full_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(customer.address_line1 || customer.city) && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <div className="space-y-1">
                    {customer.address_line1 && (
                      <p className="font-medium text-gray-900">{customer.address_line1}</p>
                    )}
                    {customer.address_line2 && (
                      <p className="font-medium text-gray-900">{customer.address_line2}</p>
                    )}
                    {customer.address_line3 && (
                      <p className="font-medium text-gray-900">{customer.address_line3}</p>
                    )}
                    {(customer.city || customer.state || customer.pincode) && (
                      <p className="font-medium text-gray-900">
                        {[customer.city, customer.state, customer.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <CustomerLocationCapture customerId={customerId} />
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <CustomerImageUpload customerId={customerId} />
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Activity size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Activity History</h3>
            <p className="text-gray-600">Activity tracking feature coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
