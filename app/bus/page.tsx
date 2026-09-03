import React from 'react';
import { Metadata } from 'next';
import { getBusRoutes, getBusStops, getPandals, getMetroStations } from '../../lib/api';
import BusPageClient from './BusPageClient';

export const metadata: Metadata = {
  title: 'Kolkata Bus Durga Puja Route Navigator & Pandal Hop Guide | PujarHop',
  description:
    'Complete Kolkata Bus route-by-route Durga Puja guide. Discover 180+ bus lines (WBTC, Private, Mini, AC) and 54 key transit hubs connecting all 248 iconic and neighborhood pandals with direct route stops and walking directions.',
};

interface BusPageProps {
  searchParams: Promise<{ bus?: string; stop?: string }>;
}

export default async function BusPage({ searchParams }: BusPageProps) {
  const { bus, stop } = await searchParams;

  const [busRoutes, busStops, pandals, metroStations] = await Promise.all([
    getBusRoutes(),
    getBusStops(),
    getPandals(),
    getMetroStations(),
  ]);

  return (
    <BusPageClient
      busRoutes={busRoutes}
      busStops={busStops}
      pandals={pandals}
      metroStations={metroStations}
      initialBusNumber={bus}
      initialStopName={stop}
    />
  );
}
