// /src/lib/api.ts

import type { ThingsboardDashboard, ThingsboardDevice, ThingsboardAsset, ThingsboardUser, ThingsboardAlarm, ThingsboardCustomer, ThingsboardTenantProfileInfo } from './types';

async function fetchThingsboard<T>(
  url: string,
  token: string,
  instanceUrl: string,
  options: RequestInit = {}
): Promise<T> {
  // Ensure the URL is correctly formed to prevent fetch errors
  const finalUrl = new URL(url, instanceUrl).toString();
  
  const response = await fetch(finalUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Attempt to get more detailed error message from ThingsBoard
    const errorBody = await response.text();
    console.error("ThingsBoard API Error:", errorBody);
    throw new Error(`API call to ${url} failed with status ${response.status}: ${errorBody}`);
  }

  // Handle cases where response might be empty (e.g., for 204 No Content on delete)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null as T;
  }

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

export async function getCustomers(token: string, instanceUrl: string): Promise<ThingsboardCustomer[]> {
    const url = `/api/customers?pageSize=100&page=0`;
    const result = await fetchThingsboard<{ data: ThingsboardCustomer[] }>(url, token, instanceUrl);
    return result?.data || [];
}

export async function getCustomerUsers(token: string, instanceUrl: string, customerId: string): Promise<ThingsboardUser[]> {
    const url = `/api/customer/${customerId}/users?pageSize=100&page=0`;
    const result = await fetchThingsboard<{ data: ThingsboardUser[] }>(url, token, instanceUrl);
    return result?.data || [];
}


export async function getUserAttributes(
    token: string,
    instanceUrl: string,
    userId: string,
    scope: 'SERVER_SCOPE' | 'SHARED_SCOPE' = 'SHARED_SCOPE'
  ): Promise<{ key: string, value: any }[]> {
    const url = `/api/plugins/telemetry/USER/${userId}/values/attributes/${scope}`;
    return await fetchThingsboard<any>(url, token, instanceUrl);
}


export async function saveUserAttributes(
    token: string,
    instanceUrl: string,
    userId: string,
    attributes: Record<string, any>,
    scope: 'SERVER_SCOPE' | 'SHARED_SCOPE' = 'SHARED_SCOPE'
): Promise<void> {
    const url = `/api/plugins/telemetry/USER/${userId}/${scope}`;
    await fetchThingsboard<void>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(attributes),
    });
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

export async function saveDeviceAttributes(
    token: string,
    instanceUrl: string,
    deviceId: string,
    attributes: Record<string, any>
): Promise<void> {
    const url = `/api/plugins/telemetry/DEVICE/${deviceId}/SERVER_SCOPE`;
    await fetchThingsboard<void>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(attributes),
    });
}

export async function deleteDeviceAttributes(
    token: string,
    instanceUrl: string,
    deviceId: string,
    keys: string[]
): Promise<void> {
    const url = `/api/plugins/telemetry/DEVICE/${deviceId}/SERVER_SCOPE?keys=${keys.join(',')}`;
    await fetchThingsboard<void>(url, token, instanceUrl, {
        method: 'DELETE',
    });
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

export async function getTenantProfileInfos(token: string, instanceUrl: string): Promise<ThingsboardTenantProfileInfo[]> {
    const url = `/api/tenantProfileInfos?pageSize=100&page=0`;
    const result = await fetchThingsboard<{ data: ThingsboardTenantProfileInfo[] }>(url, token, instanceUrl);
    return result?.data || [];
}
