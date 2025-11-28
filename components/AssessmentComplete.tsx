import React from 'react';
import { CheckCircle, UserPlus, PieChart } from 'lucide-react';

interface Props {
  onAssessNext: () => void;
  onViewResults?: () => void;
}

export const AssessmentComplete: React.FC<Props> = ({ onAssessNext, onViewResults }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Оценка сохранена!</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Данные успешно добавлены в матрицу. Что делаем дальше?</p>

        <div className="w-full max-w-sm space-y-3">
            <button 
                onClick={onAssessNext}
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <UserPlus size={20} />
                Оценить следующего
            </button>
            
            {onViewResults && (
              <button 
                  onClick={onViewResults}
                  className="w-full py-4 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                  <PieChart size={20} />
                  Смотреть результаты
              </button>
            )}
        </div>
    </div>
  );
};
