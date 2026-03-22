import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import BottomNav from '../components/BottomNav';

export default function CartPage() {
  const navigate = useNavigate();
  const { 
    t, cart, cartRestaurant, updateCartItemQuantity, 
    removeFromCart, getCartTotal, clearCart 
  } = useApp();

  const subtotal = getCartTotal();
  const deliveryFee = cartRestaurant?.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="mobile-container pb-20">
        <header className="app-header px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">{t('cart')}</h1>
        </header>

        <div className="empty-state mt-20">
          <div className="empty-state-icon">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h2 className="text-lg font-bold mb-2">{t('emptyCart')}</h2>
          <p className="text-muted-foreground mb-6">{t('startOrdering')}</p>
          <Button 
            className="btn-primary px-8"
            onClick={() => navigate('/')}
            data-testid="browse-btn"
          >
            Browse Restaurants
          </Button>
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="mobile-container pb-48">
      {/* Header */}
      <header className="app-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">{t('cart')}</h1>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-600"
          data-testid="clear-cart-btn"
        >
          Clear All
        </button>
      </header>

      <main className="px-4 py-4">
        {/* Restaurant Info */}
        {cartRestaurant && (
          <div className="bg-white rounded-2xl p-4 mb-4 border border-border">
            <h2 className="font-bold">{cartRestaurant.name}</h2>
            <p className="text-sm text-muted-foreground">{cartRestaurant.address}</p>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-3">
          {cart.map((item, index) => (
            <div 
              key={`${item.menu_item_id}-${index}`}
              className="bg-white rounded-2xl p-4 border border-border flex gap-4"
              data-testid={`cart-item-${index}`}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                {item.special_instructions && (
                  <p className="text-xs text-muted-foreground italic mb-2">
                    "{item.special_instructions}"
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FF6B00]">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="quantity-selector">
                      <button
                        className="quantity-btn"
                        onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                        data-testid={`decrease-${index}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                        data-testid={`increase-${index}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      data-testid={`remove-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 max-w-md mx-auto">
        {/* Summary */}
        <div className="space-y-2 mb-4">
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

        <Button
          className="w-full h-12 btn-primary"
          onClick={() => navigate('/checkout')}
          disabled={subtotal < (cartRestaurant?.min_order || 0)}
          data-testid="checkout-btn"
        >
          {subtotal < (cartRestaurant?.min_order || 0) 
            ? `Minimum order: ₱${cartRestaurant?.min_order}` 
            : `${t('checkout')} - ₱${total.toFixed(2)}`
          }
        </Button>
      </div>
    </div>
  );
}
