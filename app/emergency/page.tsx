import React from 'react';
import { getEmergencyServices } from '../../lib/api';
import EmergencyClient from './EmergencyClient';

export default async function EmergencyPage() {
  const services = await getEmergencyServices();

  return <EmergencyClient services={services} />;
}
