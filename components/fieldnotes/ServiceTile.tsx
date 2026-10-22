import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { ServiceCategory } from '@/types/database';
import { formatCurrency } from '@/lib/formatters';

interface ServiceTileProps {
  category: ServiceCategory;
  onPress: () => void;
  selected?: boolean;
}

export const ServiceTile: React.FC<ServiceTileProps> = ({
  category,
  onPress,
  selected = false,
}) => {
  // Map icon identifiers to Feather icons
  const getIconName = (name: string): keyof typeof Feather.glyphMap => {
    switch (name) {
      case 'tool':
        return 'tool';
      case 'zap':
        return 'zap';
      case 'cpu':
        return 'cpu';
      case 'wind':
        return 'wind';
      case 'package':
        return 'box';
      case 'sparkles':
        return 'check-circle';
      default:
        return 'activity';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
          <Feather
            name={getIconName(category.icon_identifier)}
            size={18}
            color={selected ? Palette.paperWhite : Palette.forestGreen}
          />
        </View>
        <Text style={styles.serial}>
          CAT-{category.slug.toUpperCase().slice(0, 4)}
        </Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {category.name}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.rateLabel}>CALL-OUT FROM</Text>
        <Text style={styles.price}>
          {formatCurrency(category.base_call_out_fee)}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  selected: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.forestTint,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: Palette.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
  },
  iconCircleSelected: {
    backgroundColor: Palette.forestGreen,
  },
  serial: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
  },
  title: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.subtleBorder,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rateLabel: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Palette.mutedGrayGreen,
  },
  price: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
});
