import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../../contexts/AppContext';
import { 
  LayoutDashboard, Package, Wallet, Settings, LogOut, Bike,
  MapPin, Phone, Clock, CheckCircle, DollarSign, ShoppingBag
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { user, logout, API } = useApp();
  
  const [driverProfile, setDriverProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pabiliRequests, setPabiliRequests] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deliveries');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadDeliveries, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, ordersRes, pabiliRes, earningsRes] = await Promise.all([
        axios.get(`${API}/driver/profile`).catch(() => ({ data: null })),
        axios.get(`${API}/orders`),
        axios.get(`${API}/pabili`),
        axios.get(`${API}/driver/earnings`)
      ]);
      
      setDriverProfile(profileRes.data);
      setOrders(ordersRes.data);
      setPabiliRequests(pabiliRes.data);
      setEarnings(earningsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      const [ordersRes, pabiliRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/pabili`)
      ]);
      setOrders(ordersRes.data);
      setPabiliRequests(pabiliRes.data);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    }
  };

  const toggleAvailability = async (isAvailable) => {
    try {
      await axios.put(`${API}/driver/availability?is_available=${isAvailable}`);
      setDriverProfile(prev => ({ ...prev, is_available: isAvailable }));
      toast.success(isAvailable ? 'You are now online' : 'You are now offline');
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await axios.put(`${API}/orders/${orderId}/assign-driver`);
      loadDeliveries();
      toast.success('Order accepted!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept order');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      loadDeliveries();
      toast.success(`Order ${status.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const acceptPabili = async (pabiliId) => {
    try {
      await axios.put(`${API}/pabili/${pabiliId}/accept`);
      loadDeliveries();
      toast.success('Pabili request accepted!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to accept request');
    }
  };

  const updatePabiliStatus = async (pabiliId, status) => {
    try {
      await axios.put(`${API}/pabili/${pabiliId}/status?status=${status}`);
      loadDeliveries();
      toast.success(`Status updated`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const availableOrders = orders.filter(o => o.order_status === 'ready' && !o.driver_id);
  const myOrders = orders.filter(o => o.driver_id === user?.id && !['delivered', 'cancelled'].includes(o.order_status));
  const availablePabili = pabiliRequests.filter(p => p.status === 'pending' && !p.driver_id);
  const myPabili = pabiliRequests.filter(p => p.driver_id === user?.id && !['completed', 'cancelled'].includes(p.status));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="dashboard-sidebar p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#FF6B00]">KainTayo</h1>
          <p className="text-xs text-muted-foreground">Driver Dashboard</p>
        </div>

        {/* Availability Toggle */}
        <div className="mb-6 p-3 rounded-xl bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Availability</p>
              <p className={`text-xs ${driverProfile?.is_available ? 'text-green-600' : 'text-muted-foreground'}`}>
                {driverProfile?.is_available ? 'Online' : 'Offline'}
              </p>
            </div>
            <Switch
              checked={driverProfile?.is_available || false}
              onCheckedChange={toggleAvailability}
              data-testid="availability-toggle"
            />
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'deliveries', icon: Package, label: 'Deliveries' },
            { id: 'pabili', icon: ShoppingBag, label: 'Pabili' },
            { id: 'earnings', icon: Wallet, label: 'Earnings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-[#FF6B00]/10 text-[#FF6B00]' 
                  : 'hover:bg-gray-100'
              }`}
              data-testid={`tab-${item.id}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === 'deliveries' && (availableOrders.length + myOrders.length) > 0 && (
                <span className="ml-auto bg-[#FF6B00] text-white text-xs px-2 py-0.5 rounded-full">
                  {availableOrders.length + myOrders.length}
                </span>
              )}
              {item.id === 'pabili' && (availablePabili.length + myPabili.length) > 0 && (
                <span className="ml-auto bg-[#0284C7] text-white text-xs px-2 py-0.5 rounded-full">
                  {availablePabili.length + myPabili.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
              <Bike className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">
                {driverProfile?.vehicle_type || 'Driver'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Available</span>
              <Package className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{availableOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active</span>
              <Bike className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <p className="text-2xl font-bold">{myOrders.length + myPabili.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Deliveries</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{earnings?.total_deliveries || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Earnings</span>
              <DollarSign className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <p className="text-2xl font-bold">₱{earnings?.total_earnings?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="space-y-6">
            {/* My Active Deliveries */}
            {myOrders.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">My Active Deliveries</h2>
                <div className="grid gap-4">
                  {myOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl p-4 border border-[#FF6B00]/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold">{order.restaurant_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold status-${order.order_status}`}>
                          {order.order_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2 mb-3 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{order.delivery_address}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="font-bold">₱{order.delivery_fee.toFixed(2)} fee</span>
                        {order.order_status === 'picked_up' && (
                          <Button
                            size="sm"
                            className="btn-primary"
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            data-testid={`deliver-${order.id}`}
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Orders */}
            <div>
              <h2 className="text-xl font-bold mb-4">Available for Pickup</h2>
              {availableOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-border text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No available orders</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl p-4 border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold">{order.restaurant_name}</p>
                          <p className="text-sm text-muted-foreground">{order.items.length} item(s)</p>
                        </div>
                        <span className="font-bold text-[#FF6B00]">₱{order.delivery_fee.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-start gap-2 mb-3 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{order.delivery_address}</span>
                      </div>
                      
                      <Button
                        className="w-full btn-primary"
                        onClick={() => acceptOrder(order.id)}
                        disabled={!driverProfile?.is_available}
                        data-testid={`accept-${order.id}`}
                      >
                        Accept Delivery
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pabili Tab */}
        {activeTab === 'pabili' && (
          <div className="space-y-6">
            {/* My Active Pabili */}
            {myPabili.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">My Active Pabili</h2>
                <div className="grid gap-4">
                  {myPabili.map((request) => (
                    <div key={request.id} className="bg-white rounded-2xl p-4 border border-[#0284C7]/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-[#0284C7]">Pabili Request</p>
                          <p className="text-sm text-muted-foreground">{request.customer_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold status-${request.status}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="bg-[#0284C7]/5 rounded-xl p-3 mb-3 text-sm">
                        <p className="font-medium mb-1">Items to buy:</p>
                        <p className="whitespace-pre-line">{request.items_list}</p>
                      </div>
                      
                      <div className="space-y-2 mb-3 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span><strong>Store:</strong> {request.store_location}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                          <span><strong>Deliver to:</strong> {request.delivery_address}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div>
                          <p className="text-sm text-muted-foreground">Budget: ₱{request.estimated_budget}</p>
                          <p className="font-bold text-[#0284C7]">Fee: ₱{request.service_fee}</p>
                        </div>
                        <div className="flex gap-2">
                          {request.status === 'accepted' && (
                            <Button
                              size="sm"
                              className="btn-pabili"
                              onClick={() => updatePabiliStatus(request.id, 'shopping')}
                            >
                              Start Shopping
                            </Button>
                          )}
                          {request.status === 'shopping' && (
                            <Button
                              size="sm"
                              className="btn-pabili"
                              onClick={() => updatePabiliStatus(request.id, 'delivering')}
                            >
                              Done Shopping
                            </Button>
                          )}
                          {request.status === 'delivering' && (
                            <Button
                              size="sm"
                              className="btn-pabili"
                              onClick={() => updatePabiliStatus(request.id, 'completed')}
                            >
                              Delivered
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Pabili */}
            <div>
              <h2 className="text-xl font-bold mb-4">Available Pabili Requests</h2>
              {availablePabili.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-border text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No available Pabili requests</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {availablePabili.map((request) => (
                    <div key={request.id} className="bg-white rounded-2xl p-4 border border-[#0284C7]/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-[#0284C7]">Pabili Request</p>
                          <p className="text-sm text-muted-foreground">{request.customer_name}</p>
                        </div>
                        <span className="font-bold text-[#0284C7]">₱{request.service_fee}</span>
                      </div>
                      
                      <p className="text-sm mb-3 line-clamp-2">{request.items_list}</p>
                      
                      <div className="space-y-1 mb-3 text-sm text-muted-foreground">
                        <p>Store: {request.store_location}</p>
                        <p>Budget: ₱{request.estimated_budget}</p>
                      </div>
                      
                      <Button
                        className="w-full btn-pabili"
                        onClick={() => acceptPabili(request.id)}
                        disabled={!driverProfile?.is_available}
                        data-testid={`accept-pabili-${request.id}`}
                      >
                        Accept Pabili
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold">Earnings Summary</h2>
            
            <div className="bg-white rounded-2xl p-6 border border-border">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <p className="text-4xl font-bold text-[#FF6B00]">
                  ₱{earnings?.total_earnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold">{earnings?.order_deliveries || 0}</p>
                  <p className="text-sm text-muted-foreground">Food Deliveries</p>
                  <p className="text-sm font-medium text-[#FF6B00]">
                    ₱{earnings?.order_earnings?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#0284C7]/5 rounded-xl">
                  <p className="text-2xl font-bold">{earnings?.pabili_deliveries || 0}</p>
                  <p className="text-sm text-muted-foreground">Pabili Tasks</p>
                  <p className="text-sm font-medium text-[#0284C7]">
                    ₱{earnings?.pabili_earnings?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
