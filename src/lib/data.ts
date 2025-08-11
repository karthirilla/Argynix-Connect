export type Dashboard = {
  id: string;
  name: string;
  type: string;
  deviceCount: number;
};

export const mockDashboards: Dashboard[] = [
  { id: '1', name: 'Energy Consumption', type: 'energy consumption', deviceCount: 5 },
  { id: '2', name: 'Factory Floor Monitoring', type: 'sensor data', deviceCount: 23 },
  { id: '3', name: 'Smart Farm Analytics', type: 'sensor data', deviceCount: 42 },
  { id: '4', name: 'Fleet Management Overview', type: 'asset tracking', deviceCount: 15 },
  { id: '5', name: 'Building HVAC Control', type: 'hvac control', deviceCount: 12 },
  { id: '6', name: 'Warehouse Conditions', type: 'sensor data', deviceCount: 18 },
];

export type Device = {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Inactive';
  lastActivity: string;
};

export const mockDevices: Device[] = [
  { id: 'd1', name: 'Main Power Meter', type: 'Power Meter', status: 'Active', lastActivity: '2 minutes ago' },
  { id: 'd2', name: 'Boiler Temperature Sensor', type: 'Temperature Sensor', status: 'Active', lastActivity: '1 minute ago' },
  { id: 'd3', name: 'CNC Machine #1', type: 'Industrial IoT', status: 'Inactive', lastActivity: '3 hours ago' },
  { id: 'd4', name: 'Delivery Truck 4', type: 'GPS Tracker', status: 'Active', lastActivity: '30 seconds ago' },
  { id: 'd5', name: 'Main HVAC Unit', type: 'HVAC', status: 'Active', lastActivity: '5 minutes ago' },
  { id: 'd6', name: 'Soil Moisture Sensor A1', type: 'Moisture Sensor', status: 'Inactive', lastActivity: '1 day ago' },
  { id: 'd7', name: 'Forklift #3', type: 'Industrial Vehicle', status: 'Active', lastActivity: '10 minutes ago' },
];

