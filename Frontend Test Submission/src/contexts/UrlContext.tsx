
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useLogging } from './LoggingContext';

export interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortcode: string;
  createdAt: Date;
  expiresAt: Date;
  validityPeriod: number;
  clicks: ClickData[];
}

export interface ClickData {
  timestamp: Date;
  referrer: string;
  userAgent: string;
  location: string;
  ip: string;
}

interface UrlContextType {
  urls: ShortenedUrl[];
  createShortUrl: (originalUrl: string, validityPeriod?: number, customShortcode?: string) => Promise<ShortenedUrl>;
  getUrlByShortcode: (shortcode: string) => ShortenedUrl | undefined;
  recordClick: (shortcode: string) => void;
  deleteUrl: (id: string) => void;
  isValidUrl: (url: string) => boolean;
  isShortcodeAvailable: (shortcode: string) => boolean;
}

const UrlContext = createContext<UrlContextType | undefined>(undefined);

export const useUrl = () => {
  const context = useContext(UrlContext);
  if (!context) {
    throw new Error('useUrl must be used within a UrlProvider');
  }
  return context;
};

const generateShortcode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const simulateClickData = (): Omit<ClickData, 'timestamp'> => {
  const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA'];
  const referrers = ['Direct', 'Google', 'Facebook', 'Twitter', 'LinkedIn', 'Reddit'];
  const userAgents = ['Chrome/98.0', 'Firefox/95.0', 'Safari/15.0', 'Edge/97.0'];
  
  return {
    referrer: referrers[Math.floor(Math.random() * referrers.length)],
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  };
};

export const UrlProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const { log } = useLogging();

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isShortcodeAvailable = (shortcode: string): boolean => {
    return !urls.some(url => url.shortcode === shortcode);
  };

  const createShortUrl = async (
    originalUrl: string,
    validityPeriod: number = 30,
    customShortcode?: string
  ): Promise<ShortenedUrl> => {
    if (urls.length >= 5) {
      log('error', 'URL creation failed', { reason: 'Maximum 5 URLs limit reached' });
      throw new Error('Maximum 5 URLs limit reached');
    }

    if (!isValidUrl(originalUrl)) {
      log('error', 'URL creation failed', { reason: 'Invalid URL format', url: originalUrl });
      throw new Error('Invalid URL format');
    }

    let shortcode = customShortcode;
    if (shortcode) {
      if (!/^[a-zA-Z0-9]+$/.test(shortcode) || shortcode.length < 3 || shortcode.length > 10) {
        log('error', 'URL creation failed', { reason: 'Invalid shortcode format', shortcode });
        throw new Error('Shortcode must be 3-10 alphanumeric characters');
      }
      if (!isShortcodeAvailable(shortcode)) {
        log('error', 'URL creation failed', { reason: 'Shortcode already exists', shortcode });
        throw new Error('Shortcode already exists');
      }
    } else {
      do {
        shortcode = generateShortcode();
      } while (!isShortcodeAvailable(shortcode));
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityPeriod * 60 * 1000);

    const newUrl: ShortenedUrl = {
      id: Math.random().toString(36).substr(2, 9),
      originalUrl,
      shortcode,
      createdAt: now,
      expiresAt,
      validityPeriod,
      clicks: [],
    };

    setUrls(prev => [...prev, newUrl]);
    log('info', 'URL created successfully', {
      shortcode,
      originalUrl,
      validityPeriod,
      expiresAt: expiresAt.toISOString(),
    });

    return newUrl;
  };

  const getUrlByShortcode = (shortcode: string): ShortenedUrl | undefined => {
    return urls.find(url => url.shortcode === shortcode);
  };

  const recordClick = (shortcode: string): void => {
    const clickData: ClickData = {
      timestamp: new Date(),
      ...simulateClickData(),
    };

    setUrls(prev => prev.map(url => {
      if (url.shortcode === shortcode) {
        const updatedUrl = {
          ...url,
          clicks: [...url.clicks, clickData],
        };
        log('info', 'URL click recorded', {
          shortcode,
          clickCount: updatedUrl.clicks.length,
          location: clickData.location,
          referrer: clickData.referrer,
        });
        return updatedUrl;
      }
      return url;
    }));
  };

  const deleteUrl = (id: string): void => {
    setUrls(prev => {
      const urlToDelete = prev.find(url => url.id === id);
      if (urlToDelete) {
        log('info', 'URL deleted', { shortcode: urlToDelete.shortcode, originalUrl: urlToDelete.originalUrl });
      }
      return prev.filter(url => url.id !== id);
    });
  };

  return (
    <UrlContext.Provider value={{
      urls,
      createShortUrl,
      getUrlByShortcode,
      recordClick,
      deleteUrl,
      isValidUrl,
      isShortcodeAvailable,
    }}>
      {children}
    </UrlContext.Provider>
  );
};
