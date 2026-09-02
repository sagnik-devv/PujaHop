import React from 'react';
import { getPandals, getMetroStations } from '../../lib/api';
import NearbyClient from './NearbyClient';

interface PageProps {
  searchParams: Promise<{
    lat?: string;
    lon?: string;
  }>;
}

export default async function NearbyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pandals = await getPandals();
  const metroStations = await getMetroStations();

  const initialLat = params.lat ? parseFloat(params.lat) : undefined;
  const initialLon = params.lon ? parseFloat(params.lon) : undefined;

  return (
    <NearbyClient
      pandals={pandals}
      metroStations={metroStations}
      initialLat={initialLat}
      initialLon={initialLon}
    />
  );
}
