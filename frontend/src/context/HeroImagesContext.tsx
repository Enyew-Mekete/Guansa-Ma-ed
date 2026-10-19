import React, { createContext, useContext, useEffect, useState } from 'react';
import { HeroImage } from '../types';
import { apiRequest } from '../utils/api';

interface HeroImagesContextType {
  heroImages: HeroImage[];
  error: string | null;
  addHeroImage: (image: Omit<HeroImage, 'id'>) => Promise<void>;
  updateHeroImage: (id: string, image: Omit<HeroImage, 'id'>) => Promise<void>;
  deleteHeroImage: (id: string) => Promise<void>;
}

const HeroImagesContext = createContext<HeroImagesContextType | undefined>(undefined);

export const HeroImagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiRequest<{ heroImages: HeroImage[] }>('/api/hero-images')
      .then(({ heroImages: loadedImages }) => {
        if (mounted) setHeroImages(loadedImages);
      })
      .catch((loadError: unknown) => {
        console.error('[Hero Images] Unable to load menu hero images.', loadError);
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load menu hero images.');
      });
    return () => { mounted = false; };
  }, []);

  const addHeroImage: HeroImagesContextType['addHeroImage'] = async (image) => {
    try {
      const result = await apiRequest<{ heroImage: HeroImage }>('/api/hero-images', {
        method: 'POST',
        body: JSON.stringify(image),
      });
      setHeroImages((previous) => [...previous, result.heroImage]);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add hero image.');
      throw requestError;
    }
  };

  const updateHeroImage: HeroImagesContextType['updateHeroImage'] = async (id, image) => {
    try {
      const result = await apiRequest<{ heroImage: HeroImage }>(`/api/hero-images/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(image),
      });
      setHeroImages((previous) => previous.map((entry) => entry.id === id ? result.heroImage : entry));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update hero image.');
      throw requestError;
    }
  };

  const deleteHeroImage: HeroImagesContextType['deleteHeroImage'] = async (id) => {
    try {
      await apiRequest(`/api/hero-images/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setHeroImages((previous) => previous.filter((entry) => entry.id !== id));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete hero image.');
      throw requestError;
    }
  };

  return (
    <HeroImagesContext.Provider value={{ heroImages, error, addHeroImage, updateHeroImage, deleteHeroImage }}>
      {children}
    </HeroImagesContext.Provider>
  );
};

export const useHeroImages = (): HeroImagesContextType => {
  const context = useContext(HeroImagesContext);
  if (!context) throw new Error('useHeroImages must be used within HeroImagesProvider.');
  return context;
};
