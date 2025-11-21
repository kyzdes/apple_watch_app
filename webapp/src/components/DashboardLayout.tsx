import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Send, Clock, Settings, Menu, X, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';

export default function DashboardLayout() {
  const { user, isMobileMenuOpen, setMobileMenuOpen, isConnected, unreadCount } = useStore();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Friends', to: '/friends', icon: Users },
    { name: 'Send', to: '/send', icon: Send },
    { name: 'History', to: '/history', icon: Clock, badge: unreadCount },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Haptic Friends</h1>
              <p className="text-xs text-gray-500">{user?.username}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="px-2 py-2 space-y-1 bg-white border-t">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={isActive ? 'text-blue-600' : ''} />
                    <span className="font-medium">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r">
        <div className="flex-1 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Haptic Friends</h1>
                <p className="text-sm text-gray-500">{user?.username}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} />
                    <span className="font-medium flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isActive ? "bg-white/20" : "bg-blue-600 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Connection Status */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi size={16} className="text-green-600" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-red-600" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
