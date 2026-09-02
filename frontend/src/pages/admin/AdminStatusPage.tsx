import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { getIssue, updateIssueStatus } from '../../api/issues';
import type { Issue } from '../../types';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';

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
    return <div className="text-center py-20">Loading...</div>;
  }

  if (!issue) {
    return <div className="text-center py-20 text-red-500">Issue not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Link to={`/issues/${id}`} className="text-primary-600 hover:underline">
          &larr; Back to Issue
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin: Update Issue Status</h1>
      
      <Card className="mb-8">
        <CardBody>
          <h2 className="text-lg font-bold mb-2">{issue.title}</h2>
          <p className="text-sm text-slate-500 mb-2">Current Status: <span className="font-semibold text-slate-700">{issue.status}</span></p>
        </CardBody>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="font-bold text-slate-800">Update Form</h3>
        </CardHeader>
        <CardBody>
          {message && (
            <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-4">
              <h4 className="text-sm font-semibold text-slate-700">Authentication Required</h4>
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
              label="Status Note (Optional but recommended)"
              placeholder="Why is the status changing? e.g. Work has commenced at the site..."
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            
            <Button type="submit" isLoading={isUpdating} disabled={!username || !password}>
              Update Status
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
