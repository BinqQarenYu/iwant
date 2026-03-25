import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../../contexts/AppContext';
import { 
  LayoutDashboard, Users, Store, Package, Settings, LogOut,
  CheckCircle, XCircle, TrendingUp, DollarSign, Clock, Tag, Plus, Percent
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '../../components/ui/dialog';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, API } = useApp();
  
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order: '0',
    max_discount: '',
    first_order_only: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analyticsRes, usersRes, restaurantsRes, ordersRes, promosRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/restaurants`),
        axios.get(`${API}/orders`),
        axios.get(`${API}/promo-codes`).catch(() => ({ data: [] }))
      ]);
      
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
      setRestaurants(restaurantsRes.data);
      setOrders(ordersRes.data);
      setPromoCodes(promosRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const seedPromos = async () => {
    try {
      await axios.post(`${API}/seed-promos`);
      toast.success('Promo codes seeded!');
      loadData();
    } catch (error) {
      toast.error('Failed to seed promos');
    }
  };

  const addPromoCode = async () => {
    if (!newPromo.code || !newPromo.description || !newPromo.discount_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post(`${API}/promo-codes`, {
        code: newPromo.code.toUpperCase(),
        description: newPromo.description,
        discount_type: newPromo.discount_type,
        discount_value: parseFloat(newPromo.discount_value),
        min_order: parseFloat(newPromo.min_order) || 0,
        max_discount: newPromo.max_discount ? parseFloat(newPromo.max_discount) : null,
        first_order_only: newPromo.first_order_only
      });
      toast.success('Promo code created!');
      setShowAddPromo(false);
      setNewPromo({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order: '0',
        max_discount: '',
        first_order_only: false
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create promo code');
    }
  };

  const togglePromoStatus = async (promoId, isActive) => {
    try {
      await axios.put(`${API}/promo-codes/${promoId}`, { is_active: !isActive });
      loadData();
      toast.success(isActive ? 'Promo deactivated' : 'Promo activated');
    } catch (error) {
      toast.error('Failed to update promo');
    }
  };

  const deletePromo = async (promoId) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await axios.delete(`${API}/promo-codes/${promoId}`);
      loadData();
      toast.success('Promo code deleted');
    } catch (error) {
      toast.error('Failed to delete promo');
    }
  };

  const approveRestaurant = async (restaurantId, isApproved) => {
    try {
      await axios.put(`${API}/admin/restaurants/${restaurantId}/approve?is_approved=${isApproved}`);
      loadData();
      toast.success(isApproved ? 'Restaurant approved' : 'Restaurant rejected');
    } catch (error) {
      toast.error('Failed to update restaurant');
    }
  };

  const roleColors = {
    customer: 'bg-blue-100 text-blue-700',
    merchant: 'bg-orange-100 text-orange-700',
    rider: 'bg-green-100 text-green-700',
    admin: 'bg-purple-100 text-purple-700'
  };

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
          <p className="text-xs text-muted-foreground">Admin Dashboard</p>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'restaurants', icon: Store, label: 'Restaurants' },
            { id: 'orders', icon: Package, label: 'Orders' },
            { id: 'promos', icon: Tag, label: 'Promo Codes' },
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
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="font-bold text-purple-700">{user?.name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Platform Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold">{analytics?.total_users || 0}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Restaurants</span>
                  <Store className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold">{analytics?.total_restaurants || 0}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <Package className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold">{analytics?.total_orders || 0}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <DollarSign className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <p className="text-3xl font-bold">₱{analytics?.total_revenue?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-border">
                <h3 className="font-bold mb-4">Orders Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      Pending
                    </span>
                    <span className="font-bold">{analytics?.orders_pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Delivered
                    </span>
                    <span className="font-bold">{analytics?.orders_delivered || 0}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <h3 className="font-bold mb-4">Pabili Requests</h3>
                <p className="text-3xl font-bold text-[#0284C7]">{analytics?.total_pabili || 0}</p>
                <p className="text-sm text-muted-foreground">Total requests</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <h3 className="font-bold mb-4">User Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Customers</span>
                    <span className="font-medium">
                      {users.filter(u => u.role === 'customer').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restaurants</span>
                    <span className="font-medium">
                      {users.filter(u => u.role === 'merchant').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Riders</span>
                    <span className="font-medium">
                      {users.filter(u => u.role === 'rider').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">All Users ({users.length})</h2>
            
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{u.name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{u.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">All Restaurants ({restaurants.length})</h2>
            
            <div className="grid gap-4">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-white rounded-2xl p-4 border border-border">
                  <div className="flex items-start gap-4">
                    {restaurant.image_url && (
                      <img 
                        src={restaurant.image_url} 
                        alt={restaurant.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground">{restaurant.cuisine_type}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          restaurant.is_approved 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {restaurant.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{restaurant.address}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Rating: {restaurant.rating}</span>
                        <span>Reviews: {restaurant.total_reviews}</span>
                        <span className={restaurant.is_open ? 'text-green-600' : 'text-red-500'}>
                          {restaurant.is_open ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!restaurant.is_approved && (
                        <Button
                          size="sm"
                          className="btn-primary"
                          onClick={() => approveRestaurant(restaurant.id, true)}
                          data-testid={`approve-${restaurant.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {restaurant.is_approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveRestaurant(restaurant.id, false)}
                          data-testid={`reject-${restaurant.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Recent Orders ({orders.length})</h2>
            
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Order ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Restaurant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Rider</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.slice(0, 50).map((order) => (
                      <tr 
                        key={order.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{order.customer_name}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{order.restaurant_name}</td>
                        <td className="px-4 py-3">
                          {order.rider_name ? (
                            <span className="font-medium text-sm text-[#007DFE]">{order.rider_name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">₱{order.total.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold status-${order.order_status}`}>
                            {order.order_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Promo Codes Tab */}
        {activeTab === 'promos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Promo Codes ({promoCodes.length})</h2>
              <div className="flex gap-2">
                {promoCodes.length === 0 && (
                  <Button variant="outline" onClick={seedPromos} data-testid="seed-promos-btn">
                    Seed Sample Promos
                  </Button>
                )}
                <Dialog open={showAddPromo} onOpenChange={setShowAddPromo}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary" data-testid="add-promo-btn">
                      <Plus className="w-4 h-4 mr-2" /> Add Promo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Promo Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Code *</Label>
                        <Input
                          value={newPromo.code}
                          onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., WELCOME50"
                          className="uppercase"
                          data-testid="promo-code-input"
                        />
                      </div>
                      <div>
                        <Label>Description *</Label>
                        <Input
                          value={newPromo.description}
                          onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                          placeholder="e.g., 50% off first order"
                          data-testid="promo-desc-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Discount Type *</Label>
                          <select
                            value={newPromo.discount_type}
                            onChange={(e) => setNewPromo({ ...newPromo, discount_type: e.target.value })}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                            data-testid="promo-type-select"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount (₱)</option>
                            <option value="free_delivery">Free Delivery</option>
                          </select>
                        </div>
                        <div>
                          <Label>Discount Value *</Label>
                          <Input
                            type="number"
                            value={newPromo.discount_value}
                            onChange={(e) => setNewPromo({ ...newPromo, discount_value: e.target.value })}
                            placeholder={newPromo.discount_type === 'percentage' ? '50' : '100'}
                            disabled={newPromo.discount_type === 'free_delivery'}
                            data-testid="promo-value-input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Min. Order (₱)</Label>
                          <Input
                            type="number"
                            value={newPromo.min_order}
                            onChange={(e) => setNewPromo({ ...newPromo, min_order: e.target.value })}
                            placeholder="0"
                            data-testid="promo-min-order"
                          />
                        </div>
                        <div>
                          <Label>Max Discount (₱)</Label>
                          <Input
                            type="number"
                            value={newPromo.max_discount}
                            onChange={(e) => setNewPromo({ ...newPromo, max_discount: e.target.value })}
                            placeholder="No limit"
                            data-testid="promo-max-discount"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>First Order Only</Label>
                        <Switch
                          checked={newPromo.first_order_only}
                          onCheckedChange={(checked) => setNewPromo({ ...newPromo, first_order_only: checked })}
                          data-testid="promo-first-order"
                        />
                      </div>
                      <Button className="w-full btn-primary" onClick={addPromoCode} data-testid="save-promo-btn">
                        Create Promo Code
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {promoCodes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-border text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No promo codes yet</p>
                <Button variant="outline" onClick={seedPromos}>
                  Add Sample Promo Codes
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {promoCodes.map((promo) => (
                  <div 
                    key={promo.id} 
                    className={`bg-white rounded-2xl p-4 border-2 ${promo.is_active ? 'border-green-200' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-[#FF6B00]">{promo.code}</span>
                          {promo.first_order_only && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              1st Order
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{promo.description}</p>
                      </div>
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={() => togglePromoStatus(promo.id, promo.is_active)}
                        data-testid={`toggle-promo-${promo.id}`}
                      />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {promo.discount_type === 'percentage' && `${promo.discount_value}% off`}
                          {promo.discount_type === 'fixed' && `₱${promo.discount_value} off`}
                          {promo.discount_type === 'free_delivery' && 'Free Delivery'}
                        </span>
                      </div>
                      {promo.min_order > 0 && (
                        <p className="text-muted-foreground">Min. order: ₱{promo.min_order}</p>
                      )}
                      {promo.max_discount && (
                        <p className="text-muted-foreground">Max discount: ₱{promo.max_discount}</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">
                          Used: {promo.usage_count || 0}{promo.usage_limit ? `/${promo.usage_limit}` : ''}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deletePromo(promo.id)}
                          data-testid={`delete-promo-${promo.id}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
