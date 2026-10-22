import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Palette } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Theme';
import {
  BookingTicket,
  EmptyStateIllustration,
  SectionEyebrow,
} from '@/components/fieldnotes';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/services/dataStore';
import { Booking } from '@/types/database';

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    try {
      if (!user) return;
      const list = await dataStore.getBookings({ customerId: user.id });
      setBookings(list);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const activeBookings = bookings.filter((b) =>
    ['pending', 'accepted', 'in_progress'].includes(b.status)
  );

  const historyBookings = bookings.filter((b) =>
    ['completed', 'cancelled', 'rejected', 'disputed'].includes(b.status)
  );

  const displayedList = tab === 'active' ? activeBookings : historyBookings;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TABS SELECTOR */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setTab('active')}
          style={[styles.tabButton, tab === 'active' && styles.tabButtonActive]}
        >
          <Text
            style={[styles.tabText, tab === 'active' && styles.tabTextActive]}
          >
            ACTIVE ORDERS ({activeBookings.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('history')}
          style={[styles.tabButton, tab === 'history' && styles.tabButtonActive]}
        >
          <Text
            style={[styles.tabText, tab === 'history' && styles.tabTextActive]}
          >
            HISTORY ({historyBookings.length})
          </Text>
        </Pressable>
      </View>

      <View style={styles.contentHeader}>
        <SectionEyebrow
          label={`// ${tab === 'active' ? 'SCHEDULED & IN-PROGRESS JOBS' : 'PAST SERVICE WORK ORDERS'}`}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Palette.forestGreen} />
          <Text style={styles.loadingText}>FETCHING WORK ORDERS...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingTicket
              booking={item}
              onPress={() =>
                router.push({
                  pathname: '/booking/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Palette.forestGreen}
            />
          }
          ListEmptyComponent={
            <EmptyStateIllustration
              title={
                tab === 'active'
                  ? 'No Active Service Tickets'
                  : 'No Past Service Orders'
              }
              description={
                tab === 'active'
                  ? 'You do not have any pending or in-progress appointments. Need home maintenance?'
                  : 'Completed service visits and receipts will appear here.'
              }
              actionLabel={tab === 'active' ? 'SCHEDULE A SERVICE' : undefined}
              onAction={
                tab === 'active' ? () => router.push('/book') : undefined
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.warmIvory,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.paperWhite,
    borderBottomWidth: 1.5,
    borderBottomColor: Palette.subtleBorder,
    paddingHorizontal: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Palette.forestGreen,
  },
  tabText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: Palette.forestGreen,
    fontWeight: '800',
  },
  contentHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 14,
    paddingBottom: 4,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 8,
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
});
