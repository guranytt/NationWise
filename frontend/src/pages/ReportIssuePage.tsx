import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getCategories, getStates, getLgas, createIssue } from '../api/issues';
import type { Category } from '../types';
import { useFingerprint } from '../hooks/useFingerprint';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const { visitorId, isLoading: fingerprintLoading } = useFingerprint();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getCategories(),
      getStates(),
    ]).then(([cats, stts]) => {
      setCategories(cats);
      setStates(stts);
    });
  }, []);

  useEffect(() => {
    if (state) {
      getLgas(state).then(setLgas).catch(() => setLgas([]));
      setLga('');
    } else {
      setLgas([]);
    }
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorId) {
      setError("Still calculating fingerprint. Please wait a moment.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const newIssue = await createIssue({
        title,
        description,
        category_id: categoryId,
        state,
        lga,
        fingerprint_visitor_id: visitorId,
      });
      
      navigate(`/issues/${newIssue.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 border-b border-rule pb-4">
        <h1 className="text-4xl font-serif text-ink mb-2">File Public Report</h1>
        <p className="text-ink opacity-70 font-sans">
          This record will be officially routed to the respective agency.
        </p>
      </div>
      
      {error && (
        <div className="bg-critical/10 border border-critical/30 p-4 mb-8 font-sans text-sm text-critical">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-paper border border-rule p-8 space-y-6">
        <Input
          label="Record Title"
          id="title"
          placeholder="E.g., Pothole on Awolowo Road, Ikoyi"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <Select
          label="Classification"
          id="category"
          required
          options={[{ value: '', label: 'Select classification' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        />
        
        <Textarea
          label="Detailed Description"
          id="description"
          placeholder="Provide specific details about the issue..."
          required
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-rule">
          <Select
            label="State"
            id="state"
            required
            options={[{ value: '', label: 'Select a state' }, ...states.map(s => ({ value: s, label: s }))]}
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          
          <Select
            label="L.G.A"
            id="lga"
            required
            disabled={!state}
            options={[{ value: '', label: 'Select an LGA' }, ...lgas.map(l => ({ value: l, label: l }))]}
            value={lga}
            onChange={(e) => setLga(e.target.value)}
          />
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <span className="font-sans text-xs text-ink opacity-60 uppercase tracking-widest">Record will be public</span>
          <Button 
            type="submit" 
            disabled={isSubmitting || fingerprintLoading || !title || !categoryId || !description || !state || !lga}
          >
            {isSubmitting ? 'Filing...' : 'Submit to Registry'}
          </Button>
        </div>
      </form>
    </div>
  );
}
