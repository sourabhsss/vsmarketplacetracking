'use client';

import { Star, StarHalf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RatingCardProps {
  averageRating: number;
  ratingCount: number;
  distribution?: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
}

export function RatingCard({ averageRating, ratingCount, distribution }: RatingCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="h-5 w-5 fill-warning text-warning" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className="h-5 w-5 fill-warning text-warning" />
      );
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-5 w-5 text-muted-foreground" />
      );
    }

    return stars;
  };

  const total = distribution
    ? distribution.five + distribution.four + distribution.three + distribution.two + distribution.one
    : ratingCount;

  return (
    <Card className="card-hover glass-effect border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Ratings & Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold gradient-text">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex gap-0.5 mt-2">
              {renderStars(averageRating)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {ratingCount.toLocaleString()} ratings
            </p>
          </div>

          {distribution && (
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[`${['one', 'two', 'three', 'four', 'five'][star - 1]}` as keyof typeof distribution];
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-8">
                      {star} ★
                    </span>
                    <Progress value={percentage} className="h-2 flex-1" />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}