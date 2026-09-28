import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type Role, type Staff } from '../api';

interface AuthContextType {
  currentUser: Staff | null;
  currentRoleId: string;
  currentRole: Role | null;
  roles: Role[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isDiyor: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; phone: string; password?: string; roleId?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (roleId: string) => Promise<void>;
  hasPermission: (moduleKey: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'view_revenue') => boolean;
  refreshRoles: () => Promise<void>;
  updateCurrentUserAvatar: (newAvatar: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Staff | null>(() => {
    try {
      const saved = localStorage.getItem('odim_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isDiyor = !!(
    currentUser && (
      (currentUser.phone && currentUser.phone.replace(/\D/g, '').includes('998582006')) ||
      (currentUser.name && currentUser.name.toLowerCase().includes('diyor'))
    )
  );

  const [currentRoleId, setCurrentRoleId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('odim_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.phone?.replace(/\D/g, '').includes('998582006') || u.name?.toLowerCase().includes('diyor')) {
          return u.role || 'super_admin';
        }
        return u.role || 'cashier';
      }
      return 'cashier';
    } catch {
      return 'cashier';
    }
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRoles, currentRoleData] = await Promise.all([
        api.getRoles(),
        api.getCurrentRole()
      ]);

      setRoles(fetchedRoles);
      
      // Determine active role based on logged in user or default
      const userIsDiyor = !!(
        currentUser && (
          (currentUser.phone && currentUser.phone.replace(/\D/g, '').includes('998582006')) ||
          (currentUser.name && currentUser.name.toLowerCase().includes('diyor'))
        )
      );

      const activeId = currentUser?.role || (userIsDiyor ? (currentRoleData.currentRoleId || 'super_admin') : 'cashier');
      setCurrentRoleId(activeId);
      
      const matched = fetchedRoles.find(r => r.id === activeId) || currentRoleData.role;
      setCurrentRole(matched || null);
    } catch (e) {
      console.error('Failed to load auth/role state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    try {
      const allStaff = await api.getStaff();
      const currNormPhone = (currentUser.phone || '').replace(/\D/g, '');
      const matched = allStaff.find(s => {
        if (!s) return false;
        if (s.id === currentUser.id) return true;
        const sNorm = (s.phone || '').replace(/\D/g, '');
        return !!(currNormPhone && sNorm && currNormPhone === sNorm);
      });

      if (matched) {
        const roleChanged = matched.role !== currentUser.role;
        const titleChanged = matched.roleTitle !== currentUser.roleTitle;
        const avatarChanged = (matched.avatar || '') !== (currentUser.avatar || '');
        const permsChanged = JSON.stringify(matched.modulePermissions || {}) !== JSON.stringify(currentUser.modulePermissions || {});

        if (roleChanged || titleChanged || avatarChanged || permsChanged) {
          const updated = {
            ...currentUser,
            ...matched,
            role: matched.role,
            roleTitle: matched.roleTitle,
            avatar: matched.avatar || currentUser.avatar,
            modulePermissions: matched.modulePermissions,
          };
          setCurrentUser(updated as any);
          localStorage.setItem('odim_user', JSON.stringify(updated));

          const isUserDiyor = !!(
            (updated.phone && updated.phone.replace(/\D/g, '').includes('998582006')) ||
            (updated.name && updated.name.toLowerCase().includes('diyor'))
          );
          const newRoleId = updated.role || (isUserDiyor ? 'super_admin' : 'cashier');
          setCurrentRoleId(newRoleId);
          const matchedRole = roles.find(r => r.id === newRoleId);
          if (matchedRole) {
            setCurrentRole(matchedRole);
          }
        }
      }
    } catch (e) {
      console.error('Failed to sync user role:', e);
    }
  };

  const updateCurrentUserAvatar = async (newAvatar: string) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      avatar: newAvatar
    };
    setCurrentUser(updated as any);
    localStorage.setItem('odim_user', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('odim_user_updated', { detail: updated }));

    try {
      await api.updateStaffAvatar(currentUser.id, newAvatar);
    } catch (e) {
      console.warn('Failed to save avatar to server:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      refreshCurrentUser();
    }, 2000);

    const handleUserUpdate = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('odim_user_updated', handleUserUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('odim_user_updated', handleUserUpdate);
    };
  }, [currentUser?.id, currentUser?.phone, currentUser?.role]);

  const login = async (loginStr: string, passwordStr: string) => {
    const res = await api.login(loginStr, passwordStr);
    if (res.success && res.user) {
      localStorage.setItem('odim_token', res.token);
      localStorage.setItem('odim_user', JSON.stringify(res.user));
      setCurrentUser(res.user as any);
      const isUserDiyor = !!(
        (res.user.phone && res.user.phone.replace(/\D/g, '').includes('998582006')) ||
        (res.user.name && res.user.name.toLowerCase().includes('diyor'))
      );
      const roleId = res.user.role || (isUserDiyor ? 'super_admin' : 'cashier');
      setCurrentRoleId(roleId);
      const matched = roles.find(r => r.id === roleId);
      if (matched) {
        setCurrentRole(matched);
      }
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    phone: string;
    password?: string;
    roleId?: string;
    email?: string;
  }) => {
    const isUserDiyor = data.phone.replace(/\D/g, '').includes('998582006') || `${data.firstName} ${data.lastName}`.toLowerCase().includes('diyor');
    const targetRoleId = data.roleId || (isUserDiyor ? 'super_admin' : 'cashier');
    const res = await api.register({ ...data, roleId: targetRoleId });
    if (res.success && res.user) {
      localStorage.setItem('odim_token', res.token);
      localStorage.setItem('odim_user', JSON.stringify(res.user));
      setCurrentUser(res.user as any);
      const roleId = res.user.role || targetRoleId;
      setCurrentRoleId(roleId);
      const matched = roles.find(r => r.id === roleId);
      if (matched) {
        setCurrentRole(matched);
      }
    }
  };

  const logout = async () => {
    try {
      if (currentUser?.id) {
        await api.logout(currentUser.id);
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem('odim_token');
      localStorage.removeItem('odim_user');
      setCurrentUser(null);
    }
  };

  const switchRole = async (roleId: string) => {
    if (!isDiyor) return; // Only Diyor Karimov can switch roles
    try {
      await api.switchRole(roleId);
      setCurrentRoleId(roleId);
      const matched = roles.find(r => r.id === roleId);
      if (matched) {
        setCurrentRole(matched);
      }
      if (currentUser) {
        const updated = { ...currentUser, role: roleId };
        setCurrentUser(updated);
        localStorage.setItem('odim_user', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to switch role:', e);
    }
  };

  const isSuperAdmin = isDiyor || currentRoleId === 'super_admin' || currentUser?.role === 'super_admin';
  const isAdmin = isSuperAdmin || currentRoleId === 'admin' || currentUser?.role === 'admin';

  const hasPermission = (
    moduleKey: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'view_revenue' = 'view'
  ): boolean => {
    if (isSuperAdmin) return true;

    // Check user's specific custom module permissions first
    if (currentUser?.modulePermissions && currentUser.modulePermissions[moduleKey]) {
      const mod = currentUser.modulePermissions[moduleKey];
      return !!(mod as any)[action];
    }

    // Fallback to current role permissions
    if (!currentRole || !currentRole.permissions) return true;
    const mod = currentRole.permissions[moduleKey];
    if (!mod) return false;
    return !!(mod as any)[action];
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRoleId,
        currentRole,
        roles,
        isLoading,
        isAuthenticated: !!currentUser,
        isDiyor,
        isSuperAdmin,
        isAdmin,
        login,
        register,
        logout,
        switchRole,
        hasPermission,
        refreshRoles: loadData,
        updateCurrentUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
