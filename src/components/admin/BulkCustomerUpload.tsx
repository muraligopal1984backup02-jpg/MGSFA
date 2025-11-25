import { useState, useRef } from 'react';
import { Upload, Download, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface BulkCustomerUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkCustomerUpload({ onClose, onSuccess }: BulkCustomerUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const csvContent = [
      ['customer_code', 'customer_name', 'contact_person', 'mobile_no', 'email', 'gstin', 'pan_no', 'customer_type', 'credit_limit', 'credit_days', 'owner_name', 'address_line1', 'address_line2', 'address_line3', 'city', 'state', 'pincode'].join(','),
      ['CUST001', 'ABC Enterprises', 'John Doe', '9876543210', 'john@abc.com', '27AABCU9603R1ZM', 'AABCU9603R', 'retail', '50000', '30', 'John Smith', '123 Main Street', 'Building A', 'Suite 100', 'Mumbai', 'Maharashtra', '400001'].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_upload_template.csv';
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
      const customersToInsert: any[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length !== headers.length || row.every(cell => !cell)) continue;

        const customer: any = {};
        headers.forEach((header, idx) => {
          customer[header] = row[idx]?.trim() || null;
        });

        if (!customer.customer_code || !customer.customer_name || !customer.mobile_no) {
          validationErrors.push(`Row ${i + 2}: Missing required fields (customer_code, customer_name, mobile_no)`);
          continue;
        }

        customersToInsert.push({
          customer_code: customer.customer_code,
          customer_name: customer.customer_name,
          contact_person: customer.contact_person || null,
          mobile_no: customer.mobile_no,
          email: customer.email || null,
          gstin: customer.gstin || null,
          pan_no: customer.pan_no || null,
          customer_type: customer.customer_type || 'retail',
          credit_limit: parseFloat(customer.credit_limit) || 0,
          credit_days: parseInt(customer.credit_days) || 0,
          owner_name: customer.owner_name || null,
          address_line1: customer.address_line1 || null,
          address_line2: customer.address_line2 || null,
          address_line3: customer.address_line3 || null,
          city: customer.city || null,
          state: customer.state || null,
          pincode: customer.pincode || null,
          is_active: true,
          created_by: user?.id,
        });
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setUploading(false);
        return;
      }

      if (customersToInsert.length === 0) {
        setErrors(['No valid customer data found in the file']);
        setUploading(false);
        return;
      }

      const { error } = await supabase.from('customer_master_tbl').insert(customersToInsert);

      if (error) {
        if (error.code === '23505') {
          setErrors(['Duplicate customer code found. Please check your data.']);
        } else {
          setErrors([`Database error: ${error.message}`]);
        }
      } else {
        alert(`Successfully uploaded ${customersToInsert.length} customers`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error uploading customers:', err);
      setErrors(['Failed to process file. Please check the format.']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Bulk Customer Upload</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Download the CSV template using the button below</li>
              <li>Fill in your customer data following the format</li>
              <li>Required fields: customer_code, customer_name, mobile_no</li>
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
