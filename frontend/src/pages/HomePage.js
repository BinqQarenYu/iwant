import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { 
  MapPin, Search, ShoppingCart, ChevronRight, Star, Clock, 
  Utensils, Flame, Fish, IceCream, Coffee, Cookie, ChefHat, ShoppingBag,
  ChevronDown, Percent, Bike
} from 'lucide-react';
import { Button } from '../components/ui/button';
import BottomNav from '../components/BottomNav';
import { LocationSelector, LocationHeader, CoverageMapBanner } from '../components/LocationSelector';

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
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    area: { name: 'Urdaneta City', id: 'urdaneta' },
    barangay: ''
  });
  const [selectedArea, setSelectedArea] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [selectedCategory, searchQuery, selectedArea]);

  const loadData = async () => {
    try {
      // Seed data first
      await axios.post(`${API}/seed`).catch(() => {});
      
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
      
      let filtered = response.data;
      if (selectedArea !== 'all') {
        filtered = filtered.filter(r => 
          r.area?.toLowerCase().includes(selectedArea.toLowerCase())
        );
      }
      setRestaurants(filtered);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    if (location.area) {
      setSelectedArea(location.area.name);
    }
  };

  const cartCount = getCartItemCount();

  // Area filter tabs
  const areaTabs = [
    { id: 'all', name: 'All', name_tl: 'Lahat' },
    { id: 'Urdaneta', name: 'Urdaneta', name_tl: 'Urdaneta' },
    { id: 'Binalonan', name: 'Binalonan', name_tl: 'Binalonan' },
    { id: 'Manaoag', name: 'Manaoag', name_tl: 'Manaoag' },
    { id: 'Villasis', name: 'Villasis', name_tl: 'Villasis' },
  ];

  return (
    <div className="mobile-container pb-20">
      {/* Header */}
      <header className="app-header px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <LocationHeader 
            location={selectedLocation}
            onChangeLocation={() => setShowLocationModal(true)}
          />
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

      <main className="px-4 py-4 space-y-5">
        {/* Coverage Map Banner */}
        <CoverageMapBanner onSelectLocation={() => setShowLocationModal(true)} />

        {/* Promo Banners */}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-scroll">
          {/* Pabili Banner */}
          <div 
            className="pabili-banner cursor-pointer shrink-0 w-[85%] sm:w-[70%]"
            onClick={() => user ? navigate('/pabili') : navigate('/auth')}
            data-testid="pabili-banner"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-bold">{t('pabiliService')}</span>
              </div>
              <p className="text-sm text-white/90 mb-2">{t('pabiliDesc')}</p>
              <span className="inline-flex items-center text-xs bg-white/20 rounded-full px-3 py-1">
                ₱50 {language === 'tl' ? 'bayad sa serbisyo' : 'service fee'}
              </span>
            </div>
          </div>

          {/* Free Delivery Promo */}
          <div className="shrink-0 w-[85%] sm:w-[70%] bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Bike className="w-5 h-5" />
                <span className="font-bold">Free Delivery</span>
              </div>
              <p className="text-sm text-white/90 mb-2">
                {language === 'tl' 
                  ? 'Sa unang order mo!' 
                  : 'On your first order!'
                }
              </p>
              <span className="inline-flex items-center text-xs bg-white/20 rounded-full px-3 py-1">
                Min. ₱300 order
              </span>
            </div>
            <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 text-white/10" />
          </div>
        </div>

        {/* Area Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {areaTabs.map((area) => (
            <button
              key={area.id}
              onClick={() => setSelectedArea(area.id === 'all' ? 'all' : area.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                (selectedArea === 'all' && area.id === 'all') || selectedArea === area.name
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid={`area-tab-${area.id}`}
            >
              {language === 'tl' ? area.name_tl : area.name}
            </button>
          ))}
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
              <span className="text-xs font-medium">
                {language === 'tl' ? 'Lahat' : 'All'}
              </span>
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
            <h2 className="font-bold text-lg">
              {selectedArea !== 'all' ? selectedArea : t('nearYou')}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({restaurants.length})
              </span>
            </h2>
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
              <p className="text-muted-foreground">
                {language === 'tl' 
                  ? 'Walang nahanap na restaurant' 
                  : 'No restaurants found'
                }
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedArea('all');
                  setSearchQuery('');
                }}
              >
                {language === 'tl' ? 'I-clear ang filters' : 'Clear filters'}
              </Button>
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
                  <div className="restaurant-card-image relative">
                    <img
                      src={restaurant.image_url || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 food-gradient"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${restaurant.is_open ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {restaurant.is_open 
                          ? (language === 'tl' ? 'Bukas' : t('openNow'))
                          : (language === 'tl' ? 'Sarado' : t('closed'))
                        }
                      </span>
                      {restaurant.delivery_fee === 0 && (
                        <span className="badge-free-delivery">Free Delivery</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-base">{restaurant.name}</h3>
                      <div className="flex items-center gap-1 bg-[#FF6B00]/10 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 text-[#FF6B00] fill-[#FF6B00]" />
                        <span className="text-xs font-bold text-[#FF6B00]">{restaurant.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {restaurant.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{restaurant.area || 'Urdaneta'}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{restaurant.estimated_delivery_time}</span>
                      </div>
                      <span>•</span>
                      <span>₱{restaurant.delivery_fee} delivery</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleLocationSelect}
      />
    </div>
  );
}
