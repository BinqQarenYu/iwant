import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';

export default function AuthPage() {
  const { t, sendOtp, login, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState('phone'); // phone, otp, register
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = phone.startsWith('+63') ? phone : `+63${phone.replace(/^0/, '')}`;
      const result = await sendOtp(formattedPhone);
      setPhone(formattedPhone);
      setDebugOtp(result.debug_otp); // For testing - remove in production
      setStep('otp');
      toast.success('OTP sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await login(phone, otp, name || null, role);
      if (result.is_new && !name) {
        setStep('register');
        setLoading(false);
        return;
      }
      toast.success('Welcome to KainTayo!');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      if (error.response?.data?.detail?.includes('Name is required')) {
        setStep('register');
      } else {
        toast.error(error.response?.data?.detail || 'Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await login(phone, otp, name, role);
      toast.success('Welcome to KainTayo!');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
      // Reset to OTP step to get new OTP
      setStep('phone');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button 
          onClick={() => step === 'phone' ? navigate('/') : setStep('phone')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 py-8">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#FF6B00] mb-2">KainTayo</h1>
          <p className="text-muted-foreground">Urdaneta City Food Delivery</p>
        </div>

        {/* Phone Step */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phoneNumber')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  data-testid="phone-input"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll send you a verification code via SMS
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>I want to</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'customer', label: 'Order Food', icon: '🍜' },
                  { value: 'restaurant_owner', label: 'Sell Food', icon: '🏪' },
                  { value: 'driver', label: 'Deliver', icon: '🛵' },
                  { value: 'admin', label: 'Manage', icon: '⚙️' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      role === option.value 
                        ? 'border-[#FF6B00] bg-[#FF6B00]/5' 
                        : 'border-border hover:border-[#FF6B00]/50'
                    }`}
                    onClick={() => setRole(option.value)}
                    data-testid={`role-${option.value}`}
                  >
                    <span className="text-2xl mb-1 block">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 btn-primary"
              disabled={loading}
              data-testid="send-otp-btn"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('sendOtp')}
            </Button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
            <div className="space-y-2 text-center">
              <Label>{t('enterOtp')}</Label>
              <p className="text-sm text-muted-foreground">
                Sent to {phone}
              </p>
              {debugOtp && (
                <p className="text-xs text-[#FF6B00] bg-[#FF6B00]/10 px-3 py-1 rounded-full inline-block">
                  Debug OTP: {debugOtp}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                data-testid="otp-input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 btn-primary"
              disabled={loading || otp.length !== 6}
              data-testid="verify-otp-btn"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('verifyOtp')}
            </Button>

            <button
              type="button"
              className="w-full text-center text-sm text-[#FF6B00] hover:underline"
              onClick={() => {
                setStep('phone');
                setOtp('');
              }}
              data-testid="change-phone-btn"
            >
              Change phone number
            </button>
          </form>
        )}

        {/* Register Step */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Almost there!</h2>
              <p className="text-sm text-muted-foreground">Tell us your name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl"
                data-testid="name-input"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 btn-primary"
              disabled={loading || !name.trim()}
              data-testid="register-btn"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
            </Button>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </footer>
    </div>
  );
}
