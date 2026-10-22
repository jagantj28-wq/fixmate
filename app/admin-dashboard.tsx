import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Theme';
import {
  FieldButton,
  FieldInput,
  FieldStatus,
  SectionEyebrow,
} from '@/components/fieldnotes';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/services/dataStore';
import { Booking, IssueReport, ProviderProfile, ServiceCategory } from '@/types/database';
import { formatBookingDate, formatCurrency } from '@/lib/formatters';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'categories' | 'disputes'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Operational Data
  const [metrics, setMetrics] = useState<any>(null);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [disputes, setDisputes] = useState<IssueReport[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // Dispute resolution modal state
  const [selectedDispute, setSelectedDispute] = useState<IssueReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('Reviewed with customer and provider. Service rework approved under warranty.');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [m, provs, cats, issues, bks] = await Promise.all([
        dataStore.getAdminMetrics(),
        dataStore.getProviders({ verifiedOnly: false }),
        dataStore.getCategories(),
        dataStore.getIssues(),
        dataStore.getBookings(),
      ]);

      setMetrics(m);
      setProviders(provs);
      setCategories(cats);
      setDisputes(issues);
      setAllBookings(bks);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  const handleApproveProvider = async (providerId: string) => {
    try {
      setActionLoading(true);
      await dataStore.updateProviderVerification(providerId, 'approved');
      Alert.alert('Provider Approved', 'Specialist is now verified and active for customer bookings.');
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Approval Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProvider = async (providerId: string) => {
    try {
      setActionLoading(true);
      await dataStore.updateProviderVerification(providerId, 'rejected');
      Alert.alert('Provider Application Rejected', 'Application was declined.');
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCategory = async (cat: ServiceCategory) => {
    try {
      setActionLoading(true);
      await dataStore.updateCategory(cat.id, { active: !cat.active });
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    try {
      setActionLoading(true);
      await dataStore.resolveIssue(selectedDispute.id, resolutionNotes.trim());
      setSelectedDispute(null);
      Alert.alert('Dispute Resolved', 'Resolution notes filed successfully.');
      loadAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingProviders = providers.filter((p) => p.verification_status === 'pending');
  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'under_review');

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.forestGreen} />
        <Text style={styles.loadingText}>LOADING PLATFORM AUDIT SYSTEM...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* TABS HEADER */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab('overview')}
          style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            METRICS
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('verifications')}
          style={[styles.tabBtn, activeTab === 'verifications' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'verifications' && styles.tabTextActive]}>
            APPROVALS ({pendingProviders.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('categories')}
          style={[styles.tabBtn, activeTab === 'categories' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
            CATEGORIES
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('disputes')}
          style={[styles.tabBtn, activeTab === 'disputes' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabText, activeTab === 'disputes' && styles.tabTextActive]}>
            DISPUTES ({openDisputes.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.forestGreen} />}
        showsVerticalScrollIndicator={false}
      >
        {/* OVERVIEW / METRICS TAB */}
        {activeTab === 'overview' && metrics && (
          <View>
            <SectionEyebrow label="// PLATFORM AUDIT METRICS" />
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TOTAL WORK ORDERS</Text>
                <Text style={styles.metricNum}>{metrics.totalBookings}</Text>
                <Text style={styles.metricSub}>{metrics.activeBookingsCount} currently in progress</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>GROSS SERVICE VALUE</Text>
                <Text style={styles.metricNumGreen}>{formatCurrency(metrics.totalRevenueINR)}</Text>
                <Text style={styles.metricSub}>{metrics.completedBookingsCount} completed receipts</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>TECHNICIAN ROSTER</Text>
                <Text style={styles.metricNum}>{metrics.totalProviders}</Text>
                <Text style={styles.metricSub}>{metrics.pendingProvidersCount} awaiting background review</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>OPEN DISPUTES</Text>
                <Text style={[styles.metricNum, metrics.openDisputesCount > 0 && { color: Palette.error }]}>
                  {metrics.openDisputesCount}
                </Text>
                <Text style={styles.metricSub}>Guarantee warranty claims</Text>
              </View>
            </View>

            {/* RECENT PLATFORM ACTIVITY LOG */}
            <View style={{ marginTop: 20 }}>
              <SectionEyebrow label="// ALL PLATFORM WORK ORDERS" />
              {allBookings.map((b) => (
                <View key={b.id} style={styles.bookingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingRef}>{b.booking_reference}</Text>
                    <Text style={styles.bookingService}>{b.service_category?.name}</Text>
                    <Text style={styles.bookingParties}>
                      Cust: {b.customer?.display_name} // Pro: {b.provider?.professional_name}
                    </Text>
                  </View>
                  <FieldStatus status={b.status} size="sm" />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* VERIFICATION QUEUE */}
        {activeTab === 'verifications' && (
          <View>
            <SectionEyebrow label="// TECHNICIAN ONBOARDING QUEUE" />
            {pendingProviders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="check-circle" size={24} color={Palette.forestGreen} />
                <Text style={styles.emptyTitle}>Verification Queue Clear</Text>
                <Text style={styles.emptySub}>All provider credential applications have been processed.</Text>
              </View>
            ) : (
              pendingProviders.map((prov) => (
                <View key={prov.id} style={styles.applicantCard}>
                  <View style={styles.applicantHeader}>
                    <Text style={styles.applicantName}>{prov.professional_name}</Text>
                    <FieldStatus status="pending" size="sm" />
                  </View>

                  <Text style={styles.applicantArea}>Zone: {prov.service_area}</Text>
                  <Text style={styles.applicantDesc}>{prov.description}</Text>

                  <View style={styles.actionRow}>
                    <FieldButton
                      label="DECLINE"
                      onPress={() => handleRejectProvider(prov.id)}
                      variant="destructive"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <FieldButton
                      label="APPROVE & VERIFY"
                      onPress={() => handleApproveProvider(prov.id)}
                      variant="primary"
                      size="sm"
                      loading={actionLoading}
                      style={{ flex: 2 }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* SERVICE CATEGORIES MANAGER */}
        {activeTab === 'categories' && (
          <View>
            <SectionEyebrow label="// SERVICE CATEGORY DEFINITIONS" />
            <Text style={styles.subtext}>
              Control active service listings visible to customers on the home screen.
            </Text>

            <View style={styles.catList}>
              {categories.map((cat) => (
                <View key={cat.id} style={styles.catItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catFee}>
                      Base Call-Out Fee: {formatCurrency(cat.base_call_out_fee)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleToggleCategory(cat)}
                    style={[
                      styles.toggleBtn,
                      cat.active ? styles.toggleBtnActive : styles.toggleBtnInactive,
                    ]}
                  >
                    <Text style={styles.toggleBtnText}>
                      {cat.active ? 'ACTIVE' : 'DISABLED'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* DISPUTES & ISSUES TAB */}
        {activeTab === 'disputes' && (
          <View>
            <SectionEyebrow label="// DISPUTE RESOLUTION QUEUE" />
            {disputes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="shield" size={24} color={Palette.forestGreen} />
                <Text style={styles.emptyTitle}>Zero Open Complaints</Text>
                <Text style={styles.emptySub}>No customer disputes filed under the 7-day workmanship warranty.</Text>
              </View>
            ) : (
              disputes.map((d) => (
                <View key={d.id} style={styles.disputeCard}>
                  <View style={styles.disputeHeader}>
                    <Text style={styles.disputeCat}>{d.category.toUpperCase()}</Text>
                    <FieldStatus status={d.status} size="sm" />
                  </View>

                  <Text style={styles.disputeDesc}>"{d.description}"</Text>
                  <Text style={styles.disputeMeta}>
                    Reported by: {d.reporter?.display_name || 'Customer'}
                  </Text>

                  {d.status === 'open' && (
                    <FieldButton
                      label="RESOLVE & CLOSE DISPUTE"
                      onPress={() => setSelectedDispute(d)}
                      variant="primary"
                      size="sm"
                      style={{ marginTop: 10 }}
                    />
                  )}

                  {d.resolution_notes && (
                    <Text style={styles.resolutionText}>
                      Resolution: {d.resolution_notes}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* RESOLUTION MODAL */}
      <Modal
        visible={Boolean(selectedDispute)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDispute(null)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Resolve Customer Dispute</Text>
            <Pressable onPress={() => setSelectedDispute(null)}>
              <Feather name="x" size={20} color={Palette.charcoal} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalLabel}>Dispute Complaint:</Text>
            <Text style={styles.complaintText}>"{selectedDispute?.description}"</Text>

            <FieldInput
              label="Resolution Action & Audit Log"
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              multiline
              numberOfLines={4}
            />

            <FieldButton
              label="FINALIZE RESOLUTION"
              onPress={handleResolveDispute}
              loading={actionLoading}
              variant="primary"
              style={{ marginTop: 12 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.paperWhite,
    borderBottomWidth: 1.5,
    borderBottomColor: Palette.subtleBorder,
    paddingHorizontal: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Palette.forestGreen,
  },
  tabText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
  },
  tabTextActive: {
    color: Palette.forestGreen,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 6,
  },
  metricCard: {
    width: '50%',
    padding: 4,
  },
  metricLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
  },
  metricNum: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.headline,
    fontWeight: '800',
    color: Palette.charcoal,
    marginTop: 2,
  },
  metricNumGreen: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.headline,
    fontWeight: '800',
    color: Palette.forestGreen,
    marginTop: 2,
  },
  metricSub: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 10,
    color: Palette.mutedGrayGreen,
    marginTop: 2,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  bookingRef: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  bookingService: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  bookingParties: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 10,
    color: Palette.mutedGrayGreen,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  emptySub: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    textAlign: 'center',
  },
  applicantCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  applicantName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  applicantArea: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    color: Palette.forestGreen,
    marginBottom: 6,
  },
  applicantDesc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subtext: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    marginBottom: 12,
  },
  catList: {
    gap: 8,
  },
  catItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
  },
  catName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  catFee: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    color: Palette.mutedGrayGreen,
    marginTop: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  toggleBtnActive: {
    backgroundColor: Palette.forestTint,
  },
  toggleBtnInactive: {
    backgroundColor: Palette.errorLight,
  },
  toggleBtnText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  disputeCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  disputeCat: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.error,
  },
  disputeDesc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  disputeMeta: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    color: Palette.mutedGrayGreen,
  },
  resolutionText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.forestGreen,
    fontWeight: '600',
    marginTop: 8,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: Palette.warmIvory,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Palette.paperWhite,
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
    marginBottom: 4,
  },
  complaintText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.charcoal,
    fontStyle: 'italic',
    marginBottom: 16,
  },
});
