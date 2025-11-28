
import React, { useState, useEffect } from 'react';
import { User, EmployeeProfile, EmployeeResult, AppStep, PerformanceLevel, PotentialLevel } from './types';
import { EmployeeSelector } from './components/EmployeeSelector';
import { Assessment } from './components/Assessment';
import { AssessmentComplete } from './components/AssessmentComplete';
import { Results } from './components/Results';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { getUserResults, saveAssessment } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState<AppStep>('login');
  
  const [activeEmployee, setActiveEmployee] = useState<EmployeeProfile | null>(null);
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Load user from session
  useEffect(() => {
    const savedUser = localStorage.getItem('9box_user_session');
    if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
    }
  }, []);

  useEffect(() => {
    if (user) {
        if (user.role === 'admin') {
            setCurrentStep('admin_dashboard');
        } else {
            loadUserResults();
            if (currentStep === 'login') setCurrentStep('select_employee');
        }
    } else {
        setCurrentStep('login');
    }
  }, [user]);

  const loadUserResults = async () => {
      if (user) {
          setLoadingResults(true);
          try {
             const data = await getUserResults(user);
             setResults(data);
          } catch (e) {
             console.error(e);
          } finally {
             setLoadingResults(false);
          }
      }
  };

  const handleLogin = (newUser: User) => {
    localStorage.setItem('9box_user_session', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('9box_user_session');
    setUser(null);
    setActiveEmployee(null);
    setCurrentStep('login');
  };

  const handleSelectEmployee = (emp: EmployeeProfile) => {
      setActiveEmployee(emp);
      setCurrentStep('assess');
  };

  const handleAssessmentComplete = async (data: { performance: PerformanceLevel, potential: PotentialLevel, answers: Record<string, number> }) => {
      if (!user || !activeEmployee) return;
      await saveAssessment(user, activeEmployee.id, data);
      await loadUserResults(); 
      setCurrentStep('assessment_complete');
  };

  if (currentStep === 'login') {
      return <Login onLogin={handleLogin} />;
  }

  if (currentStep === 'admin_dashboard' && user?.role === 'admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-white border-b border-gray-100 py-3 px-4 flex justify-between items-center safe-area-top">
            <h1 className="text-sm font-bold text-gray-900 tracking-tight">9Box Matrix</h1>
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 hidden sm:inline">{user?.email}</span>
                <button 
                    onClick={handleLogout}
                    className="text-xs text-red-500 font-medium hover:text-red-700"
                >
                    Выйти
                </button>
            </div>
        </header>

      
      
      <main className="flex-1 w-full max-w-screen-xl mx-auto">
        
        {currentStep === 'select_employee' && user && (
            <EmployeeSelector 
                user={user} 
                onSelect={handleSelectEmployee}
            />
        )}

        {currentStep === 'assess' && activeEmployee && (
            <Assessment 
                employee={activeEmployee}
                onComplete={handleAssessmentComplete}
                onBack={() => setCurrentStep('select_employee')}
            />
        )}

        {currentStep === 'assessment_complete' && (
            <AssessmentComplete 
                onAssessNext={() => {
                    setActiveEmployee(null);
                    setCurrentStep('select_employee');
                }}
            />
        )}

        {currentStep === 'results' && user?.role === 'admin' && (
            loadingResults ? (
                <div className="flex justify-center py-20 text-gray-500">Загрузка результатов...</div>
            ) : (
                <Results 
                    employees={results}
                    onRestart={() => loadUserResults()}
                    onAddMore={() => setCurrentStep('select_employee')}
                    readOnly={true}
                />
            )
        )}
      </main>
    </div>
  );
};

export default App;
