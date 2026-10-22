import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Theme';
import {
  BookingTicket,
  EmptyStateIllustration,
  FieldButton,
  ProviderPortrait,
  SectionEyebrow,
  ServiceTile,
} from '@/components/fieldnotes';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/services/dataStore';
import { Booking, ProviderProfile, ServiceCategory } from '@/types/database';

export default function HomeScreen() {
  const router = useRouter();
  const { user, role } = useAuth();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featuredProviders, setFeaturedProviders] = useState<ProviderProfile[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [cats, provs, bookings] = await Promise.all([
        dataStore.getCategories(),
        dataStore.getProviders({ verifiedOnly: true }),
        user ? dataStore.getBookings({ customerId: user.id }) : [],
      ]);

      setCategories(cats.filter((c) => c.active));
      setFeaturedProviders(provs.slice(0, 3));

      // Find the most immediate active booking (pending, accepted, or in_progress)
      const active = bookings.find((b) =>
        ['pending', 'accepted', 'in_progress'].includes(b.status)
      );
      setActiveBooking(active || null);
    } catch (err) {
      console.error('Failed to load home screen data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCategoryPress = (category: ServiceCategory) => {
    router.push({
      pathname: '/book',
      params: { categoryId: category.id },
    });
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/explore',
        params: { q: searchQuery.trim() },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.forestGreen} />
        <Text style={styles.loadingText}>LOADING FIELD REGISTRY...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.forestGreen}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* TOP EDITORIAL MASTHEAD */}
        <View style={styles.masthead}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandWordmark}>FIXMATE</Text>
              <View style={styles.locationTag}>
                <Text style={styles.locationTagText}>BLR-CEN</Text>
              </View>
            </View>

            {/* Quick Mode Jump Button */}
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={styles.profileBadge}
            >
              <View style={styles.roleIndicator} />
              <Text style={styles.profileBadgeText}>
                {role === 'customer' ? 'CUSTOMER' : role === 'provider' ? 'PROVIDER' : 'ADMIN'}
              </Text>
            </Pressable>
          </View>

          {/* Location line integrated into editorial experience */}
          <View style={styles.serviceZoneBar}>
            <Feather name="map-pin" size={12} color={Palette.forestGreen} />
            <Text style={styles.serviceZoneText}>
              SERVICE ZONE // INDIRANAGAR & CENTRAL BENGALURU
            </Text>
          </View>

          {/* Main Editorial Headline */}
          <Text style={styles.headline}>Your home, taken care of.</Text>
          <Text style={styles.subheadline}>
            Vetted diagnostics, transparent pricing, and printed-grade work orders.
          </Text>
        </View>

        {/* SEARCH & DISCOVERY BAR */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color={Palette.mutedGrayGreen} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search repairs: pipe leak, MCB, AC jet wash..."
              placeholderTextColor={Palette.mutedGrayGreen}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color={Palette.mutedGrayGreen} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ACTIVE WORK ORDER TICKET (If customer has an upcoming or in-progress booking) */}
        {activeBooking && (
          <View style={styles.activeBookingSection}>
            <SectionEyebrow label="// 00. ACTIVE WORK ORDER IN PROGRESS" accent />
            <BookingTicket
              booking={activeBooking}
              onPress={() =>
                router.push({
                  pathname: '/booking/[id]',
                  params: { id: activeBooking.id },
                })
              }
            />
          </View>
        )}

        {/* SERVICE CATEGORIES GRID */}
        <View style={styles.sectionHeader}>
          <SectionEyebrow label="// 01. LICENSED SERVICE CATEGORIES" />
          <Text style={styles.sectionTitle}>Select a trade specialist</Text>
        </View>

        {categories.length === 0 ? (
          <EmptyStateIllustration
            title="No Services Active"
            description="All service categories are temporarily offline for updates."
          />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.categoryCol}>
                <ServiceTile
                  category={cat}
                  onPress={() => handleCategoryPress(cat)}
                />
              </View>
            ))}
          </View>
        )}

        {/* FEATURED VERIFIED TECHNICIANS */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <View style={styles.sectionTitleRow}>
            <View>
              <SectionEyebrow label="// 02. ON-CALL LOCAL PROS" />
              <Text style={styles.sectionTitle}>Verified Master Technicians</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.viewAllLink}>VIEW ALL →</Text>
            </Pressable>
          </View>
        </View>

        {featuredProviders.length === 0 ? (
          <EmptyStateIllustration
            title="No Approved Providers in Zone"
            description="We are currently onboarding licensed specialists in this neighborhood. Please check back shortly."
          />
        ) : (
          featuredProviders.map((prov) => (
            <ProviderPortrait
              key={prov.id}
              provider={prov}
              onPress={() =>
                router.push({
                  pathname: '/provider/[id]',
                  params: { id: prov.id },
                })
              }
            />
          ))
        )}

        {/* FIXMATE FIELDNOTE STANDARDS CARD */}
        <View style={styles.standardsCard}>
          <View style={styles.standardsHeader}>
            <Feather name="shield" size={16} color={Palette.forestGreen} />
            <Text style={styles.standardsTitle}>FIXMATE FIELD STANDARDS</Text>
          </View>
          <View style={styles.standardBullet}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Itemized Transparency:</Text> Every work order separates diagnostic call-out, labor, and OEM replacement parts.
            </Text>
          </View>
          <View style={styles.standardBullet}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>Verified Identity:</Text> Technicians undergo manual credential review and government ID verification.
            </Text>
          </View>
          <View style={styles.standardBullet}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.boldText}>7-Day Warranty:</Text> Rework warranty on all repairs with in-app dispute resolution.
            </Text>
          </View>
        </View>

        {/* WORKSPACE SHORTCUTS FOR PROVIDER / ADMIN */}
        {(role === 'provider' || role === 'admin') && (
          <View style={styles.workspaceSection}>
            <SectionEyebrow label="// 03. PROFESSIONAL CONSOLE" />
            {role === 'provider' && (
              <FieldButton
                label="OPEN PROVIDER FIELD TOOL"
                onPress={() => router.push('/provider-workspace')}
                variant="accent"
                icon={<Feather name="tool" size={16} color={Palette.forestGreen} />}
              />
            )}
            {role === 'admin' && (
              <FieldButton
                label="OPEN ADMIN OPERATIONS DASHBOARD"
                onPress={() => router.push('/admin-dashboard')}
                variant="primary"
                icon={<Feather name="sliders" size={16} color={Palette.paperWhite} />}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.warmIvory,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.warmIvory,
    gap: 12,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 11,
    color: Palette.forestGreen,
    letterSpacing: 1,
  },
  masthead: {
    marginBottom: 20,
    paddingTop: 8,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandWordmark: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '900',
    color: Palette.forestGreen,
    letterSpacing: 1.5,
  },
  locationTag: {
    backgroundColor: Palette.citrusLime,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationTagText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    gap: 6,
  },
  roleIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.forestGreen,
  },
  profileBadgeText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  serviceZoneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.forestTint,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    marginBottom: 12,
  },
  serviceZoneText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forestGreen,
    letterSpacing: 0.5,
  },
  headline: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.headline,
    fontWeight: '800',
    color: Palette.charcoal,
    lineHeight: 34,
    marginBottom: 6,
  },
  subheadline: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.mutedGrayGreen,
    lineHeight: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.charcoal,
  },
  activeBookingSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  viewAllLink: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCol: {
    width: '50%',
    padding: 6,
  },
  standardsCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  standardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingBottom: 8,
    marginBottom: 12,
  },
  standardsTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.8,
  },
  standardBullet: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 6,
  },
  bulletSymbol: {
    color: Palette.forestGreen,
    fontSize: 14,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: Palette.charcoal,
  },
  workspaceSection: {
    marginTop: 24,
    gap: 12,
  },
});
