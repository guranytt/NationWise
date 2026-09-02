import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';
import type { Issue } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface IssueCardProps {
  issue: Issue;
}

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

export default function IssueCard({ issue }: IssueCardProps) {
  return (
    <Card className="hover:-translate-y-1 transition-transform duration-300">
      <CardBody>
        <div className="flex justify-between items-start mb-4 border-b border-rule pb-3">
          <Badge variant={statusColors[issue.status] || 'neutral'}>
            {statusLabels[issue.status] || issue.status}
          </Badge>
          <div className="flex flex-col items-end">
            <span className="font-sans text-xs text-ink opacity-50 uppercase tracking-widest">
              File No. {issue.id.substring(0, 6).toUpperCase()}
            </span>
            <span className="text-xs text-ink opacity-70 font-sans mt-1">
              {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        
        <Link to={`/issues/${issue.id}`} className="block group mb-4">
          <h3 className="text-xl font-serif font-bold text-ink group-hover:underline mb-2 line-clamp-2 leading-snug">
            {issue.title}
          </h3>
          <p className="text-ink opacity-80 text-sm font-sans line-clamp-3 leading-relaxed">
            {issue.description}
          </p>
        </Link>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          <span className="inline-flex items-center text-xs font-sans text-ink border border-rule px-2 py-1">
            <svg className="w-3 h-3 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            {issue.lga}, {issue.state}
          </span>
          <span className="inline-flex items-center text-xs font-sans text-ink border border-rule px-2 py-1">
            <svg className="w-3 h-3 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
            {issue.category.name}
          </span>
        </div>
      </CardBody>
      <CardFooter className="py-3 flex justify-between items-center bg-transparent">
        <div className="text-xs font-sans text-ink opacity-80">
          <span className="font-semibold uppercase tracking-wider">Assigned to: </span>
          <br/>
          {issue.routed_agency ? issue.routed_agency.name : 'Pending Assignment'}
        </div>
        <Link to={`/issues/${issue.id}`} className="text-xs font-sans font-semibold uppercase tracking-widest text-ink hover:underline">
          View Record &rarr;
        </Link>
      </CardFooter>
    </Card>
  );
}
