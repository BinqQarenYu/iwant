import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Home, ShoppingBag, Package, User } from 'lucide-react';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, user } = useApp();

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/pabili', icon: ShoppingBag, label: t('pabili'), requiresAuth: true },
    { path: '/orders', icon: Package, label: t('orders'), requiresAuth: true },
    { path: '/profile', icon: User, label: t('profile'), requiresAuth: true },
  ];

  const handleNavClick = (item) => {
    if (item.requiresAuth && !user) {
      navigate('/auth', { state: { from: { pathname: item.path } } });
    } else {
      navigate(item.path);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={`bottom-nav-item ${active ? 'active' : ''}`}
              data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
            >
              <IconComponent className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
