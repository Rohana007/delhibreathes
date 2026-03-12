import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LayoutDashboard, FileText, Map, Factory, ArrowLeft, User, LogOut, BarChart3, Beaker, Settings,
} from 'lucide-react';

const sidebarVariants = {
  hidden: { x: '-100%' },
  visible: { x: '0%', transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

export default function PolicyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear policy access and user auth
    localStorage.removeItem('policyAccess');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Redirect to start page
    navigate('/start');
    window.location.reload();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/policy-dashboard' },
    { name: 'Policy Simulator', icon: Beaker, path: '/policy-dashboard/simulator' },
    { name: 'Reports', icon: FileText, path: '/policy-dashboard/reports' },
    { name: 'Analytics', icon: BarChart3, path: '/policy-dashboard/analytics' },
    { name: 'Hotspots', icon: Map, path: '/policy-dashboard/hotspots' },
    { name: 'Source Contribution', icon: Factory, path: '/policy-dashboard/source-contribution' },
    { name: 'Profile', icon: Settings, path: '/policy-dashboard/profile' },
  ];

  const bgColor = '#FFFFFF';
  const borderColor = '#E2E8F0';
  const textColor = '#0F172A';
  const hoverBg = '#F1F5F9';
  
  // Check if we're on the reports page
  const isReportsPage = location.pathname === '/policy-dashboard/reports';

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Sidebar - Desktop */}
      <motion.aside
        className="w-64 shadow-lg hidden md:flex flex-col p-4 border-r transition-colors"
        style={{ 
          backgroundColor: bgColor,
          borderColor: borderColor
        }}
        initial={{ x: '-100%' }}
        animate={{ x: '0%' }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F1F5F9' }}>
            <Factory className="w-5 h-5" style={{ color: '#15803D' }} />
          </div>
          <h2 className="text-xl font-display font-bold" style={{ color: '#15803D' }}>
            Policy Dashboard
          </h2>
        </div>
        <nav className="flex-1">
          <ul>
            {navItems.map((item) => {
              // Show all items including Reports and Analytics
              const isActive = location.pathname === item.path || 
                (item.path === '/policy-dashboard' && location.pathname === '/policy-dashboard') ||
                (item.path === '/policy-dashboard/simulator' && location.pathname.startsWith('/policy-dashboard/simulator'));
              return (
                <li key={item.name} className="mb-2">
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                      color: isActive ? '#15803D' : '#475569',
                    }}
                    onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = hoverBg)}
                    onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 p-3 rounded-lg transition-colors"
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #DC2626',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
              e.currentTarget.style.borderColor = '#B91C1C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FEF2F2';
              e.currentTarget.style.borderColor = '#DC2626';
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Mobile & Desktop */}
        <header 
          className="shadow-md p-4 flex items-center justify-between md:justify-end border-b transition-colors"
          style={{ 
            backgroundColor: bgColor,
            borderColor: borderColor
          }}
        >
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: textColor }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-display font-bold md:hidden" style={{ color: '#15803D' }}>
            Policy Dashboard
          </h1>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border"
              style={{
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                borderColor: '#DC2626',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEE2E2';
                e.currentTarget.style.borderColor = '#B91C1C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
                e.currentTarget.style.borderColor = '#DC2626';
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          >
            <motion.aside
              className="w-64 h-full flex flex-col p-4 shadow-lg transition-colors"
              style={{ backgroundColor: bgColor }}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={sidebarVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F1F5F9' }}>
                    <Factory className="w-5 h-5" style={{ color: '#15803D' }} />
                  </div>
                  <h2 className="text-xl font-display font-bold" style={{ color: '#15803D' }}>
                    Policy Dashboard
                  </h2>
                </div>
                <button
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: textColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBg}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1">
                <ul>
                  {navItems.map((item) => {
                    // Show all items including Reports and Analytics
                    const isActive = location.pathname === item.path || 
                      (item.path === '/policy-dashboard' && location.pathname === '/policy-dashboard') ||
                      (item.path === '/policy-dashboard/simulator' && location.pathname.startsWith('/policy-dashboard/simulator'));
                    return (
                      <li key={item.name} className="mb-2">
                        <Link
                          to={item.path}
                          className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                          style={{
                            backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                            color: isActive ? '#15803D' : '#475569',
                          }}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-3 p-3 rounded-lg transition-colors border"
                  style={{
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    borderColor: '#DC2626',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEE2E2';
                    e.currentTarget.style.borderColor = '#B91C1C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                    e.currentTarget.style.borderColor = '#DC2626';
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

