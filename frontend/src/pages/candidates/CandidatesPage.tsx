import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getCandidates } from '../../api/candidates';
import type { Candidate } from '../../api/candidates';
import { MapPin, Briefcase } from 'lucide-react';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const data = await getCandidates({
          ...(stateFilter && { state: stateFilter }),
          ...(positionFilter && { position: positionFilter })
        });
        setCandidates(data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [stateFilter, positionFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Election 2027 Candidates</h1>
          <p className="text-gray-600 mt-2">Data-backed insights on who is running.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none flex-1"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All States</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
            <option value="Kano">Kano</option>
            <option value="Rivers">Rivers</option>
          </select>
          <select 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none flex-1"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="">All Positions</option>
            <option value="President">President</option>
            <option value="Governor">Governor</option>
            <option value="Senator">Senator</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map(candidate => (
            <Link key={candidate.id} to={`/candidates/${candidate.id}`} className="block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {candidate.photo_url ? (
                      <img src={candidate.photo_url} alt={candidate.full_name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                        {candidate.full_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{candidate.full_name}</h3>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded mt-1">
                        {candidate.party}
                      </span>
                    </div>
                  </div>
                  {candidate.overall_score !== null && (
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-green-50 border-2 border-green-200">
                      <span className="text-green-700 font-bold">{Math.round(candidate.overall_score)}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} />
                    <span>{candidate.position_sought}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{candidate.state}{candidate.lga ? `, ${candidate.lga}` : ''}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && candidates.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No candidates found matching your filters.
        </div>
      )}
    </div>
  );
}
