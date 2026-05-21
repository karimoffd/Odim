import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors } from '../colors';
import './Sidebar.css';
import logoImg from '../assets/logo.svg';
import {
  HiOutlineHome,
  HiOutlineChatAlt2,
  HiOutlineChat,
  HiOutlineMail,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlineInformationCircle,
  HiOutlineLogout,
  HiChevronDown,
  HiChevronUp,
  HiChevronLeft,
} from 'react-icons/hi';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: { label: string; icon: React.ReactNode; path: string }[];
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: <HiOutlineHome size={22} />, path: '/' },
      {
        label: 'Chat',
        icon: <HiOutlineChatAlt2 size={22} />,
        submenu: [
          { label: 'Inbox', icon: <HiOutlineMail size={20} />, path: '/chat/inbox' },
          { label: 'Dashboard', icon: <HiOutlineChat size={20} />, path: '/chat/dashboard' },
        ],
      },
      { label: 'Mijozlar', icon: <HiOutlineUserGroup size={22} />, path: '/clients' },
    ],
  },
  {
    items: [
      { label: 'Chat', icon: <HiOutlineChatAlt2 size={22} />, path: '/chat2' },
      { label: 'Mijozlar', icon: <HiOutlineUserGroup size={22} />, path: '/clients2' },
    ],
  },
];

const bottomItems = [
  { label: 'Sozlamalar', icon: <HiOutlineCog size={22} />, path: '/settings' },
  { label: 'Yordam', icon: <HiOutlineInformationCircle size={22} />, path: '/help' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Chat-0': true,
  });
  const [collapsed, setCollapsed] = useState(false);

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
          <HiChevronLeft size={16} />
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
                              <HiChevronUp size={16} />
                            ) : (
                              <HiChevronDown size={16} />
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
                        >
                          <span className="menu-item-icon">
                            {sub.icon}
                          </span>
                          {!collapsed && sub.label}
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
                <HiOutlineLogout size={22} />
              </span>
            </button>
          )}
        </div>
        {!collapsed && (
          <button className="exit-item" onClick={() => navigate('/login')}>
            <span className="menu-item-icon">
              <HiOutlineLogout size={22} />
            </span>
            <span>Chiqish</span>
          </button>
        )}
      </div>
    </aside>
  );
}
