import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function AuthPage() {
  const { user, loading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-[#FF6B00] mb-2" data-testid="auth-title">KainTayo</h1>
          <p className="text-muted-foreground text-sm">Urdaneta City Food Delivery</p>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8 max-w-sm">
          <h2 className="text-lg font-semibold mb-2">Welcome back!</h2>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to order food, deliver, or manage your restaurant.
          </p>
        </div>

        {/* Google Sign In Button */}
        <Button
          onClick={handleGoogleLogin}
          className="w-full max-w-sm h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm flex items-center justify-center gap-3 transition-all"
          data-testid="google-login-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-medium">Continue with Google</span>
        </Button>

        {/* Features */}
        <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm w-full">
          {[
            { icon: '🍜', label: 'Order Food' },
            { icon: '🛵', label: 'Deliver' },
            { icon: '🏪', label: 'Sell Food' },
            { icon: '📦', label: 'Pabili Service' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 text-sm"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-muted-foreground font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </footer>
    </div>
  );
}
