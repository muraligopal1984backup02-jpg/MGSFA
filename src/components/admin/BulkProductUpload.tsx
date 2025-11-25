import { useState, useRef } from 'react';
import { Upload, Download, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BulkProductUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkProductUpload({ onClose, onSuccess }: BulkProductUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = [
      ['product_code', 'product_name', 'category', 'subcategory', 'unit_of_measure', 'hsn_code', 'gst_rate', 'description'].join(','),
      ['PROD001', 'Product Name', 'Category A', 'Subcategory 1', 'pcs', '1234', '18', 'Product description'].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_upload_template.csv';
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

      const validationErrors: string[] = [];
      const productsToInsert: any[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length !== headers.length || row.every(cell => !cell)) continue;

        const product: any = {};
        headers.forEach((header, idx) => {
          product[header] = row[idx]?.trim() || null;
        });

        if (!product.product_code || !product.product_name) {
          validationErrors.push(`Row ${i + 2}: Missing required fields (product_code, product_name)`);
          continue;
        }

        productsToInsert.push({
          product_code: product.product_code,
          product_name: product.product_name,
          category: product.category || null,
          subcategory: product.subcategory || null,
          unit_of_measure: product.unit_of_measure || 'pcs',
          hsn_code: product.hsn_code || null,
          gst_rate: parseFloat(product.gst_rate) || 0,
          description: product.description || null,
          is_active: true,
        });
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setUploading(false);
        return;
      }

      if (productsToInsert.length === 0) {
        setErrors(['No valid product data found in the file']);
        setUploading(false);
        return;
      }

      const { error } = await supabase.from('product_master_tbl').insert(productsToInsert);

      if (error) {
        if (error.code === '23505') {
          setErrors(['Duplicate product code found. Please check your data.']);
        } else {
          setErrors([`Database error: ${error.message}`]);
        }
      } else {
        alert(`Successfully uploaded ${productsToInsert.length} products`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error uploading products:', err);
      setErrors(['Failed to process file. Please check the format.']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Bulk Product Upload</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download the CSV template using the button below</li>
              <li>Fill in your product data following the format</li>
              <li>Required fields: product_code, product_name</li>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
