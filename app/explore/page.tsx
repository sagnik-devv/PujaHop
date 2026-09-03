import React from 'react';
import { getPandals, getMetroStations, getBusStops } from '../../lib/api';
import ExploreClient from './ExploreClient';

export default async function ExplorePage() {
  const [pandals, metroStations, busStops] = await Promise.all([
    getPandals(),
    getMetroStations(),
    getBusStops(),
  ]);

  return (
    <ExploreClient
      initialPandals={pandals}
      metroStations={metroStations}
      busStops={busStops}
    />
  );
}
