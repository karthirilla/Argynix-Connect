// /app/assets/page.tsx
"use client";

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAssets } from '@/lib/api';
import type { Asset as AppAsset, ThingsboardAsset } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


export default function AssetsPage() {
  const [assets, setAssets] = useState<AppAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');
      const customerId = localStorage.getItem('tb_customer_id');

      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const tbAssets: ThingsboardAsset[] = await getAssets(token, instanceUrl, customerId);
        
        const formattedAssets: AppAsset[] = tbAssets.map(a => ({
          id: a.id.id,
          name: a.name,
          type: a.type,
          label: a.label || '',
        }));
        
        setAssets(formattedAssets);

      } catch (e) {
        setError('Failed to fetch assets.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4">
        <div className="rounded-lg border overflow-hidden">
         <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[120px] float-right" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }
  
  if (assets.length === 0) {
    return <div className="text-center text-muted-foreground">No assets found.</div>;
  }

  return (
    <div className="container mx-auto px-0 md:px-4">
        {/* Mobile View */}
        <div className="md:hidden grid gap-4">
            {assets.map((asset) => (
                <Card key={asset.id}>
                    <CardHeader>
                        <CardTitle className="text-base">{asset.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div><strong>Type:</strong> {asset.type}</div>
                        <div><strong>Label:</strong> {asset.label}</div>
                        <Button asChild variant="outline" size="sm" disabled className="w-full mt-2">
                            <Link href={`/assets/${asset.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assets.map((asset) => (
                    <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.type}</TableCell>
                        <TableCell>{asset.label}</TableCell>
                        <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" disabled>
                            <Link href={`/assets/${asset.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                            </Link>
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
}
