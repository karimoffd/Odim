import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  AVATAR_PRESETS,
  AVATAR_BG_COLORS,
  getDefaultAvatar
} from '../utils/avatars';
import {
  TbUser,
  TbPhone,
  TbMail,
  TbLock,
  TbEye,
  TbEyeOff,
  TbCopy,
  TbCheck,
  TbUpload,
  TbTrash,
  TbPalette,
  TbSparkles,
  TbShieldCheck,
  TbDeviceFloppy
} from 'react-icons/tb';
import {
  RiShieldStarLine,
  RiShieldUserLine,
  RiBriefcaseLine,
  RiToolsLine,
  RiShieldLine,
  RiMoneyDollarCircleLine
} from 'react-icons/ri';
import './ProfilePage.css';

const getRoleIcon = (roleId?: string, size = 14) => {
  switch (roleId) {
    case 'super_admin':
      return <RiShieldStarLine size={size} />;
    case 'admin':
      return <RiShieldUserLine size={size} />;
    case 'manager':
      return <RiBriefcaseLine size={size} />;
    case 'specialist':
      return <RiToolsLine size={size} />;
    case 'cashier':
    case 'kassir':
      return <RiMoneyDollarCircleLine size={size} />;
    default:
      return <RiShieldLine size={size} />;
  }
};

const cleanText = (text?: string): string => {
  if (!text) return '';
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '').trim();
};

export default function ProfilePage() {
  const { currentUser, currentRoleId, currentRole, roles, isDiyor, updateCurrentUserAvatar } = useAuth();

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Avatar customizer states
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ava-green-cap');
  const [selectedBg, setSelectedBg] = useState<string>('#d9f99d');
  const [customImageData, setCustomImageData] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Page interaction states
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data on mount / change
  useEffect(() => {
    if (currentUser) {
      const parts = (currentUser.name || '').trim().split(' ');
      setFirstName(currentUser.firstName || parts[0] || '');
      setLastName(currentUser.lastName || parts.slice(1).join(' ') || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setPassword(currentUser.password || '123456');

      if (currentUser.avatar) {
        if (currentUser.avatar.startsWith('data:image/svg+xml')) {
          const matched = AVATAR_PRESETS.find(p => p.renderSvg(p.defaultBg) === currentUser.avatar);
          if (matched) {
            setSelectedPresetId(matched.id);
            setSelectedBg(matched.defaultBg);
            setCustomImageData(null);
          } else {
            setCustomImageData(currentUser.avatar);
          }
        } else {
          setCustomImageData(currentUser.avatar);
        }
      } else {
        setSelectedPresetId('ava-green-cap');
        setSelectedBg('#d9f99d');
        setCustomImageData(null);
      }
    }
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Active preview image
  const currentPreview = customImageData
    ? customImageData
    : getDefaultAvatar(selectedPresetId, selectedBg);

  const activePresetObj = AVATAR_PRESETS.find(p => p.id === selectedPresetId) || AVATAR_PRESETS[0];

  const filteredPresets = AVATAR_PRESETS.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const handleSelectPreset = (id: string, defBg: string) => {
    setSelectedPresetId(id);
    setSelectedBg(defBg);
    setCustomImageData(null);
  };

  const handleSelectBg = (hex: string) => {
    setSelectedBg(hex);
    setCustomImageData(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, 256, 256);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setCustomImageData(compressed);
        }
      };
      img.src = loadEvt.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetAvatar = () => {
    setCustomImageData(null);
    setSelectedPresetId('ava-green-cap');
    setSelectedBg('#d9f99d');
    updateCurrentUserAvatar('');
    showToast("Avatar boshlang'ich holatga qaytarildi");
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const matchedRole = roles.find(r => r.id === currentRoleId);
    const staffId = currentUser?.id || 'st-loc-user';
    const avatarToSave = customImageData ? customImageData : currentPreview;

    try {
      // 1. Update Staff profile on server
      await api.updateStaff(staffId, {
        id: staffId,
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        role: currentRoleId,
        role_id: currentRoleId,
        roleTitle: matchedRole?.title || matchedRole?.name || (isDiyor ? 'Super Admin' : 'Kassir'),
        avatar: avatarToSave
      });

      // 2. Update Avatar through context (broadcasts & updates all components)
      await updateCurrentUserAvatar(avatarToSave);

      // 3. Update localStorage & context user
      const updatedUser = {
        ...(currentUser || {}),
        id: staffId,
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        role: currentRoleId,
        avatar: avatarToSave
      };
      localStorage.setItem('odim_user', JSON.stringify(updatedUser));

      showToast("✓ Profil ma'lumotlaringiz va yangi avataringiz saqlandi!");
    } catch {
      showToast("Xatolik: Ma'lumotlarni saqlashda uzilish yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = firstName
    ? `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
    : (currentUser?.name?.slice(0, 2).toUpperCase() || 'U');

  const displayName = `${firstName} ${lastName}`.trim() || currentUser?.name || 'Foydalanuvchi';

  return (
    <div className="profile-page-wrapper">
      {toastMsg && (
        <div className="profile-toast">
          <TbCheck size={18} color="#38bdf8" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP HERO CARD */}
      <div className="profile-hero-card">
        <div className="profile-hero-left">
          <div className="profile-hero-avatar-wrap">
            {currentPreview ? (
              <img src={currentPreview} alt={displayName} className="profile-hero-avatar-img" />
            ) : (
              initials
            )}
            <span className="profile-hero-online" title="Online" />
          </div>

          <div className="profile-hero-info">
            <h2>{displayName}</h2>
            <div className="profile-hero-meta">
              <span className="profile-role-badge">
                {getRoleIcon(currentRoleId, 13)}
                <span>{cleanText(currentRole?.badge || currentRole?.name || (isDiyor ? 'Super Admin' : 'Kassir'))}</span>
              </span>
              <span className="profile-phone-text">
                {phone || currentUser?.phone || 'Telefon kiritilmagan'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          <button
            type="button"
            className="profile-save-btn-top"
            disabled={isSaving}
            onClick={handleSaveAll}
          >
            <TbDeviceFloppy size={18} />
            <span>{isSaving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}</span>
          </button>
        </div>
      </div>

      {/* 2. TWO-COLUMN MAIN CONTENT */}
      <div className="profile-content-grid">
        {/* LEFT COLUMN: EMBEDDED AVATAR CUSTOMIZER */}
        <div className="profile-section-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <div className="profile-card-icon-wrap">
                <TbSparkles size={20} />
              </div>
              <div>
                <h3 className="profile-card-title">Rang-barang Avatarlar Galereyasi</h3>
                <p className="profile-card-subtitle">O'zingizga yoqqan rasmni yoki orqa fon rangini tanlang</p>
              </div>
            </div>
          </div>

          <div className="profile-avatar-customizer">
            {/* LIVE BANNER PREVIEW */}
            <div className="profile-avatar-preview-banner">
              <div className="profile-banner-avatar-circle">
                <img src={currentPreview} alt={displayName} />
              </div>

              <div className="profile-banner-info">
                {!customImageData ? (
                  <div>
                    <div className="profile-palette-title">
                      <TbPalette size={14} />
                      <span>Orqa fon rangini o'zgartirish:</span>
                    </div>
                    <div className="profile-palette-row">
                      {AVATAR_BG_COLORS.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className={`profile-palette-chip ${selectedBg === c.hex ? 'active' : ''}`}
                          style={{ backgroundColor: c.hex }}
                          onClick={() => handleSelectBg(c.hex)}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="profile-palette-title">
                    <TbSparkles size={14} />
                    <span>Maxsus rasm yuklangan</span>
                  </div>
                )}
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="profile-cat-tabs">
              <button
                type="button"
                className={`profile-cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Barchasi ({AVATAR_PRESETS.length})
              </button>
              <button
                type="button"
                className={`profile-cat-btn ${activeCategory === 'boys' ? 'active' : ''}`}
                onClick={() => setActiveCategory('boys')}
              >
                O'g'il bolalar
              </button>
              <button
                type="button"
                className={`profile-cat-btn ${activeCategory === 'girls' ? 'active' : ''}`}
                onClick={() => setActiveCategory('girls')}
              >
                Qizlar
              </button>
              <button
                type="button"
                className={`profile-cat-btn ${activeCategory === 'classic' ? 'active' : ''}`}
                onClick={() => setActiveCategory('classic')}
              >
                Klassik & Biznes
              </button>
              <button
                type="button"
                className={`profile-cat-btn ${activeCategory === 'creative' ? 'active' : ''}`}
                onClick={() => setActiveCategory('creative')}
              >
                Ijodiy
              </button>
            </div>

            {/* AVATAR PRESETS GRID */}
            <div className="profile-avatar-grid">
              {filteredPresets.map(p => {
                const isSelected = !customImageData && selectedPresetId === p.id;
                const previewSvg = p.renderSvg(isSelected ? selectedBg : p.defaultBg);

                return (
                  <div
                    key={p.id}
                    className={`profile-avatar-grid-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(p.id, p.defaultBg)}
                  >
                    <img src={previewSvg} alt="Avatar" className="profile-avatar-grid-img" />
                    {isSelected && (
                      <div className="profile-avatar-badge-check">
                        <TbCheck size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* UPLOAD & RESET BAR */}
            <div className="profile-upload-bar">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="profile-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <TbUpload size={16} />
                  <span>O'z rasmingizni yuklash</span>
                </button>
              </div>

              {currentUser?.avatar && (
                <button
                  type="button"
                  className="profile-reset-avatar-btn"
                  onClick={handleResetAvatar}
                  title="Avatarni o'chirish"
                >
                  <TbTrash size={15} />
                  <span>Avatarni o'chirish</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PERSONAL INFO & SECURITY */}
        <div className="profile-section-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <div className="profile-card-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                <TbUser size={20} />
              </div>
              <div>
                <h3 className="profile-card-title">Shaxsiy Ma'lumotlar</h3>
                <p className="profile-card-subtitle">Profil ma'lumotlari va xavfsizlik sozlamalari</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="profile-form-group">
              <label>Ismingiz</label>
              <div className="profile-input-wrap">
                <TbUser size={17} className="profile-input-icon" />
                <input
                  type="text"
                  className="profile-input with-icon"
                  placeholder="Ismingiz..."
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Familiyangiz</label>
              <div className="profile-input-wrap">
                <TbUser size={17} className="profile-input-icon" />
                <input
                  type="text"
                  className="profile-input with-icon"
                  placeholder="Familiyangiz..."
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Telefon raqamingiz</label>
              <div className="profile-input-wrap">
                <TbPhone size={17} className="profile-input-icon" />
                <input
                  type="text"
                  className="profile-input with-icon"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Email manzili</label>
              <div className="profile-input-wrap">
                <TbMail size={17} className="profile-input-icon" />
                <input
                  type="email"
                  className="profile-input with-icon"
                  placeholder="misol@odim.uz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Tizimdagi rolingiz</label>
              <div className="profile-input-wrap">
                <TbShieldCheck size={17} className="profile-input-icon" />
                <input
                  type="text"
                  className="profile-input with-icon"
                  value={cleanText(currentRole?.title || currentRole?.name || (isDiyor ? 'Super Admin' : 'Kassir'))}
                  disabled
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Parolingiz</label>
              <div className="profile-pwd-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="profile-pwd-input"
                  placeholder="Parol..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="profile-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Yashirish" : "Ko'rsatish"}
                >
                  {showPassword ? <TbEyeOff size={16} /> : <TbEye size={16} />}
                </button>
                <button
                  type="button"
                  className="profile-pwd-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(password);
                    showToast("Parol nusxalandi!");
                  }}
                  title="Nusxalash"
                >
                  <TbCopy size={16} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                className="profile-save-btn-top"
                disabled={isSaving}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <TbDeviceFloppy size={18} />
                <span>{isSaving ? "Saqlanmoqda..." : "Barcha ma'lumotlarni saqlash"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
