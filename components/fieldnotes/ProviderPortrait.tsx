import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { ProviderProfile } from '@/types/database';
import { VerificationMark } from './VerificationMark';
import { formatCurrency } from '@/lib/formatters';

interface ProviderPortraitProps {
  provider: ProviderProfile;
  onPress: () => void;
  selected?: boolean;
}

export const ProviderPortrait: React.FC<ProviderPortraitProps> = ({
  provider,
  onPress,
  selected = false,
}) => {
  // Get initials for fallback
  const initials = provider.professional_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const minFee = provider.services?.[0]?.call_out_fee || 199;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {provider.professional_name}
            </Text>
          </View>

          {provider.verification_status === 'approved' && (
            <VerificationMark label="VERIFIED TECH" />
          )}

          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color="#D97706" />
            <Text style={styles.ratingNumber}>
              {provider.average_rating.toFixed(1)}
            </Text>
            <Text style={styles.reviewsCount}>
              ({provider.total_reviews} reviews)
            </Text>
          </View>
        </View>
      </View>

      {provider.description && (
        <Text style={styles.description} numberOfLines={2}>
          {provider.description}
        </Text>
      )}

      <View style={styles.footerRow}>
        <View style={styles.areaBadge}>
          <Feather name="map-pin" size={11} color={Palette.mutedGrayGreen} />
          <Text style={styles.areaText} numberOfLines={1}>
            {provider.service_area}
          </Text>
        </View>

        <View style={styles.feeCol}>
          <Text style={styles.feeEyebrow}>CALL-OUT</Text>
          <Text style={styles.feeAmount}>{formatCurrency(minFee)}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.forestTint,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
  infoCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingNumber: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  reviewsCount: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
  },
  description: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.subtleBorder,
    paddingTop: 8,
  },
  areaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingRight: 8,
  },
  areaText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
  },
  feeCol: {
    alignItems: 'flex-end',
  },
  feeEyebrow: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
  },
  feeAmount: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
});
