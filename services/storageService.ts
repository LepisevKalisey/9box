import { User, EmployeeProfile, Assessment, EmployeeResult, Role, Company } from '../types';
import type { Question } from '../constants';

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
    const [employees, assessments, users] = await Promise.all([
        api<EmployeeProfile[]>(`/employees?companyId=${encodeURIComponent(user.companyId)}`),
        api<Assessment[]>(`/assessments?userId=${encodeURIComponent(user.id)}`),
        api<User[]>('/users')
    ]);

    // Employees in my company
    const companyEmployees = employees.filter(e => e.companyId === user.companyId);
    
    // Exclude ones I have already assessed
    const myAssessments = assessments.filter(a => a.userId === user.id);
    const assessedIds = new Set(myAssessments.map(a => a.employeeId));

    // Exclude myself
    const userById = new Map(users.map(u => [u.id, u]));
    return companyEmployees.filter(e => {
        if (e.linkedUserId === user.id) return false;
        const linked = e.linkedUserId ? userById.get(e.linkedUserId) : undefined;
        if (linked?.role === 'director') return false;
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

export const convertEmployeeToUser = async (actor: User, employeeId: string, email: string, password: string): Promise<User> => {
    const queryRole = actor.role === 'admin' ? 'adminId' : 'directorId';
    const res = await api<{ success: boolean, user: User }>(`/employees/${employeeId}/convert?${queryRole}=${encodeURIComponent(actor.id)}`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    return res.user;
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
        const riskFlag = assessment.performance === 2 && assessment.potential === 2 && assessment.answers?.['val_retention'] === 3;
        return {
          ...profile,
          performance: assessment.performance,
          potential: assessment.potential,
          answers: assessment.answers,
          aiAdvice: assessment.aiAdvice,
          date: assessment.date,
          riskFlag
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

    if (filterUserId) {
      return filteredAssessments.map(assessment => {
          const profile = employees.find(e => e.id === assessment.employeeId);
          if (!profile) return null;
          const riskFlag = assessment.performance === 2 && assessment.potential === 2 && assessment.answers?.['val_retention'] === 3;
          return {
            ...profile,
            performance: assessment.performance,
            potential: assessment.potential,
            answers: assessment.answers,
            aiAdvice: assessment.aiAdvice,
            date: assessment.date,
            assessmentId: assessment.id,
            assessedByUserId: assessment.userId,
            riskFlag
          };
        }).filter(Boolean) as EmployeeResult[];
    }

    const byEmp = new Map<string, { perfSum: number; potSum: number; count: number; latest?: Assessment; anyRetentionHigh: boolean }>();
    filteredAssessments.forEach(a => {
      const agg = byEmp.get(a.employeeId) || { perfSum: 0, potSum: 0, count: 0, latest: undefined, anyRetentionHigh: false };
      agg.perfSum += Number(a.performance);
      agg.potSum += Number(a.potential);
      agg.count += 1;
      agg.latest = !agg.latest || new Date(a.date).getTime() > new Date(agg.latest.date).getTime() ? a : agg.latest;
      const retentionVal = a.answers?.['val_retention'];
      if (retentionVal === 3) agg.anyRetentionHigh = true;
      byEmp.set(a.employeeId, agg);
    });

    const results: EmployeeResult[] = [];
    for (const [employeeId, agg] of byEmp.entries()) {
      const profile = employees.find(e => e.id === employeeId);
      if (!profile) continue;
      const perfAvg = Math.round(agg.perfSum / agg.count);
      const potAvg = Math.round(agg.potSum / agg.count);
      const riskFlag = perfAvg === 2 && potAvg === 2 && agg.anyRetentionHigh;
      results.push({
        ...profile,
        performance: perfAvg as any,
        potential: potAvg as any,
        date: agg.latest?.date,
        riskFlag,
        assessmentCount: agg.count
      });
    }
    return results;
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

// Questions
export const getQuestions = async (): Promise<Question[]> => {
    try {
        return await api<Question[]>('/questions');
    } catch {
        return [];
    }
};

export const createQuestion = async (adminUser: User, question: Omit<Question, 'id'> & { id?: string }): Promise<Question> => {
    if (adminUser.role !== 'admin') throw new Error('Unauthorized');
    return api<Question>(`/questions?adminId=${encodeURIComponent(adminUser.id)}`, {
        method: 'POST',
        body: JSON.stringify({ question })
    });
};

export const updateQuestion = async (adminUser: User, id: string, payload: Partial<Question>): Promise<Question> => {
    if (adminUser.role !== 'admin') throw new Error('Unauthorized');
    return api<Question>(`/questions/${id}?adminId=${encodeURIComponent(adminUser.id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
};

export const deleteQuestion = async (adminUser: User, id: string): Promise<void> => {
    if (adminUser.role !== 'admin') throw new Error('Unauthorized');
    await api(`/questions/${id}?adminId=${encodeURIComponent(adminUser.id)}`, { method: 'DELETE' });
};

// Thresholds
export interface AxisThresholds { low_max: number; med_max: number }
export interface Thresholds { x: AxisThresholds; y: AxisThresholds }

export const getThresholds = async (): Promise<Thresholds> => {
    return api<Thresholds>('/thresholds');
};

export const updateThresholds = async (adminUser: User, thresholds: Partial<Thresholds>): Promise<Thresholds> => {
    if (adminUser.role !== 'admin') throw new Error('Unauthorized');
    return api<Thresholds>(`/thresholds?adminId=${encodeURIComponent(adminUser.id)}`, {
        method: 'PUT',
        body: JSON.stringify(thresholds)
    });
};

export const getEmployeeAssessments = async (admin: User, employeeId: string): Promise<EmployeeResult[]> => {
    const [assessments, users] = await Promise.all([
        api<Assessment[]>(`/assessments?companyId=${encodeURIComponent(admin.companyId)}`),
        api<User[]>('/users')
    ]);
    const userById = new Map(users.map(u => [u.id, u]));
    return assessments
        .filter(a => a.employeeId === employeeId)
        .map(a => ({
            id: a.employeeId,
            name: userById.get(a.userId)?.name || '',
            position: userById.get(a.userId)?.email || '',
            companyId: admin.companyId,
            createdByUserId: admin.id,
            performance: a.performance,
            potential: a.potential,
            date: a.date,
            assessmentId: a.id,
            assessedByUserId: a.userId
        }));
};
