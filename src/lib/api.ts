// /src/lib/api.ts

import type { ThingsboardDashboard, ThingsboardDevice } from './types';

async function fetchThingsboard<T>(
  url: string,
  token: string,
  instanceUrl: string
): Promise<T> {
  const response = await fetch(`${instanceUrl}${url}`, {
    headers: {
      'X-Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}`);
  }

  return response.json();
}

export async function getDashboards(
  token: string,
  instanceUrl: string
): Promise<ThingsboardDashboard[]> {
  const result = await fetchThingsboard<{ data: ThingsboardDashboard[] }>(
    '/api/customer/dashboards?limit=100',
    token,
    instanceUrl
  );
  return result.data;
}

export async function getDevices(
  token: string,
  instanceUrl: string
): Promise<ThingsboardDevice[]> {
    const result = await fetchThingsboard<{ data: ThingsboardDevice[] }>(
        '/api/devices?limit=100', // Note: This uses /api/devices as per common ThingsBoard setups. Adjust if your user has specific customer-level device access patterns.
        token,
        instanceUrl
    );
    return result.data;
}

