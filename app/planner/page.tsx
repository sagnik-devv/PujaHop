import React, { Suspense } from 'react';
import { getPandals, getMetroStations } from '../../lib/api';
import PlannerClient from './PlannerClient';

interface PageProps {
  searchParams?: Promise<{
    fromSaved?: string;
    ids?: string;
  }>;
}

export default async function PlannerPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const pandals = await getPandals();
  const metroStations = await getMetroStations();

  const initialFromSaved = params.fromSaved === 'true';
  const initialIds = params.ids
    ? params.ids
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n > 0)
    : undefined;

  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>Loading Pujo Planner...</div>}>
      <PlannerClient
        pandals={pandals}
        metroStations={metroStations}
        initialFromSaved={initialFromSaved}
        initialIds={initialIds}
      />
    </Suspense>
  );
}
