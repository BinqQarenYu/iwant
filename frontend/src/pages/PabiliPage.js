import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../contexts/AppContext';
import { 
  ArrowLeft, ShoppingBag, MapPin, Banknote, Wallet, 
  CreditCard, Loader2, ListChecks
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import BottomNav from '../components/BottomNav';

export default function PabiliPage() {
  const navigate = useNavigate();
  const { t, user, API } = useApp();
  
  const [itemsList, setItemsList] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const serviceFee = 50;

  const paymentMethods = [
    { id: 'cod', name: t('cod'), icon: Banknote },
    { id: 'gcash', name: 'GCash', icon: Wallet, color: '#007DFE' },
    { id: 'paymaya', name: 'PayMaya', icon: CreditCard, color: '#00C851' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!itemsList.trim()) {
      toast.error('Please enter the items you need');
      return;
    }
    if (!storeLocation.trim()) {
      toast.error('Please enter the store location');
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }
    if (!estimatedBudget || parseFloat(estimatedBudget) <= 0) {
      toast.error('Please enter an estimated budget');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/pabili`, {
        items_list: itemsList,
        store_location: storeLocation,
        delivery_address: deliveryAddress,
        estimated_budget: parseFloat(estimatedBudget),
        payment_method: paymentMethod,
        notes: notes || null
      });

      toast.success('Pabili request submitted!');
      navigate('/orders');
    } catch (error) {
      console.error('Failed to submit pabili request:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-lg font-bold">{t('pabiliService')}</h1>
      </header>

      <main className="px-4 py-4">
        {/* Pabili Info Banner */}
        <div className="pabili-banner mb-6">
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{t('pabiliService')}</h2>
              <p className="text-sm text-white/90">{t('pabiliDesc')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Items List */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#0284C7]" />
              {t('itemsList')} *
            </Label>
            <Textarea
              placeholder="Example:
- 1kg Rice
- 6 eggs
- 1 can sardines
- 2 sachets of coffee"
              value={itemsList}
              onChange={(e) => setItemsList(e.target.value)}
              className="resize-none rounded-xl min-h-[120px]"
              data-testid="items-list-input"
            />
          </div>

          {/* Store Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0284C7]" />
              {t('storeLocation')} *
            </Label>
            <Input
              placeholder="e.g., Puregold Urdaneta, Savemore Nancayasan"
              value={storeLocation}
              onChange={(e) => setStoreLocation(e.target.value)}
              className="rounded-xl h-12"
              data-testid="store-location-input"
            />
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0284C7]" />
              {t('deliveryAddress')} *
            </Label>
            <Textarea
              placeholder="Your complete delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="resize-none rounded-xl"
              rows={2}
              data-testid="delivery-address-input"
            />
          </div>

          {/* Estimated Budget */}
          <div className="space-y-2">
            <Label>{t('estimatedBudget')} *</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
              <Input
                type="number"
                placeholder="0.00"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                className="rounded-xl h-12 pl-8"
                data-testid="budget-input"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This is the estimated cost of items. You'll pay the actual cost + ₱{serviceFee} service fee.
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>{t('paymentMethod')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === method.id 
                        ? 'border-[#0284C7] bg-[#0284C7]/5' 
                        : 'border-border hover:border-[#0284C7]/50'
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                    data-testid={`payment-${method.id}`}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: method.color || '#0284C7' }}
                    />
                    <span className="text-xs font-medium">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any special instructions for the rider..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none rounded-xl"
              rows={2}
              data-testid="notes-input"
            />
          </div>

          {/* Summary */}
          <div className="bg-[#0284C7]/5 rounded-xl p-4 border border-[#0284C7]/20">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t('estimatedBudget')}</span>
              <span>₱{estimatedBudget || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">{t('serviceFee')}</span>
              <span>₱{serviceFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-[#0284C7]/20">
              <span>Estimated {t('total')}</span>
              <span className="text-[#0284C7]">
                ₱{(parseFloat(estimatedBudget || 0) + serviceFee).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 btn-pabili"
            disabled={loading}
            data-testid="submit-pabili-btn"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>{t('submitRequest')}</>
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
