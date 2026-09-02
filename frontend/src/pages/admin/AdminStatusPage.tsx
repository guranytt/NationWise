import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { getIssue, updateIssueStatus } from '../../api/issues';
import type { Issue } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export default function AdminStatusPage() {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [newStatus, setNewStatus] = useState<'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'stalled'>('submitted');
  const [note, setNote] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (!id) return;
    
    getIssue(id)
      .then((data) => {
        setIssue(data);
        setNewStatus(data.status as any);
      })
      .catch(err => setMessage({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !username || !password) return;
    
    setIsUpdating(true);
    setMessage(null);
    
    try {
      const credentials = `${username}:${password}`;
      const updatedIssue = await updateIssueStatus(id, { new_status: newStatus, note }, credentials);
      setIssue(updatedIssue);
      setNote('');
      setMessage({ type: 'success', text: 'Issue status successfully updated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status. Check credentials.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-sans text-sm uppercase tracking-widest text-ink">Retrieving File...</div>;
  }

  if (!issue) {
    return <div className="text-center py-20 text-critical font-sans">Issue not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link to={`/issues/${id}`} className="text-ink hover:underline font-sans text-sm">
          &larr; Back to Record
        </Link>
      </div>
      
      <h1 className="text-2xl font-serif font-bold text-ink mb-6 pb-2 border-b border-rule">Admin: Update Record Status</h1>
      
      <div className="bg-paper border border-rule mb-8 p-6">
        <h2 className="text-lg font-serif font-bold mb-2 text-ink">{issue.title}</h2>
        <p className="text-sm text-ink opacity-70 font-sans">Current Status: <span className="font-semibold uppercase tracking-widest">{issue.status}</span></p>
      </div>
      
      <div className="bg-paper border border-rule p-8">
        <h3 className="font-sans text-xs uppercase tracking-widest font-bold text-ink mb-6 pb-2 border-b border-rule">Update Entry</h3>
        
        {message && (
          <div className={`p-4 mb-6 text-sm font-sans border ${message.type === 'success' ? 'bg-verified/10 text-verified border-verified/30' : 'bg-critical/10 text-critical border-critical/30'}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="bg-rule/10 p-4 border border-rule space-y-4">
            <h4 className="font-sans text-xs uppercase tracking-widest font-semibold text-ink">Authentication Required</h4>
            <Input
              label="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Admin Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Select
            label="New Status"
            options={[
              { value: 'submitted', label: 'Submitted' },
              { value: 'acknowledged', label: 'Acknowledged' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'stalled', label: 'Stalled' },
            ]}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as any)}
            required
          />
          
          <Textarea
            label="Status Note (Optional)"
            placeholder="Reason for status change..."
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          
          <div className="pt-4 border-t border-rule">
            <Button type="submit" disabled={isUpdating || !username || !password}>
              {isUpdating ? 'Updating...' : 'Commit Status Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
