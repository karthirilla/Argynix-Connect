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
    let url: string;
    
    // Use different endpoints based on whether the user is a tenant admin or customer user.
    // The placeholder customer ID for tenant admins is '13814000-1dd2-11b2-8080-808080808080'
    if (customerId && customerId !== '13814000-1dd2-11b2-8080-808080808080') {
        url = `/api/customer/${customerId}/devices?pageSize=100&page=0`;
    } else {
        // This is the endpoint for tenant admins to get all devices.
        url = `/api/tenant/devices?pageSize=100&page=0`;
    }
    
    const result = await fetchThingsboard<{ data: ThingsboardDevice[] }>(
        url,
        token,
        instanceUrl
    );
    return result?.data || [];
}

export async function getDeviceById(
  token: string,
  instanceUrl: string,
  deviceId: string
): Promise<ThingsboardDevice> {
  const url = `/api/device/${deviceId}`;
  return await fetchThingsboard<ThingsboardDevice>(url, token, instanceUrl);
}
