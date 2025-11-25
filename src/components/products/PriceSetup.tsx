import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import BulkPriceUpload from '../admin/BulkPriceUpload';

interface Price {
  id: string;
  customer_type: string;
  price: number;
  discount_percentage: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  product_master_tbl: {
    product_code: string;
    product_name: string;
  };
}

export default function PriceSetup() {
  const { isAdmin, isManager } = useAuth();
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from('product_price_tbl')
        .select(`
          *,
          product_master_tbl (product_code, product_name)
        `)
        .order('effective_from', { ascending: false });

      if (error) throw error;
      setPrices(data || []);
    } catch (err) {
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrices = prices.filter(
    (p) =>
      p.product_master_tbl.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_master_tbl.product_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      retail: 'Retail',
      dealer: 'Dealer',
      distributor: 'Distributor',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading prices...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Price Setup</h2>
          <p className="text-gray-600">{prices.length} price configurations</p>
        </div>
        <div className="flex gap-2">
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Upload size={20} />
              Bulk Upload
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={20} />
            Add Price
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
            placeholder="Search by product..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredPrices.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No prices found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount %
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrices.map((price) => {
                  const netPrice = price.price * (1 - price.discount_percentage / 100);
                  return (
                    <tr key={price.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {price.product_master_tbl.product_code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {price.product_master_tbl.product_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCustomerTypeLabel(price.customer_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ₹{price.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {price.discount_percentage}%
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        ₹{netPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(price.effective_from).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            price.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {price.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBulkUpload && (
        <BulkPriceUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            fetchPrices();
            setShowBulkUpload(false);
          }}
        />
      )}
    </div>
  );
}
