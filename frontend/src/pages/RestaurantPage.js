import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { 
  ArrowLeft, Star, Clock, MapPin, Phone, Plus, Minus, ShoppingCart, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, user, addToCart, getCartItemCount, API } = useApp();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    loadRestaurant();
  }, [id]);

  const loadRestaurant = async () => {
    try {
      const response = await axios.get(`${API}/restaurants/${id}`);
      setRestaurant(response.data.restaurant);
      setMenu(response.data.menu);
    } catch (error) {
      console.error('Failed to load restaurant:', error);
      toast.error('Restaurant not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/restaurant/${id}` } } });
      return;
    }
    
    addToCart(selectedItem, restaurant, quantity, specialInstructions);
    toast.success(`${selectedItem.name} added to cart!`);
    setSelectedItem(null);
    setQuantity(1);
    setSpecialInstructions('');
  };

  // Group menu items by category
  const menuByCategory = menu.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const cartCount = getCartItemCount();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <div className="mobile-container pb-24">
      {/* Header Image */}
      <div className="relative h-56">
        <img
          src={restaurant.image_url || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 food-gradient"></div>
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="relative w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg"
            data-testid="cart-btn"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h1 className="text-2xl font-bold mb-1">{restaurant.name}</h1>
          <p className="text-sm text-white/90 line-clamp-2">{restaurant.description}</p>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="px-4 py-4 bg-white border-b border-border">
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{restaurant.rating}</span>
            <span className="text-muted-foreground">({restaurant.total_reviews} {t('reviews')})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{restaurant.estimated_delivery_time}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${restaurant.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {restaurant.is_open ? t('openNow') : t('closed')}
          </span>
          <span className="text-muted-foreground">{t('minOrder')}: ₱{restaurant.min_order}</span>
          <span className="text-muted-foreground">{t('delivery')}: ₱{restaurant.delivery_fee}</span>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 py-4">
        <h2 className="text-xl font-bold mb-4">{t('menu')}</h2>
        
        {Object.entries(menuByCategory).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
              {category}
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="food-card flex gap-4 p-3 cursor-pointer"
                  onClick={() => {
                    setSelectedItem(item);
                    setQuantity(1);
                    setSpecialInstructions('');
                  }}
                  data-testid={`menu-item-${item.id}`}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#FF6B00]">₱{item.price}</span>
                      <button
                        className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center"
                        data-testid={`add-item-${item.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Footer */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border max-w-md mx-auto">
          <Button
            className="w-full h-12 btn-primary flex items-center justify-center gap-2"
            onClick={() => navigate('/cart')}
            data-testid="view-cart-btn"
          >
            <ShoppingCart className="w-5 h-5" />
            {t('viewCart')} ({cartCount})
          </Button>
        </div>
      )}

      {/* Add to Cart Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Item Image */}
            {selectedItem.image_url && (
              <div className="relative h-48">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
                  data-testid="close-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="p-5">
              <h3 className="text-xl font-bold mb-1">{selectedItem.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{selectedItem.description}</p>
              
              {/* Special Instructions */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">
                  {t('specialInstructions')}
                </label>
                <Textarea
                  placeholder="e.g., No onions, extra spicy..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="resize-none"
                  rows={2}
                  data-testid="special-instructions"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">{t('quantity')}</span>
                <div className="quantity-selector">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    data-testid="decrease-qty"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="increase-qty"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                className="w-full h-12 btn-primary"
                onClick={handleAddToCart}
                data-testid="add-to-cart-btn"
              >
                {t('addToCart')} - ₱{(selectedItem.price * quantity).toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
