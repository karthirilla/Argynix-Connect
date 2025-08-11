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
    label: string;
    status: 'Active' | 'Inactive'; // This might need to be derived or is part of a different API call
    lastActivity: string; // This might need to be derived or is part of a different API call
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
};
  
export type ThingsboardDevice = {
    id: ThingsboardId;
    createdTime: number;
    name: string;
    type: string;
    label: string | null;
    customerId?: ThingsboardId;
};
