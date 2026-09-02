import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { formatDistanceToNow, format } from 'date-fns';
import { getIssue } from '../api/issues';
import type { Issue } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const statusColors: Record<string, 'neutral' | 'pending' | 'verified' | 'critical'> = {
  submitted: 'pending',
  acknowledged: 'pending',
  in_progress: 'pending',
  resolved: 'verified',
  stalled: 'critical',
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
      <div className="flex justify-center py-20 font-sans text-sm uppercase tracking-widest text-ink">
        Retrieving File...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="bg-critical/10 text-critical border border-critical/30 p-6 inline-block text-left mb-6 font-sans">
          <h2 className="text-lg font-bold mb-2">Error Loading Issue</h2>
          <p>{error || 'Issue not found'}</p>
        </div>
        <div>
          <Link to="/issues">
            <Button>Return to Feed</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/issues" className="text-ink hover:underline font-sans text-sm inline-flex items-center">
          &larr; Back to Records
        </Link>
      </div>

      <div className="bg-paper border border-rule mb-12">
        <div className="p-8 border-b border-rule">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
               <Badge variant={statusColors[issue.status] || 'neutral'}>
                 {statusLabels[issue.status] || issue.status}
               </Badge>
               <span className="font-sans text-xs text-ink opacity-60 uppercase tracking-widest">
                 File No. {issue.id.substring(0, 8).toUpperCase()}
               </span>
            </div>
            <span className="text-ink opacity-60 text-sm font-sans">
              Filed: {format(new Date(issue.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          
          <h1 className="text-4xl font-serif font-bold text-ink mb-6">{issue.title}</h1>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <span className="inline-flex items-center text-xs font-sans text-ink uppercase tracking-widest border border-rule px-3 py-1">
              <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {issue.lga}, {issue.state}
            </span>
            <span className="inline-flex items-center text-xs font-sans text-ink uppercase tracking-widest border border-rule px-3 py-1">
              <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
              {issue.category.name}
            </span>
          </div>
          
          <div className="font-serif text-ink text-lg leading-relaxed border-l-2 border-rule pl-6">
            <p className="whitespace-pre-wrap">{issue.description}</p>
          </div>
        </div>
        
        <div className="p-8 bg-paper/50">
          <h3 className="font-sans text-xs uppercase tracking-widest text-ink mb-6 border-b border-rule pb-2">Routing Designation</h3>
          
          {issue.routed_agency ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans text-sm">
              <div>
                <span className="block text-ink opacity-60 mb-1">Assigned Agency</span>
                <span className="block font-bold text-ink text-base">{issue.routed_agency.name}</span>
              </div>
              {issue.routed_agency.contact_email && (
                <div>
                  <span className="block text-ink opacity-60 mb-1">Contact Email</span>
                  <a href={`mailto:${issue.routed_agency.contact_email}`} className="text-ink hover:underline font-medium">
                    {issue.routed_agency.contact_email}
                  </a>
                </div>
              )}
              {issue.routed_agency.contact_phone && (
                <div>
                  <span className="block text-ink opacity-60 mb-1">Contact Phone</span>
                  <span className="block text-ink font-medium">{issue.routed_agency.contact_phone}</span>
                </div>
              )}
              {issue.routed_agency.complaints_portal_url && (
                <div>
                  <span className="block text-ink opacity-60 mb-1">Official Portal</span>
                  <a href={issue.routed_agency.complaints_portal_url} target="_blank" rel="noopener noreferrer" className="text-ink hover:underline font-medium">
                    Visit Agency Portal &rarr;
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="text-ink opacity-60 font-sans italic text-sm">Awaiting agency designation.</p>
          )}
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-serif font-bold text-ink mb-6 pb-2 border-b border-rule">Audit Trail</h2>
        
        <div className="border border-rule bg-paper">
           {issue.history?.length === 0 ? (
             <div className="p-6 text-ink opacity-60 font-sans text-sm">No activity recorded yet.</div>
           ) : (
             <div className="flex flex-col">
               {issue.history?.map((entry, index) => (
                 <div key={index} className="flex flex-col md:flex-row border-b border-rule last:border-0 p-6">
                    <div className="w-48 shrink-0 mb-2 md:mb-0">
                      <time className="font-sans text-xs text-ink opacity-60 uppercase tracking-widest block">
                        {format(new Date(entry.changed_at), 'MMM d, yyyy')}
                      </time>
                      <time className="font-sans text-xs text-ink opacity-60 block mt-1">
                        {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                      </time>
                    </div>
                    
                    <div className="flex-1">
                       <div className="mb-2">
                         <Badge variant={statusColors[entry.new_status] || 'neutral'}>
                           {statusLabels[entry.new_status] || entry.new_status}
                         </Badge>
                       </div>
                       {entry.note ? (
                          <p className="font-serif text-ink text-sm leading-relaxed">{entry.note}</p>
                       ) : (
                          <p className="font-sans text-ink opacity-60 text-sm italic">Status automatically logged.</p>
                       )}
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
