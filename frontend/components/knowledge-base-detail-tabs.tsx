import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Documents } from './documents';
import { KnowledgeBaseVersions } from './knowledge-base-versions';
import { apiClient, KnowledgeBase } from '@/lib/api-client';
import { Badge } from './ui/badge';
import { GitBranch, FileText, Info, Calendar, Layers, Star } from 'lucide-react';

interface KnowledgeBaseDetailTabsProps {
  kb: KnowledgeBase;
  onBack?: () => void;
  onDocumentSelect: (document: any) => void;
  onViewVersionDetails: (version: any) => void;
  onCreateVersion: () => void;
  defaultTab?: 'overview' | 'documents' | 'versions';
}

export function KnowledgeBaseDetailTabs({ kb, onBack, onDocumentSelect, onViewVersionDetails, onCreateVersion, defaultTab = 'overview' }: KnowledgeBaseDetailTabsProps) {
  const [tab, setTab] = useState(defaultTab);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [versionCount, setVersionCount] = useState<number | null>(null);
  const [primaryVersion, setPrimaryVersion] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const docs = await apiClient.getDocumentsByKb(kb.id);
        setDocCount(docs.length);
        const versions: any[] = await apiClient.getKnowledgeBaseVersions(kb.id);
        setVersionCount(versions.length);
        const primary = versions.find((v: any) => v.is_primary);
        setPrimaryVersion(primary ? primary.version_number : null);
      } catch {
        setDocCount(null);
        setVersionCount(null);
        setPrimaryVersion(null);
      }
    }
    fetchStats();
  }, [kb.id]);

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value as 'overview' | 'documents' | 'versions')} className="w-full">
        <TabsList className="mb-4 flex gap-2 bg-muted rounded-lg p-1">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
          <TabsTrigger value="versions" className="flex-1">Versions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Info className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl font-bold mb-1">{kb.name}</CardTitle>
                <div className="text-muted-foreground text-sm">ID: <span className="font-mono">{kb.id}</span></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-base text-muted-foreground">
                {kb.description || <span className="italic">No description provided.</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs uppercase text-muted-foreground">Documents</span>
                  <span className="font-bold text-lg">{docCount !== null ? docCount : '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs uppercase text-muted-foreground">Versions</span>
                  <span className="font-bold text-lg">{versionCount !== null ? versionCount : '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-xs uppercase text-muted-foreground">Primary Version</span>
                  <span className="font-semibold text-lg">{primaryVersion || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Documents selectedKb={kb} onDocumentSelect={onDocumentSelect} />
        </TabsContent>
        <TabsContent value="versions">
          <KnowledgeBaseVersions kb={kb} onViewVersionDetails={onViewVersionDetails} onCreateVersion={onCreateVersion} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 