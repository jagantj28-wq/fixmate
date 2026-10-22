import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { formatCurrency } from '@/lib/formatters';

interface EstimatePanelProps {
  callOutFee: number;
  indicativeLabor: number;
  currency?: string;
}

export const EstimatePanel: React.FC<EstimatePanelProps> = ({
  callOutFee,
  indicativeLabor,
  currency = 'INR',
}) => {
  const estimatedTotal = callOutFee + indicativeLabor;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRANSPARENT ESTIMATE BREAKDOWN</Text>
        <Text style={styles.headerSubtitle}>
          FixMate Fieldnote Clause §4.2: No hidden booking surcharges
        </Text>
      </View>

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.itemLabel}>Diagnostic Call-out & Inspection</Text>
          <Text style={styles.itemPrice}>{formatCurrency(callOutFee, currency)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.itemLabel}>Base Labor (first 30 mins)</Text>
          <Text style={styles.itemPrice}>{formatCurrency(indicativeLabor, currency)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.itemLabel}>Replacement Parts / Consumables</Text>
          <Text style={styles.itemNote}>Billed at MRP after your approval</Text>
        </View>
      </View>

      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>ESTIMATED INITIAL CHARGE</Text>
          <Text style={styles.totalDisclaimer}>Pay on-site upon completion</Text>
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(estimatedTotal, currency)}</Text>
      </View>

      <View style={styles.noticeBox}>
        <Feather name="info" size={13} color={Palette.forestGreen} />
        <Text style={styles.noticeText}>
          The technician will inspect the fault on-site and explain any parts or extra labor required before proceeding.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    marginTop: 2,
  },
  rows: {
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    fontWeight: '500',
  },
  itemPrice: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    fontWeight: '700',
  },
  itemNote: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: Palette.subtleBorder,
    paddingTop: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.charcoal,
    letterSpacing: 0.5,
  },
  totalDisclaimer: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
  totalAmount: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Palette.forestTint,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  noticeText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.forestGreen,
    lineHeight: 16,
  },
});
