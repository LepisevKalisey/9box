import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Data directory for Docker Persistence
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

app.use(cors());
app.use(express.json());

// Serve static frontend files from 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize DB if not exists
const initDB = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }

    try {
        await fs.access(DB_FILE);
    } catch {
        const defaultDB = {
            users: [{
                id: 'admin-1',
                email: 'admin@mides.kz',
                name: 'Administrator',
                password: '128500',
                role: 'admin',
                companyId: 'company-mides'
            }],
            employees: [],
            assessments: [],
            companies: [{ id: 'company-mides', name: 'MIDES', disableUserAddEmployees: false }],
            questions: [
                {
                    id: 'perf_quality',
                    category: 'performance',
                    axis: 'x',
                    isCalibration: false,
                    title: '1. Качество результата (Zero Defect)',
                    questionText: 'Как часто вам приходится вмешиваться в работу сотрудника, чтобы исправить ошибки или докрутить результат до нужного уровня?',
                    options: [
                        { value: 0, description: 'Часто. Я регулярно перепроверяю за ним ключевые этапы.', weight: 1 },
                        { value: 1, description: 'Иногда. В сложных задачах нужен мой контроль, в типовых — справляется сам.', weight: 2 },
                        { value: 2, description: 'Почти никогда. Я полностью доверяю его результату («сделал и забыл»).', weight: 3 },
                        { value: 3, description: 'Выше стандарта, выдаёт эталонный результат.', weight: 4 }
                    ]
                },
                {
                    id: 'perf_autonomy',
                    category: 'performance',
                    axis: 'x',
                    isCalibration: false,
                    title: '2. Стабильность и автономность',
                    questionText: 'Как сотрудник действует в ситуациях неопределенности или отсутствия четких инструкций?',
                    options: [
                        { value: 0, description: 'Останавливается и ждет указаний / впадает в ступор.', weight: 1 },
                        { value: 1, description: 'Пытается решить, но часто требует валидации решения у меня.', weight: 2 },
                        { value: 2, description: 'Самостоятельно находит решение, предлагает варианты и продолжает движение к цели.', weight: 3 },
                        { value: 3, description: 'Системно действует автономно в сложной неопределённости.', weight: 4 }
                    ]
                },
                {
                    id: 'perf_efficiency',
                    category: 'performance',
                    axis: 'x',
                    isCalibration: false,
                    title: '3. Эффективность (Volume vs Resources)',
                    questionText: 'Если сравнить этого сотрудника с идеальным профилем роли, какова его отдача?',
                    options: [
                        { value: 0, description: 'Тратит больше времени/ресурсов на задачу, чем это разумно необходимо.', weight: 1 },
                        { value: 1, description: 'Выдает стабильный результат в рамках нормативов.', weight: 2 },
                        { value: 2, description: 'Регулярно делает больше или быстрее, чем ожидается, находя способы оптимизации.', weight: 3 },
                        { value: 3, description: 'Значительно превосходит ожидания с устойчивой эффективностью.', weight: 4 }
                    ]
                },
                {
                    id: 'pot_agility',
                    category: 'potential',
                    axis: 'y',
                    isCalibration: false,
                    title: '1. Learning Agility (Обучаемость)',
                    questionText: 'Вспомните последний случай, когда сотруднику пришлось освоить совершенно новый навык или инструмент. Что произошло?',
                    options: [
                        { value: 0, description: 'Сопротивлялся новому или осваивал с большим трудом и медленно.', weight: 1 },
                        { value: 1, description: 'Освоил в рабочем режиме, как и все остальные.', weight: 2 },
                        { value: 2, description: 'Освоил быстрее других и начал учить этому коллег / внедрять улучшения на базе нового.', weight: 3 },
                        { value: 3, description: 'Мгновенно осваивает и тиражирует улучшения.', weight: 4 }
                    ]
                },
                {
                    id: 'pot_scale',
                    category: 'potential',
                    axis: 'y',
                    isCalibration: false,
                    title: '2. Масштаб мышления (Helicopter View)',
                    questionText: 'Когда сотрудник сталкивается с проблемой, какой уровень решения он предлагает?',
                    options: [
                        { value: 0, description: '«Затыкает дыру» (лечит симптом, а не проблему).', weight: 1 },
                        { value: 1, description: 'Решает проблему в рамках своей зоны ответственности.', weight: 2 },
                        { value: 2, description: 'Видит корневую причину, предлагает системное решение, учитывая влияние на смежные отделы/бизнес.', weight: 3 },
                        { value: 3, description: 'Формирует системные решения с широким охватом.', weight: 4 }
                    ]
                },
                {
                    id: 'pot_drive',
                    category: 'potential',
                    axis: 'y',
                    isCalibration: false,
                    title: '3. Амбиции и Драйв',
                    questionText: 'Как сотрудник реагирует на "ничейные" задачи или сложные проблемы, выходящие за рамки его прямых обязанностей?',
                    options: [
                        { value: 0, description: '«Это не моя работа» / игнорирует.', weight: 1 },
                        { value: 1, description: 'Берется, если попросит руководитель.', weight: 2 },
                        { value: 2, description: 'Сам замечает проблему, проявляет инициативу и берет на себя ответственность за ее решение без напоминаний.', weight: 3 },
                        { value: 3, description: 'Стабильно берёт сложные «ничейные» задачи и тащит.', weight: 4 }
                    ]
                },
                {
                    id: 'val_risk',
                    category: 'calibration',
                    axis: 'x',
                    isCalibration: true,
                    title: 'А. Тест на незаменимость',
                    questionText: 'Представьте, что этот сотрудник уходит в отпуск на месяц в самый разгар сезона. Как это повлияет на работу отдела?',
                    options: [
                        { value: 0, description: 'Работа встанет или будет хаос.', weight: -4 },
                        { value: 1, description: 'Будет тяжело, но справимся.', weight: -2 },
                        { value: 2, description: 'Есть замедление, но управляемое.', weight: 0 },
                        { value: 3, description: 'Отсутствие почти не влияет.', weight: 2 }
                    ]
                },
                {
                    id: 'val_promo',
                    category: 'calibration',
                    axis: 'y',
                    isCalibration: true,
                    title: 'Б. Тест на следующий шаг',
                    questionText: 'Могли бы вы поручить этому сотруднику задачу, которую обычно выполняете вы сами?',
                    options: [
                        { value: 0, description: 'Ему ещё рано.', weight: -4 },
                        { value: 1, description: 'С моим присмотром.', weight: -2 },
                        { value: 2, description: 'Справится на уровне.', weight: 0 },
                        { value: 3, description: 'Справится лучше меня.', weight: 2 }
                    ]
                },
                {
                    id: 'val_quit_feel',
                    category: 'calibration',
                    axis: 'x',
                    isCalibration: true,
                    title: 'В. Если бы он уволился',
                    questionText: 'Если бы сотрудник уволился завтра, что бы вы почувствовали?',
                    options: [
                        { value: 0, description: 'Его уход не вызовет проблем.', weight: -4 },
                        { value: 1, description: 'Потеря некритична.', weight: -2 },
                        { value: 2, description: 'Замечаемый риск.', weight: 0 },
                        { value: 3, description: 'Существенные риски.', weight: 2 }
                    ]
                },
                {
                    id: 'val_retention',
                    category: 'calibration',
                    axis: 'y',
                    isCalibration: true,
                    title: 'Г. Если он захочет уйти',
                    questionText: 'Если ключевой сотрудник скажет, что уходит, ваши действия?',
                    options: [
                        { value: 0, description: 'Не буду удерживать.', weight: -4 },
                        { value: 1, description: 'Попробую предложить компромисс.', weight: -2 },
                        { value: 2, description: 'Готов удерживать.', weight: 0 },
                        { value: 3, description: 'Сделаю всё, чтобы удержать.', weight: 2 }
                    ]
                }
            ],
            settings: {
                thresholds: {
                    x: { low_max: 13, med_max: 20 },
                    y: { low_max: 13, med_max: 20 }
                }
            }
        };
        await fs.writeFile(DB_FILE, JSON.stringify(defaultDB, null, 2));
    }
};

const readDB = async () => JSON.parse(await fs.readFile(DB_FILE, 'utf8'));
const writeDB = async (data) => await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));

initDB();

// Seed questions into existing DB if missing (migration)
const ensureQuestions = async () => {
    try {
        const db = await readDB();
        if (!Array.isArray(db.questions) || db.questions.length === 0) {
            db.questions = [
                {
                    id: 'perf_quality',
                    category: 'performance',
                    axis: 'x',
                    isCalibration: false,
                    title: '1. Качество результата (Zero Defect)',
                    questionText: 'Как часто вам приходится вмешиваться в работу сотрудника, чтобы исправить ошибки или докрутить результат до нужного уровня?',
                    options: [
                        { value: 0, description: 'Часто. Я регулярно перепроверяю за ним ключевые этапы.', weight: 1 },
                        { value: 1, description: 'Иногда. В сложных задачах нужен мой контроль, в типовых — справляется сам.', weight: 2 },
                        { value: 2, description: 'Почти никогда. Я полностью доверяю его результату («сделал и забыл»).', weight: 3 },
                        { value: 3, description: 'Выше стандарта, выдаёт эталонный результат.', weight: 4 }
                    ]
                },
                {
                    id: 'perf_autonomy',
                    category: 'performance',
                    axis: 'x',
                    isCalibration: false,
                    title: '2. Стабильность и автономность',
                    questionText: 'Как сотрудник действует в ситуациях неопределенности или отсутствия четких инструкций?',
                    options: [
                        { value: 0, description: 'Останавливается и ждет указаний / впадает в ступор.', weight: 1 },
                        { value: 1, description: 'Пытается решить, но часто требует валидации решения у меня.', weight: 2 },
                        { value: 2, description: 'Самостоятельно находит решение, предлагает варианты и продолжает движение к цели.', weight: 3 },
                        { value: 3, description: 'Системно действует автономно в сложной неопределённости.', weight: 4 }
                    ]
                },
                {
                    id: 'perf_efficiency',
                    category: 'performance',
                    axis: 'x',
                    isCalibration: false,
                    title: '3. Эффективность (Volume vs Resources)',
                    questionText: 'Если сравнить этого сотрудника с идеальным профилем роли, какова его отдача?',
                    options: [
                        { value: 0, description: 'Тратит больше времени/ресурсов на задачу, чем это разумно необходимо.', weight: 1 },
                        { value: 1, description: 'Выдает стабильный результат в рамках нормативов.', weight: 2 },
                        { value: 2, description: 'Регулярно делает больше или быстрее, чем ожидается, находя способы оптимизации.', weight: 3 },
                        { value: 3, description: 'Значительно превосходит ожидания с устойчивой эффективностью.', weight: 4 }
                    ]
                },
                {
                    id: 'pot_agility',
                    category: 'potential',
                    axis: 'y',
                    isCalibration: false,
                    title: '1. Learning Agility (Обучаемость)',
                    questionText: 'Вспомните последний случай, когда сотруднику пришлось освоить совершенно новый навык или инструмент. Что произошло?',
                    options: [
                        { value: 0, description: 'Сопротивлялся новому или осваивал с большим трудом и медленно.', weight: 1 },
                        { value: 1, description: 'Освоил в рабочем режиме, как и все остальные.', weight: 2 },
                        { value: 2, description: 'Освоил быстрее других и начал учить этому коллег / внедрять улучшения на базе нового.', weight: 3 },
                        { value: 3, description: 'Мгновенно осваивает и тиражирует улучшения.', weight: 4 }
                    ]
                },
                {
                    id: 'pot_scale',
                    category: 'potential',
                    axis: 'y',
                    isCalibration: false,
                    title: '2. Масштаб мышления (Helicopter View)',
                    questionText: 'Когда сотрудник сталкивается с проблемой, какой уровень решения он предлагает?',
                    options: [
                        { value: 0, description: '«Затыкает дыру» (лечит симптом, а не проблему).', weight: 1 },
                        { value: 1, description: 'Решает проблему в рамках своей зоны ответственности.', weight: 2 },
                        { value: 2, description: 'Видит корневую причину, предлагает системное решение, учитывая влияние на смежные отделы/бизнес.', weight: 3 },
                        { value: 3, description: 'Формирует системные решения с широким охватом.', weight: 4 }
                    ]
                },
                {
                    id: 'pot_drive',
                    category: 'potential',
                    axis: 'y',
                    isCalibration: false,
                    title: '3. Амбиции и Драйв',
                    questionText: 'Как сотрудник реагирует на "ничейные" задачи или сложные проблемы, выходящие за рамки его прямых обязанностей?',
                    options: [
                        { value: 0, description: '«Это не моя работа» / игнорирует.', weight: 1 },
                        { value: 1, description: 'Берется, если попросит руководитель.', weight: 2 },
                        { value: 2, description: 'Сам замечает проблему, проявляет инициативу и берет на себя ответственность за ее решение без напоминаний.', weight: 3 },
                        { value: 3, description: 'Стабильно берёт сложные «ничейные» задачи и тащит.', weight: 4 }
                    ]
                },
                {
                    id: 'val_risk',
                    category: 'calibration',
                    axis: 'x',
                    isCalibration: true,
                    title: 'А. Тест на незаменимость',
                    questionText: 'Представьте, что этот сотрудник уходит в отпуск на месяц в самый разгар сезона. Как это повлияет на работу отдела?',
                    options: [
                        { value: 0, description: 'Работа встанет или будет хаос.', weight: -4 },
                        { value: 1, description: 'Будет тяжело, но справимся.', weight: -2 },
                        { value: 2, description: 'Есть замедление, но управляемое.', weight: 0 },
                        { value: 3, description: 'Отсутствие почти не влияет.', weight: 2 }
                    ]
                },
                {
                    id: 'val_promo',
                    category: 'calibration',
                    axis: 'y',
                    isCalibration: true,
                    title: 'Б. Тест на следующий шаг',
                    questionText: 'Могли бы вы поручить этому сотруднику задачу, которую обычно выполняете вы сами?',
                    options: [
                        { value: 0, description: 'Ему ещё рано.', weight: -4 },
                        { value: 1, description: 'С моим присмотром.', weight: -2 },
                        { value: 2, description: 'Справится на уровне.', weight: 0 },
                        { value: 3, description: 'Справится лучше меня.', weight: 2 }
                    ]
                },
                {
                    id: 'val_quit_feel',
                    category: 'calibration',
                    axis: 'x',
                    isCalibration: true,
                    title: 'В. Если бы он уволился',
                    questionText: 'Если бы сотрудник уволился завтра, что бы вы почувствовали?',
                    options: [
                        { value: 0, description: 'Его уход не вызовет проблем.', weight: -4 },
                        { value: 1, description: 'Потеря некритична.', weight: -2 },
                        { value: 2, description: 'Замечаемый риск.', weight: 0 },
                        { value: 3, description: 'Существенные риски.', weight: 2 }
                    ]
                },
                {
                    id: 'val_retention',
                    category: 'calibration',
                    axis: 'y',
                    isCalibration: true,
                    title: 'Г. Если он захочет уйти',
                    questionText: 'Если ключевой сотрудник скажет, что уходит, ваши действия?',
                    options: [
                        { value: 0, description: 'Не буду удерживать.', weight: -4 },
                        { value: 1, description: 'Попробую предложить компромисс.', weight: -2 },
                        { value: 2, description: 'Готов удерживать.', weight: 0 },
                        { value: 3, description: 'Сделаю всё, чтобы удержать.', weight: 2 }
                    ]
                }
            ];
            await writeDB(db);
            console.log('[Migration] Seeded questions into existing DB');
        }
    } catch {}
};

ensureQuestions();

// --- Thresholds ---
app.get('/api/thresholds', async (req, res) => {
    const db = await readDB();
    const thresholds = db.settings?.thresholds || { x: { low_max: 13, med_max: 20 }, y: { low_max: 13, med_max: 20 } };
    res.json(thresholds);
});

app.put('/api/thresholds', async (req, res) => {
    const { adminId } = req.query;
    const payload = req.body;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    db.settings = db.settings || {};
    db.settings.thresholds = db.settings.thresholds || { x: { low_max: 13, med_max: 20 }, y: { low_max: 13, med_max: 20 } };
    const apply = (axis, src) => {
        if (!src) return true;
        const t = db.settings.thresholds[axis];
        const low = Number(src.low_max);
        const med = Number(src.med_max);
        if (!Number.isFinite(low) || !Number.isFinite(med)) {
            res.status(400).json({ error: `Invalid thresholds for axis ${axis}` });
            return false;
        }
        if (low >= med) {
            res.status(400).json({ error: `low_max must be less than med_max for axis ${axis}` });
            return false;
        }
        t.low_max = low;
        t.med_max = med;
        return true;
    };
    if (!apply('x', payload?.x)) return;
    if (!apply('y', payload?.y)) return;
    await writeDB(db);
    res.json(db.settings.thresholds);
});

// --- Auth ---

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
        res.json(user);
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// --- Companies ---

app.get('/api/companies', async (req, res) => {
    const db = await readDB();
    res.json(db.companies);
});

app.post('/api/companies', async (req, res) => {
    const { name, disableUserAddEmployees } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Invalid company name' });
    }
    const db = await readDB();
    if (db.companies.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ error: 'Company exists' });
    }
    const newCompany = {
        id: `comp-${crypto.randomUUID()}`,
        name: name.trim(),
        disableUserAddEmployees: !!disableUserAddEmployees
    };
    db.companies.push(newCompany);
    await writeDB(db);
    res.json(newCompany);
});

app.put('/api/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.query;
    const { name, disableUserAddEmployees } = req.body;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const company = db.companies.find(c => c.id === id);
    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }
    if (typeof name === 'string' && name.trim()) {
        company.name = name.trim();
    }
    if (typeof disableUserAddEmployees === 'boolean') {
        company.disableUserAddEmployees = disableUserAddEmployees;
    }
    await writeDB(db);
    res.json(company);
});

app.delete('/api/companies/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.query;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    if (admin.companyId === id) {
        return res.status(400).json({ error: 'Cannot delete own company' });
    }
    
    // Cascade delete
    db.companies = db.companies.filter(c => c.id !== id);
    
    const companyUserIds = db.users.filter(u => u.companyId === id).map(u => u.id);
    const companyEmployeeIds = db.employees.filter(e => e.companyId === id).map(e => e.id);

    db.users = db.users.filter(u => u.companyId !== id);
    db.employees = db.employees.filter(e => e.companyId !== id);
    
    db.assessments = db.assessments.filter(a => 
        !companyUserIds.includes(a.userId) && 
        !companyEmployeeIds.includes(a.employeeId)
    );

    await writeDB(db);
    res.json({ success: true });
});

// --- Users ---

app.get('/api/users', async (req, res) => {
    const db = await readDB();
    res.json(db.users);
});

app.post('/api/users', async (req, res) => {
    const { creatorId, newUser } = req.body;
    const db = await readDB();
    const creator = db.users.find(u => u.id === creatorId);
    
    if (!creator || (creator.role !== 'admin' && creator.role !== 'director')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!newUser || !newUser.email || !newUser.name || !newUser.password) {
        return res.status(400).json({ error: 'Invalid user data' });
    }
    if (db.users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        return res.status(400).json({ error: 'User exists' });
    }

    const userId = crypto.randomUUID();
    const companyId = creator.role === 'director' ? creator.companyId : (newUser.companyId || creator.companyId);
    const companyExists = db.companies.find(c => c.id === companyId);
    if (!companyExists) {
        return res.status(400).json({ error: 'Invalid companyId' });
    }

    const role = newUser.role === 'director' ? 'director' : 'manager';
    if (creator.role === 'director' && role === 'director') {
        return res.status(403).json({ error: 'Director cannot create another director' });
    }
    if (role === 'director') {
        const companyHasDirector = db.users.find(u => u.companyId === companyId && u.role === 'director');
        if (companyHasDirector) {
            return res.status(400).json({ error: 'Company already has a director' });
        }
    }

    const user = {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        password: newUser.password,
        role,
        companyId: companyId
    };

    db.users.push(user);

    // Auto-create linked employee profile
    const employeeProfile = {
        id: crypto.randomUUID(),
        name: newUser.name,
        position: 'Manager',
        companyId: companyId,
        createdByUserId: creatorId,
        linkedUserId: userId
    };
    db.employees.push(employeeProfile);

    await writeDB(db);
    res.json({ success: true });
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId, directorId } = req.query;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    const director = db.users.find(u => u.id === directorId);
    const actor = admin || director;
    if (!actor || (actor.role !== 'admin' && actor.role !== 'director')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const target = db.users.find(u => u.id === id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (actor.role === 'director') {
        if (target.companyId !== actor.companyId) return res.status(403).json({ error: 'Forbidden' });
        if (target.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin' });
        if (target.id === actor.id) return res.status(400).json({ error: 'Cannot delete self' });
    }
    
    db.users = db.users.filter(u => u.id !== id);
    db.assessments = db.assessments.filter(a => a.userId !== id);
    
    const linkedEmp = db.employees.find(e => e.linkedUserId === id);
    if (linkedEmp) {
        db.assessments = db.assessments.filter(a => a.employeeId !== linkedEmp.id);
        db.employees = db.employees.filter(e => e.id !== linkedEmp.id);
    }
    
    await writeDB(db);
    res.json({ success: true });
});

// --- Employees ---

app.get('/api/employees', async (req, res) => {
    const db = await readDB();
    const { companyId } = req.query;
    if (companyId && typeof companyId === 'string') {
        return res.json(db.employees.filter(e => e.companyId === companyId));
    }
    res.json(db.employees);
});

app.post('/api/employees', async (req, res) => {
    const { userId, name, position } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    const company = db.companies.find(c => c.id === user.companyId);
    if (company && company.disableUserAddEmployees && user.role !== 'admin' && user.role !== 'director') {
        return res.status(403).json({ error: 'Adding employees is disabled by company settings' });
    }
    if (!name || !position) {
        return res.status(400).json({ error: 'Invalid employee data' });
    }
    const exists = db.employees.find(e => e.companyId === user.companyId && e.name.toLowerCase() === String(name).toLowerCase() && e.position.toLowerCase() === String(position).toLowerCase());
    if (exists) {
        return res.status(400).json({ error: 'Employee exists' });
    }

    const newEmp = {
        id: crypto.randomUUID(),
        name,
        position,
        companyId: user.companyId,
        createdByUserId: user.id
    };
    db.employees.push(newEmp);
    await writeDB(db);
    res.json(newEmp);
});

app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId, directorId } = req.query;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    const director = db.users.find(u => u.id === directorId);
    const actor = admin || director;
    if (!actor || (actor.role !== 'admin' && actor.role !== 'director')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const employee = db.employees.find(e => e.id === id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    if (actor.role === 'director' && employee.companyId !== actor.companyId) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    db.employees = db.employees.filter(e => e.id !== id);
    db.assessments = db.assessments.filter(a => a.employeeId !== id);
    if (employee?.linkedUserId) {
        const linkedUserId = employee.linkedUserId;
        db.users = db.users.filter(u => u.id !== linkedUserId);
        db.assessments = db.assessments.filter(a => a.userId !== linkedUserId);
        const linkedEmp = db.employees.find(e => e.linkedUserId === linkedUserId);
        if (linkedEmp) {
            db.assessments = db.assessments.filter(a => a.employeeId !== linkedEmp.id);
            db.employees = db.employees.filter(e => e.id !== linkedEmp.id);
        }
    }
    await writeDB(db);
    res.json({ success: true });
});

// --- Assessments ---

app.get('/api/assessments', async (req, res) => {
    const db = await readDB();
    const { userId, companyId } = req.query;
    let list = db.assessments;
    if (userId && typeof userId === 'string') {
        list = list.filter(a => a.userId === userId);
    }
    if (companyId && typeof companyId === 'string') {
        const companyUserIds = db.users.filter(u => u.companyId === companyId).map(u => u.id);
        list = list.filter(a => companyUserIds.includes(a.userId));
    }
    res.json(list);
});

app.post('/api/assessments', async (req, res) => {
    const { userId, employeeId, result } = req.body;
    const db = await readDB();
    const employee = db.employees.find(e => e.id === employeeId);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }
    if (employee.linkedUserId && employee.linkedUserId === userId) {
        return res.status(400).json({ error: 'Self-assessment is not allowed' });
    }
    
    // Remove old assessment
    db.assessments = db.assessments.filter(a => !(a.userId === userId && a.employeeId === employeeId));

    const newAssessment = {
        id: crypto.randomUUID(),
        userId,
        employeeId,
        date: new Date().toISOString(),
        ...result
    };

    db.assessments.push(newAssessment);
    await writeDB(db);
    res.json(newAssessment);
});

app.delete('/api/assessments/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId, directorId } = req.query;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    const director = db.users.find(u => u.id === directorId);
    const actor = admin || director;
    if (!actor || (actor.role !== 'admin' && actor.role !== 'director')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const exists = db.assessments.find(a => a.id === id);
    if (!exists) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    db.assessments = db.assessments.filter(a => a.id !== id);
    await writeDB(db);
    res.json({ success: true });
});

// --- Questions ---

app.get('/api/questions', async (req, res) => {
    const db = await readDB();
    res.json(db.questions || []);
});

app.post('/api/questions', async (req, res) => {
    const { adminId } = req.query;
    const { question } = req.body;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!question || !question.category || !question.questionText || !Array.isArray(question.options)) {
        return res.status(400).json({ error: 'Invalid question payload' });
    }
    if (!Array.isArray(question.options) || question.options.length !== 4) {
        return res.status(400).json({ error: 'Options must contain exactly 4 items' });
    }
    const id = question.id && typeof question.id === 'string' && question.id.trim() ? question.id.trim() : `q_${crypto.randomUUID()}`;
    if ((db.questions || []).find(q => q.id === id)) {
        return res.status(400).json({ error: 'Question id exists' });
    }
    const newQuestion = {
        id,
        category: question.category,
        axis: question.axis === 'x' || question.axis === 'y' ? question.axis : (question.category === 'performance' ? 'x' : (question.category === 'potential' ? 'y' : undefined)),
        isCalibration: !!question.isCalibration,
        title: question.title || '',
        questionText: question.questionText,
        options: question.options.map((o) => ({ value: Number(o.value), description: o.description ? String(o.description) : undefined, weight: typeof o.weight === 'number' ? o.weight : undefined }))
    };
    db.questions = db.questions || [];
    db.questions.push(newQuestion);
    await writeDB(db);
    res.json(newQuestion);
});

app.put('/api/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.query;
    const payload = req.body;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    db.questions = db.questions || [];
    const q = db.questions.find(q => q.id === id);
    if (!q) return res.status(404).json({ error: 'Question not found' });
    if (payload.category) q.category = payload.category;
    if (payload.axis === 'x' || payload.axis === 'y') q.axis = payload.axis;
    if (typeof payload.isCalibration === 'boolean') q.isCalibration = payload.isCalibration;
    if (typeof payload.title === 'string') q.title = payload.title;
    if (typeof payload.questionText === 'string') q.questionText = payload.questionText;
    if (Array.isArray(payload.options)) {
        if (payload.options.length !== 4) {
            return res.status(400).json({ error: 'Options must contain exactly 4 items' });
        }
        q.options = payload.options.map((o) => ({ value: Number(o.value), description: o.description ? String(o.description) : undefined, weight: typeof o.weight === 'number' ? o.weight : undefined }));
    }
    await writeDB(db);
    res.json(q);
});

app.delete('/api/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.query;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    if (!admin || admin.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    db.questions = db.questions || [];
    const exists = db.questions.find(q => q.id === id);
    if (!exists) return res.status(404).json({ error: 'Question not found' });
    db.questions = db.questions.filter(q => q.id !== id);
    await writeDB(db);
    res.json({ success: true });
});

// --- Director assignment ---
app.post('/api/companies/:id/director', async (req, res) => {
    const { id } = req.params;
    const { adminId, directorId } = req.query;
    const { userId } = req.body;
    const db = await readDB();
    const admin = db.users.find(u => u.id === adminId);
    const directorActor = db.users.find(u => u.id === directorId);
    const actor = admin || directorActor;
    if (!actor || (actor.role !== 'admin' && actor.role !== 'director')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const company = db.companies.find(c => c.id === id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (actor.role === 'director' && actor.companyId !== id) return res.status(403).json({ error: 'Forbidden' });
    const target = db.users.find(u => u.id === userId && u.companyId === id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    // Demote existing director in company
    const existingDirector = db.users.find(u => u.companyId === id && u.role === 'director');
    if (existingDirector && existingDirector.id !== target.id) {
        existingDirector.role = 'manager';
    }
    target.role = 'director';
    await writeDB(db);
    res.json(company);
});

// Catch all handler to return index.html for any request that doesn't match an API route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
