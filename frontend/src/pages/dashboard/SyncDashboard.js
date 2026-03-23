import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../../contexts/AppContext';
import {
  ShoppingBag, Bike, Store, Shield, LogOut, ChevronDown,
  Package, Clock, CheckCircle, MapPin, Utensils, DollarSign,
  Users, TrendingUp, Plus, XCircle, Search, RefreshCw,
  Wallet, Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

const ROLES = [
  { key: 'customer', label: 'Customer', icon: ShoppingBag, color: '#FF6B00', desc: 'Order food & pabili' },
  { key: 'rider', label: 'Rider', icon: Bike, color: '#16A34A', desc: 'Deliver & earn' },
  { key: 'merchant', label: 'Merchant', icon: Store, color: '#0284C7', desc: 'Manage restaurant' },
  { key: 'admin', label: 'Admin', icon: Shield, color: '#7C3AED', desc: 'Ops center' },
];

export default function SyncDashboard() {
  const navigate = useNavigate();
  const { user, switchRole, logout, API, t, language, toggleLanguage } = useApp();
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [switching, setSwitching] = useState(false);

  const currentRole = ROLES.find(r => r.key === user?.role) || ROLES[0];

  const handleSwitchRole = async (roleKey) => {
    if (roleKey === user?.role) {
      setShowRolePicker(false);
      return;
    }
    setSwitching(true);
    try {
      await switchRole(roleKey);
      setShowRolePicker(false);
      toast.success(`Switched to ${ROLES.find(r => r.key === roleKey)?.label}`);
    } catch (err) {
      toast.error('Failed to switch role');
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top Bar with Role Switcher */}
      <header
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm"
        data-testid="sync-dashboard-header"
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-extrabold text-[#FF6B00]">KainTayo</h1>
            <span className="text-[10px] tracking-wider font-semibold text-gray-400 uppercase hidden sm:inline">
              Sync
            </span>
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRolePicker(!showRolePicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
              style={{ background: `${currentRole.color}08` }}
              data-testid="role-switcher-btn"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: `${currentRole.color}15` }}
              >
                <currentRole.icon className="w-3.5 h-3.5" style={{ color: currentRole.color }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: currentRole.color }}>
                {currentRole.label}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Dropdown */}
            {showRolePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRolePicker(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50" data-testid="role-picker-dropdown">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-2">Switch Role</p>
                  </div>
                  {ROLES.map((role) => (
                    <button
                      key={role.key}
                      onClick={() => handleSwitchRole(role.key)}
                      disabled={switching}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                        user?.role === role.key ? 'bg-gray-50' : ''
                      }`}
                      data-testid={`switch-role-${role.key}`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${role.color}12` }}
                      >
                        <role.icon className="w-4 h-4" style={{ color: role.color }} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{role.label}</p>
                        <p className="text-[11px] text-gray-400">{role.desc}</p>
                      </div>
                      {user?.role === role.key && (
                        <CheckCircle className="w-4 h-4 ml-auto" style={{ color: role.color }} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-sm"
              data-testid="lang-toggle"
            >
              <Globe className="w-4 h-4 text-gray-500" />
            </button>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-transparent hover:border-gray-200"
                onClick={() => navigate('/profile')}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
                style={{ background: `${currentRole.color}15`, color: currentRole.color }}
                onClick={() => navigate('/profile')}
              >
                {user?.name?.charAt(0)}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              data-testid="sync-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Content based on role */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {user?.role === 'customer' && <CustomerView />}
        {user?.role === 'rider' && <RiderView />}
        {user?.role === 'merchant' && <MerchantView />}
        {user?.role === 'admin' && <AdminView />}
      </main>
    </div>
  );
}

/* ============================
   CUSTOMER VIEW
   ============================ */
function CustomerView() {
  const navigate = useNavigate();
  const { t, API } = useApp();
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [restRes, ordRes] = await Promise.all([
          axios.get(`${API}/restaurants`),
          axios.get(`${API}/orders`).catch(() => ({ data: [] }))
        ]);
        setRestaurants(restRes.data);
        setOrders(ordRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [API]);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6" data-testid="customer-view">
      {/* Active Orders Banner */}
      {activeOrders.length > 0 && (
        <div className="bg-[#FF6B00] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">{activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}</p>
              <p className="text-white/80 text-sm">{activeOrders[0]?.restaurant_name}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-[#FF6B00] hover:bg-white/90"
              onClick={() => navigate(`/orders/${activeOrders[0].id}`)}
              data-testid="track-order-btn"
            >
              {t('trackOrder')}
            </Button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#FF6B00]/30 hover:shadow-sm transition-all"
          data-testid="browse-food-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
            <Utensils className="w-5 h-5 text-[#FF6B00]" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Order Food</p>
            <p className="text-[11px] text-gray-400">{restaurants.length} restaurants</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/pabili')}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#0284C7]/30 hover:shadow-sm transition-all"
          data-testid="pabili-btn"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-[#0284C7]" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{t('pabili')}</p>
            <p className="text-[11px] text-gray-400">Grocery errands</p>
          </div>
        </button>
      </div>

      {/* Nearby Restaurants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">{t('nearYou')}</h2>
          <button
            onClick={() => navigate('/home')}
            className="text-xs text-[#FF6B00] font-semibold"
          >
            {t('viewAll')}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {restaurants.slice(0, 6).map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/restaurant/${r.id}`)}
              className="text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all"
              data-testid={`restaurant-card-${r.id}`}
            >
              <img
                src={r.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'}
                alt={r.name}
                className="w-full h-28 object-cover"
              />
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{r.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{r.cuisine_type} • {r.estimated_delivery_time}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-semibold text-yellow-600">★ {r.rating}</span>
                  <span className="text-[11px] text-gray-300">•</span>
                  <span className="text-[11px] text-gray-400">₱{r.delivery_fee} delivery</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div>
          <h2 className="font-bold text-base mb-3">{t('myOrders')}</h2>
          <div className="space-y-2">
            {orders.slice(0, 3).map((o) => (
              <button
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="w-full text-left bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-semibold text-sm">{o.restaurant_name}</p>
                  <p className="text-[11px] text-gray-400">{o.items?.length} items • ₱{o.total?.toFixed(2)}</p>
                </div>
                <OrderStatusBadge status={o.order_status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   RIDER VIEW - "Scanning for Jobs"
   ============================ */
function RiderView() {
  const { user, API } = useApp();
  const [riderProfile, setRiderProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pabili, setPabili] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, ordersRes, pabiliRes, earningsRes] = await Promise.all([
        axios.get(`${API}/rider/profile`).catch(() => ({ data: null })),
        axios.get(`${API}/orders`),
        axios.get(`${API}/pabili`),
        axios.get(`${API}/rider/earnings`)
      ]);
      setRiderProfile(profileRes.data);
      setOrders(ordersRes.data);
      setPabili(pabiliRes.data);
      setEarnings(earningsRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [API]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const toggleOnline = async (val) => {
    try {
      await axios.put(`${API}/rider/online?is_online=${val}`);
      setRiderProfile(p => ({ ...p, is_online: val }));
      toast.success(val ? 'You are now online!' : 'You are offline');
    } catch (e) { toast.error('Failed to toggle'); }
  };

  const acceptOrder = async (orderId) => {
    try {
      await axios.put(`${API}/orders/${orderId}/assign-rider`);
      loadData();
      toast.success('Order accepted!');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      loadData();
      toast.success('Updated!');
    } catch (e) { toast.error('Failed'); }
  };

  const acceptPabili = async (id) => {
    try {
      await axios.put(`${API}/pabili/${id}/accept`);
      loadData();
      toast.success('Pabili accepted!');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  const updatePabiliStatus = async (id, status) => {
    try {
      await axios.put(`${API}/pabili/${id}/status?status=${status}`);
      loadData();
      toast.success('Updated!');
    } catch (e) { toast.error('Failed'); }
  };

  if (loading) return <LoadingSpinner />;

  const availableOrders = orders.filter(o => o.order_status === 'ready' && !o.rider_id);
  const myActiveOrders = orders.filter(o => o.rider_id === user?.user_id && !['delivered', 'cancelled'].includes(o.order_status));
  const availablePabili = pabili.filter(p => p.status === 'pending' && !p.rider_id);
  const myActivePabili = pabili.filter(p => p.rider_id === user?.user_id && !['completed', 'cancelled'].includes(p.status));
  const isOnline = riderProfile?.is_online;

  return (
    <div className="space-y-6" data-testid="rider-view">
      {/* Online Toggle Bar */}
      <div className={`rounded-2xl p-4 flex items-center justify-between ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <div>
            <p className="font-bold text-sm">{isOnline ? 'Scanning for Jobs...' : 'You are Offline'}</p>
            <p className="text-[11px] text-gray-500">{isOnline ? 'New orders will appear below' : 'Go online to start earning'}</p>
          </div>
        </div>
        <Switch
          checked={isOnline || false}
          onCheckedChange={toggleOnline}
          data-testid="rider-online-toggle"
        />
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-[#FF6B00]">₱{earnings?.today_earnings?.toFixed(0) || 0}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Today</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold">{earnings?.today_deliveries || 0}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Deliveries</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-yellow-600">★ {earnings?.rating?.toFixed(1) || '5.0'}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Rating</p>
        </div>
      </div>

      {/* My Active Deliveries */}
      {myActiveOrders.length > 0 && (
        <div>
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <Bike className="w-4 h-4 text-green-600" /> My Active Deliveries
          </h2>
          <div className="space-y-3">
            {myActiveOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border-l-4 border-l-green-500 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{order.restaurant_name}</p>
                    <p className="text-[11px] text-gray-400">{order.customer_name}</p>
                  </div>
                  <OrderStatusBadge status={order.order_status} />
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-gray-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{order.delivery_address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FF6B00] text-sm">₱{order.delivery_fee?.toFixed(0)} fee</span>
                  {order.order_status === 'picked_up' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9 px-4" onClick={() => updateStatus(order.id, 'delivered')} data-testid={`deliver-${order.id}`}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Delivered
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Active Pabili */}
      {myActivePabili.length > 0 && (
        <div>
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#0284C7]" /> My Pabili Tasks
          </h2>
          <div className="space-y-3">
            {myActivePabili.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-4 border-l-4 border-l-[#0284C7] border border-gray-100">
                <p className="font-bold text-sm text-[#0284C7]">Pabili - {req.customer_name}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{req.items_list}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold text-[#0284C7] text-sm">₱{req.service_fee} fee</span>
                  {req.status === 'accepted' && (
                    <Button size="sm" className="bg-[#0284C7] hover:bg-[#0369A1] text-white h-9" onClick={() => updatePabiliStatus(req.id, 'shopping')}>Start Shopping</Button>
                  )}
                  {req.status === 'shopping' && (
                    <Button size="sm" className="bg-[#0284C7] hover:bg-[#0369A1] text-white h-9" onClick={() => updatePabiliStatus(req.id, 'delivering')}>Done Shopping</Button>
                  )}
                  {req.status === 'delivering' && (
                    <Button size="sm" className="bg-[#0284C7] hover:bg-[#0369A1] text-white h-9" onClick={() => updatePabiliStatus(req.id, 'completed')}>Delivered</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Orders */}
      <div>
        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-yellow-600" /> Available Orders ({availableOrders.length})
        </h2>
        {!isOnline ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
            <Bike className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Go online to see available orders</p>
          </div>
        ) : availableOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
            <RefreshCw className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin-slow" />
            <p className="text-sm text-gray-400">Scanning for new orders...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-green-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">{order.restaurant_name}</p>
                    <p className="text-[11px] text-gray-400">{order.items?.length} item(s) • {order.area}</p>
                  </div>
                  <span className="font-bold text-green-600 text-sm">₱{order.delivery_fee?.toFixed(0)}</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-gray-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{order.delivery_address}</span>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-10"
                  onClick={() => acceptOrder(order.id)}
                  data-testid={`accept-order-${order.id}`}
                >
                  Accept Delivery
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Pabili */}
      {availablePabili.length > 0 && (
        <div>
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#0284C7]" /> Pabili Requests ({availablePabili.length})
          </h2>
          <div className="space-y-3">
            {availablePabili.map(req => (
              <div key={req.id} className="bg-white rounded-xl p-4 border border-[#0284C7]/20">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-sm text-[#0284C7]">Pabili - {req.customer_name}</p>
                  <span className="font-bold text-[#0284C7] text-sm">₱{req.service_fee}</span>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2 mb-2">{req.items_list}</p>
                <p className="text-[11px] text-gray-400 mb-3">Budget: ₱{req.estimated_budget} • {req.store_location}</p>
                <Button
                  className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white h-10"
                  onClick={() => acceptPabili(req.id)}
                  disabled={!isOnline}
                  data-testid={`accept-pabili-${req.id}`}
                >
                  Accept Pabili
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================
   MERCHANT VIEW - "Active Inbound Orders"
   ============================ */
function MerchantView() {
  const { user, API } = useApp();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');

  const loadData = useCallback(async () => {
    try {
      const [restRes, ordersRes] = await Promise.all([
        axios.get(`${API}/my-restaurant`),
        axios.get(`${API}/orders`)
      ]);
      if (restRes.data) {
        setRestaurant(restRes.data);
        const menuRes = await axios.get(`${API}/restaurants/${restRes.data.id}`);
        setMenu(menuRes.data.menu);
      }
      setOrders(ordersRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [API]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      loadData();
      toast.success(`Order ${status}`);
    } catch (e) { toast.error('Failed'); }
  };

  if (loading) return <LoadingSpinner />;

  if (!restaurant) {
    return (
      <div className="text-center py-16" data-testid="merchant-no-restaurant">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">No Restaurant Yet</h2>
        <p className="text-sm text-gray-400 mb-4">Create your restaurant to start receiving orders</p>
      </div>
    );
  }

  const pending = orders.filter(o => o.order_status === 'pending');
  const preparing = orders.filter(o => ['confirmed', 'preparing'].includes(o.order_status));
  const ready = orders.filter(o => o.order_status === 'ready');
  const activeOrders = [...pending, ...preparing, ...ready];

  return (
    <div className="space-y-6" data-testid="merchant-view">
      {/* Restaurant Status Bar */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
        <div>
          <p className="font-bold">{restaurant.name}</p>
          <p className="text-[11px] text-gray-400">{restaurant.address}</p>
        </div>
        <button
          onClick={async () => {
            await axios.put(`${API}/restaurants/${restaurant.id}`, { is_open: !restaurant.is_open });
            loadData();
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
            restaurant.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
          data-testid="toggle-open-btn"
        >
          {restaurant.is_open ? 'Open' : 'Closed'}
        </button>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
          <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
          <p className="text-[10px] text-yellow-600 font-semibold">NEW</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
          <p className="text-2xl font-bold text-orange-700">{preparing.length}</p>
          <p className="text-[10px] text-orange-600 font-semibold">PREPARING</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <p className="text-2xl font-bold text-green-700">{ready.length}</p>
          <p className="text-[10px] text-green-600 font-semibold">READY</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === 'orders' ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-600'}`}
          data-testid="merchant-orders-tab"
        >
          Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setTab('menu')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === 'menu' ? 'bg-[#FF6B00] text-white' : 'bg-gray-100 text-gray-600'}`}
          data-testid="merchant-menu-tab"
        >
          Menu ({menu.length})
        </button>
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No active orders</p>
            </div>
          ) : (
            activeOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm">#{order.id.slice(0, 8)}</p>
                    <p className="text-[11px] text-gray-400">{order.customer_name}</p>
                  </div>
                  <OrderStatusBadge status={order.order_status} />
                </div>
                <div className="space-y-0.5 mb-3 text-sm">
                  {order.items?.map((item, i) => (
                    <p key={i} className="text-gray-600">{item.quantity}x {item.name}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="font-bold text-[#FF6B00]">₱{order.total?.toFixed(2)}</span>
                  <div className="flex gap-2">
                    {order.order_status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" className="h-9" onClick={() => updateOrderStatus(order.id, 'cancelled')} data-testid={`cancel-${order.id}`}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="bg-[#FF6B00] hover:bg-[#E55F00] text-white h-9 px-4" onClick={() => updateOrderStatus(order.id, 'confirmed')} data-testid={`confirm-${order.id}`}>
                          Accept
                        </Button>
                      </>
                    )}
                    {order.order_status === 'confirmed' && (
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-4" onClick={() => updateOrderStatus(order.id, 'preparing')} data-testid={`prepare-${order.id}`}>
                        Start Preparing
                      </Button>
                    )}
                    {order.order_status === 'preparing' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9 px-6 text-base font-bold" onClick={() => updateOrderStatus(order.id, 'ready')} data-testid={`ready-${order.id}`}>
                        READY
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Menu Tab */}
      {tab === 'menu' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {menu.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-[11px] text-gray-400">{item.category}</p>
                </div>
                <span className="font-bold text-[#FF6B00] text-sm">₱{item.price}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================
   ADMIN VIEW - "Ops Center / War Room"
   ============================ */
function AdminView() {
  const { API } = useApp();
  const [analytics, setAnalytics] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [analyticsRes, ordersRes, ridersRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`),
        axios.get(`${API}/admin/live-orders`),
        axios.get(`${API}/riders/all`).catch(() => ({ data: [] }))
      ]);
      setAnalytics(analyticsRes.data);
      setLiveOrders(ordersRes.data);
      setRiders(ridersRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [API]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) return <LoadingSpinner />;

  const onlineRiders = riders.filter(r => r.is_online);
  const busyRiders = riders.filter(r => r.is_on_delivery);

  return (
    <div className="space-y-6" data-testid="admin-view">
      {/* War Room Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Ops Center</h2>
          <p className="text-[11px] text-gray-400">Real-time platform overview</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          data-testid="refresh-ops-btn"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Orders" value={analytics?.total_orders || 0} icon={Package} color="#FF6B00" />
        <KpiCard label="Revenue" value={`₱${(analytics?.total_revenue || 0).toFixed(0)}`} icon={DollarSign} color="#16A34A" />
        <KpiCard label="Users" value={analytics?.total_users || 0} icon={Users} color="#0284C7" />
        <KpiCard label="Restaurants" value={analytics?.total_restaurants || 0} icon={Store} color="#7C3AED" />
      </div>

      {/* Rider Fleet Status */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Bike className="w-4 h-4 text-green-600" /> Rider Fleet
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{onlineRiders.length}</p>
            <p className="text-[10px] text-gray-400">Online</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-orange-600">{busyRiders.length}</p>
            <p className="text-[10px] text-gray-400">On Delivery</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">{analytics?.available_riders || 0}</p>
            <p className="text-[10px] text-gray-400">Available</p>
          </div>
        </div>
      </div>

      {/* Live Orders */}
      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600" /> Live Orders ({liveOrders.length})
        </h3>
        {liveOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
            <p className="text-sm text-gray-400">No active orders</p>
          </div>
        ) : (
          <div className="space-y-2">
            {liveOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <OrderStatusDot status={order.order_status} />
                  <div>
                    <p className="font-semibold text-sm">#{order.id?.slice(0, 8)} • {order.restaurant_name}</p>
                    <p className="text-[11px] text-gray-400">{order.customer_name} • {order.area}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">₱{order.total?.toFixed(0)}</p>
                  <OrderStatusBadge status={order.order_status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Pipeline */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-bold text-sm mb-3">Order Pipeline</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          <PipelineStep label="Pending" count={analytics?.orders_pending || 0} color="#EAB308" />
          <PipelineStep label="Preparing" count={analytics?.orders_preparing || 0} color="#F97316" />
          <PipelineStep label="Ready" count={analytics?.orders_ready || 0} color="#22C55E" />
          <PipelineStep label="In Transit" count={analytics?.orders_in_transit || 0} color="#3B82F6" />
          <PipelineStep label="Delivered" count={analytics?.orders_delivered || 0} color="#6B7280" />
        </div>
      </div>
    </div>
  );
}

/* ============================
   SHARED COMPONENTS
   ============================ */

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full" />
    </div>
  );
}

function OrderStatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-green-100 text-green-700',
    picked_up: 'bg-purple-100 text-purple-700',
    delivered: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${styles[status] || 'bg-gray-100 text-gray-600'}`} data-testid={`status-badge-${status}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function OrderStatusDot({ status }) {
  const colors = {
    pending: '#EAB308',
    confirmed: '#3B82F6',
    preparing: '#F97316',
    ready: '#22C55E',
    picked_up: '#7C3AED',
  };
  return <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[status] || '#9CA3AF' }} />;
}

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-gray-400">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function PipelineStep({ label, count, color }) {
  return (
    <div>
      <div className="w-full h-2 rounded-full bg-gray-100 mb-1.5">
        <div className="h-full rounded-full transition-all" style={{ background: color, width: count > 0 ? '100%' : '0%' }} />
      </div>
      <p className="text-lg font-bold" style={{ color }}>{count}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}
