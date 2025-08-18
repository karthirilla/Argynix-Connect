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
import { Eye, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AssetsPage() {
  const [assets, setAssets] = useState<AppAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

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

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(filter.toLowerCase()) ||
    asset.type.toLowerCase().includes(filter.toLowerCase()) ||
    asset.label.toLowerCase().includes(filter.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-0 md:px-4">
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
        <div className="md:hidden grid gap-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-9 w-full mt-2" />
                    </CardContent>
                </Card>
            ))}
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
    <div className="container mx-auto px-0 md:px-4 space-y-4">
        <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter by name, type, or label..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden grid gap-4">
            {filteredAssets.map((asset) => (
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
                    {filteredAssets.map((asset) => (
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
        {filteredAssets.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                No assets match your filter.
            </div>
        )}
    </div>
  );
}
