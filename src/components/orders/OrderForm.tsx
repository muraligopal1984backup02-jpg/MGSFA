import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface OrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  customer_type: string;
}

interface Product {
  id: string;
  product_code: string;
  product_name: string;
  unit_of_measure: string;
  gst_rate: number;
}

interface ProductPrice {
  price: number;
  discount_percentage: number;
}

interface OrderLine {
  product_id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  discount_percentage: string;
  tax_percentage: string;
  line_total: number;
}

export default function OrderForm({ onClose, onSuccess }: OrderFormProps) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    order_status: 'draft',
    notes: '',
  });
  const [orderLines, setOrderLines] = useState<OrderLine[]>([
    { product_id: '', product_name: '', quantity: '1', unit_price: '0', discount_percentage: '0', tax_percentage: '0', line_total: 0 }
  ]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (formData.customer_id) {
      const customer = customers.find(c => c.id === formData.customer_id);
      setSelectedCustomer(customer || null);
    }
  }, [formData.customer_id, customers]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_master_tbl')
        .select('id, customer_code, customer_name, customer_type')
        .eq('is_active', true)
        .order('customer_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('product_master_tbl')
        .select('id, product_code, product_name, unit_of_measure, gst_rate')
        .eq('is_active', true)
        .order('product_name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchProductPrice = async (productId: string, customerType: string): Promise<ProductPrice | null> => {
    try {
      const { data, error } = await supabase
        .from('product_price_tbl')
        .select('price, discount_percentage')
        .eq('product_id', productId)
        .eq('customer_type', customerType)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching product price:', err);
      return null;
    }
  };

  const handleProductChange = async (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newLines = [...orderLines];
    newLines[index].product_id = productId;
    newLines[index].product_name = product.product_name;
    newLines[index].tax_percentage = product.gst_rate.toString();

    if (selectedCustomer) {
      const price = await fetchProductPrice(productId, selectedCustomer.customer_type);
      if (price) {
        newLines[index].unit_price = price.price.toString();
        newLines[index].discount_percentage = price.discount_percentage.toString();
      }
    }

    calculateLineTotal(newLines, index);
    setOrderLines(newLines);
  };

  const handleLineChange = (index: number, field: keyof OrderLine, value: string) => {
    const newLines = [...orderLines];
    newLines[index] = { ...newLines[index], [field]: value };
    calculateLineTotal(newLines, index);
    setOrderLines(newLines);
  };

  const calculateLineTotal = (lines: OrderLine[], index: number) => {
    const line = lines[index];
    const quantity = parseFloat(line.quantity) || 0;
    const unitPrice = parseFloat(line.unit_price) || 0;
    const discountPct = parseFloat(line.discount_percentage) || 0;
    const taxPct = parseFloat(line.tax_percentage) || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discountPct / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPct / 100);
    const total = taxableAmount + taxAmount;

    lines[index].line_total = total;
  };

  const addLine = () => {
    setOrderLines([...orderLines, {
      product_id: '',
      product_name: '',
      quantity: '1',
      unit_price: '0',
      discount_percentage: '0',
      tax_percentage: '0',
      line_total: 0
    }]);
  };

  const removeLine = (index: number) => {
    if (orderLines.length > 1) {
      setOrderLines(orderLines.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const totalAmount = orderLines.reduce((sum, line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unit_price) || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    const discountAmount = orderLines.reduce((sum, line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unit_price) || 0;
      const discountPct = parseFloat(line.discount_percentage) || 0;
      return sum + (quantity * unitPrice * discountPct / 100);
    }, 0);

    const taxAmount = orderLines.reduce((sum, line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unit_price) || 0;
      const discountPct = parseFloat(line.discount_percentage) || 0;
      const taxPct = parseFloat(line.tax_percentage) || 0;
      const taxableAmount = (quantity * unitPrice) * (1 - discountPct / 100);
      return sum + (taxableAmount * taxPct / 100);
    }, 0);

    const netAmount = orderLines.reduce((sum, line) => sum + line.line_total, 0);

    return { totalAmount, discountAmount, taxAmount, netAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    if (orderLines.length === 0 || orderLines.every(line => !line.product_id)) {
      alert('Please add at least one product');
      return;
    }

    setSubmitting(true);

    try {
      const orderNo = `ORD${Date.now()}`;
      const totals = calculateTotals();

      const { data: orderData, error: orderError } = await supabase
        .from('sale_order_header_tbl')
        .insert([{
          order_no: orderNo,
          customer_id: formData.customer_id,
          order_date: formData.order_date,
          delivery_date: formData.delivery_date || null,
          order_status: formData.order_status,
          total_amount: totals.totalAmount,
          discount_amount: totals.discountAmount,
          tax_amount: totals.taxAmount,
          net_amount: totals.netAmount,
          notes: formData.notes || null,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const lineItems = orderLines
        .filter(line => line.product_id)
        .map((line, index) => {
          const quantity = parseFloat(line.quantity) || 0;
          const unitPrice = parseFloat(line.unit_price) || 0;
          const discountPct = parseFloat(line.discount_percentage) || 0;
          const taxPct = parseFloat(line.tax_percentage) || 0;
          const subtotal = quantity * unitPrice;
          const discountAmount = subtotal * (discountPct / 100);
          const taxableAmount = subtotal - discountAmount;
          const taxAmount = taxableAmount * (taxPct / 100);

          return {
            order_id: orderData.id,
            line_no: index + 1,
            product_id: line.product_id,
            quantity,
            unit_price: unitPrice,
            discount_percentage: discountPct,
            discount_amount: discountAmount,
            tax_percentage: taxPct,
            tax_amount: taxAmount,
            line_total: line.line_total,
          };
        });

      const { error: linesError } = await supabase
        .from('sale_order_detail_tbl')
        .insert(lineItems);

      if (linesError) throw linesError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Failed to create order');
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select
                value={formData.order_status}
                onChange={(e) => setFormData({ ...formData, order_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Disc %</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Tax %</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderLines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <select
                          value={line.product_id}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          required
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_name} ({p.unit_of_measure})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                          required
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={line.unit_price}
                          onChange={(e) => handleLineChange(index, 'unit_price', e.target.value)}
                          required
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={line.discount_percentage}
                          onChange={(e) => handleLineChange(index, 'discount_percentage', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={line.tax_percentage}
                          onChange={(e) => handleLineChange(index, 'tax_percentage', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium">
                        ₹{line.line_total.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={orderLines.length === 1}
                          className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 max-w-md ml-auto">
              <div className="text-sm font-medium text-gray-700">Gross Amount:</div>
              <div className="text-sm text-right">₹{totals.totalAmount.toFixed(2)}</div>

              <div className="text-sm font-medium text-gray-700">Discount:</div>
              <div className="text-sm text-right text-red-600">-₹{totals.discountAmount.toFixed(2)}</div>

              <div className="text-sm font-medium text-gray-700">Tax:</div>
              <div className="text-sm text-right">₹{totals.taxAmount.toFixed(2)}</div>

              <div className="text-base font-bold text-gray-900 border-t pt-2">Net Amount:</div>
              <div className="text-base font-bold text-right text-blue-600 border-t pt-2">
                ₹{totals.netAmount.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Order...' : 'Create Order'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
