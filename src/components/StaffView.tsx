import React, { useState, useEffect, useRef } from 'react';
import { api, type Staff } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  RiShieldUserLine,
  RiUser3Line,
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiSave3Line,
  RiLock2Line,
  RiUserSettingsLine,
  RiKey2Line,
  RiShieldStarLine,
  RiBriefcaseLine,
  RiToolsLine,
  RiShieldLine,
  RiInformationLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFileCopyLine,
  RiSearchLine,
  RiLockPasswordLine,
  RiPhoneLine,
  RiEditLine,
  RiDeleteBinLine,
  RiUserStarLine
} from 'react-icons/ri';
import './StaffView.css';

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
  { key: 'staff', label: 'Sozlamalar / Foydalanuvchilar va Xodimlar' },
  { key: 'roles', label: 'Sozlamalar / Rollar va Ruxsatlar' },
  { key: 'constructor', label: 'Sozlamalar / Tizim Konstruktori' },
];

const getFirstName = (s?: Staff | null): string => {
  if (!s) return '';
  if (s.firstName) return s.firstName;
  if (s.name && typeof s.name === 'string') return s.name.split(' ')[0] || s.name;
  return 'Xodim';
};

const getLastName = (s?: Staff | null): string => {
  if (!s) return '';
  if (s.lastName) return s.lastName;
  if (s.name && typeof s.name === 'string') {
    const parts = s.name.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }
  return '';
};

export default function StaffView() {
  const { roles, isSuperAdmin, currentRoleId, currentUser } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const selectedStaffIdRef = useRef<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkerPwd, setShowWorkerPwd] = useState<Record<string, boolean>>({});

  // Role & Permissions editing states for selected worker
  const [assignedRoleId, setAssignedRoleId] = useState<string>('manager');
  const [workerPermissions, setWorkerPermissions] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Form states for adding new staff
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('manager');

  // Form states for editing staff
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRoleId, setEditRoleId] = useState('manager');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const openEditModal = (worker: Staff) => {
    setSelectedStaff(worker);
    selectedStaffIdRef.current = worker.id;
    setEditFirstName(getFirstName(worker));
    setEditLastName(getLastName(worker));
    setEditPhone(worker.phone || '');
    setEditPassword(worker.password || '123456');
    setEditRoleId(worker.role || 'manager');
    setIsEditModalOpen(true);
  };

  const handleSaveEditedStaff = async () => {
    if (!selectedStaff) return;
    const fullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
    const matchedRole = roles.find(r => r.id === editRoleId);

    try {
      const res = await api.updateStaff(selectedStaff.id, {
        name: fullName,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
        password: editPassword.trim(),
        role: editRoleId,
        role_id: editRoleId,
        roleTitle: matchedRole?.title || matchedRole?.name || 'Xodim',
        role_title: matchedRole?.title || matchedRole?.name || 'Xodim',
        email: selectedStaff.email || `${editFirstName.toLowerCase()}.${editLastName.toLowerCase()}@odim.uz`.replace(/\s+/g, ''),
        status: selectedStaff.status || 'active',
        isOnline: selectedStaff.isOnline,
        assignedDeals: selectedStaff.assignedDeals || 0,
      });

      if (res.success || res) {
        showToast(`✓ ${fullName} ma'lumotlari muvaffaqiyatli tahrirlandi!`);
        setIsEditModalOpen(false);
        await loadStaff();
      }
    } catch {
      showToast("Xatolik: Tahrirlangan ma'lumotlarni saqlab bo'lmadi");
    }
  };

  const toggleWorkerPwdVisibility = (staffId: string) => {
    setShowWorkerPwd(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const loadStaff = async () => {
    try {
      const data = await api.getStaff();
      setStaff(data);
      if (data.length > 0) {
        if (!selectedStaffIdRef.current) {
          selectWorker(data[0]);
        } else {
          const updated = data.find(s => s.id === selectedStaffIdRef.current);
          if (updated) {
            setSelectedStaff(updated);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load staff:', e);
    }
  };

  useEffect(() => {
    loadStaff();
    const interval = setInterval(loadStaff, 3000);
    return () => clearInterval(interval);
  }, [roles]);

  const selectWorker = (worker: Staff) => {
    selectedStaffIdRef.current = worker.id;
    setSelectedStaff(worker);
    setAssignedRoleId(worker.role || 'manager');

    // Load worker's permissions (either from their custom permissions or role's permissions)
    const effective: any = {};
    const sourcePerms = worker.modulePermissions || {};

    MODULES.forEach(m => {
      const mod = sourcePerms[m.key] || {};
      effective[m.key] = {
        view: !!mod.view,
        create: !!mod.create,
        edit: !!mod.edit,
        delete: !!mod.delete,
      };
    });
    setWorkerPermissions(effective);
  };

  const handleRoleChangeForWorker = (roleId: string) => {
    setAssignedRoleId(roleId);
    const matchedRole = roles.find(r => r.id === roleId);
    if (matchedRole && matchedRole.permissions) {
      const permsFromRole: any = {};
      MODULES.forEach(m => {
        const mod = matchedRole.permissions[m.key] || {};
        permsFromRole[m.key] = {
          view: !!mod.view,
          create: !!mod.create,
          edit: !!mod.edit,
          delete: !!mod.delete,
        };
      });
      setWorkerPermissions(permsFromRole);
      showToast(`'${matchedRole.name}' roli tanlandi. Ushbu rolning standart dostuplari yuklandi.`);
    }
  };

  const handleToggleWorkerPerm = (modKey: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    if (!isSuperAdmin) {
      showToast("Faqat Super Admin ishchilarning dostupini o'zgartira oladi!");
      return;
    }
    setWorkerPermissions(prev => ({
      ...prev,
      [modKey]: {
        ...prev[modKey],
        [action]: !prev[modKey]?.[action],
      },
    }));
  };

  const handleSaveWorkerAccess = async () => {
    if (!selectedStaff) return;
    if (!isSuperAdmin) {
      showToast("Faqat Super Admin ishchilarga rol va dostup bera oladi!");
      return;
    }

    setIsSaving(true);
    const matchedRole = roles.find(r => r.id === assignedRoleId);
    const roleTitle = matchedRole?.title || matchedRole?.name || 'Xodim';

    try {
      const res = await api.assignStaffAccess(
        selectedStaff.id,
        assignedRoleId,
        roleTitle,
        workerPermissions
      );

      if (res.success) {
        showToast(`✓ ${selectedStaff.name} uchun yangi rol (${matchedRole?.name || assignedRoleId}) va barcha dostuplar saqlandi!`);
        await loadStaff();
      } else {
        showToast(res.message || "Saqlashda xatolik yuz berdi");
      }
    } catch {
      showToast("Xatolik: Ishchining roli va dostupini saqlab bo'lmadi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newName || !newPhone) return;
    const matchedRole = roles.find(r => r.id === newRole);

    try {
      const res = await api.addStaff({
        name: newName,
        phone: newPhone,
        email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@odim.uz`,
        role_id: newRole,
        role_title: matchedRole?.title || matchedRole?.name || 'Xodim',
        status: 'active',
        is_online: true,
        assigned_deals: 0,
      });

      if (res.success) {
        await loadStaff();
        setIsAddModalOpen(false);
        setNewName('');
        setNewPhone('');
        setNewEmail('');
        showToast(`Yangi xodim muvaffaqiyatli qo'shildi: ${newName}`);
      }
    } catch {
      showToast('Xatolik: Xodim saqlanmadi');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!isSuperAdmin) {
      showToast("Faqat Super Admin xodimlarni o'chira oladi!");
      return;
    }
    if (!window.confirm("Rostdan ham ushbu xodimni o'chirmoqchimisiz?")) return;
    try {
      await api.deleteStaff(staffId);
      await loadStaff();
      showToast("Xodim o'chirildi!");
    } catch {
      showToast("Xodimni o'chirishda xatolik");
    }
  };

  const filteredStaff = staff.filter(s => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const fullName = (s.name || '').toLowerCase();
    const phone = (s.phone || '').toLowerCase();
    const fName = (s.firstName || '').toLowerCase();
    const lName = (s.lastName || '').toLowerCase();
    return fullName.includes(term) || phone.includes(term) || fName.includes(term) || lName.includes(term);
  });

  const myProfileStaff = staff.find(s =>
    (currentUser?.phone && s.phone && s.phone.replace(/\D/g, '') === currentUser.phone.replace(/\D/g, '')) ||
    (currentUser?.id && s.id === currentUser.id) ||
    (s.phone && s.phone.replace(/\D/g, '').includes('998582006')) ||
    (s.name && s.name.toLowerCase().includes('diyor'))
  ) || staff[0];

  return (
    <div className="staff-page-container">
      {toastMsg && (
        <div className="staff-toast">
          <RiCheckLine size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SUPER ADMIN STATUS BANNER */}
      <div className="super-admin-badge-banner">
        <div className="sabb-left">
          <div className="sabb-icon">
            <RiShieldStarLine size={20} color="#1e293b" />
          </div>
          <div className="sabb-text">
            <h4>Super Admin Boshqaruvi: Ro'yxatdan O'tgan Barcha Foydalanuvchilar va Parollar Nazorati</h4>
            <p>
              {isSuperAdmin
                ? "Siz Super Adminsiz — ro'yxatdan o'tgan barcha foydalanuvchilarning ism-familiyasi, telefon raqami va parollarini hamda parolda necha belgi borligini to'liq ko'ra olasiz."
                : `Hozirgi rolingiz: ${cleanText(roles.find(r => r.id === currentRoleId)?.name || currentRoleId)}. Diqqat: Faqat Super Admin barcha foydalanuvchilar parolini va to'liq ma'lumotlarini ko'ra oladi.`}
            </p>
          </div>
        </div>
        {isSuperAdmin ? (
          <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <RiCheckLine size={13} />
            <span>Super Admin Rejimi Faol</span>
          </span>
        ) : (
          <span style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <RiLock2Line size={13} />
            <span>Faqat ko'rish rejimi</span>
          </span>
        )}
      </div>

      {/* TOP BAR */}
      <div className="staff-top-bar">
        <div>
          <h2 className="staff-page-title">Ro'yxatdan o'tganlar va Xodimlarni Boshqarish</h2>
          <span className="staff-page-sub">Tizimda ro'yxatdan o'tgan barcha akkauntlar, ism-familiyalar, telefon raqamlar va parollar nazorati</span>
        </div>

        {isSuperAdmin && (
          <button className="add-staff-btn" onClick={() => setIsAddModalOpen(true)}>
            <RiAddLine size={18} />
            <span>Yangi ishchi qo'shish</span>
          </button>
        )}
      </div>

      {/* LAYOUT: LEFT STAFF LIST, RIGHT ROLE/PERMISSION MATRIX */}
      <div className="staff-layout-grid">
        {/* STAFF LIST */}
        <div className="staff-list-card">
          <div className="sl-header">
            <h3>Barcha Foydalanuvchilar ({filteredStaff.length})</h3>
            <div className="sl-search-box">
              <RiSearchLine size={16} className="sl-search-icon" />
              <input
                type="text"
                className="sl-search-input"
                placeholder="Ism, familiya yoki telefon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="sl-body">
            {filteredStaff.map((s) => {
              const isSelected = selectedStaff?.id === s.id;
              const matchedRole = roles.find(r => r.id === s.role);
              const fName = getFirstName(s);
              const lName = getLastName(s);

              return (
                <div
                  key={s.id}
                  className={`staff-item-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectWorker(s)}
                >
                  <div className="si-avatar-wrap">
                    <div className="si-avatar" style={{ backgroundColor: '#f1f5f9', overflow: 'hidden', padding: 0 }}>
                      {s.avatar ? (
                        <img src={s.avatar} alt={fName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <RiUser3Line size={18} color="#1e293b" />
                      )}
                    </div>
                    <span className={`online-dot ${s.isOnline ? 'online' : 'offline'}`} />
                  </div>

                  <div className="si-meta">
                    <div className="si-name-row">
                      <span className="si-name">{fName} {lName}</span>
                      <span className="si-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        {getRoleIcon(s.role, 12)}
                        <span>{cleanText(matchedRole?.badge || matchedRole?.name || s.roleTitle || s.role)}</span>
                      </span>
                    </div>
                    <span className="si-phone">{s.phone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: PERMISSIONS & ROLE ASSIGNMENT PANEL */}
        <div className="staff-perm-card">
          {selectedStaff ? (
            <>
              {/* WORKER HEADER */}
              <div className="spc-header">
                <div className="spc-user-meta">
                  <div
                    className="spc-big-avatar"
                    style={{ backgroundColor: '#191919', overflow: 'hidden', padding: 0 }}
                  >
                    {selectedStaff.avatar ? (
                      <img src={selectedStaff.avatar} alt={selectedStaff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      getRoleIcon(assignedRoleId, 22)
                    )}
                  </div>
                  <div>
                    <h3>{getFirstName(selectedStaff)} {getLastName(selectedStaff)}</h3>
                    <span className="spc-role-desc">
                      {selectedStaff.phone} • {selectedStaff.email}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`spc-status-chip ${selectedStaff.isOnline ? 'online' : 'offline'}`}>
                    <span className={`status-badge-dot ${selectedStaff.isOnline ? 'online' : 'offline'}`} />
                    <span>{selectedStaff.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  {isSuperAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(selectedStaff)}
                        style={{ background: '#E0F2FE', border: 'none', color: '#0284C7', padding: '6px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RiEditLine size={14} />
                        <span>Tahrirlash</span>
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(selectedStaff.id)}
                        style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', padding: '6px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RiDeleteBinLine size={14} />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="spc-body">
                {/* SUPER ADMIN REGISTRATION & PASSWORD INFO CARD */}
                {isSuperAdmin && (
                  <div className="super-admin-user-details-card">
                    <div className="sudc-header" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RiLockPasswordLine size={18} color="#0284c7" />
                        <span className="sudc-title">Super Admin Nazorati: Foydalanuvchi Ro'yxatdan O'tish va Parol Ma'lumotlari</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditModal(selectedStaff)}
                        style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RiEditLine size={13} />
                        <span>Ma'lumotlarni Tahrirlash</span>
                      </button>
                    </div>

                    <div className="sudc-grid">
                      {/* Ismi */}
                      <div className="sudc-field">
                        <span className="sudc-label">Ismi:</span>
                        <span className="sudc-val">{getFirstName(selectedStaff)}</span>
                      </div>

                      {/* Familiyasi */}
                      <div className="sudc-field">
                        <span className="sudc-label">Familiyasi:</span>
                        <span className="sudc-val">{getLastName(selectedStaff) || '-'}</span>
                      </div>

                      {/* Telefon Raqami */}
                      <div className="sudc-field">
                        <span className="sudc-label">Telefon raqami:</span>
                        <span className="sudc-val phone-val">
                          <RiPhoneLine size={14} />
                          {selectedStaff.phone}
                        </span>
                      </div>

                      {/* Parol va Raqamlar Soni */}
                      <div className="sudc-field sudc-pwd-field">
                        <span className="sudc-label">Parol va Raqamlar/Belgilar Soni:</span>
                        <div className="sudc-pwd-wrap">
                          <span className="pwd-badge-count">
                            {selectedStaff.password ? `${selectedStaff.password.length} ta raqam/belgi qo'yilgan` : "6 ta raqam/belgi qo'yilgan"}
                          </span>

                          <div className="pwd-text-box">
                            <input
                              type={showWorkerPwd[selectedStaff.id] ? 'text' : 'password'}
                              readOnly
                              value={selectedStaff.password || '123456'}
                              className="pwd-readonly-input"
                            />
                            <button
                              type="button"
                              className="btn-toggle-pwd"
                              onClick={() => toggleWorkerPwdVisibility(selectedStaff.id)}
                              title={showWorkerPwd[selectedStaff.id] ? "Parolni yashirish" : "Parolni ko'rsatish"}
                            >
                              {showWorkerPwd[selectedStaff.id] ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                            </button>
                            <button
                              type="button"
                              className="btn-copy-pwd"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedStaff.password || '123456');
                                showToast("Parol nusxalandi!");
                              }}
                              title="Parolni nusxalash"
                            >
                              <RiFileCopyLine size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. ROL BERISH BLOKI */}
                <div className="role-assign-card-section">
                  <div className="racs-header">
                    <span className="racs-title">
                      <RiUserSettingsLine size={18} color="#1e293b" />
                      <span>1. Ishchiga Tizimdagi Rolni Berish (Role Assignment)</span>
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span>Joriy roli:</span>
                      {getRoleIcon(assignedRoleId, 13)}
                      <span style={{ color: '#0f172a' }}>{cleanText(roles.find(r => r.id === assignedRoleId)?.name || assignedRoleId)}</span>
                    </span>
                  </div>

                  <div className="racs-select-wrapper">
                    <select
                      className="role-dropdown-select"
                      value={assignedRoleId}
                      onChange={(e) => handleRoleChangeForWorker(e.target.value)}
                      disabled={!isSuperAdmin}
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {cleanText(r.badge || r.name)} — ({cleanText(r.title || r.name)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RiInformationLine size={14} style={{ flexShrink: 0 }} />
                    <span>Rol tanlanganda ushbu rolning standart ruxsatlari quyidagi jadvalga avtomatik ko'chiriladi. Siz quyida xohlagan bo'limni alohida yoqishingiz yoki o'chirishingiz mumkin.</span>
                  </p>
                </div>

                {/* 2. DOSTUP BERISH MATRITSASI */}
                <h4 className="spc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RiKey2Line size={18} color="#1e293b" />
                  <span>2. Ishchiga Bo'limlar Bo'yicha Dostup (Ruxsatlar) Berish</span>
                </h4>
                <p className="spc-section-desc">
                  Ushbu ishchi qaysi bo'limlarga kira olishi, ma'lumotlarni qo'shishi yoki o'chira olishini belgilang:
                </p>

                <div className="worker-perm-matrix-wrapper">
                  <div className="worker-perm-matrix">
                    <div className="wpm-header">
                      <span>Modul / Bo'lim</span>
                      <span>Ko'rish</span>
                      <span>Yaratish</span>
                      <span>Tahrirlash</span>
                      <span>O'chirish</span>
                    </div>

                    {MODULES.map(m => {
                      const p = workerPermissions[m.key] || { view: false, create: false, edit: false, delete: false };
                      return (
                        <div key={m.key} className="wpm-row">
                          <span className="wpm-module-name">{m.label}</span>
                          <div className="wpm-col-center">
                            <input
                              type="checkbox"
                              className="wpm-checkbox"
                              checked={!!p.view}
                              disabled={!isSuperAdmin}
                              onChange={() => handleToggleWorkerPerm(m.key, 'view')}
                            />
                          </div>
                          <div className="wpm-col-center">
                            <input
                              type="checkbox"
                              className="wpm-checkbox"
                              checked={!!p.create}
                              disabled={!isSuperAdmin}
                              onChange={() => handleToggleWorkerPerm(m.key, 'create')}
                            />
                          </div>
                          <div className="wpm-col-center">
                            <input
                              type="checkbox"
                              className="wpm-checkbox"
                              checked={!!p.edit}
                              disabled={!isSuperAdmin}
                              onChange={() => handleToggleWorkerPerm(m.key, 'edit')}
                            />
                          </div>
                          <div className="wpm-col-center">
                            <input
                              type="checkbox"
                              className="wpm-checkbox"
                              checked={!!p.delete}
                              disabled={!isSuperAdmin}
                              onChange={() => handleToggleWorkerPerm(m.key, 'delete')}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. SAQLASH TUGMASI */}
                {isSuperAdmin ? (
                  <button
                    className="btn-save-staff-access"
                    onClick={handleSaveWorkerAccess}
                    disabled={isSaving}
                  >
                    <RiSave3Line size={18} />
                    <span>
                      {isSaving ? "Bazaga saqlanmoqda..." : `Ushbu ishchiga (${selectedStaff.name}) Rol va Dostupni Saqlash`}
                    </span>
                  </button>
                ) : (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '14px', borderRadius: '12px', color: '#92400E', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RiLock2Line size={18} />
                    <span>Faqat Super Admin boshqa ishchilarga rol va dostup bera oladi. O'zgartirish uchun Super Admin roliga o'ting.</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
              Chapdagi ro'yxatdan birorta ishchini tanlang
            </div>
          )}
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="staff-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="staff-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="stm-header">
              <h3>Yangi ishchi qo'shish</h3>
              <button className="stm-close" onClick={() => setIsAddModalOpen(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="stm-body">
              <div className="stm-field">
                <label>F.I.SH (Ism familiyasi)</label>
                <input
                  type="text"
                  placeholder="Masalan: Sardor Qodirov"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="stm-field">
                <label>Telefon raqami</label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div className="stm-field">
                <label>Email manzili</label>
                <input
                  type="email"
                  placeholder="sardor@odim.uz"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="stm-field">
                <label>Dastlabki roli</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {cleanText(r.name)} ({cleanText(r.title || r.name)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="stm-footer">
              <button className="stm-btn-cancel" onClick={() => setIsAddModalOpen(false)}>Bekor qilish</button>
              <button className="stm-btn-submit" onClick={handleAddStaff}>Ishchini qo'shish</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {isEditModalOpen && (
        <div className="staff-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="staff-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="stm-header">
              <h3>Foydalanuvchi Ma'lumotlarini Tahrirlash</h3>
              <button className="stm-close" onClick={() => setIsEditModalOpen(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="stm-body">
              <div className="stm-field">
                <label>Ismi</label>
                <input
                  type="text"
                  placeholder="Masalan: Diyor"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>

              <div className="stm-field">
                <label>Familiyasi</label>
                <input
                  type="text"
                  placeholder="Masalan: Karimov"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>

              <div className="stm-field">
                <label>Telefon raqami</label>
                <input
                  type="text"
                  placeholder="+998 99 858 20 06"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              <div className="stm-field">
                <label>Parol</label>
                <input
                  type="text"
                  placeholder="Yangi parol..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              <div className="stm-field">
                <label>Tizimdagi roli</label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {cleanText(r.name)} ({cleanText(r.title || r.name)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="stm-footer">
              <button className="stm-btn-cancel" onClick={() => setIsEditModalOpen(false)}>Bekor qilish</button>
              <button className="stm-btn-submit" onClick={handleSaveEditedStaff}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
