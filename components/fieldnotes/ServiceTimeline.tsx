import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import { Typography } from '@/constants/Theme';
import { Booking, BookingStatus } from '@/types/database';

interface ServiceTimelineProps {
  booking: Booking;
}

interface Milestone {
  key: string;
  label: string;
  sublabel: string;
  isPassed: boolean;
  isCurrent: boolean;
  isTerminal?: boolean;
}

export const ServiceTimeline: React.FC<ServiceTimelineProps> = ({ booking }) => {
  const status = booking.status;

  // Handle cancelled or rejected abnormal workflows
  if (status === 'cancelled' || status === 'rejected' || status === 'disputed') {
    return (
      <View style={styles.container}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>WORK ORDER STATUS</Text>
          <Text style={styles.timestamp}>REF: {booking.booking_reference}</Text>
        </View>
        <View style={styles.alertBox}>
          <Feather
            name={status === 'cancelled' ? 'slash' : status === 'rejected' ? 'x-circle' : 'alert-circle'}
            size={20}
            color={Palette.error}
          />
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>
              BOOKING {status.toUpperCase()}
            </Text>
            <Text style={styles.alertDesc}>
              {booking.cancellation_reason ||
                (status === 'rejected'
                  ? 'The provider was unable to accept this request at the scheduled time.'
                  : 'An issue report has been logged and is under administrator review.')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Normal progression milestones
  const steps: Array<{ statusMatch: BookingStatus[]; label: string; sublabel: string }> = [
    {
      statusMatch: ['pending', 'accepted', 'in_progress', 'completed'],
      label: 'Request Logged',
      sublabel: 'Service order received & dispatched',
    },
    {
      statusMatch: ['accepted', 'in_progress', 'completed'],
      label: 'Technician Confirmed',
      sublabel: 'Slot reserved with verified specialist',
    },
    {
      statusMatch: ['in_progress', 'completed'],
      label: 'Work in Progress',
      sublabel: 'Specialist on-site performing diagnostics',
    },
    {
      statusMatch: ['completed'],
      label: 'Service Completed',
      sublabel: 'Work verified & itemized bill available',
    },
  ];

  const currentStepIndex =
    status === 'completed'
      ? 3
      : status === 'in_progress'
      ? 2
      : status === 'accepted'
      ? 1
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>WORK ORDER MILESTONES</Text>
        <Text style={styles.timestamp}>REAL-TIME AUDIT TRAIL</Text>
      </View>

      <View style={styles.milestoneList}>
        {steps.map((step, idx) => {
          const isPassed = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;

          return (
            <View key={step.label} style={styles.stepRow}>
              {/* Timeline Connector Column */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.node,
                    isPassed && styles.nodePassed,
                    isCurrent && styles.nodeCurrent,
                    isUpcoming && styles.nodeUpcoming,
                  ]}
                >
                  {isPassed ? (
                    <Feather name="check" size={12} color={Palette.paperWhite} />
                  ) : isCurrent ? (
                    <View style={styles.nodeInnerDot} />
                  ) : (
                    <View style={styles.nodeUpcomingDot} />
                  )}
                </View>

                {idx < steps.length - 1 && (
                  <View
                    style={[
                      styles.connectorLine,
                      isPassed && styles.connectorLinePassed,
                    ]}
                  />
                )}
              </View>

              {/* Milestone Details */}
              <View style={styles.detailsCol}>
                <View style={styles.stepTitleRow}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                      isUpcoming && styles.stepLabelUpcoming,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {isCurrent && (
                    <View style={styles.liveTag}>
                      <Text style={styles.liveTagText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stepSublabel}>{step.sublabel}</Text>
              </View>
            </View>
          );
        })}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.subtleBorder,
    paddingBottom: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
    letterSpacing: 0.8,
  },
  timestamp: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 9,
    color: Palette.mutedGrayGreen,
  },
  milestoneList: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  indicatorCol: {
    width: 28,
    alignItems: 'center',
  },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.paperWhite,
    zIndex: 2,
  },
  nodePassed: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  nodeCurrent: {
    borderColor: Palette.forestGreen,
    backgroundColor: Palette.citrusLime,
  },
  nodeUpcoming: {
    borderColor: Palette.subtleBorder,
    backgroundColor: Palette.cardAlt,
  },
  nodeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.forestGreen,
  },
  nodeUpcomingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.mutedGrayGreen,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: Palette.subtleBorder,
    marginVertical: 2,
  },
  connectorLinePassed: {
    backgroundColor: Palette.forestGreen,
  },
  detailsCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  stepLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.bodySm,
    fontWeight: '700',
    color: Palette.charcoal,
  },
  stepLabelCurrent: {
    color: Palette.forestGreen,
    fontWeight: '800',
  },
  stepLabelUpcoming: {
    color: Palette.mutedGrayGreen,
  },
  stepSublabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.mutedGrayGreen,
  },
  liveTag: {
    backgroundColor: Palette.citrusTint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Palette.citrusLime,
  },
  liveTagText: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  alertBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.errorLight,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Palette.error,
    alignItems: 'flex-start',
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: Typography.fontFamily.mono,
    fontSize: 11,
    fontWeight: '800',
    color: Palette.error,
    letterSpacing: 0.5,
  },
  alertDesc: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.caption,
    color: Palette.charcoal,
    marginTop: 4,
  },
});
