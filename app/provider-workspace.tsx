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
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { BillItem, Booking, ProviderProfile } from '@/types/database';
import { calculateBillTotals, formatBookingDate, formatCurrency, formatSlotRange } from '@/lib/formatters';

export default function ProviderWorkspaceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ activeBookingId?: string }>();

  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Billing Modal State
  const [billingBooking, setBillingBooking] = useState<Booking | null>(null);
  const [laborAmount, setLaborAmount] = useState('350');
  const [partsAmount, setPartsAmount] = useState('250');
  const [otherCharges, setOtherCharges] = useState('50');
  const [billNotes, setBillNotes] = useState('Replaced brass compression valve and tested under 4 bar pressure.');
  const [lineItems, setLineItems] = useState<Array<{ desc: string; qty: string; rate: string }>>([
    { desc: 'Diagnostic & Pressure Testing Labor', qty: '1', rate: '350' },
    { desc: '1/2" Brass Compression Valve (OEM)', qty: '1', rate: '250' },
    { desc: 'Teflon sealant & washer kit', qty: '1', rate: '50' },
  ]);

  const loadProviderData = async () => {
    if (!user) return;
    try {
      const allProviders = await dataStore.getProviders({ verifiedOnly: false });
      let myProfile = allProviders.find((p) => p.user_id === user.id);

      // If user is logged in as someone else but testing provider, use first provider
      if (!myProfile && allProviders.length > 0) {
        myProfile = allProviders[0];
      }

      setProviderProfile(myProfile || null);

      if (myProfile) {
        const provBookings = await dataStore.getBookings({ providerUserId: myProfile.user_id });
        setJobs(provBookings);

        if (params.activeBookingId) {
          const target = provBookings.find((b) => b.id === params.activeBookingId);
          if (target && target.status === 'in_progress') {
            setBillingBooking(target);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load provider workspace', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProviderData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProviderData();
  };

  const pendingRequests = jobs.filter((j) => j.status === 'pending');
  const confirmedJobs = jobs.filter((j) => ['accepted', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  // Real earnings calculated from actual completed bookings
  const totalEarnings = completedJobs.reduce(
    (sum, j) => sum + (j.bill?.total_amount || j.estimate_amount || 0),
    0
  );

  const handleAccept = async (booking: Booking) => {
    try {
      setActionLoading(true);
      await dataStore.updateBookingStatus({
        bookingId: booking.id,
        newStatus: 'accepted',
        actorUserId: providerProfile?.user_id || user!.id,
        actorRole: 'provider',
      });
      loadProviderData();
    } catch (err: any) {
      Alert.alert('Action Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (booking: Booking) => {
    Alert.prompt
      ? Alert.prompt('Decline Request', 'Reason for declining assignment:', async (reason) => {
          try {
            setActionLoading(true);
            await dataStore.updateBookingStatus({
              bookingId: booking.id,
              newStatus: 'rejected',
              actorUserId: providerProfile?.user_id || user!.id,
              actorRole: 'provider',
              reason: reason || 'Technician unavailable at requested slot',
            });
            loadProviderData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(false);
          }
        })
      : (async () => {
          try {
            setActionLoading(true);
            await dataStore.updateBookingStatus({
              bookingId: booking.id,
              newStatus: 'rejected',
              actorUserId: providerProfile?.user_id || user!.id,
              actorRole: 'provider',
              reason: 'Technician unavailable at requested slot',
            });
            loadProviderData();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setActionLoading(false);
          }
        })();
  };

  const handleStartJob = async (booking: Booking) => {
    try {
      setActionLoading(true);
      await dataStore.updateBookingStatus({
        bookingId: booking.id,
        newStatus: 'in_progress',
        actorUserId: providerProfile?.user_id || user!.id,
        actorRole: 'provider',
      });
      loadProviderData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFinalBill = async () => {
    if (!billingBooking) return;

    const numLabor = parseFloat(laborAmount) || 0;
    const numParts = parseFloat(partsAmount) || 0;
    const numOther = parseFloat(otherCharges) || 0;

    const parsedItems: BillItem[] = lineItems.map((item, idx) => {
      const q = parseFloat(item.qty) || 1;
      const rate = parseFloat(item.rate) || 0;
      return {
        id: `item-${Date.now()}-${idx}`,
        bill_id: '',
        description: item.desc,
        quantity: q,
        unit_price: rate,
        line_total: Math.round(q * rate * 100) / 100,
      };
    });

    const totals = calculateBillTotals(numLabor, numParts, numOther, parsedItems);

    try {
      setActionLoading(true);

      // 1. Submit itemized bill
      await dataStore.submitBill({
        booking_id: billingBooking.id,
        labor_amount: numLabor,
        parts_amount: numParts,
        other_charges: numOther,
        total_amount: totals.totalAmount,
        currency: 'INR',
        notes: billNotes.trim(),
        payment_method: 'cash_on_service',
        payment_status: 'paid',
        items: parsedItems,
      });

      // 2. Mark booking completed through state machine
      await dataStore.updateBookingStatus({
        bookingId: billingBooking.id,
        newStatus: 'completed',
        actorUserId: providerProfile?.user_id || user!.id,
        actorRole: 'provider',
        reason: 'Work successfully verified and completed with itemized invoice',
      });

      setBillingBooking(null);
      Alert.alert('Job Completed', `Work order #${billingBooking.booking_reference} finalized successfully!`);
      loadProviderData();
    } catch (err: any) {
      Alert.alert('Billing Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.forestGreen} />
        <Text style={styles.loadingText}>INITIALIZING FIELD TOOL...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.forestGreen} />}
        showsVerticalScrollIndicator={false}
      >
        {/* PROVIDER STATS BAR */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View>
              <Text style={styles.statsProName}>
                {providerProfile?.professional_name || 'Technician Field Tool'}
              </Text>
              <Text style={styles.statsStatus}>
                VERIFIED TECH // STATUS: {providerProfile?.verification_status?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.statsRatingBadge}>
              <Feather name="star" size={12} color="#D97706" />
              <Text style={styles.statsRatingText}>
                {providerProfile?.average_rating.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CONFIRMED JOBS</Text>
              <Text style={styles.metricVal}>{confirmedJobs.length}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>COMPLETED</Text>
              <Text style={styles.metricVal}>{completedJobs.length}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TOTAL EARNINGS</Text>
              <Text style={styles.metricValGreen}>{formatCurrency(totalEarnings)}</Text>
            </View>
          </View>
        </View>

        {/* SECTION 1: INCOMING REQUESTS REQUIRING ACTION */}
        <View style={styles.sectionWrap}>
          <SectionEyebrow label={`// 01. INCOMING DISPATCH REQUESTS (${pendingRequests.length})`} accent />
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyInbox}>
              <Text style={styles.emptyInboxText}>No pending dispatch requests requiring action.</Text>
            </View>
          ) : (
            pendingRequests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestTop}>
                  <View>
                    <Text style={styles.reqRef}>{req.booking_reference}</Text>
                    <Text style={styles.reqService}>{req.service_category?.name}</Text>
                  </View>
                  <FieldStatus status="pending" size="sm" />
                </View>

                <Text style={styles.reqProblem}>"{req.problem_description}"</Text>

                <View style={styles.reqMetaGrid}>
                  <View style={styles.reqMetaCol}>
                    <Text style={styles.reqMetaKey}>DATE</Text>
                    <Text style={styles.reqMetaVal}>{formatBookingDate(req.scheduled_date)}</Text>
                  </View>
                  <View style={styles.reqMetaCol}>
                    <Text style={styles.reqMetaKey}>SLOT</Text>
                    <Text style={styles.reqMetaVal}>
                      {formatSlotRange(req.scheduled_slot_start, req.scheduled_slot_end)}
                    </Text>
                  </View>
                  <View style={styles.reqMetaCol}>
                    <Text style={styles.reqMetaKey}>AREA</Text>
                    <Text style={styles.reqMetaVal}>{req.address_snapshot?.city}</Text>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <FieldButton
                    label="DECLINE"
                    onPress={() => handleReject(req)}
                    variant="destructive"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <FieldButton
                    label="ACCEPT ASSIGNMENT"
                    onPress={() => handleAccept(req)}
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

        {/* SECTION 2: CONFIRMED / TODAY'S ACTIVE ASSIGNMENTS */}
        <View style={styles.sectionWrap}>
          <SectionEyebrow label={`// 02. ACTIVE WORK ORDERS (${confirmedJobs.length})`} />
          {confirmedJobs.length === 0 ? (
            <View style={styles.emptyInbox}>
              <Text style={styles.emptyInboxText}>No confirmed appointments active today.</Text>
            </View>
          ) : (
            confirmedJobs.map((job) => (
              <View key={job.id} style={styles.activeJobCard}>
                <View style={styles.jobTopRow}>
                  <Text style={styles.jobRef}>{job.booking_reference}</Text>
                  <FieldStatus status={job.status} size="sm" />
                </View>

                <Text style={styles.jobTitle}>{job.service_category?.name}</Text>
                <Text style={styles.jobCustomer}>Customer: {job.customer?.display_name}</Text>
                <Text style={styles.jobAddress}>
                  {job.address_snapshot?.street_address}, {job.address_snapshot?.city}
                </Text>

                <View style={styles.jobButtonRow}>
                  {job.status === 'accepted' && (
                    <FieldButton
                      label="ARRIVED (START WORK)"
                      onPress={() => handleStartJob(job)}
                      variant="accent"
                      size="sm"
                      icon={<Feather name="play" size={13} color={Palette.forestGreen} />}
                      style={{ flex: 1 }}
                    />
                  )}

                  {job.status === 'in_progress' && (
                    <FieldButton
                      label="ITEMIZE BILL & COMPLETE"
                      onPress={() => setBillingBooking(job)}
                      variant="primary"
                      size="sm"
                      icon={<Feather name="check" size={13} color={Palette.paperWhite} />}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* SECTION 3: COMPLETED SERVICE LOG */}
        <View style={styles.sectionWrap}>
          <SectionEyebrow label={`// 03. COMPLETED SERVICE LOGS (${completedJobs.length})`} />
          {completedJobs.map((j) => (
            <View key={j.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyRef}>{j.booking_reference}</Text>
                <Text style={styles.historyService}>{j.service_category?.name}</Text>
                <Text style={styles.historyDate}>{formatBookingDate(j.scheduled_date)}</Text>
              </View>
              <Text style={styles.historyTotal}>
                {formatCurrency(j.bill?.total_amount || j.estimate_amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ITEMIZE BILL MODAL */}
      <Modal
        visible={Boolean(billingBooking)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBillingBooking(null)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Itemized Final Work Order</Text>
              <Text style={styles.modalSubtitle}>REF: {billingBooking?.booking_reference}</Text>
            </View>
            <Pressable onPress={() => setBillingBooking(null)}>
              <Feather name="x" size={20} color={Palette.charcoal} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <FieldInput
              label="Diagnostic & Labor Fee (₹)"
              value={laborAmount}
              onChangeText={setLaborAmount}
              keyboardType="numeric"
            />

            <FieldInput
              label="OEM Spare Parts Cost (₹)"
              value={partsAmount}
              onChangeText={setPartsAmount}
              keyboardType="numeric"
            />

            <FieldInput
              label="Consumables / Other Charges (₹)"
              value={otherCharges}
              onChangeText={setOtherCharges}
              keyboardType="numeric"
            />

            <FieldInput
              label="Technician Diagnostics Note"
              value={billNotes}
              onChangeText={setBillNotes}
              multiline
              numberOfLines={3}
            />

            {/* Total Calculation Preview */}
            <View style={styles.previewTotalBox}>
              <Text style={styles.previewTotalLabel}>CALCULATED FINAL INVOICE TOTAL</Text>
              <Text style={styles.previewTotalVal}>
                {formatCurrency(
                  (parseFloat(laborAmount) || 0) +
                    (parseFloat(partsAmount) || 0) +
                    (parseFloat(otherCharges) || 0)
                )}
              </Text>
              <Text style={styles.previewNote}>
                Collected directly on-site via Cash or UPI QR.
              </Text>
            </View>

            <FieldButton
              label="SUBMIT INVOICE & MARK COMPLETED"
              onPress={handleSubmitFinalBill}
              loading={actionLoading}
              variant="primary"
              style={{ marginTop: 16 }}
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
  statsCard: {
    backgroundColor: Palette.deepEvergreen,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1D4D3E',
    paddingBottom: 10,
    marginBottom: 12,
  },
  statsProName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '800',
    color: Palette.paperWhite,
  },
  statsStatus: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.citrusLime,
    marginTop: 2,
  },
  statsRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#163B2F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statsRatingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.paperWhite,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    gap: 2,
  },
  metricLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
    color: '#A9B2A4',
  },
  metricVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '800',
    color: Palette.paperWhite,
  },
  metricValGreen: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '800',
    color: Palette.citrusLime,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  emptyInbox: {
    padding: 16,
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    alignItems: 'center',
  },
  emptyInboxText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
  },
  requestCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reqRef: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  reqService: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  reqProblem: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  reqMetaGrid: {
    flexDirection: 'row',
    backgroundColor: Palette.cardAlt,
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  reqMetaCol: {
    flex: 1,
  },
  reqMetaKey: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    color: Palette.mutedGrayGreen,
  },
  reqMetaVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.charcoal,
    marginTop: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  activeJobCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.forestGreen,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobRef: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  jobTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  jobCustomer: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    fontWeight: '600',
    marginTop: 2,
  },
  jobAddress: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    marginBottom: 12,
  },
  jobButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 6,
  },
  historyRef: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  historyService: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '600',
    color: Palette.charcoal,
  },
  historyDate: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
  historyTotal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '800',
    color: Palette.charcoal,
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
  modalSubtitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    color: Palette.forestGreen,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  previewTotalBox: {
    backgroundColor: Palette.forestTint,
    borderWidth: 1.5,
    borderColor: Palette.forestGreen,
    borderRadius: 8,
    padding: 14,
    marginVertical: 10,
  },
  previewTotalLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.8,
  },
  previewTotalVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.headline,
    fontWeight: '900',
    color: Palette.forestGreen,
    marginVertical: 4,
  },
  previewNote: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
});
