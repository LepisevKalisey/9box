
import React, { useState } from 'react';
import { User } from '../types';
import { LayoutGrid, ArrowRight, Lock, Mail } from 'lucide-react';
import { authUser } from '../services/storageService';

interface Props {
  onLogin: (user: User) => void;
}

export const Login: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = authUser(email, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <LayoutGrid className="text-white w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">9Box Talent Matrix</h1>
        <p className="text-center text-gray-500 mb-8">Вход в систему оценки</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
            </div>
            <input
              type="email"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
            </div>
            <input
              type="password"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 mt-6 shadow-md hover:shadow-lg"
          >
            Войти <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center bg-blue-50 p-4 rounded-xl">
            <p className="text-xs text-gray-600 font-semibold mb-1">
               Демо-доступ администратора:
            </p>
            <p className="text-xs text-gray-500 font-mono">
                admin@mides.kz / 128500
            </p>
        </div>
      </div>
    </div>
  );
};
