
import React, { useState, useEffect } from 'react';
import { User, EmployeeProfile, Company } from '../types';
import { createUser, getCompanyUsers, getAdminResults, getGlobalEmployees, deleteEmployee, createCompany, getCompanies, deleteUser, deleteCompany, updateCompany, setCompanyDirector } from '../services/storageService';
import { Results } from './Results';
import { UserPlus, BarChart, Users, LogOut, Layout, Trash2, Database, Building, Loader2 } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'employees' | 'companies'>('matrix');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedUserCompanyId, setSelectedUserCompanyId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'manager' | 'director'>('manager');
  const [msg, setMsg] = useState('');

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDisableAdd, setNewCompanyDisableAdd] = useState(false);

  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedManagerId, selectedCompanyFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [allUsers, allCompanies] = await Promise.all([
            getCompanyUsers(user),
            getCompanies()
        ]);
        
        setUsers(allUsers);
        setCompanies(allCompanies);
        
        if (!selectedUserCompanyId && allCompanies.length > 0) {
            setSelectedUserCompanyId(allCompanies[0].id);
        }
        
        if (activeTab === 'matrix') {
            const res = await getAdminResults(user, selectedManagerId || undefined, selectedCompanyFilter || undefined);
            setResults(res);
        }
        
        if (activeTab === 'employees') {
            setAllEmployees(await getGlobalEmployees(user));
        }
    } catch (e) {
        console.error("Error loading data", e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await createUser(user, { 
        name: newName, 
        email: newEmail, 
        password: newPassword,
        companyId: selectedUserCompanyId,
        role: newUserRole
    });
    if (success) {
        setMsg('Пользователь создан успешно!');
        setNewName(''); setNewEmail(''); setNewPassword('');
        await loadData();
    } else {
        setMsg('Ошибка: Email уже занят или неверные данные.');
    }
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCompanyName.trim()) return;
      setLoading(true);
      await createCompany(newCompanyName, { disableUserAddEmployees: newCompanyDisableAdd });
      setNewCompanyName('');
      setNewCompanyDisableAdd(false);
      await loadData();
      setLoading(false);
  };

  const handleDeleteEmployee = async (e: React.MouseEvent, empId: string) => {
      e.stopPropagation();
      if (confirm('Вы уверены? Это удалит сотрудника и ВСЕ результаты его оценок.')) {
          setLoading(true);
          await deleteEmployee(user, empId);
          await loadData();
          setLoading(false);
      }
  };

  const handleDeleteUser = async (e: React.MouseEvent, userId: string) => {
      e.stopPropagation();
      if (confirm('Вы уверены? Это удалит пользователя и все связанные данные.')) {
          setLoading(true);
          await deleteUser(user, userId);
          await loadData();
          setLoading(false);
      }
  };

  const handleDeleteCompany = async (e: React.MouseEvent, companyId: string) => {
      e.stopPropagation();
      if (confirm('ВНИМАНИЕ: Это удалит компанию и ВСЕХ связанных с ней пользователей и сотрудников.')) {
          setLoading(true);
          await deleteCompany(user, companyId);
          await loadData();
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Layout className="text-blue-400" />
                <h1 className="font-bold text-lg">Кабинет Администратора</h1>
                <span className="text-[10px] text-gray-400 font-mono ml-2">v{__APP_VERSION__}</span>
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
        <div className="relative flex gap-2 mb-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit overflow-x-auto max-w-full">
            {[
                { id: 'matrix', label: 'Общая матрица', icon: BarChart },
                { id: 'companies', label: 'Компании', icon: Building },
                { id: 'users', label: 'Менеджеры', icon: UserPlus },
                { id: 'employees', label: 'База сотрудников', icon: Database },
            ].map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap
                        ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    <tab.icon size={18} /> {tab.label}
                </button>
            ))}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none md:hidden"></div>
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden"></div>
        </div>
        <div className="text-[10px] text-gray-400 mb-6 md:hidden">Свайпните вкладки влево/вправо</div>

        {(activeTab === 'users' || activeTab === 'employees') && (
            <div className="flex items-center gap-3 mb-4">
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
        )}

        {loading && <div className="text-center py-4"><Loader2 className="animate-spin inline mr-2"/>Обновление...</div>}

        {!loading && activeTab === 'companies' && (
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
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={newCompanyDisableAdd}
                                onChange={e => setNewCompanyDisableAdd(e.target.checked)}
                            />
                            Запретить менеджерам добавлять сотрудников
                        </label>
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
                                <div>
                                    <div className="font-bold text-gray-800">{c.name}</div>
                                    <label className="flex items-center gap-2 text-[12px] text-gray-700 mt-1">
                                        <input
                                            type="checkbox"
                                            checked={!!c.disableUserAddEmployees}
                                            onChange={async (e) => {
                                                setLoading(true);
                                                await updateCompany(user, c.id, { disableUserAddEmployees: e.target.checked });
                                                await loadData();
                                                setLoading(false);
                                            }}
                                        />
                                        Запретить добавление сотрудника менеджерами
                                    </label>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button 
                                        onClick={(e) => handleDeleteCompany(e, c.id)}
                                        className="text-red-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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

        {!loading && activeTab === 'users' && (
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
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Роль</label>
                            <select 
                                value={newUserRole}
                                onChange={e => setNewUserRole(e.target.value as any)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                            >
                                <option value="manager">Менеджер</option>
                                <option value="director">Директор</option>
                            </select>
                        </div>
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
                        {users
                          .filter(u => !selectedCompanyFilter || u.companyId === selectedCompanyFilter)
                          .map(u => {
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

        {!loading && activeTab === 'employees' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Database size={20} className="text-blue-600" />
                    База сотрудников
                </h2>
                <div className="space-y-2">
                    {allEmployees.length === 0 && <p className="text-gray-400 py-4 text-center">Список пуст</p>}
                    {allEmployees
                        .filter(emp => !selectedCompanyFilter || emp.companyId === selectedCompanyFilter)
                        .map(emp => {
                         const companyName = companies.find(c => c.id === emp.companyId)?.name || 'Неизвестно';
                         return (
                            <div key={emp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="font-bold text-gray-900">{emp.name}</div>
                                    <div className="text-xs text-gray-500">{emp.position}</div>
                                    <div className="text-[10px] uppercase font-bold text-blue-600 mt-1">{companyName}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => handleDeleteEmployee(e, emp.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {emp.linkedUserId && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setLoading(true);
                                                await setCompanyDirector(user, emp.companyId, emp.linkedUserId!);
                                                await loadData();
                                                setLoading(false);
                                            }}
                                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Назначить директором
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {!loading && activeTab === 'matrix' && (
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
                </div>
                
                <Results 
                    employees={results} 
                    onRestart={() => loadData()} 
                    readOnly={true}
                    adminUser={user}
                />
            </div>
        )}
      </div>
    </div>
  );
};
declare const __APP_VERSION__: string;
