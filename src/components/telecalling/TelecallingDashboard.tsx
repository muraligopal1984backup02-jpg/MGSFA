import { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, Users, TrendingUp, Search, Plus, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CallLogForm from './CallLogForm';
import FollowUpForm from './FollowUpForm';
import EntitySelector from './EntitySelector';

interface Entity {
  id: string;
  name: string;
  type: 'customer' | 'lead';
  mobile_no: string;
}

interface CallLog {
  id: string;
  call_date: string;
  entity_type: string;
  entity_id: string;
  call_purpose: string;
  call_status: string;
  call_outcome: string;
  call_duration: number;
  discussion_points: string;
  entity_name?: string;
}

interface FollowUp {
  id: string;
  entity_type: string;
  entity_id: string;
  follow_up_date: string;
  follow_up_time: string;
  priority: string;
  subject: string;
  status: string;
  entity_name?: string;
}

export default function TelecallingDashboard() {
  const { user, isAdmin, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'calls' | 'followups' | 'entities'>('calls');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const [selectorAction, setSelectorAction] = useState<'call' | 'followup'>('call');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [stats, setStats] = useState({
    totalCalls: 0,
    todayCalls: 0,
    pendingFollowups: 0,
    completedToday: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchTerm, activeTab, callLogs, followUps, entities]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEntities(), fetchCallLogs(), fetchFollowUps(), fetchStats()]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      let customerQuery = supabase
        .from('customer_master_tbl')
        .select('id, customer_name, mobile_no')
        .eq('is_active', true);

      let leadQuery = supabase
        .from('lead_master_tbl')
        .select('id, company_name, mobile_no');

      if (!isAdmin && !isManager) {
        customerQuery = customerQuery.eq('assigned_to', user?.id);
        leadQuery = leadQuery.eq('assigned_to', user?.id);
      }

      const [{ data: customers }, { data: leads }] = await Promise.all([
        customerQuery,
        leadQuery,
      ]);

      const allEntities: Entity[] = [
        ...(customers || []).map((c) => ({
          id: c.id,
          name: c.customer_name,
          type: 'customer' as const,
          mobile_no: c.mobile_no,
        })),
        ...(leads || []).map((l) => ({
          id: l.id,
          name: l.company_name,
          type: 'lead' as const,
          mobile_no: l.mobile_no,
        })),
      ];

      setEntities(allEntities);
    } catch (err) {
      console.error('Error fetching entities:', err);
    }
  };

  const fetchCallLogs = async () => {
    try {
      let query = supabase
        .from('call_log_tbl')
        .select('*')
        .order('call_date', { ascending: false })
        .limit(100);

      if (!isAdmin && !isManager) {
        query = query.eq('recorded_by', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const logsWithNames = (data || []).map((log) => {
        const entity = entities.find((e) => e.id === log.entity_id);
        return { ...log, entity_name: entity?.name || 'Unknown' };
      });

      setCallLogs(logsWithNames);
    } catch (err) {
      console.error('Error fetching call logs:', err);
    }
  };

  const fetchFollowUps = async () => {
    try {
      let query = supabase
        .from('follow_up_tbl')
        .select('*')
        .order('follow_up_date', { ascending: true });

      if (!isAdmin && !isManager) {
        query = query.eq('assigned_to', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const followUpsWithNames = (data || []).map((fu) => {
        const entity = entities.find((e) => e.id === fu.entity_id);
        return { ...fu, entity_name: entity?.name || 'Unknown' };
      });

      setFollowUps(followUpsWithNames);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      let callQuery = supabase.from('call_log_tbl').select('id, call_date', { count: 'exact' });
      let followUpQuery = supabase
        .from('follow_up_tbl')
        .select('id, status', { count: 'exact' })
        .eq('status', 'pending');

      if (!isAdmin && !isManager) {
        callQuery = callQuery.eq('recorded_by', user?.id);
        followUpQuery = followUpQuery.eq('assigned_to', user?.id);
      }

      const [{ count: totalCalls }, { count: pendingFollowups }, { data: todayCallsData }] =
        await Promise.all([
          callQuery,
          followUpQuery,
          callQuery.gte('call_date', today),
        ]);

      setStats({
        totalCalls: totalCalls || 0,
        todayCalls: todayCallsData?.length || 0,
        pendingFollowups: pendingFollowups || 0,
        completedToday: todayCallsData?.filter((c) => c.call_date.startsWith(today)).length || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const filterItems = () => {
    if (!searchTerm) {
      if (activeTab === 'calls') setFilteredItems(callLogs);
      else if (activeTab === 'followups') setFilteredItems(followUps);
      else setFilteredItems(entities);
      return;
    }

    const term = searchTerm.toLowerCase();
    let filtered: any[] = [];

    if (activeTab === 'calls') {
      filtered = callLogs.filter(
        (c) =>
          c.entity_name?.toLowerCase().includes(term) ||
          c.call_purpose.toLowerCase().includes(term) ||
          c.discussion_points?.toLowerCase().includes(term)
      );
    } else if (activeTab === 'followups') {
      filtered = followUps.filter(
        (f) =>
          f.entity_name?.toLowerCase().includes(term) || f.subject.toLowerCase().includes(term)
      );
    } else {
      filtered = entities.filter(
        (e) => e.name.toLowerCase().includes(term) || e.mobile_no.includes(term)
      );
    }

    setFilteredItems(filtered);
  };

  const handleLogCall = (entity: Entity) => {
    setSelectedEntity(entity);
    setShowCallForm(true);
  };

  const handleScheduleFollowUp = (entity: Entity) => {
    setSelectedEntity(entity);
    setShowFollowUpForm(true);
  };

  const openCallSelector = () => {
    setSelectorAction('call');
    setShowEntitySelector(true);
  };

  const openFollowUpSelector = () => {
    setSelectorAction('followup');
    setShowEntitySelector(true);
  };

  const handleEntitySelect = (entity: Entity) => {
    if (selectorAction === 'call') {
      handleLogCall(entity);
    } else {
      handleScheduleFollowUp(entity);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading telecalling data...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CRM Telecalling</h2>
        <p className="text-gray-600">Manage calls, follow-ups, and customer interactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Phone size={24} />
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">{stats.totalCalls}</p>
          <p className="text-blue-100">Total Calls</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock size={24} />
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">{stats.todayCalls}</p>
          <p className="text-green-100">Today's Calls</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={24} />
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">{stats.pendingFollowups}</p>
          <p className="text-orange-100">Pending Follow-ups</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} />
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl font-bold">{entities.length}</p>
          <p className="text-purple-100">Total Entities</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'calls'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Call History
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'followups'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Follow-ups
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'entities'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customers & Leads
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={openCallSelector}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Phone size={20} />
              Log Call
            </button>
            <button
              onClick={openFollowUpSelector}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              <Calendar size={20} />
              Schedule Follow-up
            </button>
          </div>

          {activeTab === 'entities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((entity: Entity) => (
                <div
                  key={entity.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{entity.name}</h3>
                      <a
                        href={`tel:${entity.mobile_no}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Phone size={14} />
                        {entity.mobile_no}
                      </a>
                      <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {entity.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLogCall(entity)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                    >
                      <Phone size={16} />
                      Log Call
                    </button>
                    <button
                      onClick={() => handleScheduleFollowUp(entity)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      <Calendar size={16} />
                      Follow-up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="space-y-3">
              {filteredItems.map((call: CallLog) => (
                <div
                  key={call.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{call.entity_name}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            call.call_outcome === 'positive'
                              ? 'bg-green-100 text-green-700'
                              : call.call_outcome === 'negative'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {call.call_outcome}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{call.discussion_points}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{new Date(call.call_date).toLocaleString()}</span>
                        <span>{call.call_purpose}</span>
                        <span>{Math.floor(call.call_duration / 60)} mins</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'followups' && (
            <div className="space-y-3">
              {filteredItems.map((followUp: FollowUp) => (
                <div
                  key={followUp.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{followUp.entity_name}</h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            followUp.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : followUp.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {followUp.priority}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            followUp.status === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : followUp.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {followUp.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{followUp.subject}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(followUp.follow_up_date).toLocaleDateString()} at{' '}
                          {followUp.follow_up_time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCallForm && selectedEntity && (
        <CallLogForm
          callLog={null}
          entityType={selectedEntity.type}
          entityId={selectedEntity.id}
          entityName={selectedEntity.name}
          entityPhone={selectedEntity.mobile_no}
          onClose={(refresh) => {
            setShowCallForm(false);
            setSelectedEntity(null);
            if (refresh) fetchData();
          }}
        />
      )}

      {showFollowUpForm && selectedEntity && (
        <FollowUpForm
          followUp={null}
          entityType={selectedEntity.type}
          entityId={selectedEntity.id}
          entityName={selectedEntity.name}
          prePopulatedData={null}
          onClose={(refresh) => {
            setShowFollowUpForm(false);
            setSelectedEntity(null);
            if (refresh) fetchData();
          }}
        />
      )}

      {showEntitySelector && (
        <EntitySelector
          entities={entities}
          actionType={selectorAction}
          onSelect={handleEntitySelect}
          onClose={() => setShowEntitySelector(false)}
        />
      )}
    </div>
  );
}
