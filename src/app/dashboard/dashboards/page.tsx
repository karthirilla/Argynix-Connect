import DashboardsList from '@/components/dashboard/dashboards-list';
import { mockDashboards } from '@/lib/data';

export default async function DashboardsPage() {
  // In a real app, you would fetch this data from the ThingsBoard API
  const dashboards = mockDashboards;

  return (
    <div className="container mx-auto">
      <DashboardsList dashboards={dashboards} />
    </div>
  );
}
