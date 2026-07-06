'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Clock, Headphones, Star, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Banner, Category, Service } from '@/lib/types';
import { BannerCarousel } from '@/components/banner-carousel';
import { ServiceCard, ServiceCardSkeleton } from '@/components/service-card';
import { KingLogo } from '@/components/king-logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
  { Icon: Zap, title: 'Instant Delivery', desc: 'Automated order processing within minutes.' },
  { Icon: Shield, title: 'Secure Payments', desc: 'Encrypted transactions and protected wallet system.' },
  { Icon: Clock, title: '24/7 Availability', desc: 'Place orders anytime, day or night.' },
  { Icon: Headphones, title: 'Dedicated Support', desc: 'WhatsApp support team ready to help.' },
];

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: bannersData }, { data: catsData }, { data: featData }] = await Promise.all([
        supabase
          .from('banners')
          .select('*, banner_images(*)')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('services')
          .select('*, provider:providers(*)')
          .eq('is_visible', true)
          .eq('is_featured', true)
          .order('sort_order')
          .limit(8),
      ]);
      setBanners((bannersData as Banner[]) || []);
      setCategories((catsData as Category[]) || []);
      setFeatured((featData as Service[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 pt-6 pb-4">
        <BannerCarousel banners={banners} />
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-silver-900">Browse Categories</h2>
          <p className="text-silver-500 mt-2">Find the service you need from our curated categories</p>
        </div>
        {categories.length === 0 && !loading ? (
          <div className="text-center py-12 text-silver-500">
            <p>Categories will appear here once configured by admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/services?category=${cat.slug}`}>
                <Card className="silver-card p-4 flex flex-col items-center text-center group cursor-pointer">
                  <div className="h-16 w-16 rounded-full silver-gradient flex items-center justify-center overflow-hidden mb-3 group-hover:scale-105 transition-transform">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                    ) : (
                      <Star className="h-8 w-8 text-silver-500" />
                    )}
                  </div>
                  <h3 className="font-medium text-silver-900 text-sm line-clamp-2">{cat.name}</h3>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-silver-900">Featured Services</h2>
            <p className="text-silver-500 mt-1">Hand-picked premium services for you</p>
          </div>
          <Link href="/services">
            <Button variant="outline" className="hidden sm:flex">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 text-silver-500">
            <p>No featured services yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
        <div className="text-center mt-6 sm:hidden">
          <Link href="/services">
            <Button variant="outline">
              View All Services <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const Icon = f.Icon;
            return (
              <Card key={f.title} className="silver-card p-6 text-center">
                <div className="h-14 w-14 rounded-2xl silver-gradient flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-7 w-7 text-silver-700" />
                </div>
                <h3 className="font-semibold text-silver-900">{f.title}</h3>
                <p className="text-sm text-silver-500 mt-1">{f.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Card className="silver-card p-8 md:p-12 text-center overflow-hidden relative">
          <div className="absolute inset-0 silver-gradient opacity-50" />
          <div className="relative">
            <div className="flex justify-center mb-4">
              <KingLogo size="lg" animated />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-silver-900">
              The King of Digital Services
            </h2>
            <p className="text-silver-600 mt-3 max-w-2xl mx-auto">
              Join thousands of customers who trust King for their digital service needs.
              Fast delivery, secure payments, and 24/7 support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Link href="/register">
                <Button size="lg" className="silver-button">
                  Get Started <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      <section className="container mx-auto px-4 py-8">
        <Card className="silver-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-silver-700" />
            <div>
              <h3 className="font-semibold text-silver-900">Trusted by thousands</h3>
              <p className="text-sm text-silver-500">Secure, fast, and reliable digital services platform.</p>
            </div>
          </div>
          <Link href="/wallet">
            <Button className="silver-button">
              Charge Your Wallet <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
