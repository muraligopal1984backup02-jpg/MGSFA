import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CollectionForm from './CollectionForm';

interface Collection {
  id: string;
  collection_no: string;
  collection_date: string;
  amount: number;
  payment_mode: string;
  collection_status: string;
  customer_master_tbl: {
    customer_name: string;
    customer_code: string;
  };
}

export default function CollectionManagement() {
  const { user, isAdmin, isManager } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      let query = supabase
        .from('collection_detail_tbl')
        .select(`
          *,
          customer_master_tbl (customer_name, customer_code)
        `)
        .order('collection_date', { ascending: false });

      if (!isAdmin && !isManager) {
        query = query.eq('collected_by', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter(
    (c) =>
      c.collection_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_master_tbl.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      cleared: 'bg-green-100 text-green-700',
      bounced: 'bg-red-100 text-red-700',
    };
    return colors[status] || colors.pending;
  };

  const getPaymentModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-100 text-green-700',
      cheque: 'bg-blue-100 text-blue-700',
      upi: 'bg-purple-100 text-purple-700',
      neft: 'bg-orange-100 text-orange-700',
      card: 'bg-pink-100 text-pink-700',
    };
    return colors[mode] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading collections...</div>;
  }

  return (
    <>
      {showForm && (
        <CollectionForm onClose={() => setShowForm(false)} onSuccess={fetchCollections} />
      )}
      <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Collections</h2>
          <p className="text-gray-600">{collections.length} total collections</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Collection
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search collections..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredCollections.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No collections found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollections.map((collection) => (
            <div key={collection.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{collection.collection_no}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(collection.collection_status)}`}>
                      {collection.collection_status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPaymentModeColor(collection.payment_mode)}`}>
                      {collection.payment_mode.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Customer: {collection.customer_master_tbl.customer_name}</p>
                  <p className="text-sm text-gray-600">Code: {collection.customer_master_tbl.customer_code}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(collection.collection_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount Collected</p>
                  <p className="text-2xl font-bold text-green-600">₹{collection.amount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
