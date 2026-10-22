import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
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
  SectionEyebrow,
  VerificationMark,
} from '@/components/fieldnotes';
import { useAuth } from '@/contexts/AuthContext';
import { dataStore, isLiveSupabaseConfigured } from '@/services/dataStore';
import { AppNotification, CustomerAddress } from '@/types/database';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, role, switchUser, availableProfiles, refreshUser } = useAuth();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // New address state
  const [addressLabel, setAddressLabel] = useState('Home');
  const [streetAddress, setStreetAddress] = useState('');
  const [unitApartment, setUnitApartment] = useState('');
  const [postalCode, setPostalCode] = useState('560038');
  const [savingAddress, setSavingAddress] = useState(false);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const [addrs, notifs] = await Promise.all([
        dataStore.getCustomerAddresses(user.id),
        dataStore.getNotifications(user.id),
      ]);
      setAddresses(addrs);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load profile data', err);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleSaveAddress = async () => {
    if (!user || !streetAddress.trim()) {
      Alert.alert('Required', 'Please enter a valid street address.');
      return;
    }
    try {
      setSavingAddress(true);
      await dataStore.saveCustomerAddress(user.id, {
        label: addressLabel,
        street_address: streetAddress.trim(),
        unit_apartment: unitApartment.trim() || null,
        city: 'Bengaluru',
        postal_code: postalCode.trim() || '560038',
        latitude: 12.9716,
        longitude: 77.6412,
        service_instructions: null,
        is_default: addresses.length === 0,
      });
      setShowAddressModal(false);
      setStreetAddress('');
      setUnitApartment('');
      loadUserData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleMarkAllRead = async () => {
    for (const notif of notifications) {
      if (!notif.read_at) {
        await dataStore.markNotificationRead(notif.id);
      }
    }
    loadUserData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE HEADER CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.display_name?.slice(0, 2).toUpperCase() || 'FM'}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.display_name || 'FixMate User'}</Text>
              <Text style={styles.userPhone}>{user?.phone || '+91 98765 43210'}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>{role.toUpperCase()} ACCOUNT</Text>
              </View>
            </View>
          </View>

          {/* NOTIFICATION CENTER BUTTON */}
          <Pressable
            onPress={() => setShowNotificationsModal(true)}
            style={styles.notifRow}
          >
            <View style={styles.notifLeft}>
              <Feather name="bell" size={16} color={Palette.forestGreen} />
              <Text style={styles.notifLabel}>FIELD NOTIFICATIONS</Text>
            </View>
            <View style={styles.notifRight}>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} NEW</Text>
                </View>
              )}
              <Feather name="chevron-right" size={16} color={Palette.mutedGrayGreen} />
            </View>
          </Pressable>
        </View>

        {/* WORKSPACE TOOLS (For Provider / Admin) */}
        {role === 'provider' && (
          <View style={styles.sectionWrap}>
            <SectionEyebrow label="// PROVIDER TOOLS" />
            <FieldButton
              label="OPEN TECHNICIAN FIELD CONSOLE"
              onPress={() => router.push('/provider-workspace')}
              variant="accent"
              icon={<Feather name="tool" size={16} color={Palette.forestGreen} />}
            />
          </View>
        )}

        {role === 'admin' && (
          <View style={styles.sectionWrap}>
            <SectionEyebrow label="// ADMIN CONTROLS" />
            <FieldButton
              label="OPEN PLATFORM OPERATIONS"
              onPress={() => router.push('/admin-dashboard')}
              variant="primary"
              icon={<Feather name="sliders" size={16} color={Palette.paperWhite} />}
            />
          </View>
        )}

        {/* DEMO ROLE SWITCHER (Vital for testing full workflow) */}
        <View style={styles.sectionWrap}>
          <SectionEyebrow label="// TEST ROLE SWITCHER (INSTANT TESTING)" />
          <Text style={styles.subtext}>
            Switch persona to test Customer booking, Provider acceptance & billing, and Admin verification.
          </Text>

          <View style={styles.personaList}>
            {availableProfiles.map((p) => {
              const isCurrent = p.id === user?.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => switchUser(p.id)}
                  style={[
                    styles.personaItem,
                    isCurrent && styles.personaItemActive,
                  ]}
                >
                  <View style={styles.personaLeft}>
                    <View
                      style={[
                        styles.personaDot,
                        isCurrent && styles.personaDotActive,
                      ]}
                    />
                    <View>
                      <Text
                        style={[
                          styles.personaName,
                          isCurrent && styles.personaNameActive,
                        ]}
                      >
                        {p.display_name}
                      </Text>
                      <Text style={styles.personaRole}>
                        ROLE: {p.role.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {isCurrent && (
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>CURRENT</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* SAVED ADDRESSES */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <SectionEyebrow label="// SAVED SERVICE ADDRESSES" />
            <Pressable onPress={() => setShowAddressModal(true)}>
              <Text style={styles.addLink}>+ ADD ADDRESS</Text>
            </Pressable>
          </View>

          {addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.addressTop}>
                <Text style={styles.addressLabel}>{addr.label.toUpperCase()}</Text>
                {addr.is_default && (
                  <View style={styles.defaultPill}>
                    <Text style={styles.defaultPillText}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressStreet}>
                {addr.street_address}
                {addr.unit_apartment ? `, ${addr.unit_apartment}` : ''}
              </Text>
              <Text style={styles.addressCity}>
                {addr.city} – {addr.postal_code}
              </Text>
              {addr.service_instructions && (
                <Text style={styles.addressInstructions}>
                  Note: {addr.service_instructions}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* CLOUD / SUPABASE CONFIG STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Feather
              name={isLiveSupabaseConfigured() ? 'check-circle' : 'database'}
              size={15}
              color={isLiveSupabaseConfigured() ? Palette.forestGreen : Palette.warning}
            />
            <Text style={styles.statusTitle}>
              {isLiveSupabaseConfigured()
                ? 'SUPABASE CLUSTER: CONNECTED'
                : 'STORAGE MODE: LOCAL PERSISTENT SANDBOX'}
            </Text>
          </View>
          <Text style={styles.statusDesc}>
            {isLiveSupabaseConfigured()
              ? 'Real-time synchronization and Row-Level-Security active via Supabase PostgreSQL.'
              : 'Operating in local offline sandbox mode. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env for production cloud sync.'}
          </Text>
        </View>
      </ScrollView>

      {/* ADD ADDRESS MODAL */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Service Address</Text>
            <Pressable onPress={() => setShowAddressModal(false)}>
              <Feather name="x" size={20} color={Palette.charcoal} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <FieldInput
              label="Address Label"
              placeholder="e.g. Home, Office, Studio"
              value={addressLabel}
              onChangeText={setAddressLabel}
            />
            <FieldInput
              label="Street Address"
              placeholder="House/Plot #, Road, Locality"
              value={streetAddress}
              onChangeText={setStreetAddress}
            />
            <FieldInput
              label="Apartment / Unit / Landmark"
              placeholder="Flat 3B, Near Metro Pillar..."
              value={unitApartment}
              onChangeText={setUnitApartment}
            />
            <FieldInput
              label="Postal Code (PIN)"
              placeholder="560038"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="number-pad"
            />

            <FieldButton
              label="SAVE SERVICE ADDRESS"
              onPress={handleSaveAddress}
              loading={savingAddress}
              style={{ marginTop: 12 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* NOTIFICATIONS MODAL */}
      <Modal
        visible={showNotificationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Field Notifications</Text>
              <Text style={styles.modalSubtitle}>
                {unreadCount} unread service updates
              </Text>
            </View>
            <View style={styles.modalHeaderActions}>
              {unreadCount > 0 && (
                <Pressable onPress={handleMarkAllRead}>
                  <Text style={styles.markReadText}>MARK ALL READ</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setShowNotificationsModal(false)}>
                <Feather name="x" size={20} color={Palette.charcoal} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.modalBody}>
            {notifications.length === 0 ? (
              <Text style={styles.emptyNotifText}>No notifications yet.</Text>
            ) : (
              notifications.map((n) => (
                <View
                  key={n.id}
                  style={[styles.notifCard, !n.read_at && styles.notifCardUnread]}
                >
                  <View style={styles.notifCardHeader}>
                    <Text style={styles.notifCardTitle}>{n.title}</Text>
                    {!n.read_at && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifCardBody}>{n.body}</Text>
                </View>
              ))
            )}
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
  profileCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  profileTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '800',
    color: Palette.paperWhite,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  userPhone: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.forestTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  roleTagText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Palette.subtleBorder,
    paddingTop: 12,
  },
  notifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.charcoal,
    letterSpacing: 0.5,
  },
  notifRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadBadge: {
    backgroundColor: Palette.citrusLime,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadBadgeText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  subtext: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    marginBottom: 10,
  },
  personaList: {
    gap: 8,
  },
  personaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
  },
  personaItemActive: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.forestTint,
  },
  personaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.mutedGrayGreen,
  },
  personaDotActive: {
    backgroundColor: Palette.forestGreen,
  },
  personaName: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  personaNameActive: {
    color: Palette.forestGreen,
  },
  personaRole: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    color: Palette.mutedGrayGreen,
  },
  activePill: {
    backgroundColor: Palette.forestGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  activePillText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.paperWhite,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addLink: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  addressCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  addressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  defaultPill: {
    backgroundColor: Palette.citrusTint,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  defaultPillText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  addressStreet: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.charcoal,
    fontWeight: '600',
  },
  addressCity: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
  },
  addressInstructions: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.charcoal,
    letterSpacing: 0.5,
  },
  statusDesc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    lineHeight: 16,
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
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markReadText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  notifCard: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  notifCardUnread: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.forestTint,
  },
  notifCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifCardTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.forestGreen,
  },
  notifCardBody: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    lineHeight: 16,
  },
  emptyNotifText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
    textAlign: 'center',
    marginTop: 32,
  },
});
