import { useState, useEffect } from 'react';
import { Calendar, Save, Plus, MapPin, X, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface Route {
  id: string;
  route_code: string;
  route_name: string;
}

interface BeatPlan {
  id?: string;
  user_id: string;
  route_id: string;
  day_monday: boolean;
  day_tuesday: boolean;
  day_wednesday: boolean;
  day_thursday: boolean;
  day_friday: boolean;
  day_saturday: boolean;
  day_sunday: boolean;
  is_active: boolean;
}

export default function BeatPlanManagement() {
  const { user, isAdmin, isManager } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [beatPlans, setBeatPlans] = useState<BeatPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BeatPlan | null>(null);
  const [formData, setFormData] = useState<BeatPlan>({
    user_id: '',
    route_id: '',
    day_monday: false,
    day_tuesday: false,
    day_wednesday: false,
    day_thursday: false,
    day_friday: false,
    day_saturday: false,
    day_sunday: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const days = [
    { key: 'day_monday', label: 'Monday' },
    { key: 'day_tuesday', label: 'Tuesday' },
    { key: 'day_wednesday', label: 'Wednesday' },
    { key: 'day_thursday', label: 'Thursday' },
    { key: 'day_friday', label: 'Friday' },
    { key: 'day_saturday', label: 'Saturday' },
    { key: 'day_sunday', label: 'Sunday' },
  ];

  useEffect(() => {
    fetchUsers();
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchBeatPlans(selectedUser);
    } else {
      setBeatPlans([]);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_master_tbl')
        .select('id, full_name, role')
        .eq('is_active', true)
        .eq('role', 'field_staff')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('route_master_tbl')
        .select('id, route_code, route_name')
        .eq('is_active', true)
        .order('route_name');

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchBeatPlans = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_route_mapping_tbl')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      setBeatPlans(data || []);
    } catch (error) {
      console.error('Error fetching beat plans:', error);
    }
  };

  const handleDayToggle = (dayKey: string) => {
    setFormData({ ...formData, [dayKey]: !formData[dayKey as keyof BeatPlan] });
  };

  const handleAddNew = () => {
    if (!selectedUser) {
      alert('Please select a field staff first');
      return;
    }
    setEditingPlan(null);
    setFormData({
      user_id: selectedUser,
      route_id: '',
      day_monday: false,
      day_tuesday: false,
      day_wednesday: false,
      day_thursday: false,
      day_friday: false,
      day_saturday: false,
      day_sunday: false,
      is_active: true,
    });
    setShowForm(true);
  };

  const handleEdit = (plan: BeatPlan) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.route_id) {
      alert('Please select a route');
      return;
    }

    const hasAnyDay = days.some(day => formData[day.key as keyof BeatPlan]);
    if (!hasAnyDay) {
      alert('Please select at least one day');
      return;
    }

    const existingRouteAssignment = beatPlans.find(
      p => p.route_id === formData.route_id && p.id !== editingPlan?.id
    );
    if (existingRouteAssignment) {
      alert('This route is already assigned to this user. Please edit the existing assignment.');
      return;
    }

    setLoading(true);
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('user_route_mapping_tbl')
          .update({
            route_id: formData.route_id,
            day_monday: formData.day_monday,
            day_tuesday: formData.day_tuesday,
            day_wednesday: formData.day_wednesday,
            day_thursday: formData.day_thursday,
            day_friday: formData.day_friday,
            day_saturday: formData.day_saturday,
            day_sunday: formData.day_sunday,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_route_mapping_tbl').insert([
          {
            user_id: selectedUser,
            route_id: formData.route_id,
            day_monday: formData.day_monday,
            day_tuesday: formData.day_tuesday,
            day_wednesday: formData.day_wednesday,
            day_thursday: formData.day_thursday,
            day_friday: formData.day_friday,
            day_saturday: formData.day_saturday,
            day_sunday: formData.day_sunday,
            assigned_by: user?.id,
          },
        ]);

        if (error) throw error;
      }

      await fetchBeatPlans(selectedUser);
      setShowForm(false);
      setEditingPlan(null);
      alert('Beat plan saved successfully');
    } catch (error) {
      console.error('Error saving beat plan:', error);
      alert('Failed to save beat plan');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to remove this beat plan?')) return;

    try {
      const { error } = await supabase
        .from('user_route_mapping_tbl')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      fetchBeatPlans(selectedUser);
    } catch (error) {
      console.error('Error removing beat plan:', error);
      alert('Failed to remove beat plan');
    }
  };

  if (!isAdmin && !isManager) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You don't have permission to manage beat plans.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Beat Plan Management</h2>
          <p className="text-gray-600 mt-1">Assign routes to field staff with day-wise schedules</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Field Staff <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setShowForm(false);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
          >
            <option value="">Choose a field staff...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>

        {selectedUser && !showForm && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Route Assignment
          </button>
        )}

        {showForm && (
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingPlan ? 'Edit Route Assignment' : 'New Route Assignment'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Route <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.route_id}
                  onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">Choose a route...</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_name} ({r.route_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Days <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {days.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => handleDayToggle(day.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData[day.key as keyof BeatPlan]
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedUser && beatPlans.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Assigned Routes ({beatPlans.length})
          </h3>
          <div className="space-y-3">
            {beatPlans.map((plan) => {
              const route = routes.find(r => r.id === plan.route_id);
              const assignedDays = days
                .filter(day => plan[day.key as keyof BeatPlan])
                .map(day => day.label);

              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <MapPin className="text-blue-600" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{route?.route_name}</p>
                      <p className="text-sm text-gray-600">{route?.route_code}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {assignedDays.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleRemovePlan(plan.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedUser && beatPlans.length === 0 && !showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No routes assigned yet</h3>
          <p className="text-gray-600">Click "Add Route Assignment" to create a beat plan</p>
        </div>
      )}
    </div>
  );
}
