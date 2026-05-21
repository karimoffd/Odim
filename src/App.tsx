import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ChatInbox from './components/ChatInbox';
import VideoCallRoom from './components/VideoCallRoom';
import './App.css';

const EmptyPage = () => null;

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = location.pathname === '/login';
  const isCallPage = location.pathname.startsWith('/call/');

  if (isLoginPage || isCallPage) {
    return <>{children}</>;
  }

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/': return { title: 'Main Dashboard', breadcrumb: 'Pages / Dashboard' };
      case '/chat/inbox': return { title: 'Inbox', breadcrumb: 'Pages / Chat / Inbox' };
      case '/chat/dashboard': return { title: 'Chat Dashboard', breadcrumb: 'Pages / Chat / Dashboard' };
      case '/chat2': return { title: 'Chat 2', breadcrumb: 'Pages / Chat 2' };
      case '/clients': return { title: 'Mijozlar', breadcrumb: 'Pages / Mijozlar' };
      case '/clients2': return { title: 'Mijozlar 2', breadcrumb: 'Pages / Mijozlar 2' };
      case '/settings': return { title: 'Sozlamalar', breadcrumb: 'Pages / Sozlamalar' };
      case '/help': return { title: 'Yordam', breadcrumb: 'Pages / Yordam' };
      default: return { title: 'Page Not Found', breadcrumb: 'Pages / 404' };
    }
  };

  const info = getPageInfo();

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <main className="main-content">
        <TopBar
          title={info.title}
          breadcrumb={info.breadcrumb}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        {children}
      </main>
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat/inbox" element={<ChatInbox />} />
          <Route path="/call/:id" element={<VideoCallRoom />} />
          <Route path="/chat/dashboard" element={<EmptyPage />} />
          <Route path="/chat2" element={<EmptyPage />} />
          <Route path="/clients" element={<EmptyPage />} />
          <Route path="/clients2" element={<EmptyPage />} />
          <Route path="/settings" element={<EmptyPage />} />
          <Route path="/help" element={<EmptyPage />} />
          <Route path="*" element={<EmptyPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;












