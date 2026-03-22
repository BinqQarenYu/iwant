import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../../contexts/AppContext';
import { 
  LayoutDashboard, Package, Utensils, Settings, LogOut, Plus,
  Clock, CheckCircle, XCircle, DollarSign, TrendingUp, ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '../../components/ui/dialog';
import { toast } from 'sonner';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const { user, logout, API } = useApp();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: '', image_url: ''
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [restaurantRes, ordersRes] = await Promise.all([
        axios.get(`${API}/my-restaurant`),
        axios.get(`${API}/orders`)
      ]);
      
      if (restaurantRes.data) {
        setRestaurant(restaurantRes.data);
        const menuRes = await axios.get(`${API}/restaurants/${restaurantRes.data.id}`);
        setMenu(menuRes.data.menu);
      }
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      loadOrders();
      toast.success(`Order ${status}`);
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await axios.post(`${API}/restaurants/${restaurant.id}/menu`, {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: newItem.category,
        image_url: newItem.image_url || null
      });
      toast.success('Menu item added!');
      setShowAddItem(false);
      setNewItem({ name: '', description: '', price: '', category: '', image_url: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const toggleItemAvailability = async (itemId, isAvailable) => {
    try {
      await axios.put(`${API}/menu/${itemId}`, { is_available: !isAvailable });
      loadData();
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const pendingOrders = orders.filter(o => o.order_status === 'pending');
  const preparingOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.order_status));
  const readyOrders = orders.filter(o => o.order_status === 'ready');

  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayOrders
    .filter(o => o.order_status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Restaurant Found</h1>
          <p className="text-muted-foreground mb-6">You haven't created a restaurant yet.</p>
          <Button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="dashboard-sidebar p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#FF6B00]">KainTayo</h1>
          <p className="text-xs text-muted-foreground">Restaurant Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'orders', icon: Package, label: 'Orders' },
            { id: 'menu', icon: Utensils, label: 'Menu' },
            { id: 'settings', icon: Settings, label: 'Settings' },
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
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
              <span className="font-bold text-[#FF6B00]">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{restaurant?.name}</p>
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
              <span className="text-sm text-muted-foreground">Pending</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{pendingOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Preparing</span>
              <Utensils className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{preparingOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ready</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{readyOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Today's Revenue</span>
              <DollarSign className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <p className="text-2xl font-bold">₱{todayRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Active Orders</h2>
            
            {orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-border text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">No active orders</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders
                  .filter(o => !['delivered', 'cancelled'].includes(o.order_status))
                  .map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl p-4 border border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold status-${order.order_status}`}>
                          {order.order_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="space-y-1 mb-3 text-sm">
                        {order.items.map((item, idx) => (
                          <p key={idx}>{item.quantity}x {item.name}</p>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="font-bold text-[#FF6B00]">₱{order.total.toFixed(2)}</span>
                        <div className="flex gap-2">
                          {order.order_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                data-testid={`cancel-${order.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="btn-primary"
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                data-testid={`confirm-${order.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Confirm
                              </Button>
                            </>
                          )}
                          {order.order_status === 'confirmed' && (
                            <Button
                              size="sm"
                              className="btn-primary"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              data-testid={`preparing-${order.id}`}
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.order_status === 'preparing' && (
                            <Button
                              size="sm"
                              className="btn-primary"
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              data-testid={`ready-${order.id}`}
                            >
                              Mark Ready
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Menu Items</h2>
              <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" data-testid="add-menu-btn">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        placeholder="e.g., Chicken Adobo"
                        data-testid="item-name"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Describe the dish"
                        rows={2}
                        data-testid="item-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price (₱) *</Label>
                        <Input
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                          placeholder="0.00"
                          data-testid="item-price"
                        />
                      </div>
                      <div>
                        <Label>Category *</Label>
                        <Input
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          placeholder="e.g., Main, Sides"
                          data-testid="item-category"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={newItem.image_url}
                        onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                        placeholder="https://..."
                        data-testid="item-image"
                      />
                    </div>
                    <Button className="w-full btn-primary" onClick={addMenuItem} data-testid="save-item-btn">
                      Add Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {menu.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 border border-border">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold">{item.name}</h3>
                    <span className="font-bold text-[#FF6B00]">₱{item.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{item.category}</span>
                    <button
                      onClick={() => toggleItemAvailability(item.id, item.is_available)}
                      className={`text-xs font-medium ${item.is_available ? 'text-green-600' : 'text-red-500'}`}
                      data-testid={`toggle-${item.id}`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold">Restaurant Settings</h2>
            <div className="bg-white rounded-2xl p-6 border border-border space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Restaurant Status</p>
                  <p className="text-sm text-muted-foreground">Accept new orders</p>
                </div>
                <button
                  onClick={async () => {
                    await axios.put(`${API}/restaurants/${restaurant.id}`, { is_open: !restaurant.is_open });
                    loadData();
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold ${
                    restaurant.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                  data-testid="toggle-status"
                >
                  {restaurant.is_open ? 'Open' : 'Closed'}
                </button>
              </div>
              <div>
                <p className="font-medium mb-2">Restaurant Name</p>
                <p className="text-muted-foreground">{restaurant.name}</p>
              </div>
              <div>
                <p className="font-medium mb-2">Address</p>
                <p className="text-muted-foreground">{restaurant.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">Delivery Fee</p>
                  <p className="text-muted-foreground">₱{restaurant.delivery_fee}</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Minimum Order</p>
                  <p className="text-muted-foreground">₱{restaurant.min_order}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
