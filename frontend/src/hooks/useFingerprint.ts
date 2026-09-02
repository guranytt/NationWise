import { useState, useEffect } from 'react';
import fpPromise from '@fingerprintjs/fingerprintjs';

let cachedVisitorId: string | null = null;

export function useFingerprint() {
  const [visitorId, setVisitorId] = useState<string | null>(cachedVisitorId);
  const [isLoading, setIsLoading] = useState(!cachedVisitorId);

  useEffect(() => {
    if (cachedVisitorId) return;

    async function getFingerprint() {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        cachedVisitorId = result.visitorId;
        setVisitorId(result.visitorId);
      } catch (error) {
        console.error('Failed to get fingerprint', error);
      } finally {
        setIsLoading(false);
      }
    }

    getFingerprint();
  }, []);

  return { visitorId, isLoading };
}
