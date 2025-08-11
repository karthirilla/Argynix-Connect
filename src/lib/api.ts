
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
    // Attempt to get more detailed error message from ThingsBoard
    const errorBody = await response.text();
    console.error("ThingsBoard API Error:", errorBody);
    throw new Error(`API call to ${url} failed with status ${response.status}: ${errorBody}`);
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
        '/api/customer/devices?limit=100',
        token,
        instanceUrl
    );
    return result.data;
}
