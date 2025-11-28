
import React, { useState, useEffect } from 'react';
import { User, EmployeeProfile, Company } from '../types';
import { createUser, getCompanyUsers, getAdminResults, getGlobalEmployees, deleteEmployee, createCompany, getCompanies, deleteUser, deleteCompany } from '../services/storageService';
import { Results } from './Results';
import { UserPlus, BarChart, Users, LogOut, Layout, Trash2, Database, Building } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'employees' | 'companies'>('matrix');
  const [users, setUsers] = useState<User[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserCompanyId, setSelectedUserCompanyId] = useState('');
  const [msg, setMsg] = useState('');

  // New Company Form State
  const [newCompanyName, setNewCompanyName] = useState('');

  // Matrix Filter State
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedManagerId, selectedCompanyFilter]);

  const loadData = () => {
    const allUsers = getCompanyUsers(user); // Actually returns all managers for admin
    const allCompanies = getCompanies();
    setUsers(allUsers);
    setCompanies(allCompanies);
    
    // Set default company for user creation if not set
    if (!selectedUserCompanyId && allCompanies.length > 0) {
        setSelectedUserCompanyId(allCompanies[0].id);
    }
    
    if (activeTab === 'matrix') {
        const res = getAdminResults(user, selectedManagerId || undefined, selectedCompanyFilter || undefined);
        setResults(res);
    }
    
    if (activeTab === 'employees') {
        setAllEmployees(getGlobalEmployees(user));
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const success = createUser(user, { 
        name: newName, 
        email: newEmail, 
        password: newPassword,
        companyId: selectedUserCompanyId 
    });
    if (success) {
        setMsg('Пользователь создан успешно!');
        setNewName(''); setNewEmail(''); setNewPassword('');
        loadData();
    } else {
        setMsg('Ошибка: Email уже занят или неверные данные.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleCreateCompany = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCompanyName.trim()) return;
      createCompany(newCompanyName);
      setNewCompanyName('');
      loadData();
  };

  const handleDeleteEmployee = (e: React.MouseEvent, empId: string) => {
      e.stopPropagation();
      if (confirm('Вы уверены? Это удалит сотрудника и ВСЕ результаты его оценок у всех менеджеров.')) {
          deleteEmployee(user, empId);
          loadData();
      }
  };

  const handleDeleteUser = (e: React.MouseEvent, userId: string) => {
      e.stopPropagation();
      if (confirm('Вы уверены? Это удалит пользователя, его доступ, его личную карточку сотрудника и все оценки, которые он сделал.')) {
          deleteUser(user, userId);
          loadData();
      }
  };

  const handleDeleteCompany = (e: React.MouseEvent, companyId: string) => {
      e.stopPropagation();
      if (confirm('ВНИМАНИЕ: Это удалит компанию и ВСЕХ связанных с ней пользователей, сотрудников и оценки. Это действие необратимо.')) {
          deleteCompany(user, companyId);
          loadData();
      }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Layout className="text-blue-400" />
                <h1 className="font-bold text-lg">Кабинет Администратора</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
                <button onClick={onLogout} className="text-sm text-red-300 hover:text-white flex items-center gap-1">
                    <LogOut size={16} /> Выход
                </button>
            </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Navigation */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit overflow-x-auto max-w-full">
            <button
                onClick={() => setActiveTab('matrix')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === 'matrix' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <BarChart size={18} /> Общая матрица
            </button>
            <button
                onClick={() => setActiveTab('companies')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === 'companies' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Building size={18} /> Компании
            </button>
            <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === 'users' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <UserPlus size={18} /> Менеджеры
            </button>
            <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap
                    ${activeTab === 'employees' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                <Database size={18} /> База сотрудников
            </button>
        </div>

        {/* Content */}
        {activeTab === 'companies' && (
             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Building size={20} className="text-blue-600" />
                        Создать компанию
                    </h2>
                    <form onSubmit={handleCreateCompany} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Название компании"
                            required
                            value={newCompanyName}
                            onChange={e => setNewCompanyName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        />
                        <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                            Добавить компанию
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Users size={20} className="text-purple-600" />
                        Список компаний
                    </h2>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {companies.length === 0 && <p className="text-gray-400">Пока нет компаний</p>}
                        {companies.map(c => (
                            <div key={c.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center group">
                                <span className="font-bold text-gray-800">{c.name}</span>
                                <div className="flex items-center gap-2">
                                     <span className="text-xs text-gray-400">{c.id}</span>
                                     <button 
                                        onClick={(e) => handleDeleteCompany(e, c.id)}
                                        className="text-red-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Удалить компанию"
                                     >
                                         <Trash2 size={16} />
                                     </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-600" />
                        Добавить менеджера
                    </h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                             <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Компания</label>
                             <select 
                                value={selectedUserCompanyId}
                                onChange={e => setSelectedUserCompanyId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                             >
                                 {companies.map(c => (
                                     <option key={c.id} value={c.id}>{c.name}</option>
                                 ))}
                             </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Имя Фамилия"
                            required
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        />
                         <input
                            type="email"
                            placeholder="Email (Логин)"
                            required
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        />
                         <input
                            type="text"
                            placeholder="Пароль"
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                        />
                        <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                            Создать аккаунт
                        </button>
                        {msg && <p className={`text-center text-sm ${msg.includes('Ошибка') ? 'text-red-500' : 'text-green-500'}`}>{msg}</p>}
                    </form>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Users size={20} className="text-purple-600" />
                        Список менеджеров
                    </h2>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {users.length === 0 && <p className="text-gray-400">Пока нет менеджеров</p>}
                        {users.map(u => {
                            const companyName = companies.find(c => c.id === u.companyId)?.name || 'Неизвестно';
                            return (
                                <div key={u.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-gray-800">{u.name}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                        <div className="text-[10px] uppercase font-bold text-blue-600 mt-1">{companyName}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">
                                            {u.password}
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteUser(e, u.id)}
                                            className="text-red-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            title="Удалить пользователя"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'employees' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Database size={20} className="text-blue-600" />
                    База сотрудников
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Здесь находятся все сотрудники.
                </p>

                <div className="space-y-2">
                    {allEmployees.length === 0 && <p className="text-gray-400 py-4 text-center">Список пуст</p>}
                    {allEmployees.map(emp => {
                         const companyName = companies.find(c => c.id === emp.companyId)?.name || 'Неизвестно';
                         return (
                            <div key={emp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="font-bold text-gray-900">{emp.name}</div>
                                    <div className="text-xs text-gray-500">{emp.position}</div>
                                    <div className="text-[10px] uppercase font-bold text-blue-600 mt-1">{companyName}</div>
                                </div>
                                <button 
                                    onClick={(e) => handleDeleteEmployee(e, emp.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Удалить сотрудника и результаты"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'matrix' && (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                     <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Компания</span>
                        <select 
                            value={selectedCompanyFilter} 
                            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="">Все компании</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                         <span className="text-xs font-bold text-gray-500 uppercase">Менеджер</span>
                        <select 
                            value={selectedManagerId} 
                            onChange={(e) => setSelectedManagerId(e.target.value)}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                            <option value="">Все менеджеры</option>
                            {users
                                .filter(u => !selectedCompanyFilter || u.companyId === selectedCompanyFilter)
                                .map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))
                            }
                        </select>
                    </div>
                    
                    <span className="text-sm text-gray-400 ml-auto self-center mt-4 sm:mt-0">
                        Оценок: {results.length}
                    </span>
                </div>
                
                {/* Admin view results but with Create Plan capability now unlocked internally */}
                <Results 
                    employees={results} 
                    onRestart={() => loadData()} 
                    readOnly={true} 
                />
            </div>
        )}
      </div>
    </div>
  );
};
