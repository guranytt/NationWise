import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getLeaderboard } from '../../api/candidates';
import type { LeaderboardEntry } from '../../api/candidates';
import { motion } from 'framer-motion';
import CountUp from '../../components/ui/CountUp';
import { StaggerContainer, StaggerItem } from '../../components/ui/StaggerReveal';

const getTierColor = (score: number) => {
  if (score >= 75) return 'bg-verified';
  if (score >= 50) return 'bg-pending';
  return 'bg-critical';
};

const getTierTextColor = (score: number) => {
  if (score >= 75) return 'text-verified';
  if (score >= 50) return 'text-pending';
  return 'text-critical';
};

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-left mb-8 pb-4 border-b border-rule">
        <h1 className="text-4xl font-serif text-ink mb-2">Registry Rankings</h1>
        <p className="text-ink opacity-70 font-sans text-sm">Candidates ordered by official composite score.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <select 
          className="px-3 py-1.5 border border-rule bg-transparent text-ink font-sans text-sm focus:outline-none focus:border-ink w-full md:w-64"
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
          className="px-3 py-1.5 border border-rule bg-transparent text-ink font-sans text-sm focus:outline-none focus:border-ink w-full md:w-64"
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
        <div className="flex justify-center py-20 font-sans text-sm uppercase tracking-widest text-ink">
          Compiling Rankings...
        </div>
      ) : (
        <div className="border-t border-rule">
          {leaders.length === 0 ? (
            <div className="text-center py-16 font-sans text-ink opacity-60">
              No entries found.
            </div>
          ) : (
            <StaggerContainer className="w-full">
              <div className="flex bg-paper border-b border-rule py-3 font-sans text-xs uppercase tracking-widest text-ink opacity-70">
                <div className="w-16 text-center shrink-0">Rank</div>
                <div className="flex-1">Record</div>
                <div className="w-1/3 min-w-[200px] hidden md:block">Details</div>
                <div className="w-32 text-right pr-4 shrink-0">Score</div>
              </div>
              
              {leaders.map(leader => (
                <StaggerItem key={leader.id} className="flex items-center border-b border-rule py-4 hover:bg-rule/10 transition-colors">
                  <div className="w-16 text-center font-serif text-2xl text-ink shrink-0">
                    {leader.rank}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <Link to={`/candidates/${leader.id}`} className="font-serif font-bold text-lg text-ink hover:underline truncate block">
                      {leader.full_name}
                    </Link>
                    <div className="font-sans text-xs text-ink opacity-70 mt-1 uppercase tracking-wide truncate">
                      {leader.party} &bull; File {leader.id.substring(0, 6).toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="w-1/3 min-w-[200px] font-sans text-sm text-ink hidden md:block pr-4 truncate">
                    <div className="font-semibold">{leader.position_sought}</div>
                    <div className="opacity-70">{leader.state}</div>
                  </div>
                  
                  <div className="w-32 pr-4 shrink-0 flex flex-col items-end">
                    <div className={`font-serif text-2xl ${getTierTextColor(leader.overall_score)}`}>
                      <CountUp end={leader.overall_score} />
                    </div>
                    {/* Score Bar */}
                    <div className="w-full h-1.5 bg-rule/30 mt-2 flex justify-end overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.round(leader.overall_score)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full ${getTierColor(leader.overall_score)}`}
                      />
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      )}
    </div>
  );
}
