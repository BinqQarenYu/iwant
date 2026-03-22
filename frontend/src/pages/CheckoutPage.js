import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, MapPin, CreditCard, Banknote, Wallet, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t, user, cart, cartRestaurant, getCartTotal, clearCart, API } = useApp();
  
  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = cartRestaurant?.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  const paymentMethods = [
    { id: 'cod', name: t('cod'), icon: Banknote, description: 'Pay when your order arrives' },
    { id: 'gcash', name: 'GCash', icon: Wallet, description: 'Pay with GCash e-wallet', color: '#007DFE' },
    { id: 'paymaya', name: 'PayMaya', icon: CreditCard, description: 'Pay with PayMaya', color: '#00C851' },
  ];

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        restaurant_id: cartRestaurant.id,
        items: cart.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          special_instructions: item.special_instructions || null
        })),
        delivery_address: address,
        payment_method: paymentMethod,
        special_instructions: specialInstructions || null
      };

      const response = await axios.post(`${API}/orders`, orderData);
      
      clearCart();
      toast.success(t('orderPlaced'));
      navigate(`/orders/${response.data.id}`);
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cartRestaurant || cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="mobile-container pb-36">
      {/* Header */}
      <header className="app-header px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">{t('checkout')}</h1>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Delivery Address */}
        <section className="space-y-3">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF6B00]" />
            {t('deliveryAddress')}
          </Label>
          <Textarea
            placeholder="Enter your complete delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="resize-none rounded-xl"
            rows={3}
            data-testid="address-input"
          />
        </section>

        {/* Payment Method */}
        <section className="space-y-3">
          <Label>{t('paymentMethod')}</Label>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <div
                  key={method.id}
                  className={`payment-method ${paymentMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                  data-testid={`payment-${method.id}`}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: method.color ? `${method.color}20` : '#FF6B0020' }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: method.color || '#FF6B00' }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method.id ? 'border-[#FF6B00]' : 'border-border'
                  }`}>
                    {paymentMethod === method.id && (
                      <div className="w-3 h-3 rounded-full bg-[#FF6B00]"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {paymentMethod !== 'cod' && (
            <p className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded-xl">
              Note: {paymentMethod === 'gcash' ? 'GCash' : 'PayMaya'} payment will be processed after order confirmation. 
              Please have your app ready for payment.
            </p>
          )}
        </section>

        {/* Special Instructions */}
        <section className="space-y-3">
          <Label>{t('specialInstructions')}</Label>
          <Textarea
            placeholder="Any special requests for your order..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="resize-none rounded-xl"
            rows={2}
            data-testid="special-instructions"
          />
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="font-bold mb-3">Order Summary</h3>
          <div className="space-y-2 mb-3">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('deliveryFee')}</span>
              <span>₱{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>{t('total')}</span>
              <span className="text-[#FF6B00]">₱{total.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Place Order Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 max-w-md mx-auto">
        <Button
          className="w-full h-12 btn-primary"
          onClick={handlePlaceOrder}
          disabled={loading || !address.trim()}
          data-testid="place-order-btn"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `${t('placeOrder')} - ₱${total.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}
