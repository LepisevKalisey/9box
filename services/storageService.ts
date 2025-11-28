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

export const createCompany = async (name: string, options?: { disableUserAddEmployees?: boolean }): Promise<Company> => {
    return api<Company>('/companies', {
        method: 'POST',
        body: JSON.stringify({ name, disableUserAddEmployees: options?.disableUserAddEmployees ?? false })
    });
};

export const updateCompany = async (adminUser: User, companyId: string, payload: Partial<Company>): Promise<Company> => {
    if (adminUser.role !== 'admin') throw new Error('Unauthorized');
    return api<Company>(`/companies/${companyId}?adminId=${encodeURIComponent(adminUser.id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

export const deleteCompany = async (adminUser: User, companyId: string): Promise<void> => {
    if (adminUser.role !== 'admin') return;
    if (adminUser.companyId === companyId) {
        console.warn("Cannot delete the admin's own company");
        return;
    }
    await api(`/companies/${companyId}?adminId=${encodeURIComponent(adminUser.id)}`, { method: 'DELETE' });
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

export const createUser = async (creator: User, newUser: { name: string, email: string, password: string, companyId?: string, role?: Role }): Promise<boolean> => {
    if (creator.role !== 'admin' && creator.role !== 'director') return false;
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

export const deleteUser = async (actor: User, targetUserId: string): Promise<void> => {
    if (actor.id === targetUserId) return;
    const queryRole = actor.role === 'admin' ? 'adminId' : 'directorId';
    await api(`/users/${targetUserId}?${queryRole}=${encodeURIComponent(actor.id)}`, { method: 'DELETE' });
};

export const getCompanyUsers = async (adminUser: User): Promise<User[]> => {
    const users = await api<User[]>('/users');
    return users.filter(u => u.role !== 'admin');
};

export const getAvailableEmployees = async (user: User): Promise<EmployeeProfile[]> => {
    const [employees, assessments] = await Promise.all([
        api<EmployeeProfile[]>(`/employees?companyId=${encodeURIComponent(user.companyId)}`),
        api<Assessment[]>(`/assessments?userId=${encodeURIComponent(user.id)}`)
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

export const deleteEmployee = async (actor: User, employeeId: string): Promise<void> => {
    const queryRole = actor.role === 'admin' ? 'adminId' : 'directorId';
    await api(`/employees/${employeeId}?${queryRole}=${encodeURIComponent(actor.id)}`, { method: 'DELETE' });
};

export const saveAssessment = async (user: User, employeeId: string, result: Omit<Assessment, 'id' | 'userId' | 'employeeId' | 'date'>): Promise<void> => {
    await api('/assessments', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, employeeId, result })
    });
};

export const getUserResults = async (user: User): Promise<EmployeeResult[]> => {
    const [myAssessments, employees] = await Promise.all([
        api<Assessment[]>(`/assessments?userId=${encodeURIComponent(user.id)}`),
        api<EmployeeProfile[]>(`/employees?companyId=${encodeURIComponent(user.companyId)}`)
    ]);
  
    return myAssessments.map(assessment => {
        const profile = employees.find(e => e.id === assessment.employeeId);
        if (!profile) return null;
        return {
            ...profile,
            performance: assessment.performance,
            potential: assessment.potential,
            answers: assessment.answers,
            aiAdvice: assessment.aiAdvice,
            date: assessment.date
        };
    }).filter(Boolean) as EmployeeResult[];
};

export const getAdminResults = async (admin: User, filterUserId?: string, filterCompanyId?: string): Promise<EmployeeResult[]> => {
    const params: string[] = [];
    if (filterUserId) params.push(`userId=${encodeURIComponent(filterUserId)}`);
    if (filterCompanyId) params.push(`companyId=${encodeURIComponent(filterCompanyId)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    const [filteredAssessments, employees] = await Promise.all([
        api<Assessment[]>(`/assessments${query}`),
        filterCompanyId ? api<EmployeeProfile[]>(`/employees?companyId=${encodeURIComponent(filterCompanyId)}`) : api<EmployeeProfile[]>('/employees')
    ]);

    return filteredAssessments.map(assessment => {
        const profile = employees.find(e => e.id === assessment.employeeId);
        if (!profile) return null;
        return {
          ...profile,
          performance: assessment.performance,
          potential: assessment.potential,
          answers: assessment.answers,
          aiAdvice: assessment.aiAdvice,
          date: assessment.date,
          assessmentId: assessment.id,
          assessedByUserId: assessment.userId
        };
      }).filter(Boolean) as EmployeeResult[];
};

export const deleteAssessment = async (admin: User, assessmentId: string): Promise<void> => {
    const queryRole = admin.role === 'admin' ? 'adminId' : 'directorId';
    await api(`/assessments/${assessmentId}?${queryRole}=${encodeURIComponent(admin.id)}`, { method: 'DELETE' });
};

export const setCompanyDirector = async (actor: User, companyId: string, userId: string): Promise<Company> => {
    const queryRole = actor.role === 'admin' ? 'adminId' : 'directorId';
    return api<Company>(`/companies/${companyId}/director?${queryRole}=${encodeURIComponent(actor.id)}`, {
        method: 'POST',
        body: JSON.stringify({ userId })
    });
};
