import { useState, useEffect } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrderReport {
  id: string;
  order_no: string;
  order_date: string;
  order_status: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  net_amount: number;
  customer_master_tbl: {
    customer_code: string;
    customer_name: string;
    customer_type: string;
  };
  user_master_tbl: {
    full_name: string;
  } | null;
}

export default function OrderReport() {
  const [orders, setOrders] = useState<OrderReport[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    customerType: '',
    orderStatus: '',
    searchTerm: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('sale_order_header_tbl')
        .select(`
          *,
          customer_master_tbl (customer_code, customer_name, customer_type),
          user_master_tbl (full_name)
        `)
        .order('order_date', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.fromDate) {
      filtered = filtered.filter(o => o.order_date >= filters.fromDate);
    }

    if (filters.toDate) {
      filtered = filtered.filter(o => o.order_date <= filters.toDate);
    }

    if (filters.customerType) {
      filtered = filtered.filter(o => o.customer_master_tbl.customer_type === filters.customerType);
    }

    if (filters.orderStatus) {
      filtered = filtered.filter(o => o.order_status === filters.orderStatus);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.order_no.toLowerCase().includes(term) ||
          o.customer_master_tbl.customer_name.toLowerCase().includes(term) ||
          o.customer_master_tbl.customer_code.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  };

  const calculateTotals = () => {
    return filteredOrders.reduce(
      (acc, order) => ({
        totalAmount: acc.totalAmount + Number(order.total_amount),
        discountAmount: acc.discountAmount + Number(order.discount_amount),
        taxAmount: acc.taxAmount + Number(order.tax_amount),
        netAmount: acc.netAmount + Number(order.net_amount),
      }),
      { totalAmount: 0, discountAmount: 0, taxAmount: 0, netAmount: 0 }
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Order No',
      'Order Date',
      'Customer Code',
      'Customer Name',
      'Customer Type',
      'Status',
      'Total Amount',
      'Discount',
      'Tax',
      'Net Amount',
      'Created By',
    ];

    const rows = filteredOrders.map(o => [
      o.order_no,
      o.order_date,
      o.customer_master_tbl.customer_code,
      o.customer_master_tbl.customer_name,
      o.customer_master_tbl.customer_type,
      o.order_status,
      o.total_amount,
      o.discount_amount,
      o.tax_amount,
      o.net_amount,
      o.user_master_tbl?.full_name || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totals = calculateTotals();

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading orders...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Order Report</h2>
          <p className="text-gray-600">{filteredOrders.length} orders</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
            <select
              value={filters.orderStatus}
              onChange={e => setFilters({ ...filters, orderStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
                placeholder="Order/Customer..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-xl font-bold text-gray-900">₹{totals.totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Discount</p>
            <p className="text-xl font-bold text-red-600">₹{totals.discountAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tax</p>
            <p className="text-xl font-bold text-gray-900">₹{totals.taxAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Net Amount</p>
            <p className="text-xl font-bold text-blue-600">₹{totals.netAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No orders found for the selected filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {order.customer_master_tbl.customer_name}
                      <div className="text-xs text-gray-500">{order.customer_master_tbl.customer_code}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {order.customer_master_tbl.customer_type}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          order.order_status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : order.order_status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      ₹{Number(order.discount_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      ₹{Number(order.tax_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                      ₹{Number(order.net_amount).toLocaleString()}
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
