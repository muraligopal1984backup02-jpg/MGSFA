import { useState, useEffect } from 'react';
import { X, Search, Phone, Calendar } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type: 'customer' | 'lead';
  mobile_no: string;
}

interface Props {
  entities: Entity[];
  actionType: 'call' | 'followup';
  onSelect: (entity: Entity) => void;
  onClose: () => void;
}

export default function EntitySelector({ entities, actionType, onSelect, onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>(entities);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredEntities(entities);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = entities.filter(
      (e) => e.name.toLowerCase().includes(term) || e.mobile_no.includes(term)
    );
    setFilteredEntities(filtered);
  }, [searchTerm, entities]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {actionType === 'call' ? (
                <>
                  <Phone size={24} className="text-blue-600" />
                  Select Entity to Log Call
                </>
              ) : (
                <>
                  <Calendar size={24} className="text-green-600" />
                  Select Entity for Follow-up
                </>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or mobile number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {filteredEntities.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                No entities found
              </div>
            ) : (
              filteredEntities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    onSelect(entity);
                    onClose();
                  }}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-4 border border-gray-200 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{entity.name}</h3>
                      <p className="text-sm text-gray-600">{entity.mobile_no}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {entity.type}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
