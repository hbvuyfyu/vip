'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Category, Service } from '@/lib/types';
import { ServiceCard, ServiceCardSkeleton } from '@/components/service-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'featured' | 'price_low' | 'price_high' | 'name'>('featured');

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: servicesData }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase
          .from('services')
          .select('*, provider:providers(*), category:categories(*)')
          .eq('is_visible', true)
          .order('sort_order'),
      ]);
      setCategories((cats as Category[]) || []);
      setServices((servicesData as Service[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = services;
    if (activeCategory !== 'all') {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) list = list.filter((s) => s.category_id === cat.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === 'price_low') sorted.sort((a, b) => a.sell_price - b.sell_price);
    else if (sort === 'price_high') sorted.sort((a, b) => b.sell_price - a.sell_price);
    else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return sorted;
  }, [services, categories, activeCategory, search, sort]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-silver-900">All Services</h1>
        <p className="text-silver-500 mt-1">Browse our complete catalog of digital services</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-400" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-silver-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-10 rounded-md border border-silver-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-silver-400"
          >
            <option value="featured">Featured first</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4 md:flex-wrap md:overflow-visible">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory('all')}
          className={cn('whitespace-nowrap', activeCategory === 'all' && 'silver-button')}
        >
          All Services
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.slug)}
            className={cn('whitespace-nowrap', activeCategory === cat.slug && 'silver-button')}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-silver-500">
          <p className="text-lg">No services found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
