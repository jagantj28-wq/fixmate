/**
 * FixMate Booking State Machine & Transition Rules
 * Strict role-authorized transitions for customer, provider, and admin
 */

import { BookingStatus, UserRole } from '@/types/database';

export interface TransitionContext {
  bookingId: string;
  currentStatus: BookingStatus;
  newStatus: BookingStatus;
  actorRole: UserRole;
  actorUserId: string;
  assignedProviderUserId?: string;
  bookingCustomerId?: string;
  scheduledDate?: string;
  scheduledSlotStart?: string;
}

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

// State transition table mapping from current status to allowed new statuses & required roles
export const ALLOWED_TRANSITIONS: Record<
  BookingStatus,
  Array<{ next: BookingStatus; roles: UserRole[] }>
> = {
  pending: [
    { next: 'accepted', roles: ['provider', 'admin'] },
    { next: 'rejected', roles: ['provider', 'admin'] },
    { next: 'cancelled', roles: ['customer', 'admin'] },
  ],
  accepted: [
    { next: 'in_progress', roles: ['provider', 'admin'] },
    { next: 'cancelled', roles: ['customer', 'provider', 'admin'] },
  ],
  in_progress: [
    { next: 'completed', roles: ['provider', 'admin'] },
  ],
  completed: [
    { next: 'disputed', roles: ['customer', 'admin'] },
  ],
  rejected: [],
  cancelled: [],
  disputed: [
    { next: 'completed', roles: ['admin'] },
    { next: 'cancelled', roles: ['admin'] },
  ],
};

/**
 * Validates whether a state transition is legal according to FixMate business logic
 */
export function validateStateTransition(ctx: TransitionContext): TransitionValidationResult {
  const { currentStatus, newStatus, actorRole, actorUserId, assignedProviderUserId, bookingCustomerId } = ctx;

  // 1. Same status is a no-op
  if (currentStatus === newStatus) {
    return { allowed: false, reason: 'Booking is already in this status' };
  }

  // 2. Check if transition is in the state diagram
  const possibleTransitions = ALLOWED_TRANSITIONS[currentStatus];
  if (!possibleTransitions || possibleTransitions.length === 0) {
    return {
      allowed: false,
      reason: `Cannot transition from terminal status '${currentStatus}' to '${newStatus}'`,
    };
  }

  const transitionRule = possibleTransitions.find((t) => t.next === newStatus);
  if (!transitionRule) {
    return {
      allowed: false,
      reason: `Illegal transition from '${currentStatus}' to '${newStatus}'`,
    };
  }

  // 3. Check role authorization
  if (!transitionRule.roles.includes(actorRole)) {
    return {
      allowed: false,
      reason: `User with role '${actorRole}' is not authorized to transition booking to '${newStatus}'`,
    };
  }

  // 4. Check actor ownership
  if (actorRole === 'customer' && bookingCustomerId && actorUserId !== bookingCustomerId) {
    return {
      allowed: false,
      reason: 'Customer can only manage their own bookings',
    };
  }

  if (actorRole === 'provider' && assignedProviderUserId && actorUserId !== assignedProviderUserId) {
    return {
      allowed: false,
      reason: 'Only the assigned provider can update this booking',
    };
  }

  // 5. Cancellation rules check
  if (newStatus === 'cancelled' && actorRole === 'customer') {
    const cancelCheck = isCancellationPermitted(currentStatus);
    if (!cancelCheck.allowed) {
      return cancelCheck;
    }
  }

  return { allowed: true };
}

/**
 * Checks if a booking can be cancelled by a customer
 */
export function isCancellationPermitted(status: BookingStatus): { allowed: boolean; reason?: string } {
  if (status === 'pending') {
    return { allowed: true };
  }
  if (status === 'accepted') {
    return { allowed: true };
  }
  if (status === 'in_progress') {
    return {
      allowed: false,
      reason: 'Service is currently in progress. Please contact your technician or support to cancel.',
    };
  }
  if (status === 'completed') {
    return {
      allowed: false,
      reason: 'Completed bookings cannot be cancelled. You can file a dispute if there is an issue.',
    };
  }
  return {
    allowed: false,
    reason: `Booking is already ${status}`,
  };
}

/**
 * Checks if a completed booking is eligible for customer review
 */
export function isReviewEligible(booking: {
  status: BookingStatus;
  hasReview?: boolean;
}): { eligible: boolean; reason?: string } {
  if (booking.status !== 'completed') {
    return {
      eligible: false,
      reason: 'Reviews can only be submitted for completed service visits',
    };
  }
  if (booking.hasReview) {
    return {
      eligible: false,
      reason: 'You have already submitted a review for this booking',
    };
  }
  return { eligible: true };
}
