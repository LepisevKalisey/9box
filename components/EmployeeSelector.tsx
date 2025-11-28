
import React, { useState, useEffect } from 'react';
import { EmployeeProfile, User } from '../types';
import { getAvailableEmployees, createEmployee, getCompanies } from '../services/storageService';
import { Plus, Search, ChevronRight, Loader2 } from 'lucide-react';

interface Props {
  user: User;
  onSelect: (employee: EmployeeProfile) => void;
  onViewResults?: () => void;
}

export const EmployeeSelector: React.FC<Props> = ({ user, onSelect, onViewResults }) => {
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [available, setAvailable] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');

  useEffect(() => {
    loadList();
  }, [user]);

  useEffect(() => {
    const loadCompanySetting = async () => {
      try {
        const companies = await getCompanies();
        const company = companies.find(c => c.id === user.companyId);
        const allowed = user.role === 'admin' || !company?.disableUserAddEmployees;
        setCanCreate(!!allowed);
        if (!allowed && mode === 'create') setMode('list');
      } catch (e) {
        setCanCreate(true);
      }
    };
    loadCompanySetting();
  }, [user]);

  const loadList = async () => {
    setLoading(true);
    try {
        const list = await getAvailableEmployees(user);
        setAvailable(list);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPosition) return;
    
    setCreating(true);
    try {
        const newEmp = await createEmployee(user, newName, newPosition);
        onSelect(newEmp);
    } catch (e) {
        console.error(e);
        setCreating(false);
    }
  };

  const filtered = available;

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 pb-24">
      
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
            onClick={() => setMode('list')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
            Выбрать из списка
        </button>
        {canCreate && (
          <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'create' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
              Новый сотрудник
          </button>
        )}
      </div>

      {mode === 'list' && (
        <div className="animate-in fade-in duration-300">
            

            {loading ? (
                <div className="text-center py-10 text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" /> Загрузка...
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-400 mb-4">Нет доступных сотрудников для оценки.</p>
                    {canCreate ? (
                      <button onClick={() => setMode('create')} className="text-blue-600 font-bold text-sm">
                          Создать нового?
                      </button>
                    ) : (
                      <div className="text-xs text-gray-500">В вашей компании добавление новых сотрудников отключено.</div>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(emp => (
                        <button
                            key={emp.id}
                            onClick={() => onSelect(emp)}
                            className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all text-left"
                        >
                            <div>
                                <div className="font-bold text-gray-900">{emp.name}</div>
                                <div className="text-xs text-gray-500">{emp.position}</div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" />
                        </button>
                    ))}
                </div>
            )}
        </div>
      )}

      {mode === 'create' && canCreate && (
        <div className="animate-in fade-in duration-300">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Добавление сотрудника</h3>
                <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <div>
                    <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ФИО сотрудника"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                    />
                </div>
                <div>
                    <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="Должность"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900"
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newName || !newPosition || creating}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2 shadow-sm"
                >
                    {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} 
                    Создать и оценить
                </button>
                </form>
            </div>
            <div className="p-4 bg-blue-50 text-blue-800 text-xs rounded-xl">
                Сотрудник будет добавлен в общий список компании. Другие менеджеры тоже смогут его видеть.
            </div>
        </div>
      )}

      {onViewResults && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 safe-area-bottom">
          <div className="max-w-md mx-auto">
              <button
              onClick={onViewResults}
              className="w-full py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 shadow-sm transition-transform active:scale-[0.98]"
              >
              Перейти к результатам
              </button>
          </div>
        </div>
      )}
    </div>
  );
};
