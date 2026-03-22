import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { MapPin, ChevronDown, Check, Navigation, X } from 'lucide-react';
import { Button } from './ui/button';

// Coverage areas data
const COVERAGE_AREAS = [
  {
    id: "urdaneta",
    name: "Urdaneta City",
    name_tl: "Lungsod ng Urdaneta",
    type: "city",
    is_primary: true,
    lat: 15.9761,
    lng: 120.5711,
    delivery_fee: 30.0,
    barangays: ["Poblacion", "Nancayasan", "San Vicente", "Cabuloan", "Cabaruan", "Consolacion"]
  },
  {
    id: "binalonan",
    name: "Binalonan",
    type: "municipality",
    lat: 16.0525,
    lng: 120.5969,
    delivery_fee: 45.0,
    barangays: ["Poblacion", "Balangobong", "San Felipe"]
  },
  {
    id: "asingan",
    name: "Asingan",
    type: "municipality",
    lat: 16.0042,
    lng: 120.6683,
    delivery_fee: 50.0,
    barangays: ["Poblacion", "Ariston East", "Ariston West"]
  },
  {
    id: "villasis",
    name: "Villasis",
    type: "municipality",
    lat: 15.9083,
    lng: 120.5878,
    delivery_fee: 45.0,
    barangays: ["Poblacion", "Bacag", "Puelay"]
  },
  {
    id: "manaoag",
    name: "Manaoag",
    type: "municipality",
    lat: 16.0439,
    lng: 120.4861,
    delivery_fee: 50.0,
    barangays: ["Poblacion", "Babasit", "Licsi"]
  },
  {
    id: "san_manuel",
    name: "San Manuel",
    type: "municipality",
    lat: 15.9883,
    lng: 120.6644,
    delivery_fee: 45.0,
    barangays: ["Poblacion", "San Antonio", "San Roque"]
  },
  {
    id: "pozorrubio",
    name: "Pozorrubio",
    type: "municipality",
    lat: 16.1094,
    lng: 120.5489,
    delivery_fee: 55.0,
    barangays: ["Poblacion", "Alipangpang", "Balacag"]
  },
  {
    id: "sison",
    name: "Sison",
    type: "municipality",
    lat: 16.1742,
    lng: 120.5117,
    delivery_fee: 60.0,
    barangays: ["Poblacion", "Amagbagan", "Artacho"]
  }
];

export const LocationSelector = ({ isOpen, onClose, onSelectLocation }) => {
  const { language } = useApp();
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAreas = COVERAGE_AREAS.filter(area => 
    area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    area.barangays.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = () => {
    if (selectedArea) {
      onSelectLocation({
        area: selectedArea,
        barangay: selectedBarangay,
        fullAddress: selectedBarangay 
          ? `${selectedBarangay}, ${selectedArea.name}, Pangasinan`
          : `${selectedArea.name}, Pangasinan`
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Select Delivery Location</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            data-testid="close-location-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="search-bar">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search area or barangay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none"
              data-testid="location-search"
            />
          </div>
        </div>

        {/* Map Preview */}
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          <img 
            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/120.5711,15.9761,10,0/600x300?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
            alt="Urdaneta Map"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-sm font-medium">Serving Urdaneta City & Nearby Areas</p>
            <p className="text-xs text-muted-foreground">Pangasinan, Philippines</p>
          </div>
        </div>

        {/* Areas List */}
        <div className="overflow-y-auto max-h-[40vh] p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            Coverage Areas
          </p>
          <div className="space-y-2">
            {filteredAreas.map((area) => (
              <div key={area.id}>
                <button
                  onClick={() => {
                    setSelectedArea(area);
                    setSelectedBarangay('');
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedArea?.id === area.id 
                      ? 'bg-[#FF6B00]/10 border-2 border-[#FF6B00]' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  data-testid={`area-${area.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    area.is_primary ? 'bg-[#FF6B00] text-white' : 'bg-gray-200'
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">
                      {area.name}
                      {area.is_primary && (
                        <span className="ml-2 text-xs bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
                          Main
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {area.type === 'city' ? 'City' : 'Municipality'} • ₱{area.delivery_fee} delivery
                    </p>
                  </div>
                  {selectedArea?.id === area.id && (
                    <Check className="w-5 h-5 text-[#FF6B00]" />
                  )}
                </button>

                {/* Barangays */}
                {selectedArea?.id === area.id && area.barangays.length > 0 && (
                  <div className="ml-12 mt-2 space-y-1">
                    {area.barangays.map((brgy) => (
                      <button
                        key={brgy}
                        onClick={() => setSelectedBarangay(brgy)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${
                          selectedBarangay === brgy 
                            ? 'bg-[#FF6B00]/10 text-[#FF6B00] font-medium' 
                            : 'hover:bg-gray-50'
                        }`}
                        data-testid={`barangay-${brgy}`}
                      >
                        {brgy}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-border p-4">
          <Button
            onClick={handleSelect}
            disabled={!selectedArea}
            className="w-full h-12 btn-primary"
            data-testid="confirm-location"
          >
            <Navigation className="w-5 h-5 mr-2" />
            {selectedArea 
              ? `Deliver to ${selectedBarangay || selectedArea.name}`
              : 'Select a location'
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export const LocationHeader = ({ location, onChangeLocation }) => {
  const { t } = useApp();
  
  return (
    <button 
      onClick={onChangeLocation}
      className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
      data-testid="location-header"
    >
      <div className="w-8 h-8 rounded-full bg-[#FF6B00]/10 flex items-center justify-center">
        <MapPin className="w-4 h-4 text-[#FF6B00]" />
      </div>
      <div className="text-left">
        <p className="text-xs text-muted-foreground">{t('deliverTo')}</p>
        <div className="flex items-center gap-1">
          <p className="font-semibold text-sm">
            {location?.barangay || location?.area?.name || 'Urdaneta City'}
          </p>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
};

export const CoverageMapBanner = ({ onSelectLocation }) => {
  const { language } = useApp();
  
  return (
    <div 
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      onClick={onSelectLocation}
      data-testid="coverage-map-banner"
    >
      {/* Map Background */}
      <div className="h-32 bg-gradient-to-br from-[#0284C7] to-[#0369A1] relative">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 150" className="w-full h-full">
            {/* Simplified map paths representing roads */}
            <path d="M0,75 L400,75" stroke="white" strokeWidth="2" fill="none" />
            <path d="M200,0 L200,150" stroke="white" strokeWidth="2" fill="none" />
            <path d="M100,50 L300,100" stroke="white" strokeWidth="1" fill="none" />
            <path d="M50,100 L350,50" stroke="white" strokeWidth="1" fill="none" />
            {/* Location markers */}
            <circle cx="200" cy="75" r="8" fill="#FF6B00" />
            <circle cx="200" cy="75" r="12" fill="none" stroke="#FF6B00" strokeWidth="2" opacity="0.5" />
            <circle cx="150" cy="60" r="4" fill="white" opacity="0.7" />
            <circle cx="250" cy="90" r="4" fill="white" opacity="0.7" />
            <circle cx="180" cy="100" r="4" fill="white" opacity="0.7" />
            <circle cx="220" cy="50" r="4" fill="white" opacity="0.7" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <div className="text-white">
            <h3 className="font-bold text-lg">
              {language === 'tl' ? 'Saan ka sa Pangasinan?' : 'Where in Pangasinan?'}
            </h3>
            <p className="text-sm text-white/80">
              {language === 'tl' 
                ? 'Urdaneta at mga katabing bayan' 
                : 'Urdaneta & surrounding towns'
              }
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 group-hover:bg-white/30 transition-colors">
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">
              {language === 'tl' ? 'Pumili' : 'Select'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Coverage list */}
      <div className="bg-white p-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
        {['Urdaneta', 'Binalonan', 'Villasis', 'Manaoag', 'Asingan', 'Pozorrubio'].map((town, i) => (
          <span 
            key={town}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
              i === 0 
                ? 'bg-[#FF6B00] text-white font-medium' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {town}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LocationSelector;
