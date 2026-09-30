import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getCandidateDetail } from '../../api/candidates';
import { getCandidateAdventure, type AdventureResponse } from '../../api/adventure';
import type { CandidateDetail } from '../../api/candidates';
import GlassCard from '../../components/ui/GlassCard';
import Badge from '../../components/ui/Badge';
import CoverflowCarousel from '../../components/ui/CoverflowCarousel';
import ParticleField from '../../components/ui/ParticleField';
import { ArrowLeft, ExternalLink, User } from 'lucide-react';
import ChatWidget from '../../components/ui/ChatWidget';

export default function CandidateAdventurePage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [adventure, setAdventure] = useState<AdventureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candData, advData] = await Promise.all([
        getCandidateDetail(id!),
        getCandidateAdventure(id!).catch(() => null) // Adventure might not exist yet
      ]);
      setCandidate(candData);
      setAdventure(advData);
    } catch (err) {
      console.error(err);
      setError('Failed to load candidate profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nw-primary"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="text-center py-20">
        <p className="text-nw-danger">{error || 'Candidate not found'}</p>
        <Link to="/candidates" className="text-nw-primary hover:underline mt-4 inline-block">Return to Directory</Link>
      </div>
    );
  }

  const { candidate: cData } = candidate;

  return (
    <>
      <ParticleField className="fixed inset-0 z-[-1]" />
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 relative z-10">
        <div className="flex items-center justify-between">
        <Link to={`/candidates/${id}`} className="inline-flex items-center text-sm text-nw-text-light-muted dark:text-nw-text-dark-muted hover:text-nw-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dossier
        </Link>
        <Link to="/candidates" className="inline-flex items-center text-sm text-nw-text-light-muted dark:text-nw-text-dark-muted hover:text-nw-primary transition-colors">
          Directory
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {cData.photo_url ? (
          <img 
            src={cData.photo_url} 
            alt={cData.full_name} 
            className="w-40 h-40 object-cover rounded-2xl border border-black/10 dark:border-white/10 shadow-lg"
          />
        ) : (
          <div className="w-40 h-40 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center flex-shrink-0">
            <User className="w-16 h-16 text-nw-text-light-muted dark:text-nw-text-dark-muted" />
          </div>
        )}
        
        <div className="flex-grow">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="primary">{cData.party}</Badge>
            <Badge>{cData.position_sought}</Badge>
            <Badge>{cData.state}{cData.lga ? `, ${cData.lga}` : ''}</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-nw-text-light dark:text-nw-text-dark mb-4">
            {cData.full_name}
          </h1>
          
          {adventure?.pdf_url && (
            <a 
              href={adventure.pdf_url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center text-sm font-medium text-nw-primary hover:text-nw-primary-light transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" /> View Source PDF
            </a>
          )}
        </div>
      </div>
      {adventure ? (
        <div className="w-full relative py-8">
          <div className="absolute inset-0 flex items-center justify-center text-nw-text-light-muted/10 dark:text-nw-text-dark-muted/5 font-display text-[150px] font-bold z-0 select-none">
            {candidate.candidate.party}
          </div>
          <CoverflowCarousel sections={adventure.sections} />
        </div>
      ) : (
        <GlassCard className="py-20 text-center">
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted mb-4">
            No adventure generated yet for this candidate.
          </p>
          <p className="text-sm">
            Admin must upload the candidate's PDF profile to unlock the AI narrative.
          </p>
        </GlassCard>
      )}

      {id && <ChatWidget candidateId={id} />}
      </div>
    </>
  );
}
