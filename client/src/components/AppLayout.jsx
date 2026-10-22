import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Scale, LayoutDashboard, Upload, Library, GitCompare, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { to: '/upload', icon: <Upload className="h-5 w-5" />, label: 'Upload' },
    { to: '/library', icon: <Library className="h-5 w-5" />, label: 'My Documents' },
    { to: '/compare', icon: <GitCompare className="h-5 w-5" />, label: 'Compare' },
    { to: '/profile', icon: <User className="h-5 w-5" />, label: 'Profile' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', icon: <ShieldCheck className="h-5 w-5" />, label: 'Admin' });
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700 flex items-center gap-2">
        <Scale className="h-6 w-6 text-blue-400" />
        <span className="text-lg font-bold">LexiClear</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === to || location.pathname.startsWith(to + '/')
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}>
            {icon} {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-3 truncate">{user?.name}</div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
};

const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <main className="flex-1 overflow-auto">{children}</main>
  </div>
);

export default AppLayout;
