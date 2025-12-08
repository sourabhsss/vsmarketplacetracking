'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number;
  className?: string;
  showIcon?: boolean;
  showValue?: boolean;
}

export function TrendIndicator({
  value,
  className,
  showIcon = true,
  showValue = true,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const absValue = Math.abs(value);

  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
    ? 'text-success'
    : 'text-error';

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn('flex items-center gap-1', colorClass, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {showValue && (
        <span className="text-sm font-medium">
          {isPositive && '+'}{absValue.toFixed(1)}%
        </span>
      )}
    </div>
  );
}