import React, { useEffect, useMemo, useState } from 'react';
import { User } from '../types';
import type { Question } from '../constants';
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../services/storageService';
import { Edit2, Plus, Trash2, Save, X, ListChecks } from 'lucide-react';

interface Props {
  user: User;
}

export const AdminQuestions: React.FC<Props> = ({ user }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Question>>({});

  const [newQ, setNewQ] = useState<Partial<Question>>({
    category: 'performance',
    axis: 'x',
    isCalibration: false,
    title: '',
    questionText: '',
    options: [
      { value: 0, label: 'Низкий', description: '', weight: 1 },
      { value: 1, label: 'Средний', description: '', weight: 2 },
      { value: 2, label: 'Высокий', description: '', weight: 3 },
    ]
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (e) {
      setError('Ошибка загрузки вопросов');
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const byCat: Record<string, Question[]> = { performance: [], potential: [], calibration: [] } as any;
    questions.forEach(q => {
      (byCat[q.category] = byCat[q.category] || []).push(q);
    });
    return byCat;
  }, [questions]);

  const startEdit = (q: Question) => {
    setEditId(q.id);
    setDraft({ ...q, options: q.options.map(o => ({ ...o })) });
  };

  const cancelEdit = () => {
    setEditId(null);
    setDraft({});
  };

  const saveEdit = async () => {
    if (!editId) return;
    setLoading(true);
    try {
      const updated = await updateQuestion(user, editId, draft as Question);
      setQuestions(prev => prev.map(q => (q.id === editId ? updated : q)));
      cancelEdit();
    } catch (e) {
      setError('Ошибка сохранения вопроса');
    } finally {
      setLoading(false);
    }
  };

  const removeQ = async (id: string) => {
    if (!confirm('Удалить вопрос?')) return;
    setLoading(true);
    try {
      await deleteQuestion(user, id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      setError('Ошибка удаления вопроса');
    } finally {
      setLoading(false);
    }
  };

  const addNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.category || !newQ.questionText || !newQ.options || newQ.options.length === 0) return;
    setLoading(true);
    try {
      const created = await createQuestion(user, newQ as any);
      setQuestions(prev => [...prev, created]);
      setNewQ({ category: 'performance', title: '', questionText: '', options: [
        { value: 0, label: 'Низкий', description: '' },
        { value: 1, label: 'Средний', description: '' },
        { value: 2, label: 'Высокий', description: '' },
      ] });
    } catch (e) {
      setError('Ошибка добавления вопроса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <ListChecks className="text-blue-600" />
        <h2 className="font-bold">Вопросы оценки</h2>
        {loading && <span className="text-xs text-gray-500">Обновление...</span>}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3">Список вопросов</h3>

          {(['performance','potential','calibration'] as const).map(cat => (
            <div key={cat} className="mb-4">
              <div className="text-xs font-bold uppercase text-gray-500 mb-2">
                {cat === 'performance' && 'Эффективность'}
                {cat === 'potential' && 'Потенциал'}
                {cat === 'calibration' && 'Калибровка'}
              </div>
              <div className="space-y-2">
                {(grouped[cat] || []).map(q => (
                  <div key={q.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    {editId === q.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-gray-200"
                          value={draft.title || ''}
                          onChange={e => setDraft({ ...draft, title: e.target.value })}
                          placeholder="Заголовок"
                        />
                        <textarea
                          className="w-full px-3 py-2 rounded-lg border border-gray-200"
                          value={draft.questionText || ''}
                          onChange={e => setDraft({ ...draft, questionText: e.target.value })}
                          placeholder="Текст вопроса"
                        />
                        <div className="space-y-2">
                          {(draft.options || []).map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs w-16 text-gray-500">{opt.value}</span>
                              <input
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
                                value={opt.label || ''}
                                onChange={e => {
                                  const next = [...(draft.options as any)];
                                  next[idx] = { ...next[idx], label: e.target.value };
                                  setDraft({ ...draft, options: next });
                                }}
                                placeholder="Метка"
                              />
                              <input
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
                                value={opt.description || ''}
                                onChange={e => {
                                  const next = [...(draft.options as any)];
                                  next[idx] = { ...next[idx], description: e.target.value };
                                  setDraft({ ...draft, options: next });
                                }}
                                placeholder="Описание"
                              />
                              <input
                                className="w-28 px-3 py-2 rounded-lg border border-gray-200"
                                type="number"
                                value={typeof opt.weight === 'number' ? (opt.weight as number) : ''}
                                onChange={e => {
                                  const next = [...(draft.options as any)];
                                  next[idx] = { ...next[idx], weight: Number(e.target.value) };
                                  setDraft({ ...draft, options: next });
                                }}
                                placeholder="Вес"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={saveEdit} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1"><Save size={16}/>Сохранить</button>
                          <button onClick={cancelEdit} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1"><X size={16}/>Отмена</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-gray-900">{q.title || 'Без заголовка'}</div>
                          <div className="text-sm text-gray-700">{q.questionText}</div>
                          <ul className="mt-2 text-xs text-gray-600 list-disc pl-4">
                            {q.options.map(o => (
                              <li key={o.value}>{o.value}: {o.description}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(q)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Edit2 size={16}/></button>
                          <button onClick={() => removeQ(q.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {(grouped[cat] || []).length === 0 && (
                  <div className="text-xs text-gray-500">Нет вопросов</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3">Добавить вопрос</h3>
          <form onSubmit={addNew} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Категория</label>
              <select
                value={newQ.category as any}
                onChange={e => setNewQ({ ...newQ, category: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200"
              >
                <option value="performance">Эффективность</option>
                <option value="potential">Потенциал</option>
                <option value="calibration">Калибровка</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Ось</label>
                <select
                  value={(newQ.axis as any) || 'x'}
                  onChange={e => setNewQ({ ...newQ, axis: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200"
                >
                  <option value="x">X (Performance)</option>
                  <option value="y">Y (Potential)</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!newQ.isCalibration}
                  onChange={e => setNewQ({ ...newQ, isCalibration: e.target.checked })}
                />
                Калибровочный вопрос
              </label>
            </div>
            <input
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
              placeholder="Заголовок (необязательно)"
              value={newQ.title || ''}
              onChange={e => setNewQ({ ...newQ, title: e.target.value })}
            />
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-gray-200"
              placeholder="Текст вопроса"
              required
              value={newQ.questionText || ''}
              onChange={e => setNewQ({ ...newQ, questionText: e.target.value })}
            />
            <div className="space-y-2">
              {(newQ.options || []).map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-gray-500">{opt.value}</span>
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
                    value={opt.label || ''}
                    onChange={e => {
                      const next = [...(newQ.options as any)];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setNewQ({ ...newQ, options: next });
                    }}
                    placeholder="Метка"
                  />
                  <input
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
                    value={opt.description || ''}
                    onChange={e => {
                      const next = [...(newQ.options as any)];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setNewQ({ ...newQ, options: next });
                    }}
                    placeholder="Описание"
                  />
                  <input
                    className="w-28 px-3 py-2 rounded-lg border border-gray-200"
                    type="number"
                    value={typeof opt.weight === 'number' ? (opt.weight as number) : ''}
                    onChange={e => {
                      const next = [...(newQ.options as any)];
                      next[idx] = { ...next[idx], weight: Number(e.target.value) };
                      setNewQ({ ...newQ, options: next });
                    }}
                    placeholder="Вес"
                  />
                </div>
              ))}
            </div>
            <button className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold flex items-center justify-center gap-2"><Plus size={16}/>Добавить</button>
          </form>
        </div>
      </div>
    </div>
  );
};
