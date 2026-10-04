import { useEffect, useState } from 'react';
import { getPublishedNews, getPublishedStory } from '../services/newsService';

/**
 * Published stories, newest first. `error` is set when the read fails, so a
 * page can say the news could not load rather than claim there is none.
 */
export function useNewsList({ max } = {}) {
  const [state, setState] = useState({ articles: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    getPublishedNews({ max })
      .then((articles) => {
        if (!cancelled) setState({ articles, loading: false, error: null });
      })
      .catch((error) => {
        console.warn('Could not load news:', error);
        if (!cancelled) setState({ articles: [], loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, [max]);

  return state;
}

/** One published story; `article` is null once loaded if there is none. */
export function useNewsStory(slug) {
  const [state, setState] = useState({ article: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ article: null, loading: true, error: null });
    getPublishedStory(slug)
      .then((article) => {
        if (!cancelled) setState({ article, loading: false, error: null });
      })
      .catch((error) => {
        console.warn(`Could not load story ${slug}:`, error);
        if (!cancelled) setState({ article: null, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}
