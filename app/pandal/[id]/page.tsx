import React from 'react';
import { notFound } from 'next/navigation';
import {
  getPandalById,
  getPandals,
  getMetroStations,
  getNearestMetroForPandal,
  getBusStops,
  getBusRoutesForPandal,
  getNearbyPandalsAPI,
  getCrowdData,
  getEateriesForPandal,
  getPandalArtDetails,
} from '../../../lib/api';
import PandalDetailClient from './PandalDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const pandals = await getPandals();
  return pandals.map(p => ({ id: p.id.toString() }));
}

export default async function PandalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pandal = await getPandalById(id);

  if (!pandal) {
    notFound();
  }

  const [metroStations, busStops, busConnectivity, nearestMetroInfo, nearbyPandals, crowdInfo, nearbyEateries, artDetails] =
    await Promise.all([
      getMetroStations(),
      getBusStops(),
      getBusRoutesForPandal(pandal.id),
      getNearestMetroForPandal(pandal.id),
      getNearbyPandalsAPI(pandal.latitude, pandal.longitude, 2.5, 4, pandal.id),
      getCrowdData(pandal.id),
      getEateriesForPandal(pandal.id),
      getPandalArtDetails(pandal.id),
    ]);

  return (
    <PandalDetailClient
      pandal={pandal}
      metroStations={metroStations}
      busStops={busStops}
      busConnectivity={busConnectivity}
      nearestMetroInfo={nearestMetroInfo}
      nearbyPandals={nearbyPandals}
      crowdInfo={crowdInfo}
      nearbyEateries={nearbyEateries}
      artDetails={artDetails}
    />
  );
}
