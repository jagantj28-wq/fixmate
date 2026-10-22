import {
  isCancellationPermitted,
  isReviewEligible,
  validateStateTransition,
} from '@/lib/stateMachine';

describe('FixMate Booking State Machine', () => {
  const customerId = 'c0000000-0000-0000-0000-000000000001';
  const providerId = 'p0000000-0000-0000-0000-000000000001';
  const otherUserId = 'c0000000-0000-0000-0000-000000000099';

  test('Provider can accept a pending booking', () => {
    const result = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'pending',
      newStatus: 'accepted',
      actorRole: 'provider',
      actorUserId: providerId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(result.allowed).toBe(true);
  });

  test('Customer cannot accept their own pending booking', () => {
    const result = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'pending',
      newStatus: 'accepted',
      actorRole: 'customer',
      actorUserId: customerId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not authorized');
  });

  test('Unassigned provider cannot update a booking', () => {
    const result = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'pending',
      newStatus: 'accepted',
      actorRole: 'provider',
      actorUserId: otherUserId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Only the assigned provider');
  });

  test('Customer can cancel a pending booking', () => {
    const result = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'pending',
      newStatus: 'cancelled',
      actorRole: 'customer',
      actorUserId: customerId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(result.allowed).toBe(true);
  });

  test('Customer cannot cancel an in_progress booking', () => {
    const result = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'in_progress',
      newStatus: 'cancelled',
      actorRole: 'customer',
      actorUserId: customerId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(result.allowed).toBe(false);
  });

  test('Provider can transition accepted to in_progress and then to completed', () => {
    const startJob = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'accepted',
      newStatus: 'in_progress',
      actorRole: 'provider',
      actorUserId: providerId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(startJob.allowed).toBe(true);

    const completeJob = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'in_progress',
      newStatus: 'completed',
      actorRole: 'provider',
      actorUserId: providerId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(completeJob.allowed).toBe(true);
  });

  test('Completed booking cannot transition directly to accepted (illegal transition)', () => {
    const result = validateStateTransition({
      bookingId: 'b-1',
      currentStatus: 'completed',
      newStatus: 'accepted',
      actorRole: 'provider',
      actorUserId: providerId,
      assignedProviderUserId: providerId,
      bookingCustomerId: customerId,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Illegal transition');
  });

  test('Review eligibility rules', () => {
    expect(isReviewEligible({ status: 'pending' }).eligible).toBe(false);
    expect(isReviewEligible({ status: 'in_progress' }).eligible).toBe(false);
    expect(isReviewEligible({ status: 'completed', hasReview: false }).eligible).toBe(true);
    expect(isReviewEligible({ status: 'completed', hasReview: true }).eligible).toBe(false);
  });

  test('Cancellation policy rules', () => {
    expect(isCancellationPermitted('pending').allowed).toBe(true);
    expect(isCancellationPermitted('accepted').allowed).toBe(true);
    expect(isCancellationPermitted('in_progress').allowed).toBe(false);
    expect(isCancellationPermitted('completed').allowed).toBe(false);
    expect(isCancellationPermitted('cancelled').allowed).toBe(false);
  });
});
