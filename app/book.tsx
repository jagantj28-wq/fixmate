import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  EstimatePanel,
  FieldButton,
  FieldInput,
  ProviderPortrait,
  SectionEyebrow,
  ServiceTile,
} from '@/components/fieldnotes';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore } from '@/services/dataStore';
import { CustomerAddress, ProviderProfile, ServiceCategory } from '@/types/database';
import { formatBookingDate, formatCurrency } from '@/lib/formatters';

const TIME_SLOTS = [
  { start: '09:00:00', end: '11:00:00', label: '09:00 AM – 11:00 AM', tag: 'MORNING' },
  { start: '11:30:00', end: '13:30:00', label: '11:30 AM – 01:30 PM', tag: 'MIDDAY' },
  { start: '14:30:00', end: '16:30:00', label: '02:30 PM – 04:30 PM', tag: 'AFTERNOON' },
  { start: '17:00:00', end: '19:00:00', label: '05:00 PM – 07:00 PM', tag: 'EVENING' },
];

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; providerId?: string }>();
  const { user } = useAuth();

  // Wizard state: Step 1 -> 2 -> 3 -> 4 -> 5 -> 6 (Confirmed)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data collections
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // Selected Booking Fields
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  // Generate next 5 days
  const today = new Date();
  const availableDates = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    return {
      iso,
      display: formatBookingDate(iso),
      isTomorrow: offset === 0,
    };
  });

  const [selectedDate, setSelectedDate] = useState(availableDates[0].iso);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0]);

  // Confirmed booking reference result
  const [confirmedBookingRef, setConfirmedBookingRef] = useState<string | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [cats, provs, addrs] = await Promise.all([
          dataStore.getCategories(),
          dataStore.getProviders({ verifiedOnly: true }),
          user ? dataStore.getCustomerAddresses(user.id) : [],
        ]);

        setCategories(cats.filter((c) => c.active));
        setProviders(provs);
        setAddresses(addrs);

        if (addrs.length > 0) {
          const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddress(defaultAddr);
        }

        // Preselect category if passed in params
        if (params.categoryId) {
          const matched = cats.find((c) => c.id === params.categoryId);
          if (matched) {
            setSelectedCategory(matched);
            setStep(2);
          }
        }

        // Preselect provider if passed in params
        if (params.providerId) {
          const matchedProv = provs.find((p) => p.id === params.providerId);
          if (matchedProv) {
            setSelectedProvider(matchedProv);
            if (matchedProv.services?.[0]?.category) {
              setSelectedCategory(matchedProv.services[0].category);
              setStep(2);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize booking flow', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, params.categoryId, params.providerId]);

  // Compute estimate
  const callOutFee = selectedCategory?.base_call_out_fee || 249;
  const indicativeLabor = selectedCategory?.base_call_out_fee ? selectedCategory.base_call_out_fee * 0.4 : 100;
  const totalEstimate = callOutFee + indicativeLabor;

  // Filter providers that offer the chosen category
  const eligibleProviders = providers.filter((p) =>
    selectedCategory ? p.services?.some((s) => s.category_id === selectedCategory.id) : true
  );

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedCategory) {
        Alert.alert('Selection Required', 'Please select a service category to proceed.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (problemDescription.trim().length < 10) {
        Alert.alert('More Details Needed', 'Please describe the problem in at least 10 characters.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedAddress) {
        Alert.alert('Address Required', 'Please choose a service address for technician arrival.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      // Pick default provider if none selected
      if (!selectedProvider && eligibleProviders.length > 0) {
        setSelectedProvider(eligibleProviders[0]);
      }
      setStep(5);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedCategory || !selectedAddress || !selectedProvider) {
      Alert.alert('Incomplete Order', 'Please complete all order details.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await dataStore.createBooking({
        customerId: user.id,
        providerId: selectedProvider.id,
        serviceCategoryId: selectedCategory.id,
        addressId: selectedAddress.id,
        addressSnapshot: {
          label: selectedAddress.label,
          street_address: selectedAddress.street_address,
          unit_apartment: selectedAddress.unit_apartment,
          city: selectedAddress.city,
          postal_code: selectedAddress.postal_code,
          service_instructions: selectedAddress.service_instructions,
        },
        scheduledDate: selectedDate,
        scheduledSlotStart: selectedSlot.start,
        scheduledSlotEnd: selectedSlot.end,
        problemDescription: problemDescription.trim(),
        estimateAmount: totalEstimate,
        currency: 'INR',
      });

      setConfirmedBookingRef(created.booking_reference);
      setConfirmedBookingId(created.id);
      setStep(6); // Step 6 = Confirmation
    } catch (err: any) {
      Alert.alert('Booking Failed', err?.message || 'Could not schedule booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.forestGreen} />
        <Text style={styles.loadingText}>PREPARING SERVICE ORDER...</Text>
      </View>
    );
  }

  // STEP 6: BRANDED CONFIRMATION SCREEN
  if (step === 6 && confirmedBookingRef) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.confirmedContent}>
          <View style={styles.confirmedCard}>
            <View style={styles.confirmedIconCircle}>
              <Feather name="check" size={28} color={Palette.forestGreen} />
            </View>

            <Text style={styles.confirmedTitle}>Work Order Dispatched</Text>
            <Text style={styles.confirmedSub}>
              Your service request has been logged and forwarded to the technician.
            </Text>

            <View style={styles.refBox}>
              <Text style={styles.refLabel}>WORK ORDER REFERENCE</Text>
              <Text style={styles.refValue}>{confirmedBookingRef}</Text>
            </View>

            <View style={styles.summaryList}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Service:</Text>
                <Text style={styles.summaryVal}>{selectedCategory?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Specialist:</Text>
                <Text style={styles.summaryVal}>{selectedProvider?.professional_name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Appointment:</Text>
                <Text style={styles.summaryVal}>
                  {formatBookingDate(selectedDate)} ({selectedSlot.label})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Indicative Total:</Text>
                <Text style={styles.summaryValBold}>{formatCurrency(totalEstimate)}</Text>
              </View>
            </View>

            <View style={styles.nextStepsNote}>
              <Feather name="clock" size={14} color={Palette.forestGreen} />
              <Text style={styles.nextStepsText}>
                The technician will review and confirm arrival. You will receive an in-app status notification.
              </Text>
            </View>

            <FieldButton
              label="TRACK WORK ORDER STATUS"
              onPress={() => {
                if (confirmedBookingId) {
                  router.replace({
                    pathname: '/booking/[id]',
                    params: { id: confirmedBookingId },
                  });
                } else {
                  router.replace('/(tabs)/bookings');
                }
              }}
              variant="primary"
              style={{ width: '100%', marginTop: 12 }}
            />

            <FieldButton
              label="RETURN TO HOME"
              onPress={() => router.replace('/(tabs)')}
              variant="secondary"
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* STEP PROGRESS BAR */}
      <View style={styles.progressHeader}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>
            STEP 0{step} OF 05 // {step === 1 ? 'CATEGORY' : step === 2 ? 'DIAGNOSTIC' : step === 3 ? 'ADDRESS' : step === 4 ? 'TIME SLOT' : 'VERIFY & ORDER'}
          </Text>
          <Text style={styles.progressPercent}>{step * 20}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${step * 20}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: SELECT CATEGORY */}
        {step === 1 && (
          <View>
            <SectionEyebrow label="// STEP 01" />
            <Text style={styles.stepTitle}>Choose a Service Trade</Text>
            <Text style={styles.stepSubtitle}>
              Select the domain of repair required for your residence.
            </Text>

            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <View key={cat.id} style={styles.categoryCol}>
                    <ServiceTile
                      category={cat}
                      selected={isSelected}
                      onPress={() => setSelectedCategory(cat)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: DESCRIBE PROBLEM */}
        {step === 2 && (
          <View>
            <SectionEyebrow label="// STEP 02" />
            <Text style={styles.stepTitle}>Describe the Fault</Text>
            <Text style={styles.stepSubtitle}>
              Detailed observations help the technician bring proper replacement valves, fuses, or tools.
            </Text>

            <View style={styles.selectedCatBanner}>
              <Feather name="tool" size={16} color={Palette.forestGreen} />
              <Text style={styles.selectedCatName}>{selectedCategory?.name}</Text>
            </View>

            <FieldInput
              label="Detailed Problem Symptoms"
              placeholder="e.g. Washing machine vibrates violently and stops during 800 RPM spin cycle. Error code E04 displayed."
              value={problemDescription}
              onChangeText={setProblemDescription}
              multiline
              numberOfLines={4}
              hint="Minimum 10 characters"
            />
          </View>
        )}

        {/* STEP 3: SELECT ADDRESS */}
        {step === 3 && (
          <View>
            <SectionEyebrow label="// STEP 03" />
            <Text style={styles.stepTitle}>Service Location</Text>
            <Text style={styles.stepSubtitle}>
              Confirm the address where the technician should report.
            </Text>

            {addresses.length === 0 ? (
              <View style={styles.emptyAddressBox}>
                <Text style={styles.emptyAddressText}>
                  No saved addresses found. Please add an address in your profile first.
                </Text>
                <FieldButton
                  label="ADD NEW ADDRESS"
                  onPress={() => router.push('/(tabs)/profile')}
                  variant="secondary"
                  size="sm"
                />
              </View>
            ) : (
              <View style={styles.addressList}>
                {addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <Pressable
                      key={addr.id}
                      onPress={() => setSelectedAddress(addr)}
                      style={[
                        styles.addressOption,
                        isSelected && styles.addressOptionSelected,
                      ]}
                    >
                      <View style={styles.radioRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.addrLabelText}>{addr.label.toUpperCase()}</Text>
                          <Text style={styles.addrStreetText}>
                            {addr.street_address}
                            {addr.unit_apartment ? `, ${addr.unit_apartment}` : ''}
                          </Text>
                          <Text style={styles.addrCityText}>{addr.city} – {addr.postal_code}</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* STEP 4: CHOOSE APPOINTMENT SLOT & TECHNICIAN */}
        {step === 4 && (
          <View>
            <SectionEyebrow label="// STEP 04" />
            <Text style={styles.stepTitle}>Appointment Slot & Technician</Text>
            <Text style={styles.stepSubtitle}>
              Select your preferred arrival date and 2-hour inspection window.
            </Text>

            {/* Date Pills */}
            <Text style={styles.subheadLabel}>SERVICE DATE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {availableDates.map((dateObj) => {
                const isSelected = selectedDate === dateObj.iso;
                return (
                  <Pressable
                    key={dateObj.iso}
                    onPress={() => setSelectedDate(dateObj.iso)}
                    style={[styles.datePill, isSelected && styles.datePillSelected]}
                  >
                    <Text style={[styles.datePillText, isSelected && styles.datePillTextSelected]}>
                      {dateObj.display}
                    </Text>
                    {dateObj.isTomorrow && (
                      <Text style={[styles.dateTag, isSelected && styles.dateTagSelected]}>
                        TOMORROW
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            <Text style={[styles.subheadLabel, { marginTop: 14 }]}>TIME WINDOW</Text>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot.start === slot.start;
                return (
                  <Pressable
                    key={slot.start}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                  >
                    <View style={styles.slotTop}>
                      <Text style={[styles.slotTag, isSelected && styles.slotTagSelected]}>
                        {slot.tag}
                      </Text>
                      {isSelected && <Feather name="check" size={14} color={Palette.forestGreen} />}
                    </View>
                    <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                      {slot.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Preferred Specialist */}
            <Text style={[styles.subheadLabel, { marginTop: 18 }]}>ASSIGNED TECHNICIAN</Text>
            {eligibleProviders.length === 0 ? (
              <Text style={styles.noProvNotice}>
                FixMate Dispatch will assign the nearest on-call licensed professional.
              </Text>
            ) : (
              eligibleProviders.map((prov) => {
                const isSelected = selectedProvider?.id === prov.id;
                return (
                  <ProviderPortrait
                    key={prov.id}
                    provider={prov}
                    selected={isSelected}
                    onPress={() => setSelectedProvider(prov)}
                  />
                );
              })
            )}
          </View>
        )}

        {/* STEP 5: REVIEW ESTIMATE & CONFIRM */}
        {step === 5 && (
          <View>
            <SectionEyebrow label="// STEP 05. ORDER REVIEW" />
            <Text style={styles.stepTitle}>Verify Work Order Details</Text>
            <Text style={styles.stepSubtitle}>
              Please review all specifications before placing the dispatch order.
            </Text>

            {/* Summary Ticket */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewHeaderTitle}>WORK ORDER SPECIFICATION</Text>
                <Text style={styles.reviewCity}>BENGALURU</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Service:</Text>
                <Text style={styles.reviewVal}>{selectedCategory?.name}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Technician:</Text>
                <Text style={styles.reviewVal}>{selectedProvider?.professional_name || 'Nearest Licensed Tech'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Arrival Window:</Text>
                <Text style={styles.reviewVal}>
                  {formatBookingDate(selectedDate)} // {selectedSlot.label}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Address:</Text>
                <Text style={styles.reviewVal}>
                  {selectedAddress?.street_address}, {selectedAddress?.city}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Problem Note:</Text>
                <Text style={styles.reviewVal} numberOfLines={2}>
                  "{problemDescription}"
                </Text>
              </View>
            </View>

            {/* Transparent Estimate Panel */}
            <EstimatePanel
              callOutFee={callOutFee}
              indicativeLabor={indicativeLabor}
            />

            {/* Terms & Cancellation Notice */}
            <View style={styles.termsBox}>
              <Text style={styles.termsTitle}>CANCELLATION POLICY & TERMS</Text>
              <Text style={styles.termsText}>
                • You can cancel free of charge any time before the technician is marked on the way.
                {'\n'}• Cash on service or UPI payment is collected only after physical inspection and invoice presentation.
              </Text>
            </View>
          </View>
        )}

        {/* NAVIGATION CONTROLS (Back / Next / Submit) */}
        <View style={styles.navRow}>
          {step > 1 && (
            <FieldButton
              label="← BACK"
              onPress={() => setStep(step - 1)}
              variant="secondary"
              style={{ flex: 1 }}
            />
          )}

          {step < 5 ? (
            <FieldButton
              label="CONTINUE →"
              onPress={handleNextStep}
              variant="primary"
              style={{ flex: step > 1 ? 2 : 1 }}
            />
          ) : (
            <FieldButton
              label="DISPATCH WORK ORDER"
              onPress={handleConfirmBooking}
              variant="accent"
              loading={submitting}
              style={{ flex: 2 }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.warmIvory,
  },
  progressHeader: {
    backgroundColor: Palette.paperWhite,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.8,
  },
  progressPercent: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Palette.cardAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Palette.forestGreen,
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
  },
  stepTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.title,
    fontWeight: '800',
    color: Palette.charcoal,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.mutedGrayGreen,
    marginBottom: 16,
    lineHeight: 18,
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
  selectedCatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.forestTint,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.forestGreen,
    marginBottom: 14,
  },
  selectedCatName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  emptyAddressBox: {
    padding: 20,
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
  },
  emptyAddressText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.mutedGrayGreen,
    textAlign: 'center',
  },
  addressList: {
    gap: 10,
  },
  addressOption: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
  },
  addressOptionSelected: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.forestTint,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Palette.mutedGrayGreen,
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.citrusLime,
  },
  addrLabelText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  addrStreetText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.charcoal,
    fontWeight: '600',
    marginTop: 2,
  },
  addrCityText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    marginTop: 1,
  },
  subheadLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dateScroll: {
    marginBottom: 10,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  datePillSelected: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.forestGreen,
  },
  datePillText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  datePillTextSelected: {
    color: Palette.paperWhite,
  },
  dateTag: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.forestGreen,
    marginTop: 2,
  },
  dateTagSelected: {
    color: Palette.citrusLime,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  slotCard: {
    width: '50%',
    padding: 4,
  },
  slotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slotCardSelected: {
    borderColor: Palette.forestGreen,
  },
  slotTag: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
  },
  slotTagSelected: {
    color: Palette.forestGreen,
  },
  slotTime: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  slotTimeSelected: {
    color: Palette.forestGreen,
  },
  noProvNotice: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingBottom: 8,
    marginBottom: 10,
  },
  reviewHeaderTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.8,
  },
  reviewCity: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    color: Palette.mutedGrayGreen,
  },
  reviewRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reviewKey: {
    width: 110,
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    color: Palette.mutedGrayGreen,
  },
  reviewVal: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    fontWeight: '600',
  },
  termsBox: {
    backgroundColor: Palette.cardAlt,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
    marginVertical: 10,
  },
  termsTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.charcoal,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  termsText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    lineHeight: 16,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  confirmedContent: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.forestGreen,
    borderRadius: 10,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  confirmedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.citrusLime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmedTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.title,
    fontWeight: '800',
    color: Palette.charcoal,
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmedSub: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  refBox: {
    backgroundColor: Palette.forestTint,
    borderWidth: 1,
    borderColor: Palette.forestGreen,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  refLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 1,
  },
  refValue: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '900',
    color: Palette.forestGreen,
    marginTop: 2,
  },
  summaryList: {
    width: '100%',
    gap: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.subtleBorder,
    paddingVertical: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryKey: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    color: Palette.mutedGrayGreen,
  },
  summaryVal: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Palette.charcoal,
  },
  summaryValBold: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  nextStepsNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Palette.warmIvory,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextStepsText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.charcoal,
    lineHeight: 16,
  },
});
