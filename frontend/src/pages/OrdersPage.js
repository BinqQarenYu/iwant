import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Package, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import BottomNav from '../components/BottomNav';

const statusColors = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  preparing: 'status-preparing',
  ready: 'status-ready',
  picked_up: 'status-picked_up',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
  accepted: 'status-confirmed',
  shopping: 'status-preparing',
  delivering: 'status-picked_up',
  completed: 'status-delivered',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  picked_up: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  accepted: 'Accepted',
  shopping: 'Shopping',
  delivering: 'Delivering',
  completed: 'Completed',
};

export default function OrdersPage() {
  const { t, user, API } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pabiliRequests, setPabiliRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, pabiliRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/pabili`)
      ]);
      setOrders(ordersRes.data);
      setPabiliRequests(pabiliRes.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="mobile-container pb-20">
      {/* Header */}
      <header className="app-header px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">{t('myOrders')}</h1>
      </header>

      <main className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="orders" data-testid="orders-tab">
              Food Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="pabili" data-testid="pabili-tab">
              Pabili ({pabiliRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state mt-10">
                <div className="empty-state-icon">
                  <Package className="w-12 h-12" />
                </div>
                <h2 className="text-lg font-bold mb-2">{t('noOrders')}</h2>
                <p className="text-muted-foreground">{t('startOrdering')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="block bg-white rounded-2xl p-4 border border-border card-hover"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold">{order.restaurant_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.order_status]}`}>
                        {statusLabels[order.order_status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#FF6B00]">₱{order.total.toFixed(2)}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pabili">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : pabiliRequests.length === 0 ? (
              <div className="empty-state mt-10">
                <div className="empty-state-icon">
                  <Package className="w-12 h-12" />
                </div>
                <h2 className="text-lg font-bold mb-2">No Pabili requests</h2>
                <p className="text-muted-foreground">Request groceries from our riders!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pabiliRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl p-4 border border-[#0284C7]/30"
                    data-testid={`pabili-${request.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-[#0284C7]">Pabili Request</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {request.items_list}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{request.store_location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                      <span className="font-bold text-[#0284C7]">
                        Budget: ₱{request.estimated_budget.toFixed(2)}
                      </span>
                    </div>
                    {request.driver_name && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Rider: {request.driver_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
