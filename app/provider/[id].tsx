import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Theme';
import {
  FieldButton,
  SectionEyebrow,
  VerificationMark,
} from '@/components/fieldnotes';
import { dataStore } from '@/services/dataStore';
import { ProviderProfile, Review } from '@/types/database';
import { formatCurrency } from '@/lib/formatters';

export default function ProviderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPro = async () => {
      try {
        if (!id) return;
        const [p, revs] = await Promise.all([
          dataStore.getProviderById(id),
          dataStore.getReviews(id),
        ]);
        setProvider(p);
        setReviews(revs);
      } catch (err) {
        console.error('Failed to load provider profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPro();
  }, [id]);

  if (loading || !provider) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.forestGreen} />
        <Text style={styles.loadingText}>LOADING SPECIALIST PROFILE...</Text>
      </View>
    );
  }

  const initials = provider.professional_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* MASTHEAD CARD */}
        <View style={styles.profileCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{provider.professional_name}</Text>
              {provider.verification_status === 'approved' && (
                <VerificationMark label="OFFICIAL VERIFIED SPECIALIST" />
              )}
              <View style={styles.ratingRow}>
                <Feather name="star" size={13} color="#D97706" />
                <Text style={styles.ratingVal}>
                  {provider.average_rating.toFixed(1)}
                </Text>
                <Text style={styles.reviewCount}>({provider.total_reviews} reviews)</Text>
              </View>
            </View>
          </View>

          <View style={styles.areaRow}>
            <Feather name="map-pin" size={13} color={Palette.forestGreen} />
            <Text style={styles.areaText}>
              Service Zone: {provider.service_area}
            </Text>
          </View>

          <Text style={styles.descTitle}>PROFESSIONAL BACKGROUND</Text>
          <Text style={styles.desc}>{provider.description}</Text>
        </View>

        {/* SERVICES OFFERED & RATES */}
        <View style={styles.sectionWrap}>
          <SectionEyebrow label="// TRADE SERVICES & CALL-OUT RATES" />
          <View style={styles.servicesList}>
            {provider.services?.map((s) => (
              <View key={s.id} style={styles.serviceItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{s.category?.name || 'General Service'}</Text>
                  <Text style={styles.serviceDetail}>
                    {s.price_description || 'Standard diagnostic inspection'}
                  </Text>
                </View>
                <View style={styles.rateCol}>
                  <Text style={styles.rateLabel}>CALL-OUT</Text>
                  <Text style={styles.rateVal}>{formatCurrency(s.call_out_fee)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CUSTOMER REVIEWS */}
        <View style={styles.sectionWrap}>
          <SectionEyebrow label={`// CUSTOMER REVIEWS (${reviews.length})`} />
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No customer reviews recorded yet.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewerName}>
                    {r.customer?.display_name || 'Verified Customer'}
                  </Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Feather
                        key={s}
                        name="star"
                        size={11}
                        color={s <= r.rating ? '#D97706' : Palette.subtleBorder}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewBody}>"{r.comment}"</Text>
              </View>
            ))
          )}
        </View>

        {/* BOOK APPOINTMENT CTA */}
        <FieldButton
          label={`BOOK WITH ${provider.professional_name.toUpperCase()}`}
          onPress={() =>
            router.push({
              pathname: '/book',
              params: { providerId: provider.id },
            })
          }
          variant="primary"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.warmIvory,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 11,
    color: Palette.forestGreen,
  },
  profileCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Palette.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '800',
    color: Palette.paperWhite,
  },
  headerInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  reviewCount: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.cardAlt,
    padding: 8,
    borderRadius: 4,
    marginBottom: 14,
  },
  areaText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  descTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  desc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    lineHeight: 18,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
  },
  serviceName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  serviceDetail: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    marginTop: 2,
  },
  rateCol: {
    alignItems: 'flex-end',
  },
  rateLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
  },
  rateVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  noReviews: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
    padding: 12,
  },
  reviewCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewBody: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    lineHeight: 16,
  },
});
