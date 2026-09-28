import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbMenu2, TbSearch, TbBell, TbChevronDown, TbSparkles, TbX } from 'react-icons/tb';
import {
  RiSunLine,
  RiMoonLine,
  RiShieldStarLine,
  RiShieldUserLine,
  RiBriefcaseLine,
  RiToolsLine,
  RiShieldLine,
  RiLogoutBoxRLine,
  RiUser3Line,
  RiMoneyDollarCircleLine
} from 'react-icons/ri';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './TopBar.css';

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

interface TopBarProps {
  title: string;
  breadcrumb?: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, breadcrumb, onMenuClick }: TopBarProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currentRoleId, currentRole, roles, switchRole, currentUser, logout, isDiyor } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const displayName = currentUser?.name || (isDiyor ? 'Diyor Karimov' : 'Foydalanuvchi');
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (isDiyor ? 'DK' : 'KS');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      console.log('Searching for:', searchValue);
    }
  };

  return (
    <header className="topbar">
      {/* Chap taraf: Sahifa ma'lumotlari va mobil menyu */}
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Menyuni ochish"
        >
          <TbMenu2 size={20} />
        </button>

        <div className="topbar-title-group">
          <h1 className="topbar-page-title">{title}</h1>
          {breadcrumb && (
            <span className="topbar-breadcrumb-text">{breadcrumb}</span>
          )}
        </div>
      </div>

      {/* O'ng taraf: Qidiruv, bildirishnoma, rejim va profil bir qatorda */}
      <div className="topbar-right-panel">
        {/* Global qidiruv shakli */}
        <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
          <TbSearch size={18} className="search-form-icon" />
          <input
            type="text"
            className="search-form-input"
            placeholder="Qidiruv..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label="Tizim bo'yicha qidiruv"
          />
          {searchValue && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchValue('')}
              aria-label="Qidiruvni tozalash"
            >
              <TbX size={14} />
            </button>
          )}
          <button type="submit" className="search-submit-action-btn">
            <TbSearch size={14} />
            <span>Izlash</span>
          </button>
        </form>

        {/* Harakatlar va tugmalar klasteri */}
        <div className="topbar-controls-cluster">
          {/* Bildirishnoma tugmasi */}
          <button
            type="button"
            className="control-circle-btn"
            aria-label="Bildirishnomalar"
            title="Bildirishnomalar"
          >
            <TbBell size={19} />
            <span className="notif-pulse-dot" />
          </button>

          {/* Bitta tugmali rejim almashtirgich */}
          <button
            type="button"
            className="control-circle-btn theme-single-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
            aria-label="Rejim almashtirish"
          >
            {theme === 'dark' ? (
              <RiSunLine size={20} className="theme-sun-icon" />
            ) : (
              <RiMoonLine size={19} className="theme-moon-icon" />
            )}
          </button>

          {/* Vertikal ajratgich */}
          <div className="controls-separator" />

          {/* Profil bloki va Rol almashtirgich */}
          <div style={{ position: 'relative' }}>
            <div
              className="topbar-user-profile"
              role="button"
              tabIndex={0}
              title="Profil menyusi"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            >
              <div className="user-avatar-badge" style={{ backgroundColor: '#191919', overflow: 'hidden', padding: 0 }}>
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{initials}</span>
                )}
                <span className="online-indicator-dot" />
              </div>
              <div className="user-details-text">
                <span className="user-display-name" style={{ fontWeight: 400 }}>{displayName}</span>
                <span className="user-role-tag" style={{ color: '#64748b', fontWeight: 400, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {getRoleIcon(currentRoleId, 11)}
                  <span>{cleanText(currentRole?.badge || currentRole?.name || (isDiyor ? 'Super Admin' : 'Kassir'))}</span>
                </span>
              </div>
              <TbChevronDown size={14} className="user-dropdown-arrow" />
            </div>

            {isRoleDropdownOpen && (
              <div className="topbar-profile-dropdown-menu">
                {/* PROFIL KARTASI HEADER */}
                <div className="tpdm-user-header">
                  <div className="tpdm-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="tpdm-user-info">
                    <div className="tpdm-name">{displayName}</div>
                    <div className="tpdm-phone">{currentUser?.phone || ''}</div>
                  </div>
                </div>

                {/* MENING PROFILIM TUGMASI */}
                <button
                  type="button"
                  className="tpdm-profile-btn"
                  onClick={() => {
                    navigate('/profile');
                    setIsRoleDropdownOpen(false);
                  }}
                >
                  <RiUser3Line size={16} />
                  <span>Mening Profilim</span>
                </button>

                {/* AVATARNI O'ZGARTIRISH TUGMASI */}
                <button
                  type="button"
                  className="tpdm-profile-btn"
                  onClick={() => {
                    navigate('/profile');
                    setIsRoleDropdownOpen(false);
                  }}
                  style={{ marginTop: '3px' }}
                >
                  <TbSparkles size={16} color="#0284c7" />
                  <span>Avatarni o'zgartirish</span>
                </button>

                {/* Faol Rolni Tanlang (RBAC) - Strictly ONLY visible for Diyor Karimov */}
                {isDiyor && (
                  <>
                    <div className="tpdm-divider" />
                    <div className="tpdm-section-title">
                      Faol Rolni Tanlang (RBAC)
                    </div>

                    {roles.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          switchRole(r.id);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`tpdm-role-item ${currentRoleId === r.id ? 'active' : ''}`}
                      >
                        <span className="tpdm-role-left">
                          {getRoleIcon(r.id, 14)}
                          <span>{cleanText(r.badge || r.name)}</span>
                        </span>
                        {currentRoleId === r.id && <span className="tpdm-check">✓</span>}
                      </button>
                    ))}
                  </>
                )}

                <div className="tpdm-divider" />

                <button
                  className="tpdm-logout-btn"
                  onClick={() => {
                    logout();
                    setIsRoleDropdownOpen(false);
                  }}
                >
                  <RiLogoutBoxRLine size={15} />
                  <span>Tizimdan chiqish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
