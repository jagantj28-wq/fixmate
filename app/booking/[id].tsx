import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  FieldInput,
  FieldStatus,
  SectionEyebrow,
  ServiceTimeline,
} from '@/components/fieldnotes';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/services/dataStore';
import { Booking } from '@/types/database';
import { formatBookingDate, formatCurrency, formatSlotRange } from '@/lib/formatters';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, role } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dispute report modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState('Service Quality');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const loadBooking = async () => {
    try {
      if (!id) return;
      const b = await dataStore.getBookingById(id);
      setBooking(b);
    } catch (err) {
      console.error('Failed to load booking details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [id, user]);

  const handleCancelBooking = () => {
    if (!booking || !user) return;
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this service order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await dataStore.updateBookingStatus({
                bookingId: booking.id,
                newStatus: 'cancelled',
                actorUserId: user.id,
                actorRole: role,
                reason: 'Customer requested cancellation before service started',
              });
              loadBooking();
            } catch (err: any) {
              Alert.alert('Cancellation Error', err.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleProviderAccept = async () => {
    if (!booking || !user) return;
    try {
      setActionLoading(true);
      await dataStore.updateBookingStatus({
        bookingId: booking.id,
        newStatus: 'accepted',
        actorUserId: user.id,
        actorRole: 'provider',
      });
      loadBooking();
    } catch (err: any) {
      Alert.alert('Status Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProviderStartWork = async () => {
    if (!booking || !user) return;
    try {
      setActionLoading(true);
      await dataStore.updateBookingStatus({
        bookingId: booking.id,
        newStatus: 'in_progress',
        actorUserId: user.id,
        actorRole: 'provider',
      });
      loadBooking();
    } catch (err: any) {
      Alert.alert('Status Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!booking || !user || !booking.provider) return;
    if (reviewComment.trim().length < 5) {
      Alert.alert('Review Required', 'Please enter a comment of at least 5 characters.');
      return;
    }
    try {
      setSubmittingReview(true);
      await dataStore.submitReview({
        bookingId: booking.id,
        customerId: user.id,
        providerId: booking.provider.id,
        rating,
        comment: reviewComment.trim(),
      });
      setShowReviewModal(false);
      Alert.alert('Review Recorded', 'Thank you for rating this service visit!');
      loadBooking();
    } catch (err: any) {
      Alert.alert('Review Error', err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!booking || !user) return;
    if (disputeDesc.trim().length < 10) {
      Alert.alert('Dispute Details', 'Please provide a detailed description of the issue.');
      return;
    }
    try {
      setSubmittingDispute(true);
      await dataStore.reportIssue({
        bookingId: booking.id,
        reporterUserId: user.id,
        category: disputeCategory,
        description: disputeDesc.trim(),
      });
      setShowDisputeModal(false);
      Alert.alert('Dispute Registered', 'Our support operations team will inspect this work order.');
      loadBooking();
    } catch (err: any) {
      Alert.alert('Dispute Error', err.message);
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading || !booking) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.forestGreen} />
        <Text style={styles.loadingText}>LOADING WORK ORDER...</Text>
      </View>
    );
  }

  const isAssignedProvider = role === 'provider' && user?.id === booking.provider?.user_id;
  const isCustomerOwner = role === 'customer' && user?.id === booking.customer_id;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TOP TICKET BANNER */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketTopRow}>
            <View>
              <Text style={styles.ticketOrderTag}>FIELD SERVICE TICKET</Text>
              <Text style={styles.ticketRef}>{booking.booking_reference}</Text>
            </View>
            <FieldStatus status={booking.status} />
          </View>

          <Text style={styles.serviceName}>{booking.service_category?.name}</Text>
          <Text style={styles.problemDesc}>"{booking.problem_description}"</Text>

          {/* SCHEDULE & LOCATION METRICS */}
          <View style={styles.metricGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricKey}>DATE</Text>
              <Text style={styles.metricVal}>{formatBookingDate(booking.scheduled_date)}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricKey}>TIME WINDOW</Text>
              <Text style={styles.metricVal}>
                {formatSlotRange(booking.scheduled_slot_start, booking.scheduled_slot_end)}
              </Text>
            </View>
          </View>

          {/* LOCATION */}
          <View style={styles.addressBox}>
            <View style={styles.addressBoxTop}>
              <Feather name="map-pin" size={13} color={Palette.forestGreen} />
              <Text style={styles.addressLabel}>
                {booking.address_snapshot?.label?.toUpperCase() || 'SERVICE ADDRESS'}
              </Text>
            </View>
            <Text style={styles.addressStreet}>
              {booking.address_snapshot?.street_address}
              {booking.address_snapshot?.unit_apartment ? `, ${booking.address_snapshot.unit_apartment}` : ''}
            </Text>
            <Text style={styles.addressCity}>
              {booking.address_snapshot?.city} – {booking.address_snapshot?.postal_code}
            </Text>
          </View>
        </View>

        {/* WORK ORDER MILESTONES (REAL SERVICE TIMELINE) */}
        <ServiceTimeline booking={booking} />

        {/* TECHNICIAN DETAILS */}
        <View style={styles.specialistCard}>
          <SectionEyebrow label="// ASSIGNED TECHNICIAN" />
          <View style={styles.specialistRow}>
            <View style={styles.specAvatar}>
              <Text style={styles.specAvatarText}>
                {booking.provider?.professional_name?.slice(0, 2).toUpperCase() || 'SP'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.specName}>{booking.provider?.professional_name}</Text>
              <Text style={styles.specArea}>
                Area: {booking.provider?.service_area}
              </Text>
              <View style={styles.ratingBadge}>
                <Feather name="star" size={11} color="#D97706" />
                <Text style={styles.ratingVal}>
                  {booking.provider?.average_rating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* BILL & INVOICE BREAKDOWN (IF FINALIZED) */}
        {booking.bill ? (
          <View style={styles.billCard}>
            <View style={styles.billHeader}>
              <Text style={styles.billTitle}>ITEMIZED SERVICE INVOICE</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>
                  {booking.bill.payment_status.toUpperCase()} ({booking.bill.payment_method.replace('_', ' ').toUpperCase()})
                </Text>
              </View>
            </View>

            <View style={styles.billRows}>
              <View style={styles.billRow}>
                <Text style={styles.billKey}>Diagnostic & Labor:</Text>
                <Text style={styles.billVal}>{formatCurrency(booking.bill.labor_amount)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billKey}>Replacement Parts:</Text>
                <Text style={styles.billVal}>{formatCurrency(booking.bill.parts_amount)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billKey}>Sundries / Consumables:</Text>
                <Text style={styles.billVal}>{formatCurrency(booking.bill.other_charges)}</Text>
              </View>
            </View>

            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalKey}>FINAL TOTAL</Text>
              <Text style={styles.billTotalVal}>{formatCurrency(booking.bill.total_amount)}</Text>
            </View>

            {booking.bill.notes && (
              <Text style={styles.billNotes}>Technician remarks: "{booking.bill.notes}"</Text>
            )}
          </View>
        ) : (
          <View style={styles.estimateCard}>
            <Text style={styles.estimateTitle}>ESTIMATED SERVICE CHARGE</Text>
            <Text style={styles.estimateVal}>{formatCurrency(booking.estimate_amount)}</Text>
            <Text style={styles.estimateNote}>
              Final itemized invoice will be presented by the technician upon completing diagnostic inspection and repair.
            </Text>
          </View>
        )}

        {/* CUSTOMER REVIEW DISPLAY (If already reviewed) */}
        {booking.review && (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewTitle}>YOUR RECORDED REVIEW</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Feather
                    key={s}
                    name="star"
                    size={12}
                    color={s <= booking.review!.rating ? '#D97706' : Palette.subtleBorder}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.reviewComment}>"{booking.review.comment}"</Text>
          </View>
        )}

        {/* PARTICIPANT ACTION BUTTONS */}
        <View style={styles.actionButtonGroup}>
          {/* PROVIDER ACTIONS */}
          {isAssignedProvider && booking.status === 'pending' && (
            <FieldButton
              label="ACCEPT SERVICE APPOINTMENT"
              onPress={handleProviderAccept}
              loading={actionLoading}
              variant="primary"
            />
          )}

          {isAssignedProvider && booking.status === 'accepted' && (
            <FieldButton
              label="MARK WORK IN PROGRESS (ON-SITE)"
              onPress={handleProviderStartWork}
              loading={actionLoading}
              variant="accent"
              icon={<Feather name="play" size={15} color={Palette.forestGreen} />}
            />
          )}

          {isAssignedProvider && booking.status === 'in_progress' && (
            <FieldButton
              label="GENERATE BILL & COMPLETE WORK"
              onPress={() =>
                router.push({
                  pathname: '/provider-workspace',
                  params: { activeBookingId: booking.id },
                })
              }
              variant="primary"
              icon={<Feather name="check" size={16} color={Palette.paperWhite} />}
            />
          )}

          {/* CUSTOMER ACTIONS */}
          {isCustomerOwner && ['pending', 'accepted'].includes(booking.status) && (
            <FieldButton
              label="CANCEL SERVICE ORDER"
              onPress={handleCancelBooking}
              loading={actionLoading}
              variant="destructive"
            />
          )}

          {isCustomerOwner && booking.status === 'completed' && !booking.review && (
            <FieldButton
              label="RATE & REVIEW TECHNICIAN"
              onPress={() => setShowReviewModal(true)}
              variant="accent"
              icon={<Feather name="star" size={15} color={Palette.forestGreen} />}
            />
          )}

          {isCustomerOwner && booking.status === 'completed' && (
            <FieldButton
              label="REPORT AN ISSUE / DISPUTE"
              onPress={() => setShowDisputeModal(true)}
              variant="secondary"
              icon={<Feather name="alert-triangle" size={15} color={Palette.charcoal} />}
            />
          )}
        </View>
      </ScrollView>

      {/* REVIEW SUBMISSION MODAL */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate Your Service Visit</Text>
            <Pressable onPress={() => setShowReviewModal(false)}>
              <Feather name="x" size={20} color={Palette.charcoal} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.ratingPrompt}>
              How was the workmanship of {booking.provider?.professional_name}?
            </Text>

            {/* Star Selector */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setRating(s)} style={styles.starBtn}>
                  <Feather
                    name="star"
                    size={28}
                    color={s <= rating ? '#D97706' : Palette.subtleBorder}
                  />
                </Pressable>
              ))}
            </View>

            <FieldInput
              label="Written Review"
              placeholder="Was the technician punctual, tidy, and transparent with pricing?"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
              hint="Minimum 5 characters"
            />

            <FieldButton
              label="SUBMIT FIELD REVIEW"
              onPress={handleSubmitReview}
              loading={submittingReview}
              variant="primary"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* DISPUTE REPORT MODAL */}
      <Modal
        visible={showDisputeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Service Dispute</Text>
            <Pressable onPress={() => setShowDisputeModal(false)}>
              <Feather name="x" size={20} color={Palette.charcoal} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.disputeNotice}>
              FixMate guarantees rework on all completed services. Please describe the problem so an administrator can investigate.
            </Text>

            <FieldInput
              label="Dispute Category"
              value={disputeCategory}
              onChangeText={setDisputeCategory}
              placeholder="Service Quality, Overcharge, Unfinished work"
            />

            <FieldInput
              label="Explanation of Fault"
              value={disputeDesc}
              onChangeText={setDisputeDesc}
              placeholder="e.g. The leak resumed after technician left; pipe connection is loose."
              multiline
              numberOfLines={4}
              hint="Minimum 10 characters"
            />

            <FieldButton
              label="LOG FORMAL DISPUTE"
              onPress={handleSubmitDispute}
              loading={submittingDispute}
              variant="destructive"
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
  ticketCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingBottom: 10,
    marginBottom: 12,
  },
  ticketOrderTag: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
  },
  ticketRef: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '900',
    color: Palette.forestGreen,
  },
  serviceName: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '800',
    color: Palette.charcoal,
    marginBottom: 4,
  },
  problemDesc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Palette.warmIvory,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
  },
  metricKey: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
  },
  metricVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.charcoal,
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: Palette.cardAlt,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
  },
  addressBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addressLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  addressStreet: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Palette.charcoal,
  },
  addressCity: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
  specialistCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  specialistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  specAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Palette.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specAvatarText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.body,
    fontWeight: '800',
    color: Palette.paperWhite,
  },
  specName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  specArea: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  billCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.forestGreen,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingBottom: 8,
    marginBottom: 10,
  },
  billTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.8,
  },
  paidBadge: {
    backgroundColor: Palette.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadgeText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.success,
  },
  billRows: {
    gap: 6,
    marginBottom: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billKey: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
  },
  billVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: Palette.subtleBorder,
    paddingTop: 8,
    marginTop: 4,
  },
  billTotalKey: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  billTotalVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  billNotes: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
    marginTop: 8,
  },
  estimateCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  estimateTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
  },
  estimateVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '800',
    color: Palette.forestGreen,
    marginTop: 2,
  },
  estimateNote: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    marginTop: 4,
    lineHeight: 16,
  },
  reviewCard: {
    backgroundColor: Palette.forestTint,
    borderWidth: 1,
    borderColor: Palette.forestGreen,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    fontStyle: 'italic',
  },
  actionButtonGroup: {
    marginTop: 10,
    gap: 10,
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
  ratingPrompt: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.charcoal,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 14,
  },
  starBtn: {
    padding: 4,
  },
  disputeNotice: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    lineHeight: 18,
    marginBottom: 16,
  },
});
