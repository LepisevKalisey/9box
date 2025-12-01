import React, { useEffect, useState } from 'react'
import { User, EmployeeProfile } from '../types'
import { Results } from './Results'
import { getAdminResults, getCompanyUsers, createUser, deleteUser, deleteEmployee, convertEmployeeToUser } from '../services/storageService'
import { BarChart, Users, LogOut, Layout, Database, Trash2, UserPlus, Loader2 } from 'lucide-react'

declare const __APP_VERSION__: string;

interface Props {
  user: User
  onLogout: () => void
  onGoAssess: () => void
}

export const DirectorDashboard: React.FC<Props> = ({ user, onLogout, onGoAssess }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'employees'>('matrix')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [employees, setEmployees] = useState<EmployeeProfile[]>([])
  const [results, setResults] = useState<any[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { loadData() }, [activeTab, selectedManagerId])

  const loadData = async () => {
    setLoading(true)
    try {
      const companyUsers = await getCompanyUsers(user)
      setUsers(companyUsers.filter(u => u.companyId === user.companyId))
      if (activeTab === 'matrix') {
        const r = await getAdminResults(user, selectedManagerId || undefined, user.companyId)
        setResults(r)
      }
      if (activeTab === 'employees') {
        // reuse admin results employees via users list -> no direct employees service for director; fetch via API
        const res = await fetch(`/api/employees?companyId=${encodeURIComponent(user.companyId)}`)
        const emps = await res.json()
        setEmployees(emps)
      }
    } finally { setLoading(false) }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const ok = await createUser(user, { name: newName, email: newEmail, password: newPassword, companyId: user.companyId, role: 'manager' })
    setMsg(ok ? 'Пользователь создан' : 'Ошибка создания')
    setNewName(''); setNewEmail(''); setNewPassword('')
    await loadData()
    setLoading(false)
    setTimeout(() => setMsg(''), 2500)
  }

  const handleDeleteUser = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    if (!confirm('Удалить пользователя?')) return
    setLoading(true)
    await deleteUser(user, userId)
    await loadData()
    setLoading(false)
  }

  const handleDeleteEmployee = async (e: React.MouseEvent, empId: string) => {
    e.stopPropagation()
    if (!confirm('Удалить сотрудника и его оценки?')) return
    setLoading(true)
    await deleteEmployee(user, empId)
    await loadData()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layout className="text-blue-400" />
            <h1 className="font-bold text-lg">Кабинет Директора</h1>
            <span className="text-[10px] text-gray-400 font-mono ml-2">v{__APP_VERSION__}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onGoAssess} className="text-sm bg-blue-600 px-3 py-1 rounded-lg">Оценивать</button>
            <button onClick={onLogout} className="text-sm text-red-300 hover:text-white flex items-center gap-1">
              <LogOut size={16} /> Выход
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="relative flex gap-2 mb-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit overflow-x-auto max-w-full">
          {[
            { id: 'matrix', label: 'Матрица', icon: BarChart },
            { id: 'users', label: 'Пользователи', icon: Users },
            { id: 'employees', label: 'Сотрудники', icon: Database }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none md:hidden"></div>
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden"></div>
        </div>
        <div className="text-[10px] text-gray-400 mb-6 md:hidden">Свайпните вкладки влево/вправо</div>

        {loading && <div className="text-center py-4"><Loader2 className="animate-spin inline mr-2"/>Обновление...</div>}

        {!loading && activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Менеджер</span>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Все менеджеры</option>
                  {users
                    .filter(u => u.companyId === user.companyId)
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <Results employees={results} onRestart={() => loadData()} readOnly={true} adminUser={user} />
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-blue-600" /> Добавить пользователя
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input type="text" placeholder="Имя Фамилия" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                <input type="email" placeholder="Email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                <input type="text" placeholder="Пароль" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" />
                <button className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">Создать аккаунт</button>
                {msg && <p className={`text-center text-sm ${msg.includes('Ошибка') ? 'text-red-500' : 'text-green-500'}`}>{msg}</p>}
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-600" /> Список пользователей компании
              </h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {users.length === 0 && <p className="text-gray-400">Пока нет пользователей</p>}
                {users.sort((a,b) => (a.role === 'director' ? -1 : 1) - (b.role === 'director' ? -1 : 1)).map(u => (
                  <div key={u.id} className={`p-3 rounded-lg flex justify-between items-center group ${u.role === 'director' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                    <div>
                      <div className="font-bold text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                      <div className="text-[10px] uppercase font-bold text-blue-600 mt-1">{u.role === 'director' ? 'Директор' : 'Менеджер'}</div>
                    </div>
                    <button onClick={(e) => handleDeleteUser(e, u.id)} className="text-red-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" disabled={u.role === 'director'}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'employees' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Database size={20} className="text-blue-600" /> Сотрудники компании
            </h2>
            <div className="space-y-2">
              {employees.length === 0 && <p className="text-gray-400 py-4 text-center">Список пуст</p>}
              {employees.map(emp => (
                <div key={emp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-bold text-gray-900">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.position}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDeleteEmployee(e, emp.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                    {!emp.linkedUserId && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const email = prompt('Email пользователя')
                          if (!email) return
                          const password = prompt('Пароль')
                          if (!password) return
                          setLoading(true)
                          try {
                            await convertEmployeeToUser(user, emp.id, email, password)
                            await loadData()
                          } finally {
                            setLoading(false)
                          }
                        }}
                        className="px-3 py-1 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        Конвертировать в пользователя
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
