import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Terminal, 
  Users, 
  ShoppingBag, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Key,
  Database
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const SimHUD = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastOtp, setLastOtp] = useState(null);
  const { API, user, setUser } = useApp();
  const navigate = useNavigate();

  const roles = [
    { id: 'customer', label: 'Client', icon: ShoppingBag, path: '/' },
    { id: 'restaurant_owner', label: 'Merchant', icon: Database, path: '/restaurant/dashboard' },
    { id: 'driver', label: 'Rider', icon: Zap, path: '/driver/dashboard' },
    { id: 'admin', label: 'Ops Center', icon: Terminal, path: '/admin/dashboard' }
  ];

  const switchRole = (roleId, path) => {
    // Simulate role switch by updating context
    const mockUser = {
      id: "sim-user-" + roleId,
      name: "Demo " + roleId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      role: roleId,
      phone: "09170000000"
    };
    
    setUser(mockUser);
    localStorage.setItem('kaintayo_user', JSON.stringify(mockUser));
    localStorage.setItem('kaintayo_token', 'demo-token');
    
    toast.success(`Switched to ${roleId} view`);
    navigate(path);
  };

  const generateOrder = async () => {
    try {
      toast.promise(axios.post(`${API}/simulate/order`), {
        loading: 'Injecting random order...',
        success: (res) => {
          return `Injecting order from ${res.data.customer_name} into system!`;
        },
        error: 'Failed to inject order'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMagicOtp = async () => {
    try {
      const phone = "09170000000"; // Default demo phone
      const res = await axios.get(`${API}/auth/last-otp/${phone}`);
      setLastOtp(res.data.otp);
      toast.info(`Magic OTP: ${res.data.otp}`, {
        description: 'Auto-fill simulated'
      });
    } catch (err) {
      setLastOtp("123456");
    }
  };

  if (process.env.NODE_ENV !== 'development' && !window.location.search.includes('demo=true')) {
    // Hidden in production unless demo param present
    if (!window.location.search.includes('demo=true')) return null;
  }

  return (
    <div className={`fixed top-24 right-0 z-[9999] transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-40px)]'}`}>
      <div className="flex">
        {/* Toggle Handle */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10 bg-[#1A1A1A] border-y border-l border-[#FF6B00]/30 rounded-l-xl flex items-center justify-center text-[#FF6B00] shadow-xl hover:bg-[#252525]"
        >
          {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* HUD Content */}
        <div className="bg-[#1A1A1A] border border-[#FF6B00]/30 rounded-l-none rounded-r-none p-4 w-64 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4 text-[#FF6B00]">
            <Zap size={16} fill="#FF6B00" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Likha Tech Simulation v1.0</span>
          </div>

          <div className="space-y-4">
            {/* Role Swapper */}
            <div>
              <label className="text-[9px] text-white/40 uppercase tracking-tighter mb-2 block">Quick Switch Roles</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => switchRole(r.id, r.path)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] transition-all ${
                      user?.role === r.id 
                      ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00]' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <r.icon size={14} className="mb-1" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sim Actions */}
            <div>
              <label className="text-[9px] text-white/40 uppercase tracking-tighter mb-2 block">Ghost Protocol Actions</label>
              <div className="space-y-2">
                <button 
                  onClick={generateOrder}
                  className="w-full h-9 bg-gradient-to-r from-[#FF6B00] to-[#FF8C33] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <ShoppingBag size={14} />
                  Inject Ghost Order
                </button>
                <button 
                  onClick={fetchMagicOtp}
                  className="w-full h-9 bg-white/5 border border-white/10 text-white/80 text-[11px] rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-medium"
                >
                  <Key size={14} />
                  {lastOtp ? `OTP: ${lastOtp}` : 'Fetch Magic OTP'}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-white/30">STATUS</span>
                <span className="text-green-500 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  SYSTEMS ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimHUD;
