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
      setError("Still calculating anti-spam fingerprint. Please wait a moment.");
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Report a Civic Issue</h1>
      <p className="text-slate-600 mb-8">
        Your report will be routed to the appropriate government agency for resolution. Please provide as much detail as possible.
      </p>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-200 space-y-6">
        <Input
          label="Issue Title"
          id="title"
          placeholder="E.g., Pothole on Awolowo Road, Ikoyi"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <Select
          label="Category"
          id="category"
          required
          options={[{ value: '', label: 'Select a category' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        />
        
        <Textarea
          label="Description"
          id="description"
          placeholder="Provide specific details about the issue..."
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="State"
            id="state"
            required
            options={[{ value: '', label: 'Select a state' }, ...states.map(s => ({ value: s, label: s }))]}
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          
          <Select
            label="LGA"
            id="lga"
            required
            disabled={!state}
            options={[{ value: '', label: 'Select an LGA' }, ...lgas.map(l => ({ value: l, label: l }))]}
            value={lga}
            onChange={(e) => setLga(e.target.value)}
          />
        </div>
        
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button 
            type="submit" 
            isLoading={isSubmitting || fingerprintLoading}
            disabled={!title || !categoryId || !description || !state || !lga}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </div>
  );
}
