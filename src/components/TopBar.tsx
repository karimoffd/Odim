import { HiOutlineMenu } from 'react-icons/hi';
import { colors } from '../colors';
import './TopBar.css';
import notificationIcon from '../assets/notifacation.svg';
import moonIcon from '../assets/moon.svg';
import infoIcon from '../assets/info.svg';
import userIcon from '../assets/user.svg';
import searchIcon from '../assets/search.svg';

interface TopBarProps {
  title: string;
  breadcrumb: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, breadcrumb, onMenuClick }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="mobile-menu-btn"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <HiOutlineMenu size={24} />
          </button>
          <div>
            <h1>{title}</h1>
            <p>{breadcrumb}</p>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="search-container">
          <img src={searchIcon} alt="" width={11} height={11} />
          <input
            type="text"
            placeholder="Izlash"
            className="search-input"
          />
        </div>
        <button className="icon-btn" aria-label="Notifications">
          <img src={notificationIcon} alt="" width={18} height={18} />
        </button>
        <button className="icon-btn" aria-label="Dark mode">
          <img src={moonIcon} alt="" width={18} height={18} />
        </button>
        <button className="icon-btn" aria-label="Information">
          <img src={infoIcon} alt="" width={24} height={24} />
        </button>
        <button className="avatar-btn" aria-label="User profile">
          <img src={userIcon} alt="" width={16} height={18} />
        </button>
      </div>
    </header>
  );
}
















































































