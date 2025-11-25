import { useState, useRef } from 'react';
import { Upload, Download, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BulkPriceUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkPriceUpload({ onClose, onSuccess }: BulkPriceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = [
      ['product_code', 'customer_type', 'price', 'discount_percentage', 'effective_from', 'effective_to'].join(','),
      ['PROD001', 'retail', '1000', '5', '2025-01-01', ''].join(','),
      ['PROD001', 'dealer', '900', '10', '2025-01-01', ''].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrors([]);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1);

      const { data: products, error: productError } = await supabase
        .from('product_master_tbl')
        .select('id, product_code');

      if (productError) throw productError;

      const productMap = new Map(products?.map(p => [p.product_code, p.id]));

      const validationErrors: string[] = [];
      const pricesToInsert: any[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length !== headers.length || row.every(cell => !cell)) continue;

        const price: any = {};
        headers.forEach((header, idx) => {
          price[header] = row[idx]?.trim() || null;
        });

        if (!price.product_code || !price.customer_type || !price.price) {
          validationErrors.push(`Row ${i + 2}: Missing required fields (product_code, customer_type, price)`);
          continue;
        }

        const productId = productMap.get(price.product_code);
        if (!productId) {
          validationErrors.push(`Row ${i + 2}: Product code '${price.product_code}' not found`);
          continue;
        }

        if (!['retail', 'dealer', 'distributor'].includes(price.customer_type)) {
          validationErrors.push(`Row ${i + 2}: Invalid customer_type. Must be retail, dealer, or distributor`);
          continue;
        }

        pricesToInsert.push({
          product_id: productId,
          customer_type: price.customer_type,
          price: parseFloat(price.price),
          discount_percentage: parseFloat(price.discount_percentage) || 0,
          effective_from: price.effective_from || new Date().toISOString().split('T')[0],
          effective_to: price.effective_to || null,
          is_active: true,
        });
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setUploading(false);
        return;
      }

      if (pricesToInsert.length === 0) {
        setErrors(['No valid price data found in the file']);
        setUploading(false);
        return;
      }

      const { error } = await supabase.from('product_price_tbl').insert(pricesToInsert);

      if (error) {
        setErrors([`Database error: ${error.message}`]);
      } else {
        alert(`Successfully uploaded ${pricesToInsert.length} price records`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error uploading prices:', err);
      setErrors(['Failed to process file. Please check the format.']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Bulk Price Upload</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download the CSV template using the button below</li>
              <li>Fill in your price data following the format</li>
              <li>Required fields: product_code, customer_type, price</li>
              <li>Customer types: retail, dealer, distributor</li>
              <li>Product codes must exist in the system</li>
              <li>Upload the completed CSV file</li>
            </ol>
          </div>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download size={20} />
            Download CSV Template
          </button>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              {uploading ? 'Uploading...' : 'Click to upload CSV file'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              {uploading ? 'Processing...' : 'Select File'}
            </button>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-4 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
