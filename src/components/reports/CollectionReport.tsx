import { useState, useEffect } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CollectionReport {
  id: string;
  collection_no: string;
  collection_date: string;
  amount: number;
  payment_mode: string;
  payment_reference: string | null;
  collection_status: string;
  customer_master_tbl: {
    customer_code: string;
    customer_name: string;
    customer_type: string;
  };
  sale_order_header_tbl: {
    order_no: string;
  } | null;
  user_master_tbl: {
    full_name: string;
  } | null;
}

export default function CollectionReport() {
  const [collections, setCollections] = useState<CollectionReport[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<CollectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    paymentMode: '',
    collectionStatus: '',
    customerType: '',
    searchTerm: '',
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [collections, filters]);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collection_detail_tbl')
        .select(`
          *,
          customer_master_tbl (customer_code, customer_name, customer_type),
          sale_order_header_tbl (order_no),
          user_master_tbl:collected_by (full_name)
        `)
        .order('collection_date', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...collections];

    if (filters.fromDate) {
      filtered = filtered.filter(c => c.collection_date >= filters.fromDate);
    }

    if (filters.toDate) {
      filtered = filtered.filter(c => c.collection_date <= filters.toDate);
    }

    if (filters.paymentMode) {
      filtered = filtered.filter(c => c.payment_mode === filters.paymentMode);
    }

    if (filters.collectionStatus) {
      filtered = filtered.filter(c => c.collection_status === filters.collectionStatus);
    }

    if (filters.customerType) {
      filtered = filtered.filter(c => c.customer_master_tbl.customer_type === filters.customerType);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.collection_no.toLowerCase().includes(term) ||
          c.customer_master_tbl.customer_name.toLowerCase().includes(term) ||
          c.customer_master_tbl.customer_code.toLowerCase().includes(term) ||
          (c.payment_reference && c.payment_reference.toLowerCase().includes(term))
      );
    }

    setFilteredCollections(filtered);
  };

  const calculateTotals = () => {
    const totalAmount = filteredCollections.reduce((sum, c) => sum + Number(c.amount), 0);
    const byPaymentMode = filteredCollections.reduce((acc, c) => {
      acc[c.payment_mode] = (acc[c.payment_mode] || 0) + Number(c.amount);
      return acc;
    }, {} as Record<string, number>);

    return { totalAmount, byPaymentMode };
  };

  const exportToCSV = () => {
    const headers = [
      'Collection No',
      'Date',
      'Customer Code',
      'Customer Name',
      'Customer Type',
      'Amount',
      'Payment Mode',
      'Reference',
      'Status',
      'Order No',
      'Collected By',
    ];

    const rows = filteredCollections.map(c => [
      c.collection_no,
      c.collection_date,
      c.customer_master_tbl.customer_code,
      c.customer_master_tbl.customer_name,
      c.customer_master_tbl.customer_type,
      c.amount,
      c.payment_mode,
      c.payment_reference || '',
      c.collection_status,
      c.sale_order_header_tbl?.order_no || '',
      c.user_master_tbl?.full_name || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totals = calculateTotals();

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading collections...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collection Report</h2>
          <p className="text-gray-600">{filteredCollections.length} collections</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={e => setFilters({ ...filters, toDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select
              value={filters.paymentMode}
              onChange={e => setFilters({ ...filters, paymentMode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.collectionStatus}
              onChange={e => setFilters({ ...filters, collectionStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
            <select
              value={filters.customerType}
              onChange={e => setFilters({ ...filters, customerType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="">All Types</option>
              <option value="retail">Retail</option>
              <option value="dealer">Dealer</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
                placeholder="Collection/Customer..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Total Collections</p>
          <p className="text-3xl font-bold text-blue-600">₹{totals.totalAmount.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">By Payment Mode</p>
          <div className="space-y-2">
            {Object.entries(totals.byPaymentMode).map(([mode, amount]) => (
              <div key={mode} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{mode}:</span>
                <span className="text-sm font-medium text-gray-900">₹{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filteredCollections.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No collections found for the selected filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCollections.map(collection => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{collection.collection_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(collection.collection_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {collection.customer_master_tbl.customer_name}
                      <div className="text-xs text-gray-500">{collection.customer_master_tbl.customer_code}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {collection.customer_master_tbl.customer_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                      ₹{Number(collection.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{collection.payment_mode}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{collection.payment_reference || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          collection.collection_status === 'cleared'
                            ? 'bg-green-100 text-green-700'
                            : collection.collection_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {collection.collection_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {collection.sale_order_header_tbl?.order_no || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
