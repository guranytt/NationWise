import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getCandidateDetail, rateCandidate } from '../../api/candidates';
import type { CandidateDetail } from '../../api/candidates';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useFingerprint } from '../../hooks/useFingerprint';
import CountUp from '../../components/ui/CountUp';

export default function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingLoading, setRatingLoading] = useState(false);
  const { visitorId } = useFingerprint();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = () => {
    if (id) {
      getCandidateDetail(id)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }

  const handleRate = async (rating: number) => {
    if (!id || !visitorId) return;
    setRatingLoading(true);
    try {
      await rateCandidate(id, visitorId, rating);
      loadData();
    } catch (err) {
      console.error('Error rating candidate:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20 font-sans text-sm uppercase tracking-widest text-ink">
      Retrieving File...
    </div>
  );

  if (!data) return <div className="text-center py-20 font-serif text-ink">Record not found</div>;

  const { candidate, score, metrics } = data;

  const chartData = score ? [
    { subject: 'Transparency', A: score.transparency_score, fullMark: 100 },
    { subject: 'Track Record', A: score.track_record_score, fullMark: 100 },
    { subject: 'Integrity', A: score.financial_score, fullMark: 100 },
    { subject: 'Perception', A: score.public_trust_score, fullMark: 100 },
    { subject: 'Policy', A: score.governance_score, fullMark: 100 },
  ] : [];

  const communityMetric = metrics.find(m => m.metric_type === 'community_rating');

  // Determine primary chart color based on overall score
  let chartColor = '#1C1A16'; // ink default
  if (score) {
    if (score.overall_score >= 75) chartColor = '#1E5945'; // verified
    else if (score.overall_score >= 50) chartColor = '#B8802E'; // pending
    else chartColor = '#9A3B2C'; // critical
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/candidates" className="inline-flex items-center text-ink font-sans text-sm hover:underline mb-8">
        &larr; Back to Registry
      </Link>
      
      <div className="border border-rule bg-paper mb-12">
        <div className="md:flex">
          {/* Left: Bio & Details */}
          <div className="p-8 md:w-1/2 flex flex-col md:border-r border-b md:border-b-0 border-rule">
            <div className="mb-6 pb-4 border-b border-rule flex justify-between items-start">
               <span className="font-sans text-xs text-ink opacity-60">File No. {candidate.id.substring(0, 8).toUpperCase()}</span>
               <span className="font-sans text-xs text-ink opacity-60">Cycle: {candidate.election_cycle}</span>
            </div>

            <div className="flex items-start gap-6 mb-6">
              {candidate.photo_url ? (
                <img src={candidate.photo_url} alt={candidate.full_name} className="w-24 h-24 object-cover border border-rule grayscale" />
              ) : (
                <div className="w-24 h-24 border border-rule bg-paper flex items-center justify-center text-ink font-serif text-3xl">
                  {candidate.full_name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-serif font-bold text-ink mb-1">{candidate.full_name}</h1>
                <div className="font-sans text-sm text-ink uppercase tracking-wider mb-2">
                  {candidate.party}
                </div>
                <div className="font-sans text-sm text-ink">
                  <span className="font-semibold">Pos:</span> {candidate.position_sought}
                </div>
                <div className="font-sans text-sm text-ink">
                  <span className="font-semibold">Loc:</span> {candidate.state}{candidate.lga ? `, ${candidate.lga}` : ''}
                </div>
              </div>
            </div>
            
            {candidate.bio && (
              <div className="font-serif text-ink text-sm leading-relaxed mb-8 border-l-2 border-rule pl-4">
                {candidate.bio}
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-rule w-full">
              <h4 className="font-sans text-xs uppercase tracking-widest text-ink mb-3 font-semibold">Community Signal</h4>
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => handleRate(1)}
                  disabled={ratingLoading || !visitorId}
                  className="font-sans text-xs px-3 py-1.5 border border-rule text-ink hover:bg-rule/20 transition disabled:opacity-50"
                >
                  Confirm Record
                </button>
                <button 
                  onClick={() => handleRate(-1)}
                  disabled={ratingLoading || !visitorId}
                  className="font-sans text-xs px-3 py-1.5 border border-rule text-ink hover:bg-rule/20 transition disabled:opacity-50"
                >
                  Dispute Record
                </button>
              </div>
              {communityMetric && (
                <p className="font-sans text-xs text-ink opacity-70 mt-2">
                  Signal Strength: {communityMetric.value.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
          
          {/* Right: Score & Chart */}
          <div className="p-8 md:w-1/2 flex flex-col items-center justify-center bg-paper/50">
            <h3 className="font-sans text-sm uppercase tracking-widest text-ink mb-4">Official Assessment</h3>
            {score ? (
              <>
                <div className="text-6xl font-serif text-ink mb-2">
                  <CountUp end={score.overall_score} />
                </div>
                <div className="font-sans text-xs uppercase tracking-widest text-ink opacity-60 mb-8">Composite Score</div>
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      <PolarGrid stroke="#C9C4B4" />
                      <PolarAngleAxis dataKey="subject" textAnchor="middle" tick={{ fill: '#1C1A16', fontSize: 10, fontFamily: 'IBM Plex Sans' }} />
                      <Radar name="Candidate" dataKey="A" stroke={chartColor} fill={chartColor} fillOpacity={0.2} isAnimationActive={true} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="py-20 font-sans text-sm text-ink opacity-50">Score calculation pending.</div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-serif text-ink mb-4 border-b border-rule pb-2">Docket: Sourced Metrics</h2>
        {metrics.length === 0 ? (
          <p className="font-sans text-sm text-ink opacity-60">No entries in docket.</p>
        ) : (
          <div className="border border-rule bg-paper">
            <table className="w-full text-left border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-rule">
                  <th className="py-3 px-4 font-semibold text-ink w-12 text-center border-r border-rule">No.</th>
                  <th className="py-3 px-4 font-semibold text-ink">Metric Dimension</th>
                  <th className="py-3 px-4 font-semibold text-ink">Value</th>
                  <th className="py-3 px-4 font-semibold text-ink">Source Record</th>
                  <th className="py-3 px-4 font-semibold text-ink">Date Filed</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, idx) => (
                  <tr key={metric.id} className="border-b border-rule last:border-0">
                    <td className="py-3 px-4 text-ink opacity-50 text-center border-r border-rule">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="py-3 px-4 text-ink capitalize">{metric.metric_type.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-ink font-medium">{metric.value.toFixed(1)}</td>
                    <td className="py-3 px-4">
                      {metric.source_url ? (
                        <a href={metric.source_url} target="_blank" rel="noreferrer" className="text-ink underline hover:no-underline">
                          {metric.source_label || 'External Source'}
                        </a>
                      ) : (
                        <span className="text-ink opacity-60">{metric.source_label || 'Internal Entry'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-ink opacity-60 text-xs">
                      {new Date(metric.scraped_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
