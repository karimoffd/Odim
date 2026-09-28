import React, { useState } from 'react';
import {
  RiShieldUserLine,
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiLock2Line,
  RiInformationLine,
  RiUserSettingsLine,
  RiShieldStarLine,
  RiBriefcaseLine,
  RiToolsLine,
  RiShieldLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import { api, type Role } from '../api';
import './RolesView.css';

const getRoleIcon = (roleId?: string, size = 13) => {
  switch (roleId) {
    case 'super_admin':
      return <RiShieldStarLine size={size} />;
    case 'admin':
      return <RiShieldUserLine size={size} />;
    case 'manager':
      return <RiBriefcaseLine size={size} />;
    case 'specialist':
      return <RiToolsLine size={size} />;
    default:
      return <RiShieldLine size={size} />;
  }
};

const cleanText = (text?: string): string => {
  if (!text) return '';
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '').trim();
};

const MODULES = [
  { key: 'deals', label: 'Savdo / Bitimlar' },
  { key: 'chat', label: 'Aloqa / Yagona Inbox' },
  { key: 'call_center', label: 'Aloqa / Call Center' },
  { key: 'clients', label: 'Mijozlar bazasi' },
  { key: 'calendar', label: 'Ish rejasi / Kalendar' },
  { key: 'tasks', label: 'Ish rejasi / Vazifalar' },
  { key: 'catalog', label: 'Ombor / Katalog' },
  { key: 'analytics', label: 'Sozlamalar / Analitika' },
  { key: 'staff', label: 'Sozlamalar / Xodimlar' },
  { key: 'roles', label: 'Sozlamalar / Rollar va Ruxsatlar' },
  { key: 'constructor', label: 'Sozlamalar / Tizim Konstruktori' },
];

const PRESET_COLORS = ['#191919', '#334155', '#475569', '#64748b', '#059669', '#d97706'];

export default function RolesView() {
  const { roles, currentRoleId, switchRole, refreshRoles, isSuperAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleColor, setRoleColor] = useState(PRESET_COLORS[0]);
  const [roleBadge, setRoleBadge] = useState('Rol');
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>(() => {
    const initial: any = {};
    MODULES.forEach(m => {
      initial[m.key] = { view: true, create: true, edit: true, delete: false };
    });
    return initial;
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleTitle('');
    setRoleDescription('');
    setRoleColor(PRESET_COLORS[1]);
    setRoleBadge('Yangi rol');
    const initial: any = {};
    MODULES.forEach(m => {
      initial[m.key] = { view: true, create: false, edit: false, delete: false };
    });
    setPermissions(initial);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleTitle(role.title);
    setRoleDescription(role.description);
    setRoleColor(role.color || PRESET_COLORS[0]);
    setRoleBadge(cleanText(role.badge || 'Rol'));
    
    const filledPerms: any = {};
    MODULES.forEach(m => {
      const existing = role.permissions?.[m.key] || {};
      filledPerms[m.key] = {
        view: !!existing.view,
        create: !!existing.create,
        edit: !!existing.edit,
        delete: !!existing.delete,
      };
    });
    setPermissions(filledPerms);
    setIsModalOpen(true);
  };

  const handleTogglePerm = (modKey: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [modKey]: {
        ...prev[modKey],
        [action]: !prev[modKey]?.[action],
      },
    }));
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      showToast('Iltimos, rol nomini kiriting!');
      return;
    }

    try {
      if (editingRoleId) {
        await api.updateRole(editingRoleId, {
          name: roleName,
          title: roleTitle || roleName,
          description: roleDescription,
          color: roleColor,
          badge: roleBadge,
          permissions,
        });
        showToast("Rol ma'lumotlari yangilandi!");
      } else {
        await api.createRole({
          name: roleName,
          title: roleTitle || roleName,
          description: roleDescription,
          color: roleColor,
          badge: roleBadge,
          permissions,
        });
        showToast('Yangi rol muvaffaqiyatli yaratildi va saqlandi!');
      }
      setIsModalOpen(false);
      await refreshRoles();
    } catch (e) {
      showToast("Xatolik yuz berdi. Rolni saqlab bo'lmadi.");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm("Rostdan ham ushbu rolni o'chirmoqchimisiz?")) return;
    try {
      const res = await api.deleteRole(roleId);
      if (res.success) {
        showToast("Rol o'chirildi!");
        await refreshRoles();
      } else {
        showToast(res.message || "O'chirishda xatolik");
      }
    } catch {
      showToast("O'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="roles-page-container">
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#FFFFFF',
          padding: '10px 18px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          zIndex: 100000,
          fontWeight: 400,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <RiCheckLine size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="roles-header-banner">
        <div className="roles-banner-text">
          <h2>
            <RiShieldUserLine size={22} color="#1e293b" />
            <span>Foydalanuvchi Rollari va Ruxsatlar Boshqaruvi (RBAC)</span>
          </h2>
          <p>
            Tizimdagi Super Admin, Oddiy Admin va barcha xodimlar rollarini boshqaring. Har bir rol uchun qaysi bo'limlar ko'rinishi, ma'lumotlar qo'shilishi yoki o'chirilishi mumkinligini sozlang.
          </p>
        </div>
        <button className="btn-create-role" onClick={handleOpenCreateModal}>
          <RiAddLine size={20} />
          <span>Yangi Rol Qo'shish</span>
        </button>
      </div>

      {/* ROLES LIST GRID */}
      <div className="roles-grid">
        {roles.map(role => {
          const isActive = currentRoleId === role.id;
          const allowedCount = Object.values(role.permissions || {}).filter(p => p.view).length;

          return (
            <div key={role.id} className={`role-card ${isActive ? 'is-active-role' : ''}`}>
              <div className="role-card-header">
                <div className="role-badge-title">
                  <span
                    className="role-color-indicator"
                    style={{ backgroundColor: role.color || '#475569' }}
                  />
                  <div>
                    <h3 className="role-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getRoleIcon(role.id, 14)}
                      <span>{role.name}</span>
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>{cleanText(role.badge || role.title)}</span>
                  </div>
                </div>
                {role.isSystem ? (
                  <span className="role-system-tag">Tizim roli</span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Maxsus</span>
                )}
              </div>

              <p className="role-description">{role.description || "Tavsif kiritilmagan."}</p>

              <div className="role-permissions-summary">
                <div className="perm-pill has-perm">
                  <RiCheckLine size={14} />
                  <span>{allowedCount} ta bo'limga ruxsat</span>
                </div>
                {role.permissions?.deals?.delete && (
                  <div className="perm-pill" style={{ borderColor: '#FECACA', color: '#DC2626' }}>
                    O'chirish huquqi bor
                  </div>
                )}
              </div>

              <div className="role-card-actions">
                <button
                  className={`btn-switch-role ${isActive ? 'active' : ''}`}
                  onClick={() => switchRole(role.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                >
                  {isActive && <RiCheckLine size={13} />}
                  <span>{isActive ? "Hozirgi Faol Rol" : "Ushbu rolni sinash"}</span>
                </button>
                <button
                  className="btn-action-icon"
                  title="Tahrirlash"
                  onClick={() => handleOpenEditModal(role)}
                >
                  <RiEditLine size={16} />
                </button>
                {!role.isSystem && (
                  <button
                    className="btn-action-icon"
                    title="O'chirish"
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      {isModalOpen && (
        <div className="role-modal-overlay">
          <div className="role-modal-content">
            <div className="role-modal-header">
              <h3>{editingRoleId ? "Rolni Tahrirlash" : "Yangi Rol Yaratish"}</h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setIsModalOpen(false)}
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            <div className="role-modal-body">
              <div className="role-form-group">
                <label>Rol nomi (Masalan: Super Admin, Kassir, Filial Menejeri)</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="Rol nomini kiriting..."
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                />
              </div>

              <div className="role-form-group">
                <label>Qisqa belgisi (Badge)</label>
                <input
                  type="text"
                  className="role-input"
                  placeholder="Masalan: Super Admin yoki Menejer"
                  value={roleBadge}
                  onChange={e => setRoleBadge(e.target.value)}
                />
              </div>

              <div className="role-form-group">
                <label>Rol tavsifi</label>
                <textarea
                  className="role-textarea"
                  rows={2}
                  placeholder="Ushbu rol kimlarga beriladi va nimalarga ruxsati bor..."
                  value={roleDescription}
                  onChange={e => setRoleDescription(e.target.value)}
                />
              </div>

              <div className="role-form-group">
                <label>Rang tanlash</label>
                <div className="role-color-picker">
                  {PRESET_COLORS.map(c => (
                    <div
                      key={c}
                      className={`color-option ${roleColor === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setRoleColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="role-form-group">
                <label>Bo'limlar bo'yicha ruxsatlar matritsasi</label>
                <div className="perm-matrix">
                  <div className="perm-matrix-header">
                    <span>Modul / Bo'lim</span>
                    <span>Ko'rish</span>
                    <span>Yaratish</span>
                    <span>Tahrirlash</span>
                    <span>O'chirish</span>
                  </div>
                  {MODULES.map(m => {
                    const p = permissions[m.key] || { view: false, create: false, edit: false, delete: false };
                    return (
                      <div key={m.key} className="perm-matrix-row">
                        <span style={{ fontWeight: 400, color: '#1E293B' }}>{m.label}</span>
                        <div>
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            checked={p.view}
                            onChange={() => handleTogglePerm(m.key, 'view')}
                          />
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            checked={p.create}
                            onChange={() => handleTogglePerm(m.key, 'create')}
                          />
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            checked={p.edit}
                            onChange={() => handleTogglePerm(m.key, 'edit')}
                          />
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            checked={p.delete}
                            onChange={() => handleTogglePerm(m.key, 'delete')}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="role-modal-footer">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={handleSaveRole}>
                {editingRoleId ? "O'zgarishlarni Saqlash" : "Rolni Yaratish va Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
