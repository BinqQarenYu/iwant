import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { 
  ArrowLeft, MapPin, Phone, User, Clock, CheckCircle, 
  Package, Utensils, Bike, Home
} from 'lucide-react';
import { Button } from '../components/ui/button';

const orderSteps = [
  { status: 'pending', label: 'Order Placed', icon: Package },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'preparing', label: 'Preparing', icon: Utensils },
  { status: 'ready', label: 'Ready', icon: Package },
  { status: 'picked_up', label: 'On the Way', icon: Bike },
  { status: 'delivered', label: 'Delivered', icon: Home },
];

const statusIndex = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  picked_up: 4,
  delivered: 5,
  cancelled: -1,
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, API } = useApp();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    // Poll for updates
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const currentStepIndex = order ? statusIndex[order.order_status] : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mobile-container p-4">
        <p>Order not found</p>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-8">
      {/* Header */}
      <header className="app-header px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{t('trackOrder')}</h1>
          <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Status Timeline */}
        {order.order_status !== 'cancelled' ? (
          <section className="bg-white rounded-2xl p-5 border border-border">
            <h2 className="font-bold mb-4">Order Status</h2>
            <div className="status-timeline">
              {orderSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isActive = index === currentStepIndex;
                const IconComponent = step.icon;
                
                return (
                  <div 
                    key={step.status}
                    className={`status-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                    data-testid={`status-${step.status}`}
                  >
                    <div className="status-step-icon">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      {isActive && (
                        <p className="text-xs text-[#FF6B00]">Current status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="bg-red-50 rounded-2xl p-5 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-red-700">Order Cancelled</p>
                <p className="text-sm text-red-600">This order has been cancelled</p>
              </div>
            </div>
          </section>
        )}

        {/* Driver Info */}
        {order.rider_name && (
          <section className="bg-white rounded-2xl p-4 border border-border">
            <h2 className="font-bold mb-3">Your Rider</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{order.rider_name}</p>
                <p className="text-sm text-muted-foreground">Your delivery partner</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                data-testid="call-driver"
              >
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
            </div>
          </section>
        )}

        {/* Restaurant Info */}
        <section className="bg-white rounded-2xl p-4 border border-border">
          <h2 className="font-bold mb-3">Restaurant</h2>
          <p className="font-semibold">{order.restaurant_name}</p>
        </section>

        {/* Delivery Address */}
        <section className="bg-white rounded-2xl p-4 border border-border">
          <h2 className="font-bold mb-3">{t('deliveryAddress')}</h2>
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
            <p className="text-sm">{order.delivery_address}</p>
          </div>
        </section>

        {/* Order Items */}
        <section className="bg-white rounded-2xl p-4 border border-border">
          <h2 className="font-bold mb-3">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x</span> {item.name}
                  {item.special_instructions && (
                    <p className="text-xs text-muted-foreground italic">
                      "{item.special_instructions}"
                    </p>
                  )}
                </div>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span>₱{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('deliveryFee')}</span>
              <span>₱{order.delivery_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>{t('total')}</span>
              <span className="text-[#FF6B00]">₱{order.total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Payment Info */}
        <section className="bg-white rounded-2xl p-4 border border-border">
          <h2 className="font-bold mb-3">{t('paymentMethod')}</h2>
          <div className="flex items-center justify-between">
            <span className="capitalize">
              {order.payment_method === 'cod' ? t('cod') : order.payment_method.toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.payment_status === 'paid' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </section>

        {/* Order Time */}
        <section className="text-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 inline-block mr-1" />
          Ordered on {formatDate(order.created_at)}
        </section>
      </main>
    </div>
  );
}
