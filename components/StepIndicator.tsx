import React from 'react';
import { AppStep } from '../types';
import { Users, ClipboardList, PieChart } from 'lucide-react';

interface Props {
  currentStep: AppStep;
}

export const StepIndicator: React.FC<Props> = ({ currentStep }) => {
  const steps = [
    { id: 'select_employee', label: 'Список', icon: Users },
    { id: 'assess', label: 'Оценка', icon: ClipboardList },
    { id: 'results', label: 'Итог', icon: PieChart },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm safe-area-top">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            // Logic to determine if completed: simple index comparison would be better if strictly linear
            const isCompleted = 
              (currentStep === 'assess' && step.id === 'select_employee') ||
              (currentStep === 'results' && step.id !== 'results');
            
            const Icon = step.icon;

            return (
              <div 
                key={step.id} 
                className={`flex flex-col items-center transition-opacity duration-300
                  ${isActive ? 'opacity-100' : isCompleted ? 'opacity-60' : 'opacity-40'}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 mb-1
                    ${isActive ? 'bg-blue-600 text-white scale-110 shadow' : 
                      isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  <Icon size={16} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};