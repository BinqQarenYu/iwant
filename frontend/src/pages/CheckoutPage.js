import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, MapPin, CreditCard, Banknote, Wallet, Loader2, Tag, X, Check, Percent } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import LocationPicker from '../components/LocationPicker';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t, language, user, cart, cartRestaurant, getCartTotal, clearCart, API } = useApp();
  
  const [address, setAddress] = useState(user?.address || '');
  const [addressCoordinates, setAddressCoordinates] = useState({ lat: null, lng: null });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [showPromos, setShowPromos] = useState(false);

  const subtotal = getCartTotal();
  const deliveryFee = cartRestaurant?.delivery_fee || 0;
  const discount = appliedPromo?.discount_amount || 0;
  const total = subtotal + deliveryFee - discount;

  useEffect(() => {
    loadAvailablePromos();
  }, []);

  const loadAvailablePromos = async () => {
    try {
      const response = await axios.get(`${API}/promo-codes/active`);
      setAvailablePromos(response.data);
    } catch (error) {
      console.error('Failed to load promos:', error);
    }
  };

  useEffect(() => {
    if (!isOrderPlaced && (!cartRestaurant || cart.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [cartRestaurant, cart.length, navigate, isOrderPlaced]);

  const paymentMethods = [
    { id: 'cod', name: t('cod'), icon: Banknote, description: language === 'tl' ? 'Bayad pagdating ng order' : 'Pay when your order arrives' },
    { id: 'gcash', name: 'GCash', icon: Wallet, description: language === 'tl' ? 'Magbayad gamit GCash' : 'Pay with GCash e-wallet', color: '#007DFE' },
    { id: 'paymaya', name: 'Maya', icon: CreditCard, description: language === 'tl' ? 'Magbayad gamit Maya' : 'Pay with Maya', color: '#00C851' },
  ];

  const applyPromoCode = async (code = promoCode) => {
    if (!code.trim()) {
      toast.error(language === 'tl' ? 'Maglagay ng promo code' : 'Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    try {
      const response = await axios.post(`${API}/promo-codes/validate`, {
        code: code.trim(),
        subtotal,
        delivery_fee: deliveryFee,
        area: cartRestaurant?.area || 'Urdaneta City'
      });

      setAppliedPromo(response.data);
      setPromoCode(response.data.code);
      setShowPromos(false);
      toast.success(language === 'tl' 
        ? `Promo code applied! -₱${response.data.discount_amount}` 
        : `Promo applied! You save ₱${response.data.discount_amount}`
      );
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid promo code');
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error(language === 'tl' ? 'Maglagay ng address' : 'Please enter your delivery address');
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
        delivery_lat: addressCoordinates.lat,
        delivery_lng: addressCoordinates.lng,
        area: cartRestaurant?.area || 'Urdaneta City',
        payment_method: paymentMethod,
        promo_code: appliedPromo?.code || null,
        special_instructions: specialInstructions || null
      };

      const response = await axios.post(`${API}/orders`, orderData);
      
      setIsOrderPlaced(true);
      clearCart();
      toast.success(t('orderPlaced'));
      navigate(`/orders/${response.data.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to place order:', error);
      toast.error(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOrderPlaced && (!cartRestaurant || cart.length === 0)) {
    return null;
  }

  return (
    <div className="mobile-container pb-40">
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

      <main className="px-4 py-4 space-y-5">
        {/* Delivery Address */}
        <section className="space-y-3">
          <LocationPicker 
            initialAddress={address} 
            onChange={(loc) => {
              setAddress(loc.address);
              setAddressCoordinates({ lat: loc.lat, lng: loc.lng });
            }}
          />
        </section>

        {/* Promo Code Section */}
        <section className="space-y-3">
          <Label className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#FF6B00]" />
            {language === 'tl' ? 'Promo Code' : 'Promo Code'}
          </Label>
          
          {appliedPromo ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-green-700">{appliedPromo.code}</p>
                    <p className="text-sm text-green-600">{appliedPromo.description}</p>
                  </div>
                </div>
                <button
                  onClick={removePromo}
                  className="p-2 hover:bg-green-100 rounded-full text-green-600"
                  data-testid="remove-promo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-green-700 font-bold">
                -{language === 'tl' ? '₱' : '₱'}{appliedPromo.discount_amount.toFixed(2)} {language === 'tl' ? 'discount' : 'off'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={language === 'tl' ? "Ilagay ang promo code" : "Enter promo code"}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="rounded-xl h-12 uppercase"
                  data-testid="promo-input"
                />
                <Button
                  onClick={() => applyPromoCode()}
                  disabled={promoLoading || !promoCode.trim()}
                  className="h-12 px-6 btn-primary"
                  data-testid="apply-promo-btn"
                >
                  {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'tl' ? 'Gamitin' : 'Apply')}
                </Button>
              </div>

              {/* Available Promos */}
              {availablePromos.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPromos(!showPromos)}
                    className="text-sm text-[#FF6B00] font-medium flex items-center gap-1"
                    data-testid="view-promos-btn"
                  >
                    <Percent className="w-4 h-4" />
                    {language === 'tl' 
                      ? `${availablePromos.length} available na promo` 
                      : `${availablePromos.length} promos available`
                    }
                  </button>
                  
                  {showPromos && (
                    <div className="mt-3 space-y-2 animate-fade-in">
                      {availablePromos.map((promo) => (
                        <button
                          key={promo.code}
                          onClick={() => {
                            setPromoCode(promo.code);
                            applyPromoCode(promo.code);
                          }}
                          className="w-full p-3 rounded-xl border-2 border-dashed border-[#FF6B00]/30 bg-[#FF6B00]/5 text-left hover:border-[#FF6B00]/50 transition-colors"
                          data-testid={`promo-${promo.code}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#FF6B00]">{promo.code}</span>
                            {promo.first_order_only && (
                              <span className="text-xs bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
                                {language === 'tl' ? 'Unang order' : 'First order'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{promo.description}</p>
                          {promo.min_order > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Min. order: ₱{promo.min_order}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
              {language === 'tl'
                ? `Ang ${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} payment ay i-process pagkatapos ma-confirm ang order.`
                : `${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} payment will be processed after order confirmation.`
              }
            </p>
          )}
        </section>

        {/* Special Instructions */}
        <section className="space-y-3">
          <Label>{t('specialInstructions')}</Label>
          <Textarea
            placeholder={language === 'tl' 
              ? "Mga espesyal na instruksiyon para sa iyong order..." 
              : "Any special requests for your order..."
            }
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="resize-none rounded-xl"
            rows={2}
            data-testid="special-instructions"
          />
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-2xl p-4 border border-border">
          <h3 className="font-bold mb-3">
            {language === 'tl' ? 'Buod ng Order' : 'Order Summary'}
          </h3>
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
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {language === 'tl' ? 'Discount' : 'Discount'} ({appliedPromo?.code})
                </span>
                <span>-₱{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>{t('total')}</span>
              <span className="text-[#FF6B00]">₱{total.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Place Order Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 max-w-md mx-auto">
        {discount > 0 && (
          <p className="text-center text-sm text-green-600 mb-2 font-medium">
            🎉 {language === 'tl' ? 'Nakatipid ka ng' : "You're saving"} ₱{discount.toFixed(2)}!
          </p>
        )}
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
