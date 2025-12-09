'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2, Package, Star } from 'lucide-react';
import { ExtensionWithStats } from '@/lib/types';
import { TrendIndicator } from '@/components/trend-indicator';
import { AnimatedStat } from '@/components/animated-stat';
import { CometCard } from '@/components/ui/comet-card';
import { BorderBeam } from '@/components/ui/border-beam';
import Link from 'next/link';
import Image from 'next/image';

interface ExtensionCardProps {
  extension: ExtensionWithStats;
  onDelete: (id: string) => void;
}

export function ExtensionCard({ extension, onDelete }: ExtensionCardProps) {
  const trend = extension.trend || 0;
  
  // Safety check for undefined values
  const displayName = extension.displayName || 'Unknown Extension';
  const publisherName = extension.publisherName || 'Unknown Publisher';
  const truncatedName = displayName.length > 20
    ? `${displayName.substring(0, 20)}...`
    : displayName;

  return (
    <CometCard rotateDepth={15} translateDepth={15} className="w-full h-full">
      <Card className="glass-effect border-border/50 group relative overflow-hidden h-full transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]">
        <BorderBeam 
          lightColor="#6366f1" 
          lightWidth={200} 
          duration={15} 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {extension.iconUrl ? (
            <Image
              src={extension.iconUrl}
              alt={extension.displayName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-md flex-shrink-0 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextSibling = e.currentTarget.nextElementSibling;
                if (nextSibling) nextSibling.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20 ${extension.iconUrl ? 'hidden' : ''}`}>
            <Package className="h-6 w-6 text-primary drop-shadow-glow" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate" title={displayName}>
              {truncatedName}
            </CardTitle>
            <p className="text-sm text-muted-foreground truncate" title={publisherName}>
              {publisherName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            onDelete(extension.id);
          }}
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Installs</p>
            <p className="text-2xl font-bold gradient-text">
              <AnimatedStat value={extension.currentInstalls} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" />
              Rating
            </p>
            <p className="text-2xl font-bold gradient-text">
              <AnimatedStat value={extension.averageRating || 0} decimals={1} />
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Growth:</span>
          <TrendIndicator value={trend} />
        </div>
        <div className="flex gap-2">
          <Button 
            asChild 
            variant="outline" 
            size="sm" 
            className="flex-1 glass-effect border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <Link href={`/extension/${extension.id}`}>View Details</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="glass-effect hover:bg-primary/5">
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
    </CometCard>
  );
}