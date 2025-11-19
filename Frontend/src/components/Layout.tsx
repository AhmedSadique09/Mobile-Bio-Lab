import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  LayoutDashboard, 
  Beaker, 
  Calendar, 
  FileText, 
  LogOut,
  Bell,
  Menu,
  Users,
  Activity,
  Settings,
  Bluetooth,
  BarChart3
} from 'lucide-react';
import { type User, type Notification } from '../types';
import { getNotifications, markNotificationAsRead } from '../lib/storage';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface LayoutProps {
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function Layout({ user, currentPage, onNavigate, onLogout, children }: LayoutProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    const userNotifications = allNotifications.filter(n => n.userId === user.id);
    setNotifications(userNotifications);
    setUnreadCount(userNotifications.filter(n => !n.read).length);
  };

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const menuItems = user.role === 'admin' ? [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'admin-users', label: 'User Management', icon: Users },
    { id: 'samples', label: 'Samples', icon: Beaker },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'protocols', label: 'Protocols', icon: FileText },
    { id: 'admin-visualization', label: 'System Analytics', icon: BarChart3 },
    { id: 'admin-logs', label: 'Activity Logs', icon: Activity },
    { id: 'profile', label: 'Settings', icon: Settings }
  ] : [
    { id: 'samples', label: 'Samples', icon: Beaker },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'protocols', label: 'Protocols', icon: FileText },
    { id: 'ble-devices', label: 'BLE Devices', icon: Bluetooth },
    { id: 'user-visualization', label: 'Data Visualization', icon: BarChart3 },
    { id: 'profile', label: 'Settings', icon: Settings }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sample': return <Beaker className="h-4 w-4" />;
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'report': return <FileText className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img src="/logo.png" alt="Mobile Bio Lab" className="h-6 w-6" />
                    Mobile Bio Lab
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-1">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={currentPage === item.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Mobile Bio Lab" className="h-7 w-7" />
              <h1 className="text-xl">Mobile Bio Lab</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h3 className="text-sm">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">No notifications</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg cursor-pointer border ${
                            notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                          }`}
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div className="flex gap-2">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.firstName}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="space-y-3">
                  <div className="border-b pb-3">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                    <Badge 
                      className="mt-2" 
                      style={{
                        backgroundColor: user.role === 'student' ? '#3b82f6' : 
                                       user.role === 'researcher' ? '#10b981' : 
                                       user.role === 'technician' ? '#f59e0b' : 
                                       '#6b7280',
                        color: 'white'
                      }}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
