import { BoxDefinition, PerformanceLevel, PotentialLevel } from './types';

export const BOX_DEFINITIONS: BoxDefinition[][] = [
  // Row 0 (Low Potential)
  [
    {
      id: 'risk',
      name: 'Риск увольнения', // Low Pot, Low Perf
      description: 'Низкая эффективность и потенциал. Требуется план улучшений или увольнение.',
      color: 'bg-red-100',
      textColor: 'text-red-800',
      x: 0,
      y: 0
    },
    {
      id: 'effective',
      name: 'Эффективный сотрудник', // Low Pot, Mod Perf
      description: 'Хорошо справляется с текущей ролью. Ключевой исполнитель.',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      x: 1,
      y: 0
    },
    {
      id: 'expert',
      name: 'Профессионал', // Low Pot, High Perf
      description: 'Эксперт в своем деле. Удерживать и мотивировать.',
      color: 'bg-green-100',
      textColor: 'text-green-800',
      x: 2,
      y: 0
    }
  ],
  // Row 1 (Moderate Potential)
  [
    {
      id: 'inconsistent',
      name: 'Нестабильный игрок', // Mod Pot, Low Perf
      description: 'Есть потенциал, но результаты слабые. Нужен коучинг или смена роли.',
      color: 'bg-orange-100',
      textColor: 'text-orange-800',
      x: 0,
      y: 1
    },
    {
      id: 'core',
      name: 'Ключевой игрок', // Mod Pot, Mod Perf
      description: 'Надежный сотрудник с возможностью роста.',
      color: 'bg-blue-100',
      textColor: 'text-blue-800',
      x: 1,
      y: 1
    },
    {
      id: 'high-impact',
      name: 'Высокоэффективный', // Mod Pot, High Perf
      description: 'Отличные результаты, может брать больше ответственности.',
      color: 'bg-green-200',
      textColor: 'text-green-900',
      x: 2,
      y: 1
    }
  ],
  // Row 2 (High Potential)
  [
    {
      id: 'enigma',
      name: 'Темная лошадка', // High Pot, Low Perf
      description: 'Высокий талант, низкие результаты. Нужно выяснить причины.',
      color: 'bg-yellow-200',
      textColor: 'text-yellow-900',
      x: 0,
      y: 2
    },
    {
      id: 'growth',
      name: 'Растущая звезда', // High Pot, Mod Perf
      description: 'Быстро учится, хорошие результаты. Готовить к повышению.',
      color: 'bg-teal-100',
      textColor: 'text-teal-800',
      x: 1,
      y: 2
    },
    {
      id: 'star',
      name: 'Будущий лидер', // High Pot, High Perf
      description: 'Топ-талант. Требует особых программ развития и удержания.',
      color: 'bg-purple-100',
      textColor: 'text-purple-800',
      x: 2,
      y: 2
    }
  ]
];

export const GET_BOX = (perf: PerformanceLevel, pot: PotentialLevel): BoxDefinition => {
  return BOX_DEFINITIONS[pot][perf];
};

export interface QuestionOption {
  value: number; // 0, 1, 2
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  category: 'performance' | 'potential' | 'calibration';
  title: string;
  questionText: string;
  options: QuestionOption[];
}

export const ASSESSMENT_QUESTIONS: Question[] = [
  // --- PERFORMANCE ---
  {
    id: 'perf_quality',
    category: 'performance',
    title: '1. Качество результата (Zero Defect)',
    questionText: 'Как часто вам приходится вмешиваться в работу сотрудника, чтобы исправить ошибки или докрутить результат до нужного уровня?',
    options: [
      { value: 0, label: 'Низкий', description: 'Часто. Я регулярно перепроверяю за ним ключевые этапы.' },
      { value: 1, label: 'Средний', description: 'Иногда. В сложных задачах нужен мой контроль, в типовых — справляется сам.' },
      { value: 2, label: 'Высокий', description: 'Почти никогда. Я полностью доверяю его результату («сделал и забыл»).' }
    ]
  },
  {
    id: 'perf_autonomy',
    category: 'performance',
    title: '2. Стабильность и автономность',
    questionText: 'Как сотрудник действует в ситуациях неопределенности или отсутствия четких инструкций?',
    options: [
      { value: 0, label: 'Низкий', description: 'Останавливается и ждет указаний / впадает в ступор.' },
      { value: 1, label: 'Средний', description: 'Пытается решить, но часто требует валидации решения у меня.' },
      { value: 2, label: 'Высокий', description: 'Самостоятельно находит решение, предлагает варианты и продолжает движение к цели.' }
    ]
  },
  {
    id: 'perf_efficiency',
    category: 'performance',
    title: '3. Эффективность (Volume vs Resources)',
    questionText: 'Если сравнить этого сотрудника с идеальным профилем роли, какова его отдача?',
    options: [
      { value: 0, label: 'Низкий', description: 'Тратит больше времени/ресурсов на задачу, чем это разумно необходимо.' },
      { value: 1, label: 'Средний', description: 'Выдает стабильный результат в рамках нормативов.' },
      { value: 2, label: 'Высокий', description: 'Регулярно делает больше или быстрее, чем ожидается, находя способы оптимизации.' }
    ]
  },

  // --- POTENTIAL ---
  {
    id: 'pot_agility',
    category: 'potential',
    title: '1. Learning Agility (Обучаемость)',
    questionText: 'Вспомните последний случай, когда сотруднику пришлось освоить совершенно новый навык или инструмент. Что произошло?',
    options: [
      { value: 0, label: 'Низкий', description: 'Сопротивлялся новому или осваивал с большим трудом и медленно.' },
      { value: 1, label: 'Средний', description: 'Освоил в рабочем режиме, как и все остальные.' },
      { value: 2, label: 'Высокий', description: 'Освоил быстрее других и начал учить этому коллег / внедрять улучшения на базе нового.' }
    ]
  },
  {
    id: 'pot_scale',
    category: 'potential',
    title: '2. Масштаб мышления (Helicopter View)',
    questionText: 'Когда сотрудник сталкивается с проблемой, какой уровень решения он предлагает?',
    options: [
      { value: 0, label: 'Низкий', description: '«Затыкает дыру» (лечит симптом, а не проблему).' },
      { value: 1, label: 'Средний', description: 'Решает проблему в рамках своей зоны ответственности.' },
      { value: 2, label: 'Высокий', description: 'Видит корневую причину, предлагает системное решение, учитывая влияние на смежные отделы/бизнес.' }
    ]
  },
  {
    id: 'pot_drive',
    category: 'potential',
    title: '3. Амбиции и Драйв',
    questionText: 'Как сотрудник реагирует на "ничейные" задачи или сложные проблемы, выходящие за рамки его прямых обязанностей?',
    options: [
      { value: 0, label: 'Низкий', description: '«Это не моя работа» / игнорирует.' },
      { value: 1, label: 'Средний', description: 'Берется, если попросит руководитель.' },
      { value: 2, label: 'Высокий', description: 'Сам замечает проблему, проявляет инициативу и берет на себя ответственность за ее решение без напоминаний.' }
    ]
  },
  
  // --- CALIBRATION ---
  {
    id: 'val_risk',
    category: 'calibration',
    title: 'А. Тест на незаменимость',
    questionText: 'Представьте, что этот сотрудник уходит в отпуск на месяц в самый разгар сезона. Как это повлияет на работу отдела?',
    options: [
      { value: 0, label: 'Высокий риск', description: 'Работа встанет или будет хаос.' },
      { value: 1, label: 'Средний риск', description: 'Будет тяжело, но справимся.' },
      { value: 2, label: 'Низкий риск', description: 'Процессы налажены так, что его отсутствие почти не замедлит команду.' }
    ]
  },
  {
    id: 'val_promo',
    category: 'calibration',
    title: 'Б. Тест на следующий шаг',
    questionText: 'Могли бы вы поручить этому сотруднику задачу, которую обычно выполняете вы сами?',
    options: [
      { value: 0, label: 'Нет', description: 'Ему еще рано.' },
      { value: 1, label: 'Частично', description: 'С моим присмотром.' },
      { value: 2, label: 'Да, абсолютно', description: 'Я уверен, что он справится не хуже меня.' }
    ]
  },
  {
    id: 'val_quit_feel',
    category: 'calibration',
    title: 'В. Если бы он уволился',
    questionText: 'Если бы сотрудник уволился завтра, что бы вы почувствовали?',
    options: [
      { value: 0, label: 'С облегчением', description: 'Его уход не вызовет проблем.' },
      { value: 1, label: 'Найдем замену без проблем', description: 'Потеря некритична.' },
      { value: 2, label: 'Будет проблемой', description: 'Его уход создаст заметные риски.' }
    ]
  },
  {
    id: 'val_retention',
    category: 'calibration',
    title: 'Г. Если он захочет уйти',
    questionText: 'Если ключевой сотрудник скажет, что уходит, ваши действия?',
    options: [
      { value: 0, label: 'Пожелаю удачи', description: 'Не буду удерживать.' },
      { value: 1, label: 'Постараюсь обсудить', description: 'Попробую предложить компромисс.' },
      { value: 2, label: 'Сделаю всё, чтобы удержать', description: 'Готов действовать, чтобы сохранить.' }
    ]
  }
];
