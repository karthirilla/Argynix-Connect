
// /src/lib/api.ts

import type { ThingsboardDashboard, ThingsboardDevice, ThingsboardAsset, ThingsboardUser, ThingsboardAlarm } from './types';

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

export async function getUser(token: string, instanceUrl: string): Promise<ThingsboardUser> {
  const url = '/api/auth/user';
  return await fetchThingsboard<ThingsboardUser>(url, token, instanceUrl);
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

export async function getDashboardById(
  token: string,
  instanceUrl: string,
  dashboardId: string
): Promise<ThingsboardDashboard> {
  const url = `/api/dashboard/${dashboardId}`;
  return await fetchThingsboard<ThingsboardDashboard>(url, token, instanceUrl);
}


export async function getDevices(
  token:string,
  instanceUrl: string,
  customerId: string | null
): Promise<ThingsboardDevice[]> {
    let url: string;
    
    // Use different endpoints based on whether the user is a tenant admin or customer user.
    if (customerId) {
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

export async function getDeviceAttributes(
    token: string,
    instanceUrl: string,
    deviceId: string
  ): Promise<{ key: string, value: any }[]> {
    const url = `/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes/SERVER_SCOPE`;
    return await fetchThingsboard<any>(url, token, instanceUrl);
}

export async function getDeviceTelemetryKeys(
    token: string,
    instanceUrl: string,
    deviceId: string
  ): Promise<string[]> {
    const url = `/api/plugins/telemetry/DEVICE/${deviceId}/keys/timeseries`;
    return await fetchThingsboard<string[]>(url, token, instanceUrl);
}

export async function getAssets(
    token: string,
    instanceUrl: string,
    customerId: string | null
  ): Promise<ThingsboardAsset[]> {
    let url: string;
      
    if (customerId) {
        url = `/api/customer/${customerId}/assets?pageSize=100&page=0`;
    } else {
        url = `/api/tenant/assets?pageSize=100&page=0`;
    }
      
    const result = await fetchThingsboard<{ data: ThingsboardAsset[] }>(
        url,
        token,
        instanceUrl
    );
    return result?.data || [];
  }

export async function getAlarms(
  token: string,
  instanceUrl: string
): Promise<ThingsboardAlarm[]> {
  const url = '/api/alarms?pageSize=100&page=0&sortProperty=createdTime&sortOrder=DESC';
  const result = await fetchThingsboard<{ data: ThingsboardAlarm[] }>(
    url,
    token,
    instanceUrl
  );
  return result?.data || [];
}
