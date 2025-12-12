'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Package, Star } from 'lucide-react';
import { ExtensionWithStats } from '@/lib/types';
import { TrendIndicator } from '@/components/trend-indicator';
import { AnimatedStat } from '@/components/animated-stat';
import Link from 'next/link';
import Image from 'next/image';

interface ExtensionCardProps {
  extension: ExtensionWithStats;
}

export function ExtensionCard({ extension }: ExtensionCardProps) {
  const trend = extension.trend || 0;
  
  // Safety check for undefined values
  const displayName = extension.displayName || 'Unknown Extension';
  const publisherName = extension.publisherName || 'Unknown Publisher';
  const truncatedName = displayName.length > 20
    ? `${displayName.substring(0, 20)}...`
    : displayName;

  return (
      <Card className="group h-full transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_#000000]">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {extension.iconUrl ? (
            <Image
              src={extension.iconUrl}
              alt={extension.displayName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg border-2 border-foreground flex-shrink-0 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextSibling = e.currentTarget.nextElementSibling;
                if (nextSibling) nextSibling.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 bg-primary rounded-lg border-2 border-foreground flex items-center justify-center flex-shrink-0 ${extension.iconUrl ? 'hidden' : ''}`}>
            <Package className="h-6 w-6 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate" title={displayName}>
              {truncatedName}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-bold truncate uppercase" title={publisherName}>
              {publisherName}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted rounded-lg border-2 border-foreground p-3">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">Installs</p>
            <p className="text-2xl font-black text-foreground">
              <AnimatedStat value={extension.currentInstalls} />
            </p>
          </div>
          <div className="bg-muted rounded-lg border-2 border-foreground p-3">
            <p className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1 uppercase">
              <Star className="h-3 w-3 fill-warning text-warning" />
              Rating
            </p>
            <p className="text-2xl font-black text-foreground">
              <AnimatedStat value={extension.averageRating || 0} decimals={1} />
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4 bg-accent rounded-lg border-2 border-foreground p-2">
          <span className="text-xs font-bold uppercase">Growth:</span>
          <TrendIndicator value={trend} />
        </div>
        <div className="flex gap-3">
          <Button 
            asChild 
            variant="default" 
            size="sm" 
            className="flex-1"
          >
            <Link href={`/extension/${extension.id}`}>View Details</Link>
          </Button>
          <Button asChild variant="outline" size="icon-sm">
            <a
              href={extension.marketplaceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
      </Card>
  );
}