import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { getCompareCandidates } from '../../api/candidates';
import type { CandidateDetail } from '../../api/candidates';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft } from 'lucide-react';

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#eab308'];

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
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
    </div>
  );

  if (ids.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Compare Candidates</h2>
        <p className="text-gray-600 mb-6">Select at least two candidates to compare them side-by-side.</p>
        <Link to="/candidates" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Browse Candidates
        </Link>
      </div>
    );
  }

  // Build combined chart data
  const chartData = [
    { subject: 'Transparency', fullMark: 100 },
    { subject: 'Track Record', fullMark: 100 },
    { subject: 'Integrity', fullMark: 100 },
    { subject: 'Public Perception', fullMark: 100 },
    { subject: 'Policy Strength', fullMark: 100 },
  ].map(dimension => {
    const dataPoint: any = { subject: dimension.subject, fullMark: dimension.fullMark };
    candidates.forEach((c) => {
      const score = c.score;
      if (score) {
        if (dimension.subject === 'Transparency') dataPoint[c.candidate.full_name] = score.transparency_score;
        if (dimension.subject === 'Track Record') dataPoint[c.candidate.full_name] = score.track_record_score;
        if (dimension.subject === 'Integrity') dataPoint[c.candidate.full_name] = score.financial_score;
        if (dimension.subject === 'Public Perception') dataPoint[c.candidate.full_name] = score.public_trust_score;
        if (dimension.subject === 'Policy Strength') dataPoint[c.candidate.full_name] = score.governance_score;
      } else {
        dataPoint[c.candidate.full_name] = 0;
      }
    });
    return dataPoint;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/candidates" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
        <ArrowLeft size={16} className="mr-2" /> Back to Candidates
      </Link>
      
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Head-to-Head Comparison</h1>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[400px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Score Dimensions Overlay</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              {candidates.map((c, idx) => (
                <Radar 
                  key={c.candidate.id}
                  name={c.candidate.full_name} 
                  dataKey={c.candidate.full_name} 
                  stroke={COLORS[idx % COLORS.length]} 
                  fill={COLORS[idx % COLORS.length]} 
                  fillOpacity={0.3} 
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-4 px-4 text-left text-gray-500 font-semibold">Metrics</th>
                {candidates.map((c) => (
                  <th key={c.candidate.id} className="py-4 px-4 min-w-[150px]">
                    <div className="flex flex-col items-center">
                      {c.candidate.photo_url ? (
                        <img src={c.candidate.photo_url} alt={c.candidate.full_name} className="w-16 h-16 rounded-full object-cover mb-2" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl mb-2">
                          {c.candidate.full_name.charAt(0)}
                        </div>
                      )}
                      <span className="font-bold text-gray-900">{c.candidate.full_name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1">{c.candidate.party}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4 px-4 text-left font-semibold text-gray-700 bg-gray-50">Overall Score</td>
                {candidates.map(c => (
                  <td key={c.candidate.id} className="py-4 px-4">
                    <span className="text-2xl font-bold text-green-600">
                      {c.score ? Math.round(c.score.overall_score) : 'N/A'}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-left text-gray-600 bg-gray-50">Transparency</td>
                {candidates.map(c => (
                  <td key={c.candidate.id} className="py-4 px-4">{c.score ? Math.round(c.score.transparency_score) : '-'}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-left text-gray-600 bg-gray-50">Track Record</td>
                {candidates.map(c => (
                  <td key={c.candidate.id} className="py-4 px-4">{c.score ? Math.round(c.score.track_record_score) : '-'}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-left text-gray-600 bg-gray-50">Integrity</td>
                {candidates.map(c => (
                  <td key={c.candidate.id} className="py-4 px-4">{c.score ? Math.round(c.score.financial_score) : '-'}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-left text-gray-600 bg-gray-50">Perception</td>
                {candidates.map(c => (
                  <td key={c.candidate.id} className="py-4 px-4">{c.score ? Math.round(c.score.public_trust_score) : '-'}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-4 px-4 text-left text-gray-600 bg-gray-50">Policy</td>
                {candidates.map(c => (
                  <td key={c.candidate.id} className="py-4 px-4">{c.score ? Math.round(c.score.governance_score) : '-'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
