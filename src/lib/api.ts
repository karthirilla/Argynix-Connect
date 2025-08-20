
// /src/lib/api.ts

import type { ThingsboardDashboard, ThingsboardDevice, ThingsboardAsset, ThingsboardUser, ThingsboardAlarm, ThingsboardCustomer, ThingsboardAuditLog, ThingsboardAdminSettings, ThingsboardSecuritySettings, CalculatedField } from './types';

// Helper function to get a new token using the refresh token
async function getNewToken(instanceUrl: string, refreshToken: string): Promise<{ token: string, refreshToken: string } | null> {
  try {
    const response = await fetch(`${instanceUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Token refresh failed", error);
    return null;
  }
}

async function fetchThingsboard<T>(
  url: string,
  token: string | null,
  instanceUrl: string,
  options: RequestInit = {},
  isRetry: boolean = false // Prevent infinite retry loops
): Promise<T> {
  if (!instanceUrl || instanceUrl === 'http://your-thingsboard-instance.com') {
      throw new Error('ThingsBoard instance URL is not configured. Please set NEXT_PUBLIC_THINGSBOARD_INSTANCE_URL in your environment file.');
  }

  try {
      new URL(instanceUrl);
  } catch (e) {
      throw new Error('Invalid ThingsBoard instance URL. Please check your configuration.');
  }

  const finalUrl = new URL(url, instanceUrl).toString();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['X-Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(finalUrl, {
      ...options,
      headers,
    });
  } catch (error: any) {
    // This catches network errors (e.g., server is down, CORS issues)
    console.error("Network error or CORS issue:", error);
    throw new Error(`Could not connect to the ThingsBoard instance at ${instanceUrl}. Please check the server status, your network connection, and CORS configuration.`);
  }


  // If unauthorized and not a retry, try to refresh the token
  if (response.status === 401 && !isRetry && !url.includes('/api/auth/logout')) {
    const refreshToken = localStorage.getItem('tb_refresh_token');
    if (refreshToken) {
      const newTokens = await getNewToken(instanceUrl, refreshToken);
      if (newTokens) {
        localStorage.setItem('tb_auth_token', newTokens.token);
        localStorage.setItem('tb_refresh_token', newTokens.refreshToken);
        // Retry the original request with the new token
        return fetchThingsboard<T>(url, newTokens.token, instanceUrl, options, true);
      }
    }
    // If refresh fails or no refresh token, logout
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorBody = "An unknown error occurred.";
    try {
      const errorJson = await response.json();
      errorBody = errorJson.message || JSON.stringify(errorJson);
    } catch(e) {
      errorBody = await response.text();
    }
    
    if (typeof errorBody === 'string' && errorBody.includes("permission")) {
      // Don't log permission errors to the console as they are handled in the UI
    } else {
      console.error("ThingsBoard API Error:", errorBody);
    }
    
    throw new Error(`${errorBody}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0' || response.headers.get('Content-Length') === '0') {
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

export async function logout(token: string, instanceUrl: string): Promise<void> {
    const url = '/api/auth/logout';
    await fetchThingsboard<void>(url, token, instanceUrl, { method: 'POST' });
}

export async function changePassword(token: string, instanceUrl: string, currentPassword: string, newPassword: string): Promise<void> {
    const url = '/api/auth/changePassword';
    await fetchThingsboard<void>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
    });
}

export async function requestPasswordReset(instanceUrl: string, email: string): Promise<void> {
    const url = '/api/noauth/resetPasswordByEmail';
    // This is a no-auth endpoint, so token is null
    await fetchThingsboard<void>(url, null, instanceUrl, {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}


export async function getUser(token: string, instanceUrl: string): Promise<ThingsboardUser> {
  const url = '/api/auth/user';
  return await fetchThingsboard<ThingsboardUser>(url, token, instanceUrl);
}

export async function saveUser(
    token: string,
    instanceUrl: string,
    userData: Omit<Partial<ThingsboardUser>, 'id' | 'createdTime'>,
    sendActivationMail: boolean = true
): Promise<ThingsboardUser> {
    const url = `/api/user?sendActivationMail=${sendActivationMail}`;
    return await fetchThingsboard<ThingsboardUser>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

export async function deleteUser(token: string, instanceUrl: string, userId: string): Promise<void> {
    const url = `/api/user/${userId}`;
    await fetchThingsboard<void>(url, token, instanceUrl, { method: 'DELETE' });
}

export async function setUserCredentialsEnabled(token: string, instanceUrl: string, userId: string, enabled: boolean): Promise<void> {
    const url = `/api/user/${userId}/userCredentialsEnabled?userCredentialsEnabled=${enabled}`;
    await fetchThingsboard<void>(url, token, instanceUrl, { method: 'POST' });
}

export async function getCustomers(token: string, instanceUrl: string): Promise<ThingsboardCustomer[]> {
    const url = `/api/customers?pageSize=100&page=0`;
    const result = await fetchThingsboard<{ data: ThingsboardCustomer[] }>(url, token, instanceUrl);
    return result?.data || [];
}

export async function getCustomerUsers(token: string, instanceUrl: string, customerId: string): Promise<ThingsboardUser[]> {
    // Exclude the 'public' customer from user lookups
    if (customerId === '13814000-1dd2-11b2-8080-808080808080') {
        return [];
    }
    const url = `/api/customer/${customerId}/users?pageSize=100&page=0`;
    const result = await fetchThingsboard<{ data: ThingsboardUser[] }>(url, token, instanceUrl);
    return result?.data || [];
}

export async function getUserAttributes(
    token: string,
    instanceUrl: string,
    userId: string
  ): Promise<{ key: string, value: any }[]> {
    const serverScopeUrl = `/api/plugins/telemetry/USER/${userId}/values/attributes/SERVER_SCOPE`;
    const sharedScopeUrl = `/api/plugins/telemetry/USER/${userId}/values/attributes/SHARED_SCOPE`;
    
    try {
        const [serverAttributes, sharedAttributes] = await Promise.all([
            fetchThingsboard<any[]>(serverScopeUrl, token, instanceUrl).catch(() => []),
            fetchThingsboard<any[]>(sharedScopeUrl, token, instanceUrl).catch(() => [])
        ]);
        return [...(serverAttributes || []), ...(sharedAttributes || [])];
    } catch (e) {
        console.error("Failed to fetch one or more user attribute scopes", e);
        return [];
    }
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
  // Check if the customerId is the special "Public" id and treat it as null if so.
  const isPublicCustomer = customerId === '13814000-1dd2-11b2-8080-808080808080';
  const url = customerId && !isPublicCustomer
    ? `/api/customer/${customerId}/dashboards?pageSize=100&page=0`
    : '/api/tenant/dashboards?pageSize=100&page=0'; // Fallback for admins/public
  const result = await fetchThingsboard<{ data: ThingsboardDashboard[] }>(url, token, instanceUrl);
  return result?.data || [];
}

export async function getDashboardById(
  token: string,
  instanceUrl: string,
  dashboardId: string
): Promise<ThingsboardDashboard> {
  const url = `/api/dashboard/info/${dashboardId}`;
  return await fetchThingsboard<ThingsboardDashboard>(url, token, instanceUrl);
}

export async function deleteDashboard(
  token: string,
  instanceUrl: string,
  dashboardId: string
): Promise<void> {
  const url = `/api/dashboard/${dashboardId}`;
  await fetchThingsboard<void>(url, token, instanceUrl, { method: 'DELETE' });
}

export async function makeDashboardPublic(
  token: string,
  instanceUrl: string,
  dashboardId: string
): Promise<ThingsboardDashboard> {
    const url = `/api/dashboard/${dashboardId}/public`;
    return await fetchThingsboard<ThingsboardDashboard>(url, token, instanceUrl, { method: 'POST' });
}

export async function getDevices(
  token:string,
  instanceUrl: string,
  customerId: string | null
): Promise<ThingsboardDevice[]> {
    let url: string;
    if (customerId) {
        url = `/api/customer/${customerId}/devices?pageSize=100&page=0`;
    } else {
        url = `/api/tenant/devices?pageSize=100&page=0`;
    }
    const result = await fetchThingsboard<{ data: ThingsboardDevice[] }>(url, token, instanceUrl);
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

export async function getDeviceTelemetry(
    token: string,
    instanceUrl: string,
    deviceId: string,
    keys: string[],
    startTs: number,
    endTs: number,
    limit: number = 1000,
): Promise<any> {
    const encodedKeys = encodeURIComponent(keys.join(','));
    const url = `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${encodedKeys}&startTs=${startTs}&endTs=${endTs}&limit=${limit}&agg=NONE`;
    return await fetchThingsboard<any>(url, token, instanceUrl);
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
    const result = await fetchThingsboard<{ data: ThingsboardAsset[] }>(url, token, instanceUrl);
    return result?.data || [];
  }

export async function getAssetById(
    token: string,
    instanceUrl: string,
    assetId: string
  ): Promise<ThingsboardAsset> {
    const url = `/api/asset/${assetId}`;
    return await fetchThingsboard<ThingsboardAsset>(url, token, instanceUrl);
  }

export async function getAlarms(
  token: string,
  instanceUrl: string
): Promise<ThingsboardAlarm[]> {
  const url = '/api/alarms?pageSize=100&page=0&sortProperty=createdTime&sortOrder=DESC&fetchOriginator=true';
  const result = await fetchThingsboard<{ data: ThingsboardAlarm[] }>(url, token, instanceUrl);
  return result?.data || [];
}

export async function getAlarmById(
  token: string,
  instanceUrl: string,
  alarmId: string
): Promise<ThingsboardAlarm> {
  const url = `/api/alarm/info/${alarmId}`;
  return await fetchThingsboard<ThingsboardAlarm>(url, token, instanceUrl);
}

export async function ackAlarm(
    token: string,
    instanceUrl: string,
    alarmId: string
): Promise<void> {
    const url = `/api/alarm/${alarmId}/ack`;
    await fetchThingsboard<void>(url, token, instanceUrl, { method: 'POST' });
}

export async function clearAlarm(
    token: string,
    instanceUrl: string,
    alarmId: string
): Promise<void> {
    const url = `/api/alarm/${alarmId}/clear`;
    await fetchThingsboard<void>(url, token, instanceUrl, { method: 'POST' });
}

export async function getAuditLogs(
    token: string,
    instanceUrl: string,
    startTime?: number,
    endTime?: number,
    userId?: string
): Promise<ThingsboardAuditLog[]> {
    const params = new URLSearchParams({
        pageSize: '100',
        page: '0',
        sortProperty: 'createdTime',
        sortOrder: 'DESC',
    });
    if (startTime) params.append('startTime', String(startTime));
    if (endTime) params.append('endTime', String(endTime));

    const baseUrl = userId ? `/api/audit/logs/user/${userId}` : '/api/audit/logs';
    const url = `${baseUrl}?${params.toString()}`;

    const result = await fetchThingsboard<{ data: ThingsboardAuditLog[] }>(url, token, instanceUrl);
    return result?.data || [];
}

// RPC
export async function sendOneWayRpc(
    token: string,
    instanceUrl: string,
    deviceId: string,
    payload: { method: string, params: any, timeout: number }
): Promise<void> {
    const url = `/api/rpc/oneway/${deviceId}`;
    await fetchThingsboard<void>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function scheduleRpc(
    token: string,
    instanceUrl: string,
    deviceId: string,
    payload: { method: string, params: any, timeout: number },
    scheduleTime: number
): Promise<any> {
    const command = {
        entityId: { id: deviceId, entityType: 'DEVICE' },
        type: 'RPC',
        name: payload.method,
        additionalInfo: {
            ...payload,
            scheduleTime,
        }
    };
    const url = `/api/rule-engine/schedule`;
    return await fetchThingsboard<any>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(command)
    });
}

// Admin Settings
export async function getAdminSettings(token: string, instanceUrl: string, key: string): Promise<ThingsboardAdminSettings> {
    const url = `/api/admin/settings/${key}`;
    return await fetchThingsboard<ThingsboardAdminSettings>(url, token, instanceUrl);
}

export async function saveAdminSettings(token: string, instanceUrl: string, settings: { key: string, jsonValue: any }): Promise<ThingsboardAdminSettings> {
    const url = `/api/admin/settings`;
    return await fetchThingsboard<ThingsboardAdminSettings>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(settings)
    });
}

export async function sendTestMail(token: string, instanceUrl: string, email: string, settings: { key: string, jsonValue: any }): Promise<void> {
    const url = `/api/admin/settings/testMail`;
    await fetchThingsboard<void>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(settings)
    });
}

export async function getSecuritySettings(token: string, instanceUrl: string): Promise<ThingsboardSecuritySettings> {
    const url = `/api/admin/securitySettings`;
    return await fetchThingsboard<ThingsboardSecuritySettings>(url, token, instanceUrl);
}

export async function saveSecuritySettings(token: string, instanceUrl: string, settings: any): Promise<ThingsboardSecuritySettings> {
    const url = `/api/admin/securitySettings`;
    return await fetchThingsboard<ThingsboardSecuritySettings>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(settings)
    });
}

// Calculated Fields
export async function getCalculatedFieldsByEntityId(token: string, instanceUrl: string, entityType: 'DEVICE' | 'ASSET', entityId: string): Promise<CalculatedField[]> {
    const url = `/api/${entityType}/${entityId}/calculatedFields?pageSize=100&page=0`;
    const result = await fetchThingsboard<{ data: CalculatedField[] }>(url, token, instanceUrl);
    return result?.data || [];
}

export async function saveCalculatedField(token: string, instanceUrl: string, field: Omit<CalculatedField, 'createdTime'>): Promise<CalculatedField> {
    const url = `/api/calculatedField`;
    return await fetchThingsboard<CalculatedField>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify(field),
    });
}

export async function deleteCalculatedField(token: string, instanceUrl: string, fieldId: string): Promise<void> {
    const url = `/api/calculatedField/${fieldId}`;
    await fetchThingsboard<void>(url, token, instanceUrl, { method: 'DELETE' });
}

export async function testScript(script: string, telemetryJson: string): Promise<any> {
    const url = `/api/calculatedField/testScript`;
    const token = localStorage.getItem('tb_auth_token');
    const instanceUrl = localStorage.getItem('tb_instance_url');
    if (!token || !instanceUrl) throw new Error("Authentication details not found");

    const telemetry = JSON.parse(telemetryJson);

    return await fetchThingsboard<any>(url, token, instanceUrl, {
        method: 'POST',
        body: JSON.stringify({ script, telemetry }),
    });
}

    