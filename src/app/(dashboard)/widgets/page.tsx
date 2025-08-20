
// /app/(dashboard)/widgets/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { getWidgetsBundles, getBundleWidgetTypes } from '@/lib/api';
import type { ThingsboardWidgetsBundle, ThingsboardWidgetType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Package, LayoutGrid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type BundleWithWidgets = ThingsboardWidgetsBundle & { widgets: ThingsboardWidgetType[] };

export default function WidgetsPage() {
  const [bundles, setBundles] = useState<BundleWithWidgets[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('tb_auth_token');
      const instanceUrl = localStorage.getItem('tb_instance_url');

      if (!token || !instanceUrl) {
        setError('Authentication details not found.');
        setIsLoading(false);
        return;
      }

      try {
        const bundlesData = await getWidgetsBundles(token, instanceUrl);
        const bundlesWithWidgets = await Promise.all(
          bundlesData.map(async (bundle) => {
            try {
              const widgets = await getBundleWidgetTypes(token, instanceUrl, bundle.id.id);
              return { ...bundle, widgets };
            } catch (e) {
              console.error(`Failed to fetch widgets for bundle ${bundle.title}`, e);
              return { ...bundle, widgets: [] };
            }
          })
        );

        setBundles(bundlesWithWidgets);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch widgets bundles.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (bundles.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Widget Bundles Found</h3>
            <p className="text-muted-foreground">There are no widget bundles to display.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Widgets Library</h1>
            <p className="text-muted-foreground">A read-only list of all available widget bundles and their widgets.</p>
        </div>
        <Accordion type="multiple" className="space-y-4">
            {bundles.map((bundle) => (
            <AccordionItem value={bundle.id.id} key={bundle.id.id} className="border-0">
                 <Card>
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <CardHeader className="p-0 text-left">
                            <CardTitle className="flex items-center gap-3">
                                <Package className="h-6 w-6 text-primary"/>
                                {bundle.title}
                            </CardTitle>
                             <CardDescription>
                                {bundle.widgets.length} widget{bundle.widgets.length !== 1 && 's'} in this bundle.
                            </CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="px-6 pb-6">
                            {bundle.widgets.length > 0 ? (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                                {bundle.widgets.map(widget => (
                                    <Card key={widget.id.id} className="bg-muted/50">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <LayoutGrid className="h-4 w-4 text-muted-foreground"/>
                                                {widget.name}
                                            </CardTitle>
                                             <CardDescription>
                                                {widget.deprecated ? <span className="text-destructive">Deprecated</span> : 'Available'}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">This bundle contains no widgets.</p>
                            )}
                        </div>
                    </AccordionContent>
                </Card>
            </AccordionItem>
            ))}
        </Accordion>
    </div>
  );
}
