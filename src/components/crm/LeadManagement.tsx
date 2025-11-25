import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Lead {
  id: string;
  lead_code: string;
  company_name: string;
  contact_person: string;
  mobile_no: string;
  lead_status: string;
  estimated_value: number;
}

export default function LeadManagement() {
  const { user, isAdmin, isManager } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      let query = supabase.from('lead_master_tbl').select('*').order('created_at', { ascending: false });

      if (!isAdmin && !isManager) {
        query = query.eq('assigned_to', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.lead_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mobile_no.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading leads...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
          <p className="text-gray-600">{leads.length} total leads</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Add Lead
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">No leads found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">{lead.company_name}</h3>
              <p className="text-sm text-gray-600">{lead.lead_code}</p>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-gray-600">Contact: {lead.contact_person}</p>
                <p className="text-gray-600">Mobile: {lead.mobile_no}</p>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{lead.lead_status}</span>
                  {lead.estimated_value > 0 && <span className="text-sm font-medium">₹{lead.estimated_value.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
