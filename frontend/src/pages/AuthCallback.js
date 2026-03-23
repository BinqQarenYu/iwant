import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const { exchangeSession } = useApp();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

      if (!sessionId) {
        navigate('/', { replace: true });
        return;
      }

      try {
        const userData = await exchangeSession(sessionId);
        toast.success(`Welcome, ${userData.name}!`);
        // Clear hash and navigate to home
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/', { replace: true, state: { user: userData } });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/auth', { replace: true });
      }
    };

    processAuth();
  }, [exchangeSession, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
