import { useState, useEffect } from 'react';
import { X, Save, Phone, Calendar } from 'lucide-react';
import FollowUpForm from './FollowUpForm';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CallLog {
  id?: string;
  call_date: string;
  entity_type: 'customer' | 'lead';
  entity_id: string;
  call_type: string;
  call_purpose: string;
  call_status: string;
  call_duration: number;
  discussion_points: string;
  customer_feedback: string;
  next_action: string;
  call_outcome: string;
}

interface Props {
  callLog: CallLog | null;
  entityType: 'customer' | 'lead';
  entityId: string;
  entityName: string;
  entityPhone?: string;
  onClose: (refresh: boolean) => void;
}

interface FollowUpData {
  subject: string;
  notes: string;
}

export default function CallLogForm({ callLog, entityType, entityId, entityName, entityPhone, onClose }: Props) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CallLog>({
    call_date: new Date().toISOString().slice(0, 16),
    entity_type: entityType,
    entity_id: entityId,
    call_type: 'outgoing',
    call_purpose: 'follow_up',
    call_status: 'completed',
    call_duration: 0,
    discussion_points: '',
    customer_feedback: '',
    next_action: '',
    call_outcome: 'neutral',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpData, setFollowUpData] = useState<FollowUpData | null>(null);

  useEffect(() => {
    if (callLog) {
      setFormData(callLog);
    }
  }, [callLog]);

  const saveCallLog = async () => {
    setError('');
    setLoading(true);

    try {
      if (callLog) {
        const { error: updateError } = await supabase
          .from('call_log_tbl')
          .update({
            call_date: formData.call_date,
            call_type: formData.call_type,
            call_purpose: formData.call_purpose,
            call_status: formData.call_status,
            call_duration: formData.call_duration,
            discussion_points: formData.discussion_points,
            customer_feedback: formData.customer_feedback,
            next_action: formData.next_action,
            call_outcome: formData.call_outcome,
            updated_at: new Date().toISOString(),
          })
          .eq('id', callLog.id);

        if (updateError) throw updateError;
      } else {
        const callLogData: any = { ...formData };

        if (user?.id) {
          const { data: userExists } = await supabase
            .from('user_master_tbl')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (userExists) {
            callLogData.recorded_by = user.id;
          }
        }

        const { error: insertError } = await supabase.from('call_log_tbl').insert([callLogData]);

        if (insertError) throw insertError;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save call log');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveCallLog();
    if (success) {
      onClose(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Phone size={24} className="text-blue-600" />
              {callLog ? 'Edit Call Log' : 'Log New Call'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{entityName}</p>
            {entityPhone && (
              <a
                href={`tel:${entityPhone}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-1"
              >
                <Phone size={14} />
                {entityPhone}
              </a>
            )}
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
                Call Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.call_date}
                onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Type</label>
              <select
                value={formData.call_type}
                onChange={(e) => setFormData({ ...formData, call_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Purpose</label>
              <select
                value={formData.call_purpose}
                onChange={(e) => setFormData({ ...formData, call_purpose: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="enquiry">Enquiry</option>
                <option value="follow_up">Follow Up</option>
                <option value="collection_followup">Collection Follow-up</option>
                <option value="support">Support</option>
                <option value="complaint">Complaint</option>
                <option value="order_confirmation">Order Confirmation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Status</label>
              <select
                value={formData.call_status}
                onChange={(e) => setFormData({ ...formData, call_status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="completed">Completed</option>
                <option value="no_answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="unreachable">Unreachable</option>
                <option value="callback_requested">Callback Requested</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={Math.floor(formData.call_duration / 60)}
                onChange={(e) =>
                  setFormData({ ...formData, call_duration: parseInt(e.target.value) * 60 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Outcome</label>
              <select
                value={formData.call_outcome}
                onChange={(e) => setFormData({ ...formData, call_outcome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discussion Points
            </label>
            <textarea
              rows={3}
              value={formData.discussion_points}
              onChange={(e) => setFormData({ ...formData, discussion_points: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              placeholder="Key points discussed during the call..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Feedback
            </label>
            <textarea
              rows={2}
              value={formData.customer_feedback}
              onChange={(e) => setFormData({ ...formData, customer_feedback: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              placeholder="Customer's response or feedback..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Next Action</label>
            <textarea
              rows={2}
              value={formData.next_action}
              onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              placeholder="Required follow-up or next steps..."
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
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Call Log'}
            </button>
            <button
              type="button"
              onClick={async () => {
                const success = await saveCallLog();
                if (success) {
                  setFollowUpData({
                    subject: formData.next_action || `Follow-up for ${entityName}`,
                    notes: formData.discussion_points || '',
                  });
                  setShowFollowUpForm(true);
                }
              }}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
              <Calendar size={18} />
              Schedule Follow-up
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

      {showFollowUpForm && (
        <FollowUpForm
          followUp={null}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          prePopulatedData={followUpData}
          onClose={(refresh) => {
            setShowFollowUpForm(false);
            if (refresh) {
              onClose(true);
            }
          }}
        />
      )}
    </div>
  );
}
