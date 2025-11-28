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
            companies: [{ id: 'company-mides', name: 'MIDES' }]
        };
        await fs.writeFile(DB_FILE, JSON.stringify(defaultDB, null, 2));
    }
};

const readDB = async () => JSON.parse(await fs.readFile(DB_FILE, 'utf8'));
const writeDB = async (data) => await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));

initDB();

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
    const { name } = req.body;
    const db = await readDB();
    const newCompany = {
        id: `comp-${crypto.randomUUID()}`,
        name
    };
    db.companies.push(newCompany);
    await writeDB(db);
    res.json(newCompany);
});

app.delete('/api/companies/:id', async (req, res) => {
    const { id } = req.params;
    const db = await readDB();
    
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
    
    if (!creator || creator.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (db.users.find(u => u.email === newUser.email)) {
        return res.status(400).json({ error: 'User exists' });
    }

    const userId = crypto.randomUUID();
    const companyId = newUser.companyId || creator.companyId;

    const user = {
        id: userId,
        email: newUser.email,
        name: newUser.name,
        password: newUser.password,
        role: 'manager',
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
    const db = await readDB();
    
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
    res.json(db.employees);
});

app.post('/api/employees', async (req, res) => {
    const { userId, name, position } = req.body;
    const db = await readDB();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });

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
    const db = await readDB();
    db.employees = db.employees.filter(e => e.id !== id);
    db.assessments = db.assessments.filter(a => a.employeeId !== id);
    await writeDB(db);
    res.json({ success: true });
});

// --- Assessments ---

app.get('/api/assessments', async (req, res) => {
    const db = await readDB();
    res.json(db.assessments);
});

app.post('/api/assessments', async (req, res) => {
    const { userId, employeeId, result } = req.body;
    const db = await readDB();
    
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

// Catch all handler to return index.html for any request that doesn't match an API route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});