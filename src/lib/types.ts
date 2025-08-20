
// /src/lib/types.ts

export type Dashboard = {
    id: string;
    name: string;
    type: string;
    isPublic: boolean;
    deviceCount: number;
};
  
export type Device = {
    id: string;
    name: string;
    type: string;
    label: string | null;
    status: 'Active' | 'Inactive';
    lastActivity: string;
    customerId?: string;
    customerName?: string;
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
    status: 'ACTIVE_UNACK' | 'ACTIVE_ACK' | 'CLEARED_UNACK' | 'CLEARED_ACK';
    originatorName: string;
    originatorType: string;
    createdTime: number;
    ackTs?: number;
    clearTs?: number;
    assignee?: any;
    details?: any;
    propagate: boolean;
};

export interface UserPermissions {
    canExport: boolean;
    canSchedule: boolean;
}

export interface AppUser extends ThingsboardUser {
    permissions: UserPermissions;
    userCredentialsEnabled: boolean;
}

export type AppAuditLog = {
    id: string;
    createdTime: number;
    entityType: string | null;
    entityName: string | null;
    userName: string;
    actionType: string;
    actionStatus: 'SUCCESS' | 'FAILURE';
    failureDetails: string | null;
};


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
    public: boolean;
    publicId?: string;
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
    tenantId?: ThingsboardId;
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
    assignee?: any;
    details?: any;
    propagate: boolean;
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

export type ThingsboardAuditLog = {
    id: ThingsboardId;
    createdTime: number;
    tenantId: ThingsboardId;
    customerId: ThingsboardId | null;
    entityId: ThingsboardId | null;
    userId: ThingsboardId;
    userName: string; // User email
    actionType: string; // e.g., 'LOGIN', 'LOGOUT', 'ADDED'
    actionData: any; // Contains details about the action
    actionStatus: 'SUCCESS' | 'FAILURE';
    actionFailureDetails: string | null;
};

export type ThingsboardRpcRequest = {
    method: string;
    params: any;
    timeout?: number;
    expirationTime?: number;
    persistent?: boolean;
}

// Admin Settings types
export type ThingsboardAdminSettings = {
    key: string;
    jsonValue: any;
    id?: ThingsboardId;
}

export type ThingsboardMailSettings = {
    host: string;
    port: number;
    username: string;
    password?: string;
    enableTls: boolean | string;
    protocol: string;
    timeout: number;
    smtpAuth: boolean | string;
}

export type ThingsboardSecuritySettings = {
    passwordPolicy: {
        minimumLength: number;
        minimumUppercaseLetters: number;
        minimumLowercaseLetters: number;
        minimumDigits: number;
        minimumSpecialCharacters: number;
        allowWhitespace: boolean;
        passwordExpirationPeriodDays?: number;
        passwordReuseFrequencyDays?: number;
    }
}

export interface CalculatedField {
    id?: ThingsboardId;
    createdTime?: number;
    entityId: ThingsboardId;
    name: string;
    script: string;
}

export interface ThingsboardJob {
    id: ThingsboardId;
    createdTime: number;
    type: string; // e.g., 'BULK_IMPORT_DEVICES'
    status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'CANCELLED' | 'FAILED';
    progress?: {
        total: number;
        processed: number;
    };
    additionalInfo?: {
        error?: string;
        [key: string]: any;
    };
    entityId: ThingsboardId | null;
}
