import React, { useState } from 'react';
import { EmployeeResult } from '../types';
import { Plus, Trash2, UserPlus } from 'lucide-react';

interface Props {
  employees: EmployeeResult[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeeResult[]>>;
  onNext: () => void;
}

export const EmployeeSetup: React.FC<Props> = ({ employees, setEmployees, onNext }) => {
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPosition.trim()) return;

    const newEmployee: EmployeeResult = {
      id: crypto.randomUUID(),
      name: newName,
      position: newPosition,
      performance: null,
      potential: null,
      companyId: 'local',
      createdByUserId: 'local'
    };

    setEmployees([...employees, newEmployee]);
    setNewName('');
    setNewPosition('');
  };

  const handleRemove = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-4 md:p-6 pb-24">
      <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Кого оцениваем?</h2>
          <p className="text-sm text-gray-500">Добавьте сотрудников в список</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ФИО сотрудника"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="Должность"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!newName || !newPosition}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2 shadow-sm"
          >
            <Plus size={18} /> Добавить
          </button>
        </form>
      </div>

      <div className="space-y-3 mb-8">
        {employees.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-gray-100">
            <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <UserPlus size={24} />
            </div>
            <p className="text-gray-400 text-sm">Список пуст</p>
          </div>
        ) : (
          employees.map(emp => (
            <div key={emp.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <div className="font-bold text-gray-900">{emp.name}</div>
                <div className="text-xs text-gray-500">{emp.position}</div>
              </div>
              <button
                onClick={() => handleRemove(emp.id)}
                className="text-gray-400 hover:text-red-500 p-2 bg-gray-50 rounded-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 safe-area-bottom">
        <div className="max-w-md mx-auto">
            <button
            onClick={onNext}
            disabled={employees.length === 0}
            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 shadow-lg transition-transform active:scale-[0.98]"
            >
            Начать оценку ({employees.length})
            </button>
        </div>
      </div>
    </div>
  );
};