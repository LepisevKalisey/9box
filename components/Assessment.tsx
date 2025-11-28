
import React, { useState } from 'react';
import { EmployeeProfile, PerformanceLevel, PotentialLevel, Assessment as AssessmentType } from '../types';
import { ASSESSMENT_QUESTIONS } from '../constants';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface Props {
  employee: EmployeeProfile;
  onComplete: (results: { performance: PerformanceLevel, potential: PotentialLevel, answers: Record<string, number> }) => void;
  onBack: () => void;
  onGoCompany?: () => void;
}

export const Assessment: React.FC<Props> = ({ employee, onComplete, onBack, onGoCompany }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const currentQuestion = ASSESSMENT_QUESTIONS[currentQIndex];

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    const isLastQuestion = currentQIndex === ASSESSMENT_QUESTIONS.length - 1;

    // Auto-advance or Finish
    setTimeout(() => {
        if (isLastQuestion) {
            finishAssessment(newAnswers);
        } else {
            setCurrentQIndex(prev => prev + 1);
        }
    }, 300);
  };

  const handlePrevStep = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const finishAssessment = (finalAnswers: Record<string, number>) => {
    const perfScore = calculateScore(finalAnswers, 'performance');
    const potScore = calculateScore(finalAnswers, 'potential');
    
    onComplete({
        performance: mapScoreToLevel(perfScore),
        potential: mapScoreToLevel(potScore),
        answers: finalAnswers
    });
  };

  const calculateScore = (currentAnswers: Record<string, number>, category: 'performance' | 'potential') => {
    const questions = ASSESSMENT_QUESTIONS.filter(q => q.category === category);
    let total = 0;
    questions.forEach(q => {
      if (currentAnswers[q.id] !== undefined) {
        total += currentAnswers[q.id];
      }
    });
    return total;
  };

  const mapScoreToLevel = (score: number): 0 | 1 | 2 => {
    if (score <= 1) return 0;
    if (score <= 4) return 1;
    return 2;
  };

  const progressPercent = ((currentQIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100;
  const currentAnswerValue = answers[currentQuestion.id];

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col font-sans pb-10">
        {/* Minimal Header */}
        <div className="pt-4 pb-2 px-4 bg-gray-50 flex-none sticky top-14 z-20 shadow-sm border-b border-gray-100/50 backdrop-blur-md bg-gray-50/90">
             <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
                <div 
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
            <div className="flex justify-between items-end">
                <div>
                     <h2 className="text-sm font-bold text-gray-900 leading-none">{employee.name}</h2>
                     <p className="text-xs text-gray-500 mt-1 leading-none">{employee.position}</p>
                </div>
                <div className="text-xs font-medium text-gray-400">
                    {currentQIndex + 1} / {ASSESSMENT_QUESTIONS.length}
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 py-6">
            
            {/* Question (Main Focus) */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300" key={`q-${currentQuestion.id}`}>
                <h3 className="text-2xl font-bold text-gray-900 leading-snug">
                    {currentQuestion.questionText}
                </h3>
            </div>

            {/* Answers (Secondary) */}
            <div className="space-y-3 pb-10">
                {currentQuestion.options.map((opt) => {
                    const isSelected = currentAnswerValue === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => handleAnswer(opt.value)}
                            className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 active:scale-[0.98]
                                ${isSelected 
                                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-600' 
                                    : 'border-transparent bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {isSelected ? (
                                    <CheckCircle className="flex-none text-blue-600 mt-0.5" size={20} />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-none mt-0.5" />
                                )}
                                <span className="text-base font-medium leading-normal">
                                    {opt.description}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 flex-none z-10 safe-area-bottom flex justify-between items-center">
            <button 
                onClick={handlePrevStep}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 px-2 py-2 rounded-lg transition-colors text-sm font-medium"
            >
                <ArrowLeft size={18} /> Назад
            </button>
            {onGoCompany && (
                <button 
                    onClick={onGoCompany}
                    className="text-xs bg-gray-900 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-800"
                >
                    К компании
                </button>
            )}
        </div>
    </div>
  );
};
