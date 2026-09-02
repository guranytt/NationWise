import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { getCompareCandidates } from '../../api/candidates';
import type { CandidateDetail } from '../../api/candidates';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import CountUp from '../../components/ui/CountUp';

const COLORS = ['#1C1A16', '#1E5945', '#B8802E', '#9A3B2C'];

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const [candidates, setCandidates] = useState<CandidateDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const ids = searchParams.get('ids')?.split(',') || [];

  useEffect(() => {
    if (ids.length > 0) {
      getCompareCandidates(ids)
        .then(setCandidates)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [ids.join(',')]);

  if (loading) return (
    <div className="flex justify-center py-20 font-sans text-sm uppercase tracking-widest text-ink">
      Retrieving Files...
    </div>
  );

  if (ids.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif text-ink mb-4">Cross-Reference Registry</h2>
        <p className="text-ink opacity-70 font-sans mb-6">Select at least two candidate records to cross-reference their dossiers.</p>
        <Link to="/candidates" className="px-6 py-2 border border-ink text-ink font-sans text-sm hover:bg-ink hover:text-paper transition-colors">
          Open Registry Directory
        </Link>
      </div>
    );
  }

  // Build combined chart data
  const chartData = [
    { subject: 'Transparency', fullMark: 100 },
    { subject: 'Track Record', fullMark: 100 },
    { subject: 'Integrity', fullMark: 100 },
    { subject: 'Perception', fullMark: 100 },
    { subject: 'Policy', fullMark: 100 },
  ].map(dimension => {
    const dataPoint: any = { subject: dimension.subject, fullMark: dimension.fullMark };
    candidates.forEach((c) => {
      const score = c.score;
      if (score) {
        if (dimension.subject === 'Transparency') dataPoint[c.candidate.full_name] = score.transparency_score;
        if (dimension.subject === 'Track Record') dataPoint[c.candidate.full_name] = score.track_record_score;
        if (dimension.subject === 'Integrity') dataPoint[c.candidate.full_name] = score.financial_score;
        if (dimension.subject === 'Perception') dataPoint[c.candidate.full_name] = score.public_trust_score;
        if (dimension.subject === 'Policy') dataPoint[c.candidate.full_name] = score.governance_score;
      } else {
        dataPoint[c.candidate.full_name] = 0;
      }
    });
    return dataPoint;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end border-b border-rule pb-4 mb-8">
         <h1 className="text-3xl font-serif text-ink">Cross-Reference</h1>
         <Link to="/candidates" className="font-sans text-sm text-ink hover:underline">
           &larr; Back to Directory
         </Link>
      </div>
      
      <div className="border border-rule bg-paper mb-12 p-8 flex flex-col items-center">
        <h3 className="font-sans text-xs uppercase tracking-widest text-ink mb-6 border-b border-rule pb-2 w-full text-center">Composite Overlay</h3>
        <div className="w-full max-w-2xl h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#C9C4B4" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#1C1A16', fontSize: 11, fontFamily: 'IBM Plex Sans' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {candidates.map((c, idx) => (
                <Radar 
                  key={c.candidate.id}
                  name={c.candidate.full_name} 
                  dataKey={c.candidate.full_name} 
                  stroke={COLORS[idx % COLORS.length]} 
                  fill={COLORS[idx % COLORS.length]} 
                  fillOpacity={0.15} 
                  isAnimationActive={true}
                />
              ))}
              <Legend wrapperStyle={{ fontFamily: 'IBM Plex Sans', fontSize: '12px' }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-rule bg-paper flex flex-col md:flex-row">
        {candidates.map((c, idx) => (
          <div key={c.candidate.id} className={`flex-1 p-8 ${idx > 0 ? 'border-t md:border-t-0 md:border-l border-rule' : ''}`}>
             <div className="mb-6 pb-4 border-b border-rule flex justify-between items-start">
               <span className="font-sans text-xs text-ink opacity-60">File No. {c.candidate.id.substring(0, 8).toUpperCase()}</span>
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-serif font-bold text-ink mb-1">{c.candidate.full_name}</h2>
              <div className="font-sans text-sm text-ink uppercase tracking-wider mb-2 opacity-80">
                {c.candidate.party}
              </div>
              <div className="font-sans text-sm text-ink opacity-80">
                {c.candidate.position_sought} &bull; {c.candidate.state}
              </div>
            </div>

            <div className="mb-8 text-center">
               <div className="font-sans text-xs uppercase tracking-widest text-ink mb-2">Composite Score</div>
               <div className="text-5xl font-serif text-ink">
                  {c.score ? <CountUp end={c.score.overall_score} /> : 'N/A'}
               </div>
            </div>

            <div className="space-y-4 font-sans text-sm">
               <div className="flex justify-between border-b border-rule pb-2">
                 <span className="text-ink opacity-80">Transparency</span>
                 <span className="font-medium text-ink">{c.score ? Math.round(c.score.transparency_score) : '-'}</span>
               </div>
               <div className="flex justify-between border-b border-rule pb-2">
                 <span className="text-ink opacity-80">Track Record</span>
                 <span className="font-medium text-ink">{c.score ? Math.round(c.score.track_record_score) : '-'}</span>
               </div>
               <div className="flex justify-between border-b border-rule pb-2">
                 <span className="text-ink opacity-80">Integrity</span>
                 <span className="font-medium text-ink">{c.score ? Math.round(c.score.financial_score) : '-'}</span>
               </div>
               <div className="flex justify-between border-b border-rule pb-2">
                 <span className="text-ink opacity-80">Perception</span>
                 <span className="font-medium text-ink">{c.score ? Math.round(c.score.public_trust_score) : '-'}</span>
               </div>
               <div className="flex justify-between border-b border-rule pb-2">
                 <span className="text-ink opacity-80">Policy</span>
                 <span className="font-medium text-ink">{c.score ? Math.round(c.score.governance_score) : '-'}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
