'use client';

import Link from 'next/link';
import { Star, Zap, ShoppingCart } from 'lucide-react';
import type { Service } from '@/lib/types';
import { formatCurrency, truncate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  href?: string;
}

export function ServiceCard({ service, href }: ServiceCardProps) {
  const link = href || `/services/${service.id}`;
  return (
    <Card className="silver-card overflow-hidden p-0 flex flex-col group">
      <Link href={link} className="block relative aspect-square overflow-hidden bg-silver-100">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full silver-gradient flex items-center justify-center">
            <Zap className="h-12 w-12 text-silver-400" />
          </div>
        )}
        {service.is_featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-silver-900/80 text-white text-xs font-medium">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            Featured
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link href={link}>
          <h3 className="font-semibold text-silver-900 line-clamp-1">{service.name}</h3>
        </Link>
        <p className="text-sm text-silver-500 mt-1 line-clamp-2 flex-1">
          {truncate(service.description || 'Premium digital service with instant delivery.', 80)}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-silver-500">Price</span>
            <p className="text-lg font-bold text-silver-900">{formatCurrency(service.sell_price)}</p>
          </div>
          <Link href={link}>
            <Button size="sm" className="silver-button">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Order
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className={cn('rounded-xl border border-silver-200 bg-white overflow-hidden')}>
      <div className="aspect-square animate-shimmer" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 rounded animate-shimmer" />
        <div className="h-3 w-full rounded animate-shimmer" />
        <div className="h-3 w-1/2 rounded animate-shimmer" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 w-16 rounded animate-shimmer" />
          <div className="h-8 w-16 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
