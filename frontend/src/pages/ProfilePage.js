import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { 
  ArrowLeft, User, Phone, MapPin, LogOut, ChevronRight, 
  Globe, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import BottomNav from '../components/BottomNav';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, user, setUser, logout, language, toggleLanguage, API } = useApp();
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API}/auth/profile`, {
        name: name.trim(),
        address: address.trim() || null
      });
      setUser(response.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const roleLabels = {
    customer: 'Customer',
    merchant: 'Restaurant Owner',
    rider: 'Delivery Rider',
    admin: 'Administrator'
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
        <h1 className="text-lg font-bold">{t('profile')}</h1>
      </header>

      <main className="px-4 py-4 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 flex items-center justify-center overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[#FF6B00]" />
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-bold text-lg mb-1"
                  data-testid="name-input"
                />
              ) : (
                <h2 className="font-bold text-lg">{user?.name}</h2>
              )}
              <p className="text-sm text-muted-foreground">{roleLabels[user?.role]}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 py-3 border-t border-border">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3 py-3 border-t border-border">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{t('deliveryAddress')}</p>
              {editing ? (
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your default delivery address"
                  className="resize-none mt-1"
                  rows={2}
                  data-testid="address-input"
                />
              ) : (
                <p className="font-medium">{user?.address || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Edit/Save Button */}
          <div className="pt-3 border-t border-border">
            {editing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditing(false);
                    setName(user?.name || '');
                    setAddress(user?.address || '');
                  }}
                  data-testid="cancel-edit-btn"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 btn-primary"
                  onClick={handleSave}
                  disabled={loading}
                  data-testid="save-btn"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEditing(true)}
                data-testid="edit-profile-btn"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Language */}
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            onClick={toggleLanguage}
            data-testid="language-toggle"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span>Language</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {language === 'en' ? 'English' : 'Filipino'}
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </button>

          {/* Dashboard Link (for restaurant owners, drivers, admins) */}
          {user?.role !== 'customer' && (
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t border-border"
              onClick={() => navigate(`/dashboard/${user?.role === 'merchant' ? 'restaurant' : user?.role}`)}
              data-testid="dashboard-link"
            >
              <span>Go to Dashboard</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          {/* Logout */}
          <button
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors border-t border-border text-red-500"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          KainTayo v1.0.0 • Urdaneta City
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
