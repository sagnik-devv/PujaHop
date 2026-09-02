import React from 'react';
import { getPandals, getMetroStations } from '../../lib/api';
import ExploreClient from './ExploreClient';

export default async function ExplorePage() {
  const pandals = await getPandals();
  const metroStations = await getMetroStations();

  return <ExploreClient initialPandals={pandals} metroStations={metroStations} />;
}
