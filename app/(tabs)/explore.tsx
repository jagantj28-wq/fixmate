import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Theme';
import {
  EmptyStateIllustration,
  ProviderPortrait,
  SectionEyebrow,
} from '@/components/fieldnotes';
import { dataStore } from '@/services/dataStore';
import { ProviderProfile, ServiceCategory } from '@/types/database';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; categoryId?: string }>();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    params.categoryId || null
  );
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, provs] = await Promise.all([
        dataStore.getCategories(),
        dataStore.getProviders({
          categoryId: selectedCategoryId || undefined,
          searchQuery: searchQuery.trim() || undefined,
          verifiedOnly: true,
        }),
      ]);

      setCategories(cats);
      setProviders(provs);
    } catch (err) {
      console.error('Failed to load explore data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, searchQuery]);

  // Sync if query param changed from route
  useEffect(() => {
    if (params.q !== undefined && params.q !== searchQuery) {
      setSearchQuery(params.q);
    }
    if (params.categoryId !== undefined && params.categoryId !== selectedCategoryId) {
      setSelectedCategoryId(params.categoryId);
    }
  }, [params.q, params.categoryId]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* SEARCH BAR */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={Palette.mutedGrayGreen} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers or services..."
            placeholderTextColor={Palette.mutedGrayGreen}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={Palette.mutedGrayGreen} />
            </Pressable>
          )}
        </View>
      </View>

      {/* HORIZONTAL CATEGORY FILTER PILLS */}
      <View style={styles.filterPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContent}
        >
          <Pressable
            onPress={() => setSelectedCategoryId(null)}
            style={[
              styles.pill,
              selectedCategoryId === null && styles.pillSelected,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                selectedCategoryId === null && styles.pillTextSelected,
              ]}
            >
              ALL TRADES
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                style={[styles.pill, isSelected && styles.pillSelected]}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected && styles.pillTextSelected,
                  ]}
                >
                  {cat.name.split(' ')[0].toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* RESULTS HEADER */}
      <View style={styles.resultsMeta}>
        <SectionEyebrow
          label={`// ${providers.length} VERIFIED SPECIALISTS IN BENGALURU`}
        />
      </View>

      {/* PROVIDER LIST */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Palette.forestGreen} />
          <Text style={styles.loadingText}>QUERYING SPECIALISTS...</Text>
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProviderPortrait
              provider={item}
              onPress={() =>
                router.push({
                  pathname: '/provider/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyStateIllustration
              title="No Technicians Found"
              description="No registered specialists match your criteria in this service area. Try adjusting your search query or trade filter."
              actionLabel="RESET SEARCH FILTERS"
              onAction={clearFilters}
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
  searchBarWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Palette.paperWhite,
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.warmIvory,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.charcoal,
  },
  filterPillsContainer: {
    backgroundColor: Palette.paperWhite,
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingVertical: 10,
  },
  filterPillsContent: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: Palette.warmIvory,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
  },
  pillSelected: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  pillText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.charcoal,
    letterSpacing: 0.5,
  },
  pillTextSelected: {
    color: Palette.paperWhite,
  },
  resultsMeta: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 14,
    paddingBottom: 4,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 32,
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
