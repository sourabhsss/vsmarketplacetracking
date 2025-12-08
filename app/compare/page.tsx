'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, GitCompare } from 'lucide-react';
import Image from 'next/image';
import { Extension } from '@/lib/types';

export default function ComparePage() {
  const router = useRouter();
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);

  const { data: extensions } = useQuery<Extension[]>({
    queryKey: ['extensions'],
    queryFn: async () => {
      const res = await fetch('/api/extensions');
      if (!res.ok) throw new Error('Failed to fetch extensions');
      return res.json();
    },
  });

  const toggleExtension = (id: string) => {
    setSelectedExtensions((prev) =>
      prev.includes(id)
        ? prev.filter((extId) => extId !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 glass-effect"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <GitCompare className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Compare Extensions
              </h1>
              <p className="text-sm text-muted-foreground">
                Select up to 5 extensions to compare
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="glass-effect border-border/50 mb-8">
          <CardHeader>
            <CardTitle>Select Extensions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {extensions?.map((ext) => {
                const isSelected = selectedExtensions.includes(ext.id);
                return (
                  <button
                    key={ext.id}
                    onClick={() => toggleExtension(ext.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 glow-primary'
                        : 'border-border/50 hover:border-primary/50 glass-effect'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {ext.iconUrl ? (
                        <Image
                          src={ext.iconUrl}
                          alt={ext.displayName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-md"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <GitCompare className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ext.displayName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {ext.publisherName}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedExtensions.length > 0 && (
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle>Comparison Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <p className="text-muted-foreground text-center py-20">
                  Comparison chart will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedExtensions.length === 0 && (
          <div className="text-center py-20">
            <GitCompare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Extensions Selected</h3>
            <p className="text-muted-foreground">
              Select extensions above to start comparing
            </p>
          </div>
        )}
      </main>
    </div>
  );
}