// /src/lib/api.ts

import type { ThingsboardDashboard, ThingsboardDevice } from './types';

async function fetchThingsboard<T>(
  url: string,
  token: string,
  instanceUrl: string
): Promise<T> {
  // Ensure the URL is correctly formed to prevent fetch errors
  const finalUrl = new URL(url, instanceUrl).toString();
  
  const response = await fetch(finalUrl, {
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

  // Handle cases where response might be empty
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch(e) {
    console.error("Failed to parse ThingsBoard API response", text);
    throw new Error("Invalid JSON response from server.");
  }
}

export async function getDashboards(
  token: string,
  instanceUrl: string,
  customerId: string | null
): Promise<ThingsboardDashboard[]> {
  // This endpoint works for users to get their assigned dashboards.
  const url = '/api/user/dashboards?pageSize=100&page=0';

  const result = await fetchThingsboard<{ data: ThingsboardDashboard[] }>(
    url,
    token,
    instanceUrl
  );
  return result?.data || [];
}


export async function getDevices(
  token:string,
  instanceUrl: string,
  customerId: string | null
): Promise<ThingsboardDevice[]> {
    // This endpoint should work for both tenant admins and customer users.
    // For tenant admins, it fetches all devices. For customer users, it's scoped to their customer ID by the API based on the token.
    const url = '/api/devices?pageSize=100&page=0';
    
    const result = await fetchThingsboard<{ data: ThingsboardDevice[] }>(
        url,
        token,
        instanceUrl
    );
    return result?.data || [];
}
