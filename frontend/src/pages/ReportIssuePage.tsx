import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { getCategories } from '../api/categories';
import { getStates, getLgas } from '../api/locations';
import { createIssue } from '../api/issues';
import GlassCard from '../components/ui/GlassCard';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportIssuePage() {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
    getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (state) {
      getLgas(state).then(setLgas).catch(() => setLgas([]));
      setLga('');
    } else {
      setLgas([]);
      setLga('');
    }
  }, [state]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await createIssue({
        title,
        description,
        category_id: categoryId,
        state,
        lga: lga || '',
        fingerprint_visitor_id: localStorage.getItem('nw_visitor_id') || 'anon-' + Math.random().toString(36).substring(7),
      });
      setSuccess(true);
      toast.success("Issue reported successfully!");
    } catch (err) {
      toast.error("Failed to report issue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in fade-in zoom-in duration-500">
        <GlassCard className="p-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-nw-text-light dark:text-nw-text-dark mb-4">
            Report Submitted
          </h2>
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted mb-8">
            Thank you for bringing this to our attention. An email has been dispatched to the relevant agency automatically.
          </p>
          <button 
            onClick={() => {
              setSuccess(false);
              setTitle('');
              setDescription('');
              setCategoryId('');
            }}
            className="btn-primary"
          >
            Submit Another Report
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold text-nw-text-light dark:text-nw-text-dark mb-3">
          Report an Issue
        </h1>
        <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted">
          Your report will be publicly visible and automatically routed to the responsible government agency via email.
        </p>
      </div>

      <GlassCard className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-2">Issue Title</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Briefly describe the issue..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium mb-2">Detailed Description</label>
              <textarea
                required
                rows={5}
                className="input-field resize-none"
                placeholder="Provide as much detail as possible to help agencies identify the problem..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                required
                className="input-field"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="" disabled>Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <select
                required
                className="input-field"
                value={state}
                onChange={e => setState(e.target.value)}
              >
                <option value="" disabled>Select State</option>
                {states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {lgas.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Local Government Area (Optional)</label>
                <select
                  className="input-field"
                  value={lga}
                  onChange={e => setLga(e.target.value)}
                >
                  <option value="">Select LGA</option>
                  {lgas.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center text-xs text-nw-text-light-muted dark:text-nw-text-dark-muted">
              <AlertCircle className="w-4 h-4 mr-2" />
              Your IP is recorded to prevent spam.
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center px-8"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
