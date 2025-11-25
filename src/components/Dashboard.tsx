import { useState } from 'react';
import { Users, ShoppingCart, DollarSign, MapPin, Package, Tag, FileText, BarChart3, ChevronRight, Phone, Map, Calendar, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomerManagement from './crm/CustomerManagement';
import OrderManagement from './orders/OrderManagement';
import CollectionManagement from './collections/CollectionManagement';
import LocationTracking from './admin/LocationTracking';
import ProductManagement from './products/ProductManagement';
import PriceSetup from './products/PriceSetup';
import OrderReport from './reports/OrderReport';
import CollectionReport from './reports/CollectionReport';
import TelecallingDashboard from './telecalling/TelecallingDashboard';
import RouteManagement from './routes/RouteManagement';
import BeatPlanManagement from './routes/BeatPlanManagement';
import RouteCustomerMapping from './routes/RouteCustomerMapping';

type MainTab = 'master' | 'transaction' | 'crm' | 'reports';
type SubTab = 'customers' | 'products' | 'prices' | 'orders' | 'collections' | 'telecalling' | 'order-report' | 'collection-report' | 'tracking' | 'routes' | 'beat-plans' | 'route-customers';

export default function Dashboard() {
  const { isAdmin, isManager } = useAuth();
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('master');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('customers');

  const mainTabs = [
    { id: 'master' as MainTab, label: 'Master' },
    { id: 'transaction' as MainTab, label: 'Transaction' },
    { id: 'crm' as MainTab, label: 'CRM' },
    { id: 'reports' as MainTab, label: 'Reports' },
  ];

  const subTabs: Record<MainTab, Array<{ id: SubTab; label: string; icon: any; show: boolean }>> = {
    master: [
      { id: 'customers' as SubTab, label: 'Customers', icon: Users, show: true },
      { id: 'products' as SubTab, label: 'Products', icon: Package, show: isAdmin || isManager },
      { id: 'routes' as SubTab, label: 'Routes', icon: Map, show: isAdmin || isManager },
      { id: 'route-customers' as SubTab, label: 'Route Customers', icon: UserCog, show: isAdmin || isManager },
      { id: 'beat-plans' as SubTab, label: 'Beat Plans', icon: Calendar, show: isAdmin || isManager },
    ],
    transaction: [
      { id: 'prices' as SubTab, label: 'Price Setup', icon: Tag, show: isAdmin || isManager },
      { id: 'orders' as SubTab, label: 'Orders', icon: ShoppingCart, show: true },
      { id: 'collections' as SubTab, label: 'Collections', icon: DollarSign, show: true },
    ],
    crm: [
      { id: 'telecalling' as SubTab, label: 'Telecalling', icon: Phone, show: true },
    ],
    reports: [
      { id: 'order-report' as SubTab, label: 'Order Report', icon: FileText, show: isAdmin || isManager },
      { id: 'collection-report' as SubTab, label: 'Collection Report', icon: BarChart3, show: isAdmin || isManager },
      { id: 'tracking' as SubTab, label: 'Staff Tracking', icon: MapPin, show: isAdmin || isManager },
    ],
  };

  const visibleSubTabs = subTabs[activeMainTab].filter((tab) => tab.show);

  const handleMainTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
    const firstVisibleSubTab = subTabs[tab].find((st) => st.show);
    if (firstVisibleSubTab) {
      setActiveSubTab(firstVisibleSubTab.id);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg mb-6">
        <div className="flex border-b border-gray-700">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleMainTabChange(tab.id)}
              className={`px-8 py-4 font-semibold text-sm uppercase tracking-wide transition-all ${
                activeMainTab === tab.id
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 px-4 py-3 overflow-x-auto">
          {visibleSubTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-medium text-sm transition-all whitespace-nowrap ${
                  activeSubTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <span className="font-medium text-gray-800">{mainTabs.find(t => t.id === activeMainTab)?.label}</span>
        <ChevronRight size={16} className="text-gray-400" />
        <span className="text-orange-600 font-medium">
          {visibleSubTabs.find(t => t.id === activeSubTab)?.label}
        </span>
      </div>

      <div>
        {activeSubTab === 'customers' && <CustomerManagement />}
        {activeSubTab === 'products' && <ProductManagement />}
        {activeSubTab === 'routes' && <RouteManagement />}
        {activeSubTab === 'route-customers' && <RouteCustomerMapping />}
        {activeSubTab === 'beat-plans' && <BeatPlanManagement />}
        {activeSubTab === 'prices' && <PriceSetup />}
        {activeSubTab === 'orders' && <OrderManagement />}
        {activeSubTab === 'collections' && <CollectionManagement />}
        {activeSubTab === 'telecalling' && <TelecallingDashboard />}
        {activeSubTab === 'order-report' && <OrderReport />}
        {activeSubTab === 'collection-report' && <CollectionReport />}
        {activeSubTab === 'tracking' && <LocationTracking />}
      </div>
    </div>
  );
}
