import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getLeaderboard } from '../../api/candidates';
import type { LeaderboardEntry } from '../../api/candidates';
import { Trophy, Medal, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  useEffect(() => {
    const fetchBoard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard({
          ...(stateFilter && { state: stateFilter }),
          ...(positionFilter && { position: positionFilter })
        });
        setLeaders(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [stateFilter, positionFilter]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-yellow-400" size={24} />;
      case 2: return <Medal className="text-gray-400" size={24} />;
      case 3: return <Award className="text-amber-600" size={24} />;
      default: return <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">NationWise Leaderboard</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">See who is leading the pack based on data, transparency, and public trust.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center">
        <select 
          className="px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none text-gray-700 font-medium"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">National Overall</option>
          <option value="Lagos">Lagos State</option>
          <option value="Abuja">FCT Abuja</option>
          <option value="Kano">Kano State</option>
          <option value="Rivers">Rivers State</option>
        </select>
        <select 
          className="px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none text-gray-700 font-medium"
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
        >
          <option value="">All Positions</option>
          <option value="President">Presidential</option>
          <option value="Governor">Gubernatorial</option>
          <option value="Senator">Senatorial</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {leaders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No candidates found matching the criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b">
                  <th className="py-5 px-6 font-semibold w-16 text-center">Rank</th>
                  <th className="py-5 px-6 font-semibold">Candidate</th>
                  <th className="py-5 px-6 font-semibold hidden md:table-cell">Position / State</th>
                  <th className="py-5 px-6 font-semibold hidden sm:table-cell">Party</th>
                  <th className="py-5 px-6 font-semibold text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map(leader => (
                  <tr key={leader.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">{getRankIcon(leader.rank)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <Link to={`/candidates/${leader.id}`} className="font-bold text-gray-900 hover:text-green-600 transition-colors text-lg">
                        {leader.full_name}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-gray-600 hidden md:table-cell">
                      {leader.position_sought} &bull; {leader.state}
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                        {leader.party}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`text-xl font-bold ${
                        leader.rank <= 3 ? 'text-green-600' : 'text-gray-800'
                      }`}>
                        {Math.round(leader.overall_score)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
