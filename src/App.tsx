import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ChatInbox from './components/ChatInbox';
import VideoCallRoom from './components/VideoCallRoom';
import CallCenter from './components/CallCenter';
import Clients from './components/Clients';
import CalendarView from './components/CalendarView';
import TasksView from './components/TasksView';
import CatalogView from './components/CatalogView';
import DocumentGenerator from './components/DocumentGenerator';
import AnalyticsView from './components/AnalyticsView';
import StaffView from './components/StaffView';
import RolesView from './components/RolesView';
import SystemConstructor from './components/SystemConstructor';
import StaffChat from './components/StaffChat';
import ProfilePage from './components/ProfilePage';
import KanbanSlaSettings from './components/KanbanSlaSettings';
import SuperAdminAuditPage from './components/SuperAdminAuditPage';
import IntegrationsView from './components/IntegrationsView';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationListener from './components/NotificationListener';
import { useAuth } from './context/AuthContext';
import './App.css';

const EmptyPage = () => null;

function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';
  const isCallPage = location.pathname.startsWith('/call/');

  if (isLoginPage) {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  if (!isAuthenticated && !isCallPage) {
    return <Navigate to="/login" replace />;
  }

  if (isCallPage) {
    return <>{children}</>;
  }


  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
      case '/deals': return { title: 'Bitimlar', breadcrumb: 'Pages / Savdo / Bitimlar' };
      case '/call-center': return { title: 'Call Center', breadcrumb: 'Pages / Aloqa / Call Center' };
      case '/chat/inbox': return { title: 'Yagona Inbox', breadcrumb: 'Pages / Aloqa / Yagona Inbox' };
      case '/chat/staff': return { title: 'Foydalanuvchilar Chati', breadcrumb: 'Pages / Aloqa / Foydalanuvchilar Chati' };
      case '/calendar': return { title: 'Kalendar', breadcrumb: 'Pages / Ish rejasi / Kalendar' };
      case '/tasks': return { title: 'Vazifalar', breadcrumb: 'Pages / Ish rejasi / Vazifalar' };
      case '/catalog': return { title: 'Katalog', breadcrumb: 'Pages / Ombor / Katalog' };
      case '/document-generator': return { title: 'Hujjatlar generatori', breadcrumb: 'Pages / Ombor / Hujjatlar generatori' };
      case '/chat/dashboard': return { title: 'Chat Dashboard', breadcrumb: 'Pages / Chat / Dashboard' };
      case '/chat2': return { title: 'Chat 2', breadcrumb: 'Pages / Chat 2' };
      case '/clients': return { title: 'Mijozlar bazasi', breadcrumb: 'Pages / Savdo / Mijozlar bazasi' };
      case '/clients2': return { title: 'Mijozlar 2', breadcrumb: 'Pages / Mijozlar 2' };
      case '/settings': return { title: 'Sozlamalar', breadcrumb: 'Pages / Sozlamalar' };
      case '/settings/roles': return { title: 'Rollar va Ruxsatlar (RBAC)', breadcrumb: 'Pages / Sozlamalar / Rollar va Ruxsatlar' };
      case '/settings/analytics': return { title: 'Analitika', breadcrumb: 'Pages / Sozlamalar / Analitika' };
      case '/settings/staff': return { title: 'Xodimlar', breadcrumb: 'Pages / Sozlamalar / Xodimlar' };
      case '/settings/system-constructor': return { title: 'Tizim konstruktori', breadcrumb: 'Pages / Sozlamalar / Tizim konstruktori' };
      case '/settings/kanban-sla': return { title: 'Kanban vaqtlari va SLA', breadcrumb: 'Pages / Sozlamalar / Kanban vaqtlari (SLA)' };
      case '/settings/integrations': return { title: 'Ijtimoiy Tarmoqlar Integratsiyasi', breadcrumb: 'Pages / Sozlamalar / Integratsiyalar' };
      case '/settings/audit': return { title: 'Xodimlar Auditi va Sotuv Vaqtlari', breadcrumb: 'Pages / Sozlamalar / Xodimlar Auditi' };
      case '/profile': return { title: 'Mening Profilim', breadcrumb: 'Pages / Profil / Mening Profilim' };
      case '/help': return { title: 'Yordam', breadcrumb: 'Pages / Yordam' };
      default: return { title: 'Page Not Found', breadcrumb: 'Pages / 404' };
    }
  };

  const info = getPageInfo();

  return (
    <div className="app-layout">
      <NotificationListener />
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

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/deals" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login defaultMode="register" />} />
              <Route path="/chat/inbox" element={<ChatInbox />} />
              <Route path="/chat/staff" element={<StaffChat />} />
              <Route path="/call-center" element={<CallCenter />} />
              <Route path="/call/:id" element={<VideoCallRoom />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/tasks" element={<TasksView />} />
              <Route path="/catalog" element={<CatalogView />} />
              <Route path="/document-generator" element={<DocumentGenerator />} />
              <Route path="/settings" element={<AnalyticsView />} />
              <Route path="/settings/roles" element={<SuperAdminRoute><RolesView /></SuperAdminRoute>} />
              <Route path="/settings/analytics" element={<AnalyticsView />} />
              <Route path="/settings/staff" element={<SuperAdminRoute><ErrorBoundary fallbackTitle="Xodimlar bo'limida xatolik yuz berdi"><StaffView /></ErrorBoundary></SuperAdminRoute>} />
              <Route path="/settings/system-constructor" element={<SuperAdminRoute><SystemConstructor /></SuperAdminRoute>} />
              <Route path="/settings/kanban-sla" element={<KanbanSlaSettings />} />
              <Route path="/settings/integrations" element={<IntegrationsView />} />
              <Route path="/settings/audit" element={<SuperAdminRoute><SuperAdminAuditPage /></SuperAdminRoute>} />
              <Route path="/chat/dashboard" element={<ChatInbox />} />
              <Route path="/chat2" element={<ChatInbox />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients2" element={<Clients />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/help" element={<SystemConstructor />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;












