import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getCandidateDetail, rateCandidate } from '../../api/candidates';
import type { CandidateDetail } from '../../api/candidates';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { MapPin, Briefcase, ExternalLink, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useFingerprint } from '../../hooks/useFingerprint';

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
      // Reload data to get updated score
      loadData();
    } catch (err) {
      console.error('Error rating candidate:', err);
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
    </div>
  );

  if (!data) return <div className="text-center py-20">Candidate not found</div>;

  const { candidate, score, metrics } = data;

  const chartData = score ? [
    { subject: 'Transparency', A: score.transparency_score, fullMark: 100 },
    { subject: 'Track Record', A: score.track_record_score, fullMark: 100 },
    { subject: 'Integrity', A: score.financial_score, fullMark: 100 },
    { subject: 'Public Perception', A: score.public_trust_score, fullMark: 100 },
    { subject: 'Policy Strength', A: score.governance_score, fullMark: 100 },
  ] : [];

  const communityMetric = metrics.find(m => m.metric_type === 'community_rating');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/candidates" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
        <ArrowLeft size={16} className="mr-2" /> Back to Candidates
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="md:flex">
          <div className="p-8 md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100">
            {candidate.photo_url ? (
              <img src={candidate.photo_url} alt={candidate.full_name} className="w-32 h-32 rounded-full object-cover mb-4" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-4xl mb-4">
                {candidate.full_name.charAt(0)}
              </div>
            )}
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{candidate.full_name}</h1>
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 font-semibold rounded-full mb-4">
              {candidate.party}
            </span>
            
            <div className="space-y-3 w-full mt-2 text-gray-600">
              <div className="flex items-center gap-3">
                <Briefcase size={20} className="text-gray-400" />
                <span className="text-lg">{candidate.position_sought} ({candidate.election_cycle})</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-gray-400" />
                <span className="text-lg">{candidate.state}{candidate.lga ? `, ${candidate.lga}` : ''}</span>
              </div>
            </div>
            
            {candidate.bio && (
              <p className="mt-6 text-gray-600 text-sm leading-relaxed text-justify">
                {candidate.bio}
              </p>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 w-full">
              <h4 className="font-semibold text-gray-800 mb-3">Community Signal</h4>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleRate(1)}
                  disabled={ratingLoading || !visitorId}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
                >
                  <ThumbsUp size={18} /> Upvote
                </button>
                <button 
                  onClick={() => handleRate(-1)}
                  disabled={ratingLoading || !visitorId}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                >
                  <ThumbsDown size={18} /> Downvote
                </button>
              </div>
              {communityMetric && (
                <p className="text-sm text-gray-500 mt-2">
                  Community Trust Score: <span className="font-bold text-gray-700">{communityMetric.value.toFixed(1)}%</span>
                </p>
              )}
            </div>
          </div>
          
          <div className="p-8 md:w-1/2 bg-gray-50 flex flex-col items-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Overall Score</h3>
            {score ? (
              <>
                <div className="text-6xl font-black text-green-600 mb-6">{Math.round(score.overall_score)}<span className="text-2xl text-gray-400">/100</span></div>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" textAnchor="middle" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Candidate" dataKey="A" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="py-20 text-gray-500">No score data available yet.</div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Points & Metrics</h2>
        {metrics.length === 0 ? (
          <p className="text-gray-500">No scraped metrics available for this candidate.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="py-4 px-6 font-semibold">Metric Type</th>
                  <th className="py-4 px-6 font-semibold">Value</th>
                  <th className="py-4 px-6 font-semibold">Source</th>
                  <th className="py-4 px-6 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(metric => (
                  <tr key={metric.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-4 px-6 text-gray-900 capitalize">{metric.metric_type.replace(/_/g, ' ')}</td>
                    <td className="py-4 px-6 font-medium">{metric.value.toFixed(1)}</td>
                    <td className="py-4 px-6">
                      {metric.source_url ? (
                        <a href={metric.source_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {metric.source_label || 'Link'} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-gray-500">{metric.source_label || 'Unknown'}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm">
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
