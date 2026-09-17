import { useEffect, useState } from 'react';
import { getPromises, type PromiseRecord } from '../../api/ai';

export default function PromiseTracker({ candidateId }: { candidateId: string }) {
  const [promises, setPromises] = useState<PromiseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPromises(candidateId)
      .then(setPromises)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return <div className="text-sm font-sans opacity-60">Loading promises...</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-serif text-ink mb-4 border-b border-rule pb-2">Campaign Promises</h2>
      {promises.length === 0 ? (
        <p className="font-sans text-sm text-ink opacity-60">No promises extracted for this candidate yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promises.map(promise => (
            <div key={promise.id} className="border border-rule bg-paper p-4 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-sans uppercase tracking-wider bg-rule/10 px-2 py-1">
                  {promise.category}
                </span>
                <span className={`text-xs font-sans font-semibold uppercase px-2 py-1 border 
                  ${promise.status === 'fulfilled' ? 'border-green-800 text-green-800' : 
                    promise.status === 'broken' ? 'border-red-800 text-red-800' : 
                    promise.status === 'in_progress' ? 'border-yellow-800 text-yellow-800' : 
                    'border-rule text-ink opacity-60'}`}>
                  {promise.status.replace('_', ' ')}
                </span>
              </div>
              <p className="font-serif text-sm mb-4 flex-grow">{promise.promise_text}</p>
              
              <div className="flex justify-between items-end mt-auto pt-4 border-t border-rule text-xs font-sans opacity-60">
                <span>Confidence: {(promise.confidence_score * 100).toFixed(0)}%</span>
                {promise.extracted_from_url && (
                  <a href={promise.extracted_from_url} target="_blank" rel="noreferrer" className="underline hover:no-underline">
                    Source
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
