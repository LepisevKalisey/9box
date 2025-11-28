
import React, { useState, useEffect } from 'react';
import { EmployeeResult, PerformanceLevel, PotentialLevel, User } from '../types';
import { GET_BOX, BOX_GUIDE } from '../constants';
import { deleteAssessment } from '../services/storageService';
import { RefreshCw, Sparkles, X, ChevronRight, LayoutGrid, List, UserPlus, AlertTriangle } from 'lucide-react';

interface Props {
  employees: EmployeeResult[];
  onRestart: () => void; // Used as refresh or restart
  onAddMore?: () => void; // Optional: button to add more employees
  readOnly?: boolean; // If true, disables "Generate Advice" (Admin View)
  adminUser?: User; // Admin for operations like delete assessment
}

export const Results: React.FC<Props> = ({ employees, onRestart, onAddMore, readOnly = false, adminUser }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResult | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
        setViewMode('list');
    }
  }, []);

  const getEmployeesInBox = (perf: PerformanceLevel, pot: PotentialLevel) => {
    return employees.filter(e => e.performance === perf && e.potential === pot);
  };

  const handleEmployeeClick = (emp: EmployeeResult) => {
    setSelectedEmployee(emp);
  };


  const handleDeleteAssessment = async () => {
    if (!selectedEmployee || !selectedEmployee.assessmentId || !adminUser) return;
    setDeleting(true);
    try {
      await deleteAssessment(adminUser, selectedEmployee.assessmentId);
      setSelectedEmployee(null);
      onRestart();
    } finally {
      setDeleting(false);
    }
  };

  // --- Renderers ---

  const renderGrid = () => (
    <div className="relative">
         {/* Y Axis Label */}
         <div className="absolute -left-10 top-0 bottom-0 flex items-center justify-center z-10">
                <span className="-rotate-90 font-bold text-gray-500 tracking-widest text-xs whitespace-nowrap bg-white/90 px-1 rounded">ПОТЕНЦИАЛ</span>
        </div>
        
        <div className="grid grid-rows-3 gap-2 h-[500px] lg:h-[600px] border-l-2 border-b-2 border-gray-300 p-2 ml-12">
                {[2, 1, 0].map(pot => (
                    <div key={`row-${pot}`} className="grid grid-cols-3 gap-2">
                        {[0, 1, 2].map(perf => {
                            const box = GET_BOX(perf, pot);
                            const emps = getEmployeesInBox(perf, pot);
                            
                            return (
                                <div 
                                    key={box.id} 
                                    className={`${box.color} border border-white/50 rounded-lg p-2 relative hover:shadow-md transition-all flex flex-col`}
                                >
                                    <div className={`text-[10px] font-bold uppercase mb-1 opacity-70 truncate ${box.textColor}`}>
                                        {box.name}
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                        {emps.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleEmployeeClick(emp)}
                                                className="w-full text-left bg-white/60 hover:bg-white px-2 py-1 rounded text-xs shadow-sm transition-colors flex items-center justify-between group"
                                            >
                                                <span className="truncate font-medium text-gray-900 flex items-center gap-1">
                                                  {emp.riskFlag && <AlertTriangle size={12} className="text-red-500" />}
                                                  {emp.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="absolute top-1 right-1 text-[10px] font-bold bg-white/40 w-5 h-5 flex items-center justify-center rounded-full text-gray-700">
                                        {emps.length}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
        </div>
         {/* X Axis Label */}
         <div className="mt-2 text-center font-bold text-gray-400 tracking-widest text-xs ml-4">
            ЭФФЕКТИВНОСТЬ
        </div>
    </div>
  );

  const renderList = () => {
    const activeBoxes: { def: any, emps: EmployeeResult[] }[] = [];
    [2, 1, 0].forEach(pot => {
        [0, 1, 2].forEach(perf => {
             const emps = getEmployeesInBox(perf, pot);
             if (emps.length > 0) {
                 activeBoxes.push({ def: GET_BOX(perf, pot), emps });
             }
        });
    });

    if (activeBoxes.length === 0) return <div className="text-center text-gray-500 py-10">Нет данных для отображения</div>;

    return (
        <div className="space-y-4">
            {activeBoxes.map(({ def, emps }) => (
                <div key={def.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className={`${def.color} px-4 py-3 flex justify-between items-center border-b border-white/20`}>
                        <h3 className={`font-bold text-sm uppercase ${def.textColor}`}>{def.name}</h3>
                        <span className="bg-white/40 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">{emps.length}</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {emps.map(emp => (
                            <button 
                                key={emp.id}
                                onClick={() => handleEmployeeClick(emp)}
                                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                            >
                                <div>
                                    <div className="font-bold text-gray-800">{emp.name}</div>
                                    <div className="text-xs text-gray-500">{emp.position}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                     {emp.riskFlag && <AlertTriangle size={14} className="text-red-500" />}
                                     {emp.aiAdvice && <Sparkles size={14} className="text-purple-500" />}
                                     <ChevronRight size={16} className="text-gray-300" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-20">
       <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
         <h2 className="text-2xl font-bold text-gray-900">Результаты</h2>
         <div className="text-sm text-gray-500">Оценок: {employees.length}</div>
          <div className="flex gap-2">
             <div className="bg-gray-100 p-1 rounded-lg flex md:hidden">
                 <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                 >
                    <LayoutGrid size={18} />
                 </button>
                 <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                 >
                    <List size={18} />
                 </button>
             </div>
             
             {onAddMore && (
                 <button
                    onClick={onAddMore}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-bold text-sm"
                 >
                    <UserPlus size={16} /> Оценить еще
                 </button>
             )}
          </div>
       </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1">
            {viewMode === 'grid' ? renderGrid() : renderList()}
        </div>

        {/* Desktop Sidebar (visible on large screens) */}
        <div className="hidden lg:block w-96 bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-fit sticky top-24">
             {selectedEmployee ? (
                 <EmployeeDetailContent 
                   employee={selectedEmployee} 
                   onClose={() => setSelectedEmployee(null)}
                   readOnly={readOnly}
                   onDeleteAssessment={handleDeleteAssessment}
                   deleting={deleting}
                 />
             ) : (
                <div className="text-center text-gray-400 py-20 flex flex-col items-center">
                    <LayoutGrid size={48} className="mb-4 opacity-20" />
                    <p>Выберите сотрудника для просмотра деталей</p>
                </div>
             )}
        </div>
      </div>

      {/* Mobile Modal/Sheet for Details */}
      {selectedEmployee && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="font-bold text-lg text-gray-900">Детали</h3>
                      <button 
                        onClick={() => setSelectedEmployee(null)}
                        className="p-2 bg-gray-100 rounded-full text-gray-500"
                      >
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6">
                      <EmployeeDetailContent 
                        employee={selectedEmployee} 
                        onClose={() => setSelectedEmployee(null)}
                        readOnly={readOnly}
                        onDeleteAssessment={handleDeleteAssessment}
                        deleting={deleting}
                     />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const EmployeeDetailContent: React.FC<{
    employee: EmployeeResult;
    onClose: () => void;
    readOnly?: boolean;
    onDeleteAssessment?: () => void;
    deleting?: boolean;
}> = ({ employee, readOnly, onDeleteAssessment, deleting }) => {
    const box = GET_BOX(employee.performance!, employee.potential!);
    const guide = BOX_GUIDE[box.id];

    return (
        <div>
            <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{employee.name}</h3>
                <p className="text-gray-500">{employee.position}</p>
            </div>

            <div className={`p-4 rounded-xl mb-6 ${box.color} ${box.textColor} ring-1 ring-black/5`}>
              <div className="font-bold text-lg mb-1">{box.name}</div>
              <div className="text-sm opacity-90 leading-snug">{box.description}</div>
            </div>
            {employee.riskFlag && (
              <div className="mb-6 flex items-center gap-2 text-red-600 font-bold text-sm">
                 <AlertTriangle size={16} /> Риск ухода: требуется план удержания
              </div>
            )}

            <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-800">Краткое описание и рекомендации</h4>
                    {employee.date && (
                        <span className="text-xs text-gray-400">Дата оценки: {new Date(employee.date).toLocaleDateString()}</span>
                    )}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-200">
                    <div className="mb-3 font-medium">{guide.summary}</div>
                    <ul className="list-disc pl-5 space-y-1">
                        {guide.recommendations.map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>
                </div>
            </div>
            {readOnly && employee.assessmentId && (
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onDeleteAssessment}
                        disabled={deleting}
                        className="text-xs bg-red-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? 'Удаление...' : 'Удалить оценку'}
                    </button>
                </div>
            )}
        </div>
    );
};
