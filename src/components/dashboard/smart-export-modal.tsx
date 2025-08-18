
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Dashboard } from '@/lib/types';
import type { SmartExportOutput } from '@/ai/flows/smart-export';
import { getSmartExportSuggestion } from '@/lib/actions';
import { Loader2, FileJson, FileText, Lightbulb, Download } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface SmartExportModalProps {
  dashboard: Dashboard;
  isOpen: boolean;
  onClose: () => void;
}

export function SmartExportModal({ dashboard, isOpen, onClose }: SmartExportModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SmartExportOutput | null>(null);
  const [instanceUrl, setInstanceUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSuggestion(null);
      const url = localStorage.getItem('tb_instance_url');
      setInstanceUrl(url || '');
    }
  }, [isOpen]);

  const handleGetSuggestion = async () => {
    if (!instanceUrl) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'ThingsBoard instance URL not found.',
      });
      return;
    }

    setIsLoading(true);
    const result = await getSmartExportSuggestion({
      thingsBoardInstance: instanceUrl,
      dashboardType: dashboard.type,
    });
    setIsLoading(false);

    if (result.success && result.data) {
      setSuggestion(result.data);
      toast({
        title: 'Suggestion Ready!',
        description: 'AI has generated export recommendations.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
  };
  
  const handleExport = () => {
    toast({
        title: "Export Started",
        description: `Your data is being exported as a ${suggestion?.optimalFormat} file.`
    })
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Smart Export for "{dashboard.name}"</DialogTitle>
          <DialogDescription>
            Use AI to get suggestions on the best fields and format for your data export.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!suggestion ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
                <Lightbulb className="h-12 w-12 text-accent mb-4" />
                <p className="text-muted-foreground mb-4">Click below to get AI-powered export recommendations.</p>
                 <Button onClick={handleGetSuggestion} disabled={isLoading} className="bg-accent hover:bg-accent/90">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Get Suggestions
                </Button>
            </div>
          ) : (
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg">AI Recommendations</h3>
                <div>
                    <h4 className="font-medium text-base mb-2">Optimal Format</h4>
                    <Badge variant="secondary" className="text-base">
                        {suggestion.optimalFormat === 'JSON' ? <FileJson className="mr-2 h-4 w-4"/> : <FileText className="mr-2 h-4 w-4"/>}
                        {suggestion.optimalFormat}
                    </Badge>
                </div>
                 <div>
                    <h4 className="font-medium text-base mb-2">Suggested Fields</h4>
                    <div className="flex flex-wrap gap-2">
                        {suggestion.suggestedFields.map(field => (
                            <Badge key={field} variant="outline">{field}</Badge>
                        ))}
                    </div>
                </div>
                <Separator />
                <div>
                    <h4 className="font-medium text-base mb-2">Reasoning</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">{suggestion.reasoning}</p>
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {suggestion && (
            <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export as {suggestion.optimalFormat}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
