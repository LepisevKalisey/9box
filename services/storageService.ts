import { User, EmployeeProfile, Assessment, EmployeeResult, Role, Company } from '../types';

// In production (Docker), frontend is served by backend, so we use relative path.
// In dev, Vite proxy handles the /api redirection.
const API_URL = '/api';

// Helper for Fetch
const api = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res.json();
};

export const getCompanies = async (): Promise<Company[]> => {
    return api<Company[]>('/companies');
};

export const createCompany = async (name: string): Promise<Company> => {
    return api<Company>('/companies', {
        method: 'POST',
        body: JSON.stringify({ name })
    });
};

export const deleteCompany = async (adminUser: User, companyId: string): Promise<void> => {
    if (adminUser.role !== 'admin') return;
    if (adminUser.companyId === companyId) {
        console.warn("Cannot delete the admin's own company");
        return;
    }
    await api(`/companies/${companyId}`, { method: 'DELETE' });
};

export const authUser = async (email: string, password: string): Promise<User | null> => {
    try {
        return await api<User>('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    } catch (e) {
        return null;
    }
};

export const createUser = async (creator: User, newUser: { name: string, email: string, password: string, companyId?: string }): Promise<boolean> => {
    if (creator.role !== 'admin') return false;
    try {
        await api('/users', {
            method: 'POST',
            body: JSON.stringify({ creatorId: creator.id, newUser })
        });
        return true;
    } catch (e) {
        return false;
    }
};

export const deleteUser = async (adminUser: User, targetUserId: string): Promise<void> => {
    if (adminUser.role !== 'admin') return;
    if (adminUser.id === targetUserId) return;
    await api(`/users/${targetUserId}`, { method: 'DELETE' });
};

export const getCompanyUsers = async (adminUser: User): Promise<User[]> => {
    const users = await api<User[]>('/users');
    return users.filter(u => u.role !== 'admin');
};

export const getAvailableEmployees = async (user: User): Promise<EmployeeProfile[]> => {
    const [employees, assessments] = await Promise.all([
        api<EmployeeProfile[]>('/employees'),
        api<Assessment[]>('/assessments')
    ]);

    // Employees in my company
    const companyEmployees = employees.filter(e => e.companyId === user.companyId);
    
    // Exclude ones I have already assessed
    const myAssessments = assessments.filter(a => a.userId === user.id);
    const assessedIds = new Set(myAssessments.map(a => a.employeeId));

    // Exclude myself
    return companyEmployees.filter(e => {
        if (e.linkedUserId === user.id) return false;
        return !assessedIds.has(e.id);
    });
};

export const createEmployee = async (user: User, name: string, position: string): Promise<EmployeeProfile> => {
    return api<EmployeeProfile>('/employees', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, name, position })
    });
};

export const getGlobalEmployees = async (adminUser: User): Promise<EmployeeProfile[]> => {
    if (adminUser.role !== 'admin') return [];
    return api<EmployeeProfile[]>('/employees');
};

export const deleteEmployee = async (adminUser: User, employeeId: string): Promise<void> => {
    if (adminUser.role !== 'admin') return;
    await api(`/employees/${employeeId}`, { method: 'DELETE' });
};

export const saveAssessment = async (user: User, employeeId: string, result: Omit<Assessment, 'id' | 'userId' | 'employeeId' | 'date'>): Promise<void> => {
    await api('/assessments', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, employeeId, result })
    });
};

export const getUserResults = async (user: User): Promise<EmployeeResult[]> => {
    const [assessments, employees] = await Promise.all([
        api<Assessment[]>('/assessments'),
        api<EmployeeProfile[]>('/employees')
    ]);

    const myAssessments = assessments.filter(a => a.userId === user.id);
  
    return myAssessments.map(assessment => {
        const profile = employees.find(e => e.id === assessment.employeeId);
        if (!profile) return null;
        return {
            ...profile,
            performance: assessment.performance,
            potential: assessment.potential,
            answers: assessment.answers,
            aiAdvice: assessment.aiAdvice
        };
    }).filter(Boolean) as EmployeeResult[];
};

export const getAdminResults = async (admin: User, filterUserId?: string, filterCompanyId?: string): Promise<EmployeeResult[]> => {
    const [assessments, employees, users] = await Promise.all([
        api<Assessment[]>('/assessments'),
        api<EmployeeProfile[]>('/employees'),
        api<User[]>('/users')
    ]);

    let filteredAssessments = assessments;
    
    if (filterCompanyId) {
         const companyUserIds = users.filter(u => u.companyId === filterCompanyId).map(u => u.id);
         filteredAssessments = filteredAssessments.filter(a => companyUserIds.includes(a.userId));
    }

    if (filterUserId) {
        filteredAssessments = filteredAssessments.filter(a => a.userId === filterUserId);
    }

    return filteredAssessments.map(assessment => {
        const profile = employees.find(e => e.id === assessment.employeeId);
        if (!profile) return null;
        return {
          ...profile,
          performance: assessment.performance,
          potential: assessment.potential,
          answers: assessment.answers,
          aiAdvice: assessment.aiAdvice
        };
      }).filter(Boolean) as EmployeeResult[];
};