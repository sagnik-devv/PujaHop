import React from 'react';
import { getAllToilets } from '../../lib/api';
import NearbyToiletsClient from './NearbyToiletsClient';

interface PageProps {
  searchParams: Promise<{
    lat?: string;
    lon?: string;
  }>;
}

export default async function NearbyToiletsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const toilets = await getAllToilets();

  const initialLat = params.lat ? parseFloat(params.lat) : undefined;
  const initialLon = params.lon ? parseFloat(params.lon) : undefined;

  return (
    <NearbyToiletsClient
      toilets={toilets}
      initialLat={initialLat}
      initialLon={initialLon}
    />
  );
}
