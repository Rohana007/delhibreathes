import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Map, Download, LogOut, Menu, X, Shield, 
  LayoutDashboard, ChevronRight, Factory
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const admin = JSON.parse(localStorage.getItem('admin') || '{}');

  const handleLogout = () => {
    // Keep adminToken so user can access policy dashboard without re-login
    // Only clear admin-specific session data
    sessionStorage.removeItem('adminAccessVerified');
    // Clear access code attempts and lockout
    localStorage.removeItem('adminAccessAttempts');
    localStorage.removeItem('adminAccessLockout');
    // Redirect to policy dashboard (adminToken is preserved)
    window.location.href = '/policy-dashboard';
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
    { path: '/admin/map', label: 'Map & Heatmap', icon: Map },
    { path: '/admin/source-contribution', label: 'Source Contribution', icon: Factory },
    { path: '/admin/export', label: 'Export Data', icon: Download },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
        style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(37, 99, 235, 0.08)' }}>
                <Shield className="w-5 h-5" style={{ color: '#2563EB' }} />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold" style={{ color: '#0F172A' }}>
                  Admin Panel
                </h2>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  Delhi Breathes
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active ? 'chip active' : 'btn-ghost'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                )}
                {sidebarOpen && active && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer - Admin Info & Logout */}
        <div className="p-4 border-t" style={{ borderColor: '#E2E8F0' }}>
          {sidebarOpen && (
            <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#0F172A' }}>
                {admin.name || 'Admin'}
              </p>
              <p className="text-xs" style={{ color: '#64748B' }}>
                {admin.email || 'admin@delhibreathes.com'}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg btn-ghost text-left"
            style={{ color: '#DC2626' }}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg glass-card"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="absolute left-0 top-0 bottom-0 w-64 bg-white"
            style={{ borderRight: '1px solid #E2E8F0' }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" style={{ color: '#2563EB' }} />
                <h2 className="text-lg font-display font-bold" style={{ color: '#0F172A' }}>
                  Admin Panel
                </h2>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" style={{ color: '#64748B' }} />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active ? 'chip active' : 'btn-ghost'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: '#E2E8F0' }}>
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#0F172A' }}>
                  {admin.name || 'Admin'}
                </p>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  {admin.email || 'admin@delhibreathes.com'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg btn-ghost"
                style={{ color: '#DC2626' }}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="p-4 border-b glass-card" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold" style={{ color: '#0F172A' }}>
                {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-sm" style={{ color: '#64748B' }}>
                {admin.email || 'admin@delhibreathes.com'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

