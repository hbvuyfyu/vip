import React, { useEffect, useRef, useState } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions, Linking } from 'react-native';
import type { Banner } from '@/lib/types';
import { COLORS } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<FlatList>(null);

  // Collect all images from all banners
  const images = banners.flatMap(b =>
    (b.images ?? []).filter(img => img.is_active).map(img => ({ url: img.image_url, link: b.link_url }))
  );

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      const next = (current + 1) % images.length;
      setCurrent(next);
      ref.current?.scrollToIndex({ index: next, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [current, images.length]);

  if (!images.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={ref}
        data={images}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrent(idx);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.url }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 4 },
  image: { width, height: 180 },
  dots: { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: COLORS.gold, width: 18 },
});
