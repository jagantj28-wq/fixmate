import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Theme';
import { SectionEyebrow } from '@/components/fieldnotes';

export default function AboutModalScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="auto" />
      <SectionEyebrow label="// SYSTEM FIELDNOTES" accent />
      <Text style={styles.title}>About FixMate</Text>
      <Text style={styles.subtitle}>Home services, without the guesswork.</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="shield" size={16} color={Palette.forestGreen} />
          <Text style={styles.cardTitle}>PLATFORM GUARANTEES</Text>
        </View>

        <Text style={styles.itemTitle}>1. Vetted Diagnostics</Text>
        <Text style={styles.itemDesc}>
          All registered technicians pass credential checks and field verification before receiving customer work orders.
        </Text>

        <Text style={styles.itemTitle}>2. Itemized Invoicing</Text>
        <Text style={styles.itemDesc}>
          Final bills separate diagnostic inspection, labor hours, and replacement parts at standard MRP.
        </Text>

        <Text style={styles.itemTitle}>3. 7-Day Workmanship Warranty</Text>
        <Text style={styles.itemDesc}>
          Every completed service order includes in-app dispute reporting and rework guarantees.
        </Text>
      </View>

      <View style={styles.techSpecBox}>
        <Text style={styles.techSpecTitle}>ARCHITECTURE & STACK</Text>
        <Text style={styles.techSpecText}>
          • Framework: React Native + Expo Router v58
          {'\n'}• Database: Supabase PostgreSQL with Row Level Security (RLS)
          {'\n'}• Design System: FixMate Fieldnotes
          {'\n'}• Version: 1.0.0 (Production Candidate)
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.warmIvory,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.title,
    fontWeight: '800',
    color: Palette.charcoal,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    color: Palette.mutedGrayGreen,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Palette.paperWhite,
    borderWidth: 1.5,
    borderColor: Palette.subtleBorder,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  itemTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Palette.charcoal,
    marginTop: 8,
  },
  itemDesc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    lineHeight: 16,
    marginTop: 2,
  },
  techSpecBox: {
    backgroundColor: Palette.cardAlt,
    borderWidth: 1,
    borderColor: Palette.subtleBorder,
    borderRadius: 6,
    padding: 14,
  },
  techSpecTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    fontWeight: '800',
    color: Palette.charcoal,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  techSpecText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: Palette.mutedGrayGreen,
    lineHeight: 18,
  },
});
