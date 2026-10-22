import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { Booking } from '@/types/database';
import { FieldStatus } from './FieldStatus';
import { formatBookingDate, formatCurrency, formatSlotRange } from '@/lib/formatters';

interface BookingTicketProps {
  booking: Booking;
  onPress: () => void;
}

export const BookingTicket: React.FC<BookingTicketProps> = ({ booking, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ticketWrapper, pressed && styles.ticketPressed]}
    >
      {/* Top Header of Ticket */}
      <View style={styles.ticketHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderLabel}>SERVICE TICKET</Text>
          <Text style={styles.reference}>{booking.booking_reference}</Text>
        </View>
        <FieldStatus status={booking.status} size="sm" />
      </View>

      {/* Main Ticket Body */}
      <View style={styles.ticketBody}>
        <Text style={styles.serviceName}>
          {booking.service_category?.name || 'Home Maintenance'}
        </Text>
        <Text style={styles.problemDesc} numberOfLines={2}>
          "{booking.problem_description}"
        </Text>

        <View style={styles.detailGrid}>
          <View style={styles.detailCol}>
            <View style={styles.rowItem}>
              <Feather name="calendar" size={13} color={Palette.forestGreen} />
              <Text style={styles.detailText}>
                {formatBookingDate(booking.scheduled_date)}
              </Text>
            </View>
            <View style={styles.rowItem}>
              <Feather name="clock" size={13} color={Palette.forestGreen} />
              <Text style={styles.detailText}>
                {formatSlotRange(booking.scheduled_slot_start, booking.scheduled_slot_end)}
              </Text>
            </View>
          </View>

          <View style={styles.detailCol}>
            <View style={styles.rowItem}>
              <Feather name="user" size={13} color={Palette.forestGreen} />
              <Text style={styles.detailText} numberOfLines={1}>
                {booking.provider?.professional_name || 'Assigned Specialist'}
              </Text>
            </View>
            <View style={styles.rowItem}>
              <Feather name="map-pin" size={13} color={Palette.forestGreen} />
              <Text style={styles.detailText} numberOfLines={1}>
                {booking.address_snapshot?.city || 'Local Area'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Perforated Divider line with punched ticket notches */}
      <View style={styles.perforationContainer}>
        <View style={styles.notchLeft} />
        <View style={styles.dashedLine} />
        <View style={styles.notchRight} />
      </View>

      {/* Ticket Footer */}
      <View style={styles.ticketFooter}>
        <View>
          <Text style={styles.costEyebrow}>
            {booking.bill ? 'FINAL ITEMIZED TOTAL' : 'ESTIMATED SERVICE CHARGE'}
          </Text>
          <Text style={styles.costAmount}>
            {formatCurrency(booking.bill?.total_amount || booking.estimate_amount)}
          </Text>
        </View>

        <View style={styles.actionPrompt}>
          <Text style={styles.actionText}>VIEW WORK ORDER</Text>
          <Feather name="arrow-right" size={14} color={Palette.forestGreen} />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  ticketWrapper: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  ticketPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ticketHeader: {
    backgroundColor: Palette.cardAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.mutedGrayGreen,
    letterSpacing: 1,
  },
  reference: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  ticketBody: {
    padding: 16,
  },
  serviceName: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '700',
    color: Palette.charcoal,
    marginBottom: 4,
  },
  problemDesc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Palette.warmIvory,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
  },
  detailCol: {
    flex: 1,
    gap: 6,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    fontWeight: '600',
  },
  perforationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    position: 'relative',
    backgroundColor: Palette.paperWhite,
  },
  notchLeft: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.warmIvory,
    position: 'absolute',
    left: -6,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
  },
  notchRight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.warmIvory,
    position: 'absolute',
    right: -6,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    marginHorizontal: 16,
  },
  ticketFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.paperWhite,
  },
  costEyebrow: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
    letterSpacing: 0.5,
  },
  costAmount: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.5,
  },
});
