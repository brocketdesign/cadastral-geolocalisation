import { useState, useEffect } from 'react';

export interface TextAd {
  id: string;
  type: 'text';
  enabled: boolean;
  icon: string;
  title: string;
  description: string;
  cta: string;
  color: string;
  link: string;
}

export interface ImageAd {
  id: string;
  type: 'image';
  enabled: boolean;
  src: string;
  alt: string;
  href: string;
  format: 'sidebar' | 'banner' | 'inline';
}

export type AnyAd = TextAd | ImageAd;

interface AdsConfig {
  textAds: TextAd[];
  imageAds: ImageAd[];
}

// Module-level cache so we only fetch once per session
let cachedConfig: AdsConfig | null = null;
let fetchPromise: Promise<AdsConfig> | null = null;

async function fetchAdsConfig(): Promise<AdsConfig> {
  if (cachedConfig) return cachedConfig;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/api/ads')
    .then((r) => r.json())
    .then((data: AdsConfig) => {
      cachedConfig = data;
      fetchPromise = null;
      return data;
    })
    .catch(() => {
      fetchPromise = null;
      // Return empty on error; AdBanner falls back to hardcoded defaults
      return { textAds: [], imageAds: [] };
    });

  return fetchPromise;
}

export function useAdsConfig(): { config: AdsConfig | null; isLoaded: boolean } {
  const [config, setConfig] = useState<AdsConfig | null>(cachedConfig);
  const [isLoaded, setIsLoaded] = useState(cachedConfig !== null);

  useEffect(() => {
    if (cachedConfig) return;
    fetchAdsConfig().then((c) => {
      setConfig(c);
      setIsLoaded(true);
    });
  }, []);

  return { config, isLoaded };
}
