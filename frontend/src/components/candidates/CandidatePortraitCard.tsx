import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../ui/GlassCard';
import { Link } from 'react-router';

export interface CandidatePortraitCardProps {
  candidate: {
    id: string;
    full_name: string;
    party: string;
    state: string;
    lga: string | null;
    position_sought: string;
    photo_url: string | null;
    overall_score: number | null;
  };
  index: number;
}

const getPartyColor = (party: string) => {
  const normalized = party.trim().toUpperCase();
  switch (normalized) {
    case 'APC': return 'bg-[#059669]';
    case 'PDP': return 'bg-[#EF4444]';
    case 'LP': return 'bg-[#F59E0B]';
    case 'NNPP': return 'bg-[#3B82F6]';
    default: return 'bg-gray-500';
  }
};

const CandidatePortraitCard: React.FC<CandidatePortraitCardProps> = ({ candidate, index }) => {
  const partyColor = getPartyColor(candidate.party);
  const initials = candidate.full_name ? candidate.full_name.charAt(0).toUpperCase() : '?';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover="hover"
      variants={{
        hover: {
          y: -8,
          boxShadow: '0 8px 30px rgba(5,150,105,0.2)',
        },
      }}
      className={cn(
        "relative flex flex-col group cursor-pointer",
        "min-h-[420px] aspect-[3/4]",
        "bg-white/70 border border-black/10 backdrop-blur-xl rounded-2xl overflow-hidden dark:bg-white/5 dark:border-white/10"
      )}
    >
      {/* Top 60% Photo Section */}
      <Link to={`/candidates/${candidate.id}`} className="relative h-[60%] w-full overflow-hidden flex-shrink-0 block cursor-pointer">
        {candidate.photo_url ? (
          <motion.img
            src={candidate.photo_url}
            alt={candidate.full_name}
            className="w-full h-full object-cover"
            variants={{
              hover: { scale: 1.05 }
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        ) : (
          <motion.div 
            className="w-full h-full bg-gradient-to-br from-[#065F46] to-[#059669] flex items-center justify-center text-white/50"
            variants={{
              hover: { scale: 1.05 }
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <span className="text-8xl font-display font-bold opacity-30">{initials}</span>
          </motion.div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
          <h3 className="text-white font-display font-bold text-2xl leading-tight drop-shadow-md">
            {candidate.full_name}
          </h3>
        </div>
      </Link>

      {/* Party Accent Bar */}
      <div className={`h-1 w-full flex-shrink-0 ${partyColor}`} />

      {/* Bottom 40% Info Section */}
      <div className="relative flex-1 p-5 flex flex-col justify-between bg-white/40 dark:bg-black/20">
        <div>
          <p className="font-sans text-sm uppercase tracking-wider font-bold text-gray-800 dark:text-gray-200 mb-1">
            {candidate.position_sought}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {candidate.lga ? `${candidate.lga}, ` : ''}{candidate.state}
          </p>
          <div className="mt-3 inline-block px-2 py-1 rounded-md text-xs font-bold border border-gray-200/60 dark:border-gray-700/60 text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/20">
            {candidate.party}
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex flex-col gap-1.5">
            <Link to={`/candidates/${candidate.id}`} className="block">
              <motion.span 
                className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                variants={{
                  hover: { opacity: 1, x: 0 },
                }}
                initial={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                View Dossier →
              </motion.span>
            </Link>
            <Link to={`/candidates/${candidate.id}/adventure`} className="block">
              <motion.span 
                className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                variants={{
                  hover: { opacity: 1, x: 0 },
                }}
                initial={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                View Adventure ✨
              </motion.span>
            </Link>
          </div>
          
          {candidate.overall_score !== null && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase text-gray-500 font-bold mb-0.5 tracking-wider">Score</span>
              <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md font-bold text-lg leading-none border border-emerald-200 dark:border-emerald-800/50">
                {candidate.overall_score}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CandidatePortraitCard;
