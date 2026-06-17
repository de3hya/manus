import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  BarChart3,
  Wallet,
  TrendingUp,
  Package,
  Truck,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/transactions', label: 'Transactions', icon: Wallet },
    { path: '/budgets', label: 'Budgets', icon: TrendingUp },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/stock-movements', label: 'Stock Movements', icon: Truck },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <aside
        className={`glass fixed left-0 top-0 h-full transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } z-40`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'hidden'}`}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-lavender flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">AcctInv</span>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === path
                    ? 'bg-gradient-to-r from-cyan-500/20 to-lavender/20 text-cyan-300'
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            {sidebarOpen && (
              <div className="px-4 py-3 rounded-lg bg-white/5">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={20} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="h-full overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
