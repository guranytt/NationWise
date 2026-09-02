import { useState, useEffect } from 'react';
import { getIssues, getCategories, getStates } from '../api/issues';
import type { Issue, Category } from '../types';
import IssueCard from '../components/issues/IssueCard';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export default function IssueFeedPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryId, setCategoryId] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    Promise.all([
      getCategories(),
      getStates(),
    ]).then(([cats, stts]) => {
      setCategories(cats);
      setStates(stts);
    });
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryId) params.category_id = categoryId;
      if (state) params.state = state;
      if (status) params.status = status;
      
      const data = await getIssues(params);
      setIssues(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [categoryId, state, status]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Civic Issues Feed</h1>
          <p className="text-slate-600">Track and monitor infrastructure issues reported across Nigeria.</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
        <Select
          options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        />
        <Select
          options={[{ value: '', label: 'All States' }, ...states.map(s => ({ value: s, label: s }))]}
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'stalled', label: 'Stalled' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Button variant="secondary" onClick={() => { setCategoryId(''); setState(''); setStatus(''); }}>
          Reset
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-slate-500">Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-500">No issues found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
