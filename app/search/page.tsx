import React from 'react';
import { searchPandals } from '../../lib/api';
import SearchClient from './SearchClient';

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q || '';
  const initialResults = query ? await searchPandals(query) : { pandals: [], metroStations: [], areas: [] };

  return <SearchClient initialQuery={query} initialResults={initialResults} />;
}
