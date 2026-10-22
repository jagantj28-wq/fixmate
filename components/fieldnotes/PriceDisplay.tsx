import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { formatCurrency } from '@/lib/formatters';

interface PriceDisplayProps {
  amount: number;
  label?: string;
  isEstimate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  currency?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  label,
  isEstimate = true,
  size = 'md',
  currency = 'INR',
}) => {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.eyebrow}>{label.toUpperCase()}</Text>}
      <View style={styles.row}>
        <Text
          style={[
            styles.amount,
            isLarge && styles.amountLg,
            isSmall && styles.amountSm,
          ]}
        >
          {formatCurrency(amount, currency)}
        </Text>
        {isEstimate && (
          <Text style={[styles.estimateTag, isSmall && styles.estimateTagSm]}>
            EST.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amount: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.titleSm,
    fontWeight: '800',
    color: Palette.charcoal,
  },
  amountLg: {
    fontSize: Typography.fontSize.headline,
  },
  amountSm: {
    fontSize: Typography.fontSize.body,
  },
  estimateTag: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
  },
  estimateTagSm: {
    fontSize: 9,
  },
});
