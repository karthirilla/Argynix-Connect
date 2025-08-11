import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockDevices } from '@/lib/data';
import { cn } from '@/lib/utils';

export default async function DevicesPage() {
  // In a real app, you would fetch this data from the ThingsBoard API
  const devices = mockDevices;

  return (
    <div className="container mx-auto">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell>{device.type}</TableCell>
                <TableCell>
                  <Badge
                    variant={device.status === 'Active' ? 'default' : 'secondary'}
                    className={cn(
                        device.status === 'Active' && 'bg-green-500/20 text-green-700 border-green-500/20 hover:bg-green-500/30',
                        device.status === 'Inactive' && 'bg-gray-500/20 text-gray-700 border-gray-500/20 hover:bg-gray-500/30'
                    )}
                  >
                    {device.status}
                  </Badge>
                </TableCell>
                <TableCell>{device.lastActivity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
