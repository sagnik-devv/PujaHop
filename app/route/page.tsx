import React from 'react';
import { getPandals, getMetroStations } from '../../lib/api';
import RouteClient from './RouteClient';

interface PageProps {
  searchParams: Promise<{
    to?: string;
    fromName?: string;
    lat?: string;
    lon?: string;
  }>;
}

export default async function RoutePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pandals = await getPandals();
  const metroStations = await getMetroStations();

  const initialToId = params.to ? parseInt(params.to, 10) : pandals[0]?.id || 1;
  const initialFromName = params.fromName || 'Central Kolkata (Esplanade)';
  const initialLat = params.lat ? parseFloat(params.lat) : (params.fromName ? undefined : 22.5649);
  const initialLon = params.lon ? parseFloat(params.lon) : (params.fromName ? undefined : 88.3517);

  return (
    <RouteClient
      pandals={pandals}
      metroStations={metroStations}
      initialToId={initialToId}
      initialFromName={initialFromName}
      initialLat={initialLat}
      initialLon={initialLon}
    />
  );
}
