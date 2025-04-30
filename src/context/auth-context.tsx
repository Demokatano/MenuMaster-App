
"use client";

import type { User, Admin, UpdateUserData } from "@/types"; // Import UpdateUserData
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// --- LocalStorage Keys ---
const LS_USERS_KEY = "menuMasterUsers";
const LS_ADMINS_KEY = "menuMasterAdmins"; // New key for admins
const LS_CURRENT_USER_KEY = "menuMasterCurrentUser";
const LS_ADMIN_LOGGED_IN_KEY = "menuMasterAdminLoggedIn";


// Function to safely get data from localStorage
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    // Attempt to clear corrupted data
    try {
        window.localStorage.removeItem(key);
    } catch (removeError) {
        console.error(`Error removing corrupted localStorage key “${key}”:`, removeError);
    }
    return defaultValue;
  }
};

// Function to safely set data in localStorage
const setInLocalStorage = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") {
    console.warn(`Tried setting localStorage key “${key}” outside browser environment.`);
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
  }
};


interface AuthContextType {
  currentUser: User | null;
  isAdminLoggedIn: boolean;
  loginUser: (login: string, passwordAttempt: string) => boolean;
  signupUser: (userData: Omit<User, "id" | "passwordPlain"> & { passwordPlain: string }) => boolean;
  logoutUser: () => void;
  loginAdmin: (login: string, passwordAttempt: string) => boolean;
  logoutAdmin: () => void;
  signupAdmin: (login: string, passwordPlain: string) => boolean; // Add admin signup
  updateUser: (updateData: UpdateUserData) => boolean; // Use standard UpdateUserData from types
  deleteUser: (userId: string) => boolean; // Add delete user function
  users: User[];
  admins: Admin[]; // Expose admins list
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]); // State for admins
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false); // Prevent premature rendering based on default state
  const { toast } = useToast();

  // Load initial state from localStorage on mount
  useEffect(() => {
    setUsers(getFromLocalStorage<User[]>(LS_USERS_KEY, []));
    const storedAdmins = getFromLocalStorage<Admin[]>(LS_ADMINS_KEY, []);
     if (storedAdmins.length === 0) {
        const defaultAdmin: Admin = {
            id: 'admin_default',
            login: 'admin',
            passwordPlain: '0000' // Use the updated password
        };
         setAdmins([defaultAdmin]);
         setInLocalStorage<Admin[]>(LS_ADMINS_KEY, [defaultAdmin]); // Save default admin immediately
     } else {
         setAdmins(storedAdmins);
     }
    setCurrentUser(getFromLocalStorage<User | null>(LS_CURRENT_USER_KEY, null));
    setIsAdminLoggedIn(getFromLocalStorage<boolean>(LS_ADMIN_LOGGED_IN_KEY, false));
    setIsInitialized(true);
     // If a user session was found in storage, ensure admin is logged out state-wise
     if (getFromLocalStorage<User | null>(LS_CURRENT_USER_KEY, null)) {
        setIsAdminLoggedIn(false);
        setInLocalStorage<boolean>(LS_ADMIN_LOGGED_IN_KEY, false);
     }
      // If an admin session was found, ensure user is logged out state-wise
     if (getFromLocalStorage<boolean>(LS_ADMIN_LOGGED_IN_KEY, false)) {
         setCurrentUser(null);
         setInLocalStorage<User | null>(LS_CURRENT_USER_KEY, null);
     }
  }, []);

  // Persist users to localStorage when they change
  useEffect(() => {
    if (isInitialized) { // Only save after initial load
        setInLocalStorage<User[]>(LS_USERS_KEY, users);
    }
  }, [users, isInitialized]);

   // Persist admins to localStorage when they change
   useEffect(() => {
    if (isInitialized) {
      setInLocalStorage<Admin[]>(LS_ADMINS_KEY, admins);
    }
  }, [admins, isInitialized]);

   // Persist currentUser to localStorage when it changes
   useEffect(() => {
    if (isInitialized) {
        setInLocalStorage<User | null>(LS_CURRENT_USER_KEY, currentUser);
    }
  }, [currentUser, isInitialized]);

   // Persist isAdminLoggedIn to localStorage when it changes
   useEffect(() => {
    if (isInitialized) {
       setInLocalStorage<boolean>(LS_ADMIN_LOGGED_IN_KEY, isAdminLoggedIn);
    }
   }, [isAdminLoggedIn, isInitialized]);


   const loginUser = useCallback((nameIdentifier: string, passwordAttempt: string): boolean => {
    // Find user by NAME field (case-insensitive, trimmed)
    const trimmedNameIdentifier = nameIdentifier.trim().toLowerCase();
    const user = users.find(u => u.name.trim().toLowerCase() === trimmedNameIdentifier);

    console.log(`[AuthContext] Attempting user login for name: ${nameIdentifier}`);
    console.log(`[AuthContext] Trimmed/Lowercased name: ${trimmedNameIdentifier}`);
    console.log("[AuthContext] Available users:", users.map(u => ({id: u.id, name: u.name, login: u.login})));
    console.log("[AuthContext] User found by name:", user);

    // IMPORTANT: In a real app, compare the hashed passwordAttempt with the stored hash.
    // For this mock, we compare plain text passwords. Trim password attempt just in case.
    if (user && passwordAttempt.trim() === user.passwordPlain.trim()) {
      console.log("[AuthContext] Password matches. Setting current user.");
      setCurrentUser(user);
      setIsAdminLoggedIn(false); // Ensure admin is logged out if user logs in
      setInLocalStorage(LS_ADMIN_LOGGED_IN_KEY, false); // Persist admin logout
      setInLocalStorage(LS_CURRENT_USER_KEY, user); // Persist user login
      setTimeout(() => toast({ title: "Login bem-sucedido!", description: `Bem-vindo de volta, ${user.name}!` }), 0);
      console.log("[AuthContext] currentUser state after successful login:", user);
      return true;
    }

    console.log("[AuthContext] Password mismatch or user name not found.");
    setTimeout(() => toast({ title: "Falha no Login", description: "Nome ou senha inválidos.", variant: "destructive" }), 0);
    return false;
}, [users, toast]);


   // Updated signupUser to include CPF check
   const signupUser = useCallback((userData: Omit<User, "id" | "passwordPlain"> & { passwordPlain: string }): boolean => {
    const trimmedLogin = userData.login.trim();
    const trimmedEmail = userData.email.trim();
    const trimmedCPF = userData.cpf?.trim(); // Handle optional CPF

     if (!trimmedLogin || !userData.name.trim() || !trimmedEmail || !userData.passwordPlain.trim()) {
        setTimeout(() => toast({ title: "Falha no Cadastro", description: "Todos os campos obrigatórios devem ser preenchidos.", variant: "destructive" }), 0);
        return false;
     }

     if (users.some(u => u.login.trim().toLowerCase() === trimmedLogin.toLowerCase())) {
        setTimeout(() => toast({ title: "Falha no Cadastro", description: "Este login já está em uso.", variant: "destructive" }), 0);
        return false;
     }
      if (users.some(u => u.email.trim().toLowerCase() === trimmedEmail.toLowerCase())) {
        setTimeout(() => toast({ title: "Falha no Cadastro", description: "Este email já está cadastrado.", variant: "destructive" }), 0);
        return false;
     }
     // Check for unique CPF (only if provided)
     if (trimmedCPF && users.some(u => u.cpf?.trim() === trimmedCPF)) {
        setTimeout(() => toast({ title: "Falha no Cadastro", description: "Este CPF já está cadastrado.", variant: "destructive" }), 0);
        return false;
     }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(16).slice(2)}`, // More robust ID
      login: trimmedLogin,
      name: userData.name.trim(),
      email: trimmedEmail,
      cpf: trimmedCPF || '', // Store trimmed CPF or empty string
      address: userData.address.trim(),
      cep: userData.cep.trim(),
      houseNumber: userData.houseNumber.trim(),
      phone: userData.phone.trim(),
      passwordPlain: userData.passwordPlain.trim(), // Store trimmed plain password (INSECURE MOCK)
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    setTimeout(() => toast({ title: "Cadastro realizado!", description: "Sua conta foi criada com sucesso." }), 0);
    return true;
  }, [users, toast]);

  const logoutUser = useCallback(() => {
    console.log("[AuthContext] Logging out user. Current user before logout:", currentUser);
    setCurrentUser(null);
    setInLocalStorage(LS_CURRENT_USER_KEY, null); // Clear user from storage on logout
    setTimeout(() => toast({ title: "Logout", description: "Você saiu da sua conta." }), 0);
    console.log("[AuthContext] currentUser state after logout:", null);
  }, [toast, currentUser]); // Added currentUser dependency

  // --- Admin Functions ---

   const signupAdmin = useCallback((login: string, passwordPlain: string): boolean => {
        const trimmedLogin = login.trim();
        const trimmedPassword = passwordPlain.trim();

         if (!trimmedLogin || !trimmedPassword) {
             setTimeout(() => toast({ title: "Falha no Cadastro Admin", description: "Login e senha não podem estar vazios.", variant: "destructive" }), 0);
             return false;
         }

        if (admins.some(a => a.login.trim().toLowerCase() === trimmedLogin.toLowerCase())) {
            setTimeout(() => toast({ title: "Falha no Cadastro Admin", description: "Este login de administrador já está em uso.", variant: "destructive" }), 0);
            return false;
        }

        const newAdmin: Admin = {
            id: `admin_${Date.now()}`,
            login: trimmedLogin,
            passwordPlain: trimmedPassword, // Store trimmed plain password (INSECURE MOCK)
        };

        setAdmins(prevAdmins => [...prevAdmins, newAdmin]);
        setTimeout(() => toast({ title: "Admin Criado", description: `Administrador '${trimmedLogin}' criado com sucesso.` }), 0);
        return true;
    }, [admins, toast]);


  const loginAdmin = useCallback((login: string, passwordAttempt: string): boolean => {
    console.log(`[AuthContext] Attempting admin login for: ${login}`);
    const trimmedLogin = login.trim();
    const admin = admins.find(a => a.login.trim().toLowerCase() === trimmedLogin.toLowerCase());

    if (admin && passwordAttempt.trim() === admin.passwordPlain.trim()) {
      console.log("[AuthContext] Admin credentials match. Setting admin logged in state.");
      setIsAdminLoggedIn(true);
      setCurrentUser(null); // Log out any regular user
      setInLocalStorage(LS_CURRENT_USER_KEY, null); // Clear user from storage
      setInLocalStorage(LS_ADMIN_LOGGED_IN_KEY, true); // Persist admin login
      setTimeout(() => toast({ title: "Login de Administrador", description: "Acesso administrativo concedido." }), 0);
      console.log("[AuthContext] isAdminLoggedIn state after successful admin login:", true);
      return true;
    }
    console.log("[AuthContext] Admin credentials mismatch or admin not found.");
    setTimeout(() => toast({ title: "Falha no Login Admin", description: "Credenciais de administrador inválidas.", variant: "destructive" }), 0);
    return false;
  }, [admins, toast]);


  const logoutAdmin = useCallback(() => {
    console.log("[AuthContext] Logging out admin. Current admin state before logout:", isAdminLoggedIn);
    setIsAdminLoggedIn(false);
    setInLocalStorage(LS_ADMIN_LOGGED_IN_KEY, false); // Clear admin from storage
    setTimeout(() => toast({ title: "Logout Admin", description: "Você saiu do modo administrativo." }), 0);
     console.log("[AuthContext] isAdminLoggedIn state after admin logout:", false);
  }, [toast, isAdminLoggedIn]); // Added isAdminLoggedIn dependency


  // --- User Profile Update ---
   // Updated updateUser to handle optional login, CPF, uniqueness checks, and password reset flags
   const updateUser = useCallback((updateData: UpdateUserData): boolean => {
       let success = false;
       let toastInfo: { title: string, description: string, variant?: "destructive" } | null = null;

       setUsers(prevUsers => {
            const userIndex = prevUsers.findIndex(u => u.id === updateData.id);
            if (userIndex === -1) {
                 toastInfo = { title: "Erro", description: "Usuário não encontrado.", variant: "destructive" };
                 return prevUsers;
            }

            const userToUpdate = prevUsers[userIndex];
            let updatedUser = { ...userToUpdate };

            // Prepare trimmed values for comparison and update
             const trimmedNewLogin = updateData.login?.trim().toLowerCase();
             const trimmedNewEmail = updateData.email.trim().toLowerCase();
             const trimmedNewCPF = updateData.cpf?.trim();

             const currentUserLoginLower = userToUpdate.login.trim().toLowerCase();
             const currentUserEmailLower = userToUpdate.email.trim().toLowerCase();
             const currentUserCPFLower = userToUpdate.cpf?.trim();


            // Check for login uniqueness (if changed)
             if (trimmedNewLogin && trimmedNewLogin !== currentUserLoginLower && prevUsers.some(u => u.login.trim().toLowerCase() === trimmedNewLogin && u.id !== updateData.id)) {
                toastInfo = { title: "Falha na Atualização", description: "Este login já está em uso por outra conta.", variant: "destructive" };
                return prevUsers;
            }

             // Check for email uniqueness (if changed)
             if (trimmedNewEmail !== currentUserEmailLower && prevUsers.some(u => u.email.trim().toLowerCase() === trimmedNewEmail && u.id !== updateData.id)) {
                 toastInfo = { title: "Falha na Atualização", description: "Este email já está em uso por outra conta.", variant: "destructive" };
                 return prevUsers;
             }

             // Check for CPF uniqueness (if changed and provided)
             if (trimmedNewCPF && trimmedNewCPF !== currentUserCPFLower && prevUsers.some(u => u.cpf?.trim() === trimmedNewCPF && u.id !== updateData.id)) {
                 toastInfo = { title: "Falha na Atualização", description: "Este CPF já está em uso por outra conta.", variant: "destructive" };
                 return prevUsers;
             }

            // Check if password change is requested
            if (updateData.newPassword) {
                const trimmedNewPassword = updateData.newPassword.trim();
                 // Check current password UNLESS it's a user reset flow OR an admin reset
                 if (!updateData.isPasswordReset && !updateData.isAdminPasswordReset) {
                     const trimmedCurrentPasswordAttempt = updateData.currentPassword?.trim();
                     if (!trimmedCurrentPasswordAttempt || trimmedCurrentPasswordAttempt !== userToUpdate.passwordPlain.trim()) {
                         toastInfo = { title: "Falha na Atualização", description: "Senha atual incorreta.", variant: "destructive" };
                         return prevUsers;
                     }
                 }
                 // Ensure new password is not empty and meets minimum length if applicable (already handled by Zod, but good safety check)
                  if (!trimmedNewPassword) {
                     toastInfo = { title: "Falha na Atualização", description: "Nova senha não pode ser vazia.", variant: "destructive" };
                     return prevUsers;
                 }
                 updatedUser.passwordPlain = trimmedNewPassword; // Store trimmed new password
            }

            // Apply the updates (using trimmed values where applicable)
             updatedUser = {
                 ...updatedUser,
                 login: updateData.login?.trim() ?? updatedUser.login, // Use trimmed new login or keep old
                 name: updateData.name.trim(),
                 email: updateData.email.trim(),
                 cpf: trimmedNewCPF !== undefined ? trimmedNewCPF : updatedUser.cpf, // Use trimmed new CPF or keep old
                 address: updateData.address.trim(),
                 cep: updateData.cep.trim(),
                 houseNumber: updateData.houseNumber.trim(),
                 phone: updateData.phone.trim(),
             };


            const newUsers = [...prevUsers];
            newUsers[userIndex] = updatedUser;
            success = true;
             if (updateData.newPassword) {
                toastInfo = updateData.isAdminPasswordReset
                  ? { title: "Sucesso", description: `Senha do usuário "${updatedUser.name}" redefinida.` }
                  : (updateData.isPasswordReset ? { title: "Senha Redefinida", description: "Sua senha foi alterada com sucesso." } : { title: "Sucesso", description: "Seu perfil foi atualizado (com senha)." });
            } else {
                toastInfo = { title: "Sucesso", description: "Perfil atualizado." };
            }


            // Update currentUser state if the updated user is the current one
            if (currentUser?.id === updatedUser.id) {
                 setCurrentUser(updatedUser);
                  setInLocalStorage(LS_CURRENT_USER_KEY, updatedUser); // Immediately persist change for current user
            }

            return newUsers;
       });

       // Dispatch toast outside the updater
       if (toastInfo) setTimeout(() => toast(toastInfo as any), 0);
       return success;
   }, [toast, currentUser, users]); // Added `users` dependency for uniqueness checks


   // --- User Deletion (Admin) ---
   const deleteUser = useCallback((userId: string): boolean => {
        let success = false;
        let toastInfo: { title: string, description: string, variant?: "destructive" } | null = null;
        let userName = '';

        setUsers(prevUsers => {
            const userIndex = prevUsers.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                toastInfo = { title: "Erro", description: "Usuário não encontrado para exclusão.", variant: "destructive" };
                return prevUsers;
            }

            userName = prevUsers[userIndex].name;
            const newUsers = prevUsers.filter(u => u.id !== userId);

            // If the deleted user is the currently logged-in user, log them out
            if (currentUser?.id === userId) {
                setCurrentUser(null);
                 setInLocalStorage(LS_CURRENT_USER_KEY, null); // Clear from storage
            }

            success = true;
            toastInfo = { title: "Usuário Excluído", description: `Usuário "${userName}" foi removido.` };
            return newUsers;
        });

        if (toastInfo) setTimeout(() => toast(toastInfo as any), 0);
        return success;
   }, [toast, currentUser]);


  const value = {
    currentUser,
    isAdminLoggedIn,
    users, // Expose users list
    admins, // Expose admins list
    loginUser,
    signupUser,
    logoutUser,
    loginAdmin,
    logoutAdmin,
    signupAdmin, // Expose admin signup
    updateUser, // Expose update user
    deleteUser, // Expose delete user
  };

  // Render children only after state is initialized from localStorage
  return (
     <AuthContext.Provider value={value}>
         {isInitialized ? children : null /* Or a loading indicator */}
     </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
