import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { 
  MapPin, Search, ShoppingCart, ChevronRight, Star, Clock, 
  Utensils, Flame, Fish, IceCream, Coffee, Cookie, ChefHat, ShoppingBag
} from 'lucide-react';
import { Button } from '../components/ui/button';
import BottomNav from '../components/BottomNav';

const categoryIcons = {
  filipino: Utensils,
  rice_meals: ChefHat,
  street_food: Flame,
  chicken: Utensils,
  pork: Utensils,
  seafood: Fish,
  noodles: Utensils,
  desserts: IceCream,
  drinks: Coffee,
  snacks: Cookie,
};

export default function HomePage() {
  const { t, language, toggleLanguage, user, getCartItemCount, API } = useApp();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [selectedCategory, searchQuery]);

  const loadData = async () => {
    try {
      // Seed data first
      await axios.post(`${API}/seed`);
      
      const [restaurantsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/restaurants`),
        axios.get(`${API}/categories`)
      ]);
      setRestaurants(restaurantsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      const params = {};
      if (selectedCategory) params.cuisine = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const response = await axios.get(`${API}/restaurants`, { params });
      setRestaurants(response.data);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    }
  };

  const cartCount = getCartItemCount();

  return (
    <div className="mobile-container pb-20">
      {/* Header */}
      <header className="app-header px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <p className="text-xs text-muted-foreground">{t('deliverTo')}</p>
              <p className="font-semibold text-sm">Urdaneta City, Pangasinan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="lang-toggle">
              <button 
                className={`lang-toggle-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => language !== 'en' && toggleLanguage()}
                data-testid="lang-en-btn"
              >
                EN
              </button>
              <button 
                className={`lang-toggle-btn ${language === 'tl' ? 'active' : ''}`}
                onClick={() => language !== 'tl' && toggleLanguage()}
                data-testid="lang-tl-btn"
              >
                TL
              </button>
            </div>
            {/* Cart Button */}
            <button 
              className="relative p-2"
              onClick={() => navigate('/cart')}
              data-testid="cart-button"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="search-bar">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Pabili Banner */}
        <div 
          className="pabili-banner cursor-pointer animate-slide-up"
          onClick={() => user ? navigate('/pabili') : navigate('/auth')}
          data-testid="pabili-banner"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-bold text-lg">{t('pabiliService')}</span>
            </div>
            <p className="text-sm text-white/90">{t('pabiliDesc')}</p>
            <Button 
              className="mt-3 bg-white text-[#0284C7] hover:bg-white/90 rounded-full px-4 py-2 h-auto text-sm font-bold"
              data-testid="pabili-cta"
            >
              {t('orderNow')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Categories */}
        <section className="animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">{t('categories')}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-scroll">
            <button
              className={`category-pill shrink-0 ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
              data-testid="category-all"
            >
              <div className="category-pill-icon">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">All</span>
            </button>
            {categories.map((cat) => {
              const IconComponent = categoryIcons[cat.id] || Utensils;
              return (
                <button
                  key={cat.id}
                  className={`category-pill shrink-0 ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                  data-testid={`category-${cat.id}`}
                >
                  <div className="category-pill-icon">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">
                    {language === 'tl' ? cat.name_tl : cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Restaurants */}
        <section className="animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">{t('nearYou')}</h2>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="restaurant-card animate-pulse">
                  <div className="h-32 bg-gray-200"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Utensils className="w-12 h-12" />
              </div>
              <p className="text-muted-foreground">No restaurants found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {restaurants.map((restaurant, index) => (
                <Link
                  key={restaurant.id}
                  to={`/restaurant/${restaurant.id}`}
                  className={`restaurant-card block animate-slide-up stagger-${Math.min(index + 1, 5)}`}
                  data-testid={`restaurant-card-${restaurant.id}`}
                >
                  <div className="restaurant-card-image">
                    <img
                      src={restaurant.image_url || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 food-gradient"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${restaurant.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {restaurant.is_open ? t('openNow') : t('closed')}
                      </span>
                      {restaurant.delivery_fee === 0 && (
                        <span className="badge-free-delivery">Free Delivery</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-base mb-1">{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {restaurant.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium">{restaurant.rating}</span>
                        <span className="text-muted-foreground">({restaurant.total_reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{restaurant.estimated_delivery_time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{t('minOrder')}: ₱{restaurant.min_order}</span>
                      <span>•</span>
                      <span>{t('delivery')}: ₱{restaurant.delivery_fee}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
