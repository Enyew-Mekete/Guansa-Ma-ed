import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NewsPost, Vacancy } from '../types';
import { apiRequest } from '../utils/api';

const sortVacanciesByNewest = (vacancies: Vacancy[]) =>
  [...vacancies].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));

interface NewsContextType {
  newsPosts: NewsPost[];
  vacancies: Vacancy[];
  unreadCount: number;
  error: string | null;
  clearError: () => void;
  addNewsPost: (post: Omit<NewsPost, 'id' | 'createdAt'>) => Promise<void>;
  updateNewsPost: (id: string, updates: Omit<NewsPost, 'id' | 'createdAt'>) => Promise<void>;
  deleteNewsPost: (id: string) => Promise<void>;
  addVacancy: (vacancy: Omit<Vacancy, 'id' | 'createdAt'>) => Promise<void>;
  updateVacancy: (id: string, updates: Omit<Vacancy, 'id' | 'createdAt'>) => Promise<void>;
  deleteVacancy: (id: string) => Promise<void>;
  markNewsAsRead: (id: string) => Promise<boolean>;
  markVacanciesAsRead: (id: string) => Promise<boolean>;
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export const NewsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [readNewsIds, setReadNewsIds] = useState<string[]>([]);
  const [readVacancyIds, setReadVacancyIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiRequest<{ posts: NewsPost[]; readPostIds: string[] }>('/api/news'),
      apiRequest<{ vacancies: Vacancy[]; readVacancyIds: string[] }>('/api/vacancies'),
    ])
      .then(([newsResult, vacancyResult]) => {
        if (!mounted) return;
        setNewsPosts(newsResult.posts);
        setReadNewsIds(newsResult.readPostIds);
        setVacancies(sortVacanciesByNewest(vacancyResult.vacancies));
        setReadVacancyIds(vacancyResult.readVacancyIds);
      })
      .catch((loadError: unknown) => {
        console.error('[Content] Unable to load news and vacancy records.', loadError);
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load published content.');
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshReadState = async () => {
      try {
        const readState = await apiRequest<{ readPostIds: string[]; readVacancyIds: string[] }>('/api/content/read-state');
        if (mounted) {
          setReadNewsIds(readState.readPostIds);
          setReadVacancyIds(readState.readVacancyIds);
          setError((previous) => previous === 'Unable to refresh content read status.' ? null : previous);
        }
      } catch (refreshError) {
        if (mounted) {
          setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh content read status.');
        }
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshReadState();
    };
    const intervalId = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const unreadCount = useMemo(
    () =>
      newsPosts.filter((post) => !readNewsIds.includes(post.id)).length +
      vacancies.filter((vacancy) => !readVacancyIds.includes(vacancy.id)).length,
    [newsPosts, readNewsIds, vacancies, readVacancyIds],
  );

  const addNewsPost = async (post: Omit<NewsPost, 'id' | 'createdAt'>) => {
    try {
      const result = await apiRequest<{ post: NewsPost }>('/api/news', {
        method: 'POST',
        body: JSON.stringify(post),
      });
      setNewsPosts((previous) => [result.post, ...previous]);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to publish news.');
      throw requestError;
    }
  };

  const updateNewsPost = async (id: string, updates: Omit<NewsPost, 'id' | 'createdAt'>) => {
    try {
      const result = await apiRequest<{ post: NewsPost }>(`/api/news/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setNewsPosts((previous) => previous.map((post) => post.id === id ? result.post : post));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update news.');
      throw requestError;
    }
  };

  const deleteNewsPost = async (id: string) => {
    try {
      await apiRequest(`/api/news/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setNewsPosts((previous) => previous.filter((post) => post.id !== id));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete news.');
      throw requestError;
    }
  };

  const addVacancy = async (vacancy: Omit<Vacancy, 'id' | 'createdAt'>) => {
    try {
      const result = await apiRequest<{ vacancy: Vacancy }>('/api/vacancies', {
        method: 'POST',
        body: JSON.stringify(vacancy),
      });
      setVacancies((previous) => sortVacanciesByNewest([result.vacancy, ...previous]));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to publish vacancy.');
      throw requestError;
    }
  };

  const updateVacancy = async (id: string, updates: Omit<Vacancy, 'id' | 'createdAt'>) => {
    try {
      const result = await apiRequest<{ vacancy: Vacancy }>(`/api/vacancies/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setVacancies((previous) =>
        sortVacanciesByNewest(previous.map((vacancy) => vacancy.id === id ? result.vacancy : vacancy)),
      );
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update vacancy.');
      throw requestError;
    }
  };

  const deleteVacancy = async (id: string) => {
    try {
      await apiRequest(`/api/vacancies/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setVacancies((previous) => previous.filter((vacancy) => vacancy.id !== id));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete vacancy.');
      throw requestError;
    }
  };

  const markNewsAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (readNewsIds.includes(id)) return true;
    try {
      await apiRequest(`/api/news/${encodeURIComponent(id)}/read`, { method: 'POST' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to mark news as read.');
      return false;
    }
    setReadNewsIds((previous) => previous.includes(id) ? previous : [...previous, id]);
    setError(null);
    return true;
  }, [readNewsIds]);
  const markVacanciesAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (readVacancyIds.includes(id)) return true;
    try {
      await apiRequest(`/api/vacancies/${encodeURIComponent(id)}/read`, { method: 'POST' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to mark vacancy as read.');
      return false;
    }
    setReadVacancyIds((previous) => previous.includes(id) ? previous : [...previous, id]);
    setError(null);
    return true;
  }, [readVacancyIds]);
  const clearError = () => setError(null);

  return (
    <NewsContext.Provider
      value={{
        newsPosts,
        vacancies,
        unreadCount,
        error,
        clearError,
        addNewsPost,
        updateNewsPost,
        deleteNewsPost,
        addVacancy,
        updateVacancy,
        deleteVacancy,
        markNewsAsRead,
        markVacanciesAsRead,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
};

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
}
