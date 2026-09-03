import React from 'react';
import { Metadata } from 'next';
import { getMetroStations, getPandals } from '../../lib/api';
import MetroPageClient from './MetroPageClient';

export const metadata: Metadata = {
  title: 'Kolkata Metro Durga Puja Guide & Station Navigator | Pujo Navigation',
  description:
    'Complete Kolkata Metro station-by-station Durga Puja guide. Discover iconic and neighborhood pandals within walking distance from every Blue, Green, Purple, and Orange line station with direct Google Maps directions.',
};

interface MetroPageProps {
  searchParams: Promise<{ station?: string }>;
}

export default async function MetroPage({ searchParams }: MetroPageProps) {
  const { station } = await searchParams;
  const initialStationId = station ? parseInt(station, 10) : undefined;

  const [metroStations, pandals] = await Promise.all([
    getMetroStations(),
    getPandals(),
  ]);

  return (
    <MetroPageClient
      metroStations={metroStations}
      pandals={pandals}
      initialStationId={initialStationId}
    />
  );
}
