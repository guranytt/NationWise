import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { formatDistanceToNow, format } from 'date-fns';
import { getIssue } from '../api/issues';
import type { Issue } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const statusColors: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  submitted: 'neutral',
  acknowledged: 'info',
  in_progress: 'warning',
  resolved: 'success',
  stalled: 'danger',
};

const statusLabels: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  stalled: 'Stalled',
};

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    getIssue(id)
      .then(setIssue)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
        <p className="mt-2 text-slate-500">Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg inline-block text-left mb-6">
          <h2 className="text-lg font-bold mb-2">Error Loading Issue</h2>
          <p>{error || 'Issue not found'}</p>
        </div>
        <div>
          <Link to="/">
            <Button>Return to Feed</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center">
          &larr; Back to Feed
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 md:p-8 border-b border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <Badge variant={statusColors[issue.status]} className="text-sm px-3 py-1">
              {statusLabels[issue.status]}
            </Badge>
            <span className="text-slate-500 text-sm">
              Reported {format(new Date(issue.created_at), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">{issue.title}</h1>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="inline-flex items-center text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {issue.lga}, {issue.state}
            </span>
            <span className="inline-flex items-center text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              {issue.category.name}
            </span>
          </div>
          
          <div className="prose prose-slate max-w-none">
            <p className="whitespace-pre-wrap text-slate-700 text-lg leading-relaxed">
              {issue.description}
            </p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Routing Information</h3>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            {issue.routed_agency ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-slate-500 mb-1">Assigned Agency</span>
                  <span className="block font-semibold text-slate-900">{issue.routed_agency.name}</span>
                </div>
                {issue.routed_agency.contact_email && (
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">Contact Email</span>
                    <a href={`mailto:${issue.routed_agency.contact_email}`} className="text-primary-600 hover:underline">
                      {issue.routed_agency.contact_email}
                    </a>
                  </div>
                )}
                {issue.routed_agency.contact_phone && (
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">Contact Phone</span>
                    <span className="block text-slate-900">{issue.routed_agency.contact_phone}</span>
                  </div>
                )}
                {issue.routed_agency.complaints_portal_url && (
                  <div>
                    <span className="block text-sm font-medium text-slate-500 mb-1">Official Portal</span>
                    <a href={issue.routed_agency.complaints_portal_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Visit Agency Portal &rarr;
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-600 italic">This issue has not been assigned to a specific agency yet.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Status Timeline</h2>
        
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {issue.history?.map((entry, index) => (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary-100 text-primary-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant={statusColors[entry.new_status]}>{statusLabels[entry.new_status]}</Badge>
                  <time className="text-xs text-slate-500 font-medium">
                    {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                  </time>
                </div>
                {entry.note ? (
                  <p className="text-slate-700 text-sm">{entry.note}</p>
                ) : (
                  <p className="text-slate-500 text-sm italic">Status updated to {statusLabels[entry.new_status]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
