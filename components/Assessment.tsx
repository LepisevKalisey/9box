
import React, { useEffect, useState } from 'react';
import { EmployeeProfile, PerformanceLevel, PotentialLevel, Assessment as AssessmentType } from '../types';
import { ASSESSMENT_QUESTIONS, Question } from '../constants';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getQuestions, getThresholds } from '../services/storageService';

interface Props {
  employee: EmployeeProfile;
  onComplete: (results: { performance: PerformanceLevel, potential: PotentialLevel, answers: Record<string, number> }) => void;
  onBack: () => void;
}

export const Assessment: React.FC<Props> = ({ employee, onComplete, onBack }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questions, setQuestions] = useState<Question[]>(ASSESSMENT_QUESTIONS);
  const [thresholds, setThresholds] = useState<{ x: { low_max: number, med_max: number }, y: { low_max: number, med_max: number } } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [q, th] = await Promise.all([getQuestions(), getThresholds()]);
        if (Array.isArray(q) && q.length > 0) {
          setQuestions(q);
        }
        if (th) setThresholds(th);
      } catch {}
    })();
  }, []);

  const currentQuestion = questions[currentQIndex];
  if (!currentQuestion) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col font-sans pb-10">
        <div className="pt-4 pb-2 px-4 bg-gray-50 flex-none sticky top-14 z-20 shadow-sm border-b border-gray-100/50 backdrop-blur-md bg-gray-50/90">
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
            <div className="bg-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `0%` }} />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-none">{employee.name}</h2>
              <p className="text-xs text-gray-500 mt-1 leading-none">{employee.position}</p>
            </div>
            <div className="text-xs font-medium text-gray-400">0 / 0</div>
          </div>
        </div>
        <div className="flex-1 px-4 py-6">
          <div className="text-center text-gray-500 py-20">Загрузка вопросов...</div>
        </div>
      </div>
    );
  }

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    const isLastQuestion = currentQIndex === questions.length - 1;

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
    if (Object.keys(finalAnswers).length !== questions.length) {
      return;
    }
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const getAxis = (q: Question): 'x' | 'y' => q.axis ? q.axis : (q.category === 'performance' ? 'x' : 'y');
    const getWeight = (q: Question, selected: number): number => {
      const opt = q.options.find(o => o.value === selected);
      if (opt && typeof opt.weight === 'number') return opt.weight as number;
      if (q.isCalibration) {
        if (selected === 0) return -4; if (selected === 1) return 0; if (selected === 2) return 2;
        return 0;
      }
      if (selected === 0) return 1; if (selected === 1) return 2; if (selected === 2) return 3;
      return selected;
    };

    let xSum = 0, ySum = 0;
    questions.forEach(q => {
      const sel = finalAnswers[q.id];
      const w = getWeight(q, sel);
      if (getAxis(q) === 'x') xSum += w; else ySum += w;
    });

    // Optional clamp if thresholds exist
    const [min, max] = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
    xSum = clamp(xSum, min, max);
    ySum = clamp(ySum, min, max);

    const toLevel = (axis: 'x'|'y', score: number): PerformanceLevel | PotentialLevel => {
      const th = thresholds || { x: { low_max: 13, med_max: 20 }, y: { low_max: 13, med_max: 20 } };
      const t = th[axis];
      if (score <= t.low_max) return 0 as any;
      if (score <= t.med_max) return 1 as any;
      return 2 as any;
    };

    const performanceLevel = toLevel('x', xSum) as PerformanceLevel;
    const potentialLevel = toLevel('y', ySum) as PotentialLevel;

    onComplete({ performance: performanceLevel, potential: potentialLevel, answers: finalAnswers });
  };

  const calculateScore = (currentAnswers: Record<string, number>, category: 'performance' | 'potential') => {
    const list = questions.filter(q => q.category === category);
    let total = 0;
    list.forEach(q => {
      if (currentAnswers[q.id] !== undefined) {
        const opt = q.options.find(o => o.value === currentAnswers[q.id]);
        total += typeof opt?.weight === 'number' ? (opt!.weight as number) : (q.isCalibration ? (currentAnswers[q.id] === 0 ? -4 : currentAnswers[q.id] === 1 ? 0 : 2) : (currentAnswers[q.id] + 1));
      }
    });
    return total;
  };

  const mapScoreToLevel = (score: number): 0 | 1 | 2 => {
    const th = thresholds || { x: { low_max: 13, med_max: 20 }, y: { low_max: 13, med_max: 20 } };
    // This function is unused in new flow; kept for fallback
    if (score <= th.x.low_max) return 0;
    if (score <= th.x.med_max) return 1;
    return 2;
  };

  const progressPercent = questions.length > 0 ? (((currentQIndex + 1) / questions.length) * 100) : 0;
  const currentAnswerValue = currentQuestion ? answers[currentQuestion.id] : undefined;

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
                    {currentQIndex + 1} / {questions.length}
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

        {/* Back Button */}
        <div className="p-4 flex-none z-10 safe-area-bottom">
            <button 
                onClick={handlePrevStep}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 px-2 py-2 rounded-lg transition-colors text-sm font-medium"
            >
                <ArrowLeft size={18} /> Назад
            </button>
        </div>
    </div>
  );
};
