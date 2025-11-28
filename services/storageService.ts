
import { User, EmployeeProfile, Assessment, EmployeeResult, Role, Company } from '../types';

const DB_KEY = '9box_db_v3';

interface DB {
  users: User[];
  employees: EmployeeProfile[];
  assessments: Assessment[];
  companies: Company[];
}

// Initialize DB with Admin
const initDB = (): DB => {
  const existing = localStorage.getItem(DB_KEY);
  if (existing) {
    const db = JSON.parse(existing);
    // Migration: ensure companies array exists if upgrading from v2
    if (!db.companies) {
        db.companies = [{ id: 'company-mides', name: 'MIDES' }];
    }
    return db;
  }

  const defaultCompany: Company = {
      id: 'company-mides',
      name: 'MIDES'
  };

  const defaultAdmin: User = {
    id: 'admin-1',
    email: 'admin@mides.kz',
    name: 'Administrator',
    password: '128500',
    role: 'admin',
    companyId: defaultCompany.id
  };

  const initialDB: DB = {
    users: [defaultAdmin],
    employees: [], // Admin usually isn't assessed in this flow, but could be added if needed
    assessments: [],
    companies: [defaultCompany]
  };

  localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
  return initialDB;
};

const saveDB = (db: DB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

export const getCompanies = (): Company[] => {
    const db = initDB();
    return db.companies;
}

export const createCompany = (name: string): Company => {
    const db = initDB();
    const newCompany: Company = {
        id: `comp-${crypto.randomUUID()}`,
        name: name
    };
    db.companies.push(newCompany);
    saveDB(db);
    return newCompany;
}

export const deleteCompany = (adminUser: User, companyId: string) => {
    if (adminUser.role !== 'admin') return;
    if (adminUser.companyId === companyId) {
        console.warn("Cannot delete the admin's own company");
        return;
    }

    const db = initDB();
    
    // 1. Delete Company
    db.companies = db.companies.filter(c => c.id !== companyId);
    
    // 2. Identify Users and Employees in this company
    const companyUserIds = db.users.filter(u => u.companyId === companyId).map(u => u.id);
    const companyEmployeeIds = db.employees.filter(e => e.companyId === companyId).map(e => e.id);

    // 3. Delete Users
    db.users = db.users.filter(u => u.companyId !== companyId);
    
    // 4. Delete Employees
    db.employees = db.employees.filter(e => e.companyId !== companyId);
    
    // 5. Delete Assessments (made by deleted users OR made on deleted employees)
    db.assessments = db.assessments.filter(a => 
        !companyUserIds.includes(a.userId) && 
        !companyEmployeeIds.includes(a.employeeId)
    );
    
    saveDB(db);
}

export const authUser = (email: string, password: string): User | null => {
  const db = initDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  return user || null;
};

export const createUser = (creator: User, newUser: { name: string, email: string, password: string, companyId?: string }): boolean => {
  if (creator.role !== 'admin') return false;
  const db = initDB();
  
  if (db.users.find(u => u.email === newUser.email)) return false; // Exists

  const userId = crypto.randomUUID();
  const companyId = newUser.companyId || creator.companyId;

  const user: User = {
    id: userId,
    email: newUser.email,
    name: newUser.name,
    password: newUser.password,
    role: 'manager',
    companyId: companyId
  };

  db.users.push(user);

  // Automatically create an Employee Profile for this User so they can be assessed by others
  const employeeProfile: EmployeeProfile = {
      id: crypto.randomUUID(),
      name: newUser.name,
      position: 'Manager', // Default position for users
      companyId: companyId,
      createdByUserId: creator.id,
      linkedUserId: userId // Link to the user account
  };
  db.employees.push(employeeProfile);

  saveDB(db);
  return true;
};

export const deleteUser = (adminUser: User, targetUserId: string) => {
    if (adminUser.role !== 'admin') return;
    if (adminUser.id === targetUserId) {
        console.warn("Cannot delete yourself");
        return;
    }

    const db = initDB();
    
    // 1. Delete User
    db.users = db.users.filter(u => u.id !== targetUserId);
    
    // 2. Delete assessments BY this user
    db.assessments = db.assessments.filter(a => a.userId !== targetUserId);
    
    // 3. Delete linked Employee Profile and assessments OF this user
    const linkedEmp = db.employees.find(e => e.linkedUserId === targetUserId);
    if (linkedEmp) {
        // Delete assessments where this user was the subject
        db.assessments = db.assessments.filter(a => a.employeeId !== linkedEmp.id);
        // Delete the employee profile
        db.employees = db.employees.filter(e => e.id !== linkedEmp.id);
    }
    
    saveDB(db);
}

export const getCompanyUsers = (adminUser: User): User[] => {
    const db = initDB();
    return db.users.filter(u => u.role !== 'admin');
}

export const getAvailableEmployees = (user: User): EmployeeProfile[] => {
  const db = initDB();
  // Employees in my company
  const companyEmployees = db.employees.filter(e => e.companyId === user.companyId);
  
  // Exclude ones I have already assessed
  const myAssessments = db.assessments.filter(a => a.userId === user.id);
  const assessedIds = new Set(myAssessments.map(a => a.employeeId));

  // Exclude myself (if I am also an employee in the list)
  return companyEmployees.filter(e => {
      if (e.linkedUserId === user.id) return false;
      return !assessedIds.has(e.id);
  });
};

export const createEmployee = (user: User, name: string, position: string): EmployeeProfile => {
  const db = initDB();
  const newEmp: EmployeeProfile = {
    id: crypto.randomUUID(),
    name,
    position,
    companyId: user.companyId,
    createdByUserId: user.id
  };
  db.employees.push(newEmp);
  saveDB(db);
  return newEmp;
};

// Admin function to get all employees for management
export const getGlobalEmployees = (adminUser: User): EmployeeProfile[] => {
    if (adminUser.role !== 'admin') return [];
    const db = initDB();
    return db.employees; // Return all employees so admin can manage them across companies
};

// Admin function to delete employee and all related assessments
export const deleteEmployee = (adminUser: User, employeeId: string): void => {
    if (adminUser.role !== 'admin') return;
    const db = initDB();
    
    db.employees = db.employees.filter(e => e.id !== employeeId);
    db.assessments = db.assessments.filter(a => a.employeeId !== employeeId);
    
    saveDB(db);
};

export const saveAssessment = (user: User, employeeId: string, result: Omit<Assessment, 'id' | 'userId' | 'employeeId' | 'date'>) => {
  const db = initDB();
  
  // Remove existing if re-assessing
  db.assessments = db.assessments.filter(a => !(a.userId === user.id && a.employeeId === employeeId));

  const newAssessment: Assessment = {
    id: crypto.randomUUID(),
    userId: user.id,
    employeeId,
    date: new Date().toISOString(),
    ...result
  };

  db.assessments.push(newAssessment);
  saveDB(db);
};

// Get results for specific user (My Assessments)
export const getUserResults = (user: User): EmployeeResult[] => {
  const db = initDB();
  const myAssessments = db.assessments.filter(a => a.userId === user.id);
  
  return myAssessments.map(assessment => {
    const profile = db.employees.find(e => e.id === assessment.employeeId);
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

// Get Global Results (Admin)
export const getAdminResults = (admin: User, filterUserId?: string, filterCompanyId?: string): EmployeeResult[] => {
    const db = initDB();
    let assessments = db.assessments;
    
    // Filter by Company
    if (filterCompanyId) {
         const companyUserIds = db.users.filter(u => u.companyId === filterCompanyId).map(u => u.id);
         assessments = assessments.filter(a => companyUserIds.includes(a.userId));
    }

    // Filter by specific Manager
    if (filterUserId) {
        assessments = assessments.filter(a => a.userId === filterUserId);
    }

    return assessments.map(assessment => {
        const profile = db.employees.find(e => e.id === assessment.employeeId);
        if (!profile) return null;
        return {
          ...profile,
          performance: assessment.performance,
          potential: assessment.potential,
          answers: assessment.answers,
          aiAdvice: assessment.aiAdvice
        };
      }).filter(Boolean) as EmployeeResult[];
}
