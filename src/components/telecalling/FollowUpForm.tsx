import { useState, useEffect } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface FollowUp {
  id?: string;
  entity_type: 'customer' | 'lead';
  entity_id: string;
  follow_up_date: string;
  follow_up_time: string;
  priority: string;
  follow_up_type: string;
  subject: string;
  notes: string;
  status: string;
  assigned_to?: string;
}

interface Props {
  followUp: FollowUp | null;
  entityType: 'customer' | 'lead';
  entityId: string;
  entityName: string;
  prePopulatedData?: {
    subject?: string;
    notes?: string;
  } | null;
  onClose: (refresh: boolean) => void;
}

export default function FollowUpForm({ followUp, entityType, entityId, entityName, prePopulatedData, onClose }: Props) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FollowUp>({
    entity_type: entityType,
    entity_id: entityId,
    follow_up_date: new Date().toISOString().split('T')[0],
    follow_up_time: '10:00',
    priority: 'medium',
    follow_up_type: 'call',
    subject: '',
    notes: '',
    status: 'pending',
    assigned_to: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (followUp) {
      setFormData(followUp);
    } else if (prePopulatedData) {
      setFormData(prev => ({
        ...prev,
        subject: prePopulatedData.subject || prev.subject,
        notes: prePopulatedData.notes || prev.notes,
      }));
    }
  }, [followUp, prePopulatedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (followUp) {
        const { error: updateError } = await supabase
          .from('follow_up_tbl')
          .update({
            follow_up_date: formData.follow_up_date,
            follow_up_time: formData.follow_up_time,
            priority: formData.priority,
            follow_up_type: formData.follow_up_type,
            subject: formData.subject,
            notes: formData.notes,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', followUp.id);

        if (updateError) throw updateError;
      } else {
        const followUpData: any = { ...formData };

        if (user?.id) {
          const { data: userExists } = await supabase
            .from('user_master_tbl')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (userExists) {
            followUpData.created_by = user.id;
          }
        }

        if (formData.assigned_to) {
          const { data: assignedUserExists } = await supabase
            .from('user_master_tbl')
            .select('id')
            .eq('id', formData.assigned_to)
            .maybeSingle();

          if (!assignedUserExists) {
            delete followUpData.assigned_to;
          }
        }

        const { error: insertError } = await supabase.from('follow_up_tbl').insert([followUpData]);

        if (insertError) throw insertError;
      }

      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save follow-up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={24} className="text-green-600" />
              {followUp ? 'Edit Follow-Up' : 'Schedule Follow-Up'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{entityName}</p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-Up Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.follow_up_date}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Follow-Up Time
              </label>
              <input
                type="time"
                value={formData.follow_up_time}
                onChange={(e) => setFormData({ ...formData, follow_up_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Follow-Up Type</label>
              <select
                value={formData.follow_up_type}
                onChange={(e) => setFormData({ ...formData, follow_up_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="visit">Visit</option>
                <option value="demo">Demo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
              placeholder="Purpose of follow-up..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
              placeholder="Additional notes or reminders..."
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Follow-Up'}
            </button>
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
