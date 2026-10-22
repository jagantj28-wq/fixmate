import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { BookingStatus } from '@/types/database';

interface FieldStatusProps {
  status: BookingStatus | string;
  size?: 'sm' | 'md';
}

export const FieldStatus: React.FC<FieldStatusProps> = ({ status, size = 'md' }) => {
  let badgeBg: string = Palette.cardAlt;
  let textColor: string = Palette.charcoal;
  let indicatorColor: string = Palette.mutedGrayGreen;
  let displayLabel = status.replace('_', ' ').toUpperCase();

  switch (status) {
    case 'accepted':
      badgeBg = Palette.forestTint;
      textColor = Palette.forestGreen;
      indicatorColor = Palette.forestGreen;
      break;
    case 'in_progress':
      badgeBg = Palette.infoLight;
      textColor = Palette.info;
      indicatorColor = Palette.info;
      displayLabel = 'IN PROGRESS';
      break;
    case 'completed':
      badgeBg = Palette.successLight;
      textColor = Palette.success;
      indicatorColor = Palette.success;
      break;
    case 'pending':
      badgeBg = Palette.warningLight;
      textColor = Palette.warning;
      indicatorColor = Palette.warning;
      break;
    case 'rejected':
    case 'cancelled':
      badgeBg = Palette.errorLight;
      textColor = Palette.error;
      indicatorColor = Palette.error;
      break;
    case 'disputed':
      badgeBg = Palette.errorLight;
      textColor = Palette.error;
      indicatorColor = Palette.error;
      break;
    case 'approved':
      badgeBg = Palette.successLight;
      textColor = Palette.success;
      indicatorColor = Palette.success;
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: badgeBg }, isSmall && styles.badgeSm]}>
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <Text style={[styles.label, { color: textColor }, isSmall && styles.labelSm]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: Typography.fontSize.tiny,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSm: {
    fontSize: 9,
  },
});
