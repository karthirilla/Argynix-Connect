// /src/lib/types.ts

export type Dashboard = {
    id: string;
    name: string;
    type: string;
    deviceCount: number;
};
  
export type Device = {
    id: string;
    name: string;
    type: string;
    label: string | null;
    status: 'Active' | 'Inactive'; // This might need to be derived or is part of a different API call
    lastActivity: string; // This might need to be derived or is part of a different API call
};

export type Asset = {
    id: string;
    name: string;
    type: string;
    label: string;
};

export type Alarm = {
    id: string;
    name: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
    status: string;
    originatorName: string;
    originatorType: string;
    createdTime: number;
}

export interface UserPermissions {
    canExport: boolean;
    canSchedule: boolean;
    userDisabled: boolean;
}

export interface AppUser extends ThingsboardUser {
    permissions: UserPermissions
}


// Raw types from ThingsBoard API
export type ThingsboardId = {
    id: string;
    entityType: string;
};

export type ThingsboardDashboard = {
    id: ThingsboardId;
    createdTime: number;
    title: string;
    name: string; // For consistency, though API uses title
    configuration?: any; // To hold dashboard widget configuration
};
  
export type ThingsboardDevice = {
    id: ThingsboardId;
    createdTime: number;
    name: string;
    type: string;
    label: string | null;
    customerId?: ThingsboardId;
};

export type ThingsboardAsset = {
    id: ThingsboardId;
    createdTime: number;
    name: string;
    type: string;
    label: string | null;
    customerId?: ThingsboardId;
};

export type ThingsboardCustomer = {
    id: ThingsboardId;
    createdTime: number;
    title: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
    state?: string | null;
    city?: string | null;
    address?: string | null;
    address2?: string | null;
    zip?: string | null;
    additionalInfo?: any;
}

export type ThingsboardUser = {
    id: { id: string, entityType: string };
    createdTime: number;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    authority: 'SYS_ADMIN' | 'TENANT_ADMIN' | 'CUSTOMER_USER';
    customerId: { id: string, entityType: string };
    tenantId: { id: string, entityType: string };
    additionalInfo: {
        description?: string;
        address?: {
            street?: string;
            city?: string;
            state?: string;
            zip?: string;
            country?: string;
        };
        mobile?: string;
    } | null;
};

export type ThingsboardAlarm = {
    id: ThingsboardId;
    name: string; // This is the alarm type
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE';
    status: 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';
    originator: ThingsboardId;
    originatorName: string;
    createdTime: number;
    ackTs?: number;
    clearTs?: number;
};

export interface Schedule {
  key: string;
  enabled: boolean;
  deleted?: boolean;
  attributeKey: string;
  attributeValue: string;
  mode: 'particular' | 'recurring';
  fireTime?: string;
  days?: string[];
  time?: string;
}

export type ThingsboardTenantProfileInfo = {
    id: ThingsboardId;
    name: string;
    description: string | null;
    default: boolean;
}
