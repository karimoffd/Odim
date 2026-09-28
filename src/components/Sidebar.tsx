import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../colors';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';
import logoImg from '../assets/logo.svg';
import {
  RiPhoneLine,
  RiShoppingBag3Line,
  RiCalendarCheckLine,
  RiBox3Line,
  RiSettings4Line,
  RiQuestionLine,
  RiLogoutBoxRLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiArrowLeftSLine,
  RiUser3Line,
} from 'react-icons/ri';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  permKey?: string;
  submenu?: { label: string; path: string; permKey?: string }[];
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const rawMenuSections: MenuSection[] = [
  {
    items: [
      {
        label: 'Aloqa',
        icon: <RiPhoneLine size={21} />,
        submenu: [
          { label: 'Yagona inbox', path: '/chat/inbox', permKey: 'chat' },
          { label: 'Foydalanuvchilar chati', path: '/chat/staff', permKey: 'chat' },
          { label: 'Call center', path: '/call-center', permKey: 'call_center' },
          { label: 'Integratsiyalar (TG, Insta, FB)', path: '/settings/integrations', permKey: 'chat' },
        ],
      },
      {
        label: 'Savdo',
        icon: <RiShoppingBag3Line size={21} />,
        submenu: [
          { label: 'Bitimlar', path: '/', permKey: 'deals' },
          { label: 'Mijozlar bazasi', path: '/clients', permKey: 'clients' },
        ],
      },
      {
        label: 'Ish rejasi',
        icon: <RiCalendarCheckLine size={21} />,
        submenu: [
          { label: 'Kalendar', path: '/calendar', permKey: 'calendar' },
          { label: 'Vazifalar', path: '/tasks', permKey: 'tasks' },
        ],
      },
      {
        label: 'Ombor',
        icon: <RiBox3Line size={21} />,
        submenu: [
          { label: 'Katalog', path: '/catalog', permKey: 'catalog' },
          { label: 'Hujjatlar generatori', path: '/document-generator', permKey: 'catalog' },
        ],
      },
      {
        label: 'Sozlamalar',
        icon: <RiSettings4Line size={21} />,
        submenu: [
          { label: 'Rollar va Ruxsatlar', path: '/settings/roles', permKey: 'roles' },
          { label: 'Xodimlar', path: '/settings/staff', permKey: 'staff' },
          { label: 'Integratsiyalar (TG, Insta, FB)', path: '/settings/integrations', permKey: 'constructor' },
          { label: 'Analitika', path: '/settings/analytics', permKey: 'analytics' },
          { label: 'Tizim konstruktori', path: '/settings/system-constructor', permKey: 'constructor' },
          { label: 'Kanban vaqtlari (SLA)', path: '/settings/kanban-sla', permKey: 'deals' },
          { label: 'Xodimlar Auditi & Sotuv Vaqtlari', path: '/settings/audit', permKey: 'roles' },
        ],
      },
    ],
  },
];

const bottomItems = [
  { label: 'Mening Profilim', icon: <RiUser3Line size={21} />, path: '/profile' },
  { label: 'Yordam', icon: <RiQuestionLine size={21} />, path: '/help' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, isSuperAdmin } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Aloqa-0': true,
    'Savdo-0': true,
    'Ish rejasi-0': true,
    'Ombor-0': true,
    'Sozlamalar-0': true,
  });
  const [collapsed, setCollapsed] = useState(false);

  // Filter items dynamically according to active role's permissions
  const menuSections = rawMenuSections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item.submenu) {
        const allowedSubmenu = item.submenu.filter(sub => {
          if (!isSuperAdmin && (sub.path.includes('/settings/roles') || sub.path.includes('/settings/staff') || sub.path.includes('/settings/system-constructor'))) {
            return false;
          }
          return !sub.permKey || hasPermission(sub.permKey, 'view');
        });
        return { ...item, submenu: allowedSubmenu };
      }
      return item;
    }).filter(item => {
      if (item.submenu) return item.submenu.length > 0;
      return !item.permKey || hasPermission(item.permKey, 'view');
    })
  }));

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigate = (path?: string) => {
    if (path) {
      if (setMobileOpen) setMobileOpen(false);
      navigate(path);
    }
  };

  return (
    <aside
      className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: collapsed ? colors.sidebarCollapsedWidth : colors.sidebarWidth,
      }}
    >

      <div className={`sidebar-header ${collapsed ? 'collapsed' : ''}`}>
        <div className="logo-container">
          <img
            src={logoImg}
            alt="Odim"
            className={`logo-img ${collapsed ? 'collapsed-logo' : ''}`}
          />
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`toggle-btn ${collapsed ? 'collapsed' : ''}`}
          aria-label="Toggle sidebar"
        >
          <RiArrowLeftSLine size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="menu-section">
            {section.items.map((item, iIdx) => {
              const menuKey = `${item.label}-${sIdx}`;
              const isOpen = openMenus[menuKey] ?? false;
              const hasSubmenu = !!item.submenu;

              const isSubmenuActive = hasSubmenu && item.submenu?.some(sub => location.pathname === sub.path);
              const isActive = location.pathname === item.path || isSubmenuActive;
              const showSubmenu = hasSubmenu && (isOpen || (collapsed && isSubmenuActive));

              return (
                <div key={iIdx}>
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        toggleMenu(menuKey);
                      } else {
                        handleNavigate(item.path);
                      }
                    }}
                    className={`menu-item ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
                  >
                    <span className="menu-item-icon">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="menu-item-text">{item.label}</span>
                        {hasSubmenu && (
                          <span className="submenu-toggle-icon">
                            {isOpen ? (
                              <RiArrowUpSLine size={18} />
                            ) : (
                              <RiArrowDownSLine size={18} />
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </button>

                  {showSubmenu && (
                    <div className={`submenu ${collapsed ? 'collapsed' : ''}`}>
                      {item.submenu!.map((sub, subIdx) => (
                        <button
                          key={subIdx}
                          onClick={() => handleNavigate(sub.path)}
                          className={`submenu-item ${location.pathname === sub.path ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
                          title={collapsed ? sub.label : undefined}
                        >
                          {!collapsed ? sub.label : sub.label.slice(0, 2)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={`sidebar-footer-container ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-footer">
          {bottomItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigate(item.path)}
              className={`footer-item ${location.pathname === item.path ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
            >
              <span className="menu-item-icon">{item.icon}</span>
              {!collapsed && <span className='menu-item-text'>{item.label}</span>}
            </button>
          ))}
          {collapsed && (
            <button className="footer-item collapsed" onClick={() => navigate('/login')}>
              <span className="menu-item-icon">
                <RiLogoutBoxRLine size={21} />
              </span>
            </button>
          )}
        </div>
        {!collapsed && (
          <button className="exit-item" onClick={() => navigate('/login')}>
            <span className="menu-item-icon">
              <RiLogoutBoxRLine size={21} />
            </span>
            <span>Chiqish</span>
          </button>
        )}
      </div>
    </aside>
  );
}
