import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { fetchJson } from '../api/client';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TrackedItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  icon: string | null;
}

interface NationalAverage {
  item_id: string;
  name: string;
  unit: string;
  category: string;
  average_price: number;
  data_points: number;
}

export default function StateOfNationPage() {
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [averages, setAverages] = useState<NationalAverage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedItem, setSelectedItem] = useState('');
  const [price, setPrice] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, avgRes] = await Promise.all([
        fetchJson<TrackedItem[]>('/prices/items'),
        fetchJson<{data: NationalAverage[]}>('/prices/national')
      ]);
      setItems(itemsRes);
      setAverages(avgRes.data);
    } catch (err) {
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !price || !state) return;
    
    setSubmitting(true);
    try {
      await fetchJson('/prices/submit', {
        method: 'POST',
        body: JSON.stringify({
          item_id: selectedItem,
          price: parseFloat(price),
          state,
          lga: null,
          fingerprint_hash: localStorage.getItem('nw_fingerprint') || 'default-anon-hash'
        })
      });
      toast.success('Price submitted successfully!');
      setPrice('');
      loadData(); // Refresh averages
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit price. You might have hit the weekly limit.');
    } finally {
      setSubmitting(false);
    }
  };

  const states = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", 
    "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", 
    "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", 
    "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
  ];

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nw-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-nw-text-light dark:text-nw-text-dark">
          State of the Nation
        </h1>
        <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted text-lg">
          Crowdsourced, real-time price tracking of essential household commodities across Nigeria. Data is validated weekly using outlier filtering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Market Data View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-semibold flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-nw-primary" />
              National Averages
            </h2>
            <Badge variant="primary" className="animate-pulse">Live Data</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(item => {
              const avg = averages.find(a => a.item_id === item.id);
              return (
                <GlassCard key={item.id} hoverEffect className="p-5 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-nw-text-light-muted dark:text-nw-text-dark-muted">{item.unit}</p>
                    </div>
                    <Badge variant={item.category === 'Food' ? 'success' : item.category === 'Fuel' ? 'warning' : 'secondary'}>
                      {item.category}
                    </Badge>
                  </div>
                  
                  {avg ? (
                    <div>
                      <div className="text-3xl font-bold text-nw-primary dark:text-nw-primary-light">
                        ₦{avg.average_price.toLocaleString()}
                      </div>
                      <p className="text-xs text-nw-text-light-muted dark:text-nw-text-dark-muted mt-1">
                        Based on {avg.data_points} verified submissions this month
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-nw-text-light-muted dark:text-nw-text-dark-muted italic py-2">
                      Not enough data yet.
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Submission Form */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-24">
            <h3 className="text-xl font-semibold mb-2">Contribute Data</h3>
            <p className="text-sm text-nw-text-light-muted dark:text-nw-text-dark-muted mb-6">
              Help us track the true cost of living. Submissions are limited to once per week per item to prevent spam.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Item</label>
                <select 
                  className="input-field"
                  value={selectedItem}
                  onChange={e => setSelectedItem(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose an item...</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <select 
                  className="input-field"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  required
                >
                  <option value="" disabled>Where did you buy it?</option>
                  {states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Current Price (₦)</label>
                <input 
                  type="number" 
                  className="input-field"
                  placeholder="e.g. 1500"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  min="1"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full btn-primary py-3 mt-2 flex justify-center items-center"
              >
                {submitting ? 'Submitting...' : 'Submit Price'}
              </button>
              
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start">
                <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Data integrity is important. Outlier submissions that fall significantly outside the interquartile range (IQR) for a state are automatically filtered out.
                </p>
              </div>
            </form>
          </GlassCard>
        </div>
        
      </div>
    </div>
  );
}
