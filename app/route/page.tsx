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
  const initialFromName = params.fromName || 'Current Location';
  const initialLat = params.lat ? parseFloat(params.lat) : undefined;
  const initialLon = params.lon ? parseFloat(params.lon) : undefined;

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
