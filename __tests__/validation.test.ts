import {
  bookingBillSchema,
  bookingCreationSchema,
  loginSchema,
  registerSchema,
  reviewSchema,
} from '@/lib/validation';

describe('FixMate Zod Input Validation', () => {
  test('Validates registration schema', () => {
    const valid = registerSchema.safeParse({
      email: 'service.tech@example.com',
      password: 'securePassword123',
      displayName: 'Rajesh Sharma',
      phone: '+91 98450 11223',
      role: 'provider',
    });
    expect(valid.success).toBe(true);

    const invalidEmail = registerSchema.safeParse({
      email: 'not-an-email',
      password: '123',
      displayName: 'R',
      phone: '123',
      role: 'customer',
    });
    expect(invalidEmail.success).toBe(false);
  });

  test('Validates booking creation schema', () => {
    const validBooking = bookingCreationSchema.safeParse({
      service_category_id: '11111111-1111-1111-1111-111111111101',
      provider_id: 'f0000000-0000-0000-0000-000000000001',
      address_snapshot: {
        label: 'Home',
        street_address: '104 HAL 2nd stage',
        city: 'Bengaluru',
        postal_code: '560038',
      },
      scheduled_date: '2026-10-25',
      scheduled_slot_start: '10:00:00',
      scheduled_slot_end: '12:00:00',
      problem_description: 'Severe pipe leak under the kitchen sink dripping onto cabinets',
      estimate_amount: 349.0,
      currency: 'INR',
    });
    expect(validBooking.success).toBe(true);

    // Problem description too short (<10 chars)
    const shortDesc = bookingCreationSchema.safeParse({
      service_category_id: '11111111-1111-1111-1111-111111111101',
      provider_id: 'f0000000-0000-0000-0000-000000000001',
      address_snapshot: {
        label: 'Home',
        street_address: '104 HAL',
        city: 'Bengaluru',
        postal_code: '560038',
      },
      scheduled_date: '2026-10-25',
      scheduled_slot_start: '10:00',
      scheduled_slot_end: '12:00',
      problem_description: 'Leaking',
      estimate_amount: 349.0,
    });
    expect(shortDesc.success).toBe(false);
  });

  test('Validates bill totals against line items sum', () => {
    // Valid bill where labor (300) + parts (250) + other (50) == total (600)
    const validBill = bookingBillSchema.safeParse({
      booking_id: '11111111-1111-1111-1111-111111111101',
      labor_amount: 300,
      parts_amount: 250,
      other_charges: 50,
      total_amount: 600,
      currency: 'INR',
      payment_method: 'cash_on_service',
      items: [
        { description: 'Diagnostics & Labor', quantity: 1, unit_price: 300, line_total: 300 },
        { description: 'Replacement Washer Valve', quantity: 1, unit_price: 250, line_total: 250 },
        { description: 'Teflon sealant tape', quantity: 1, unit_price: 50, line_total: 50 },
      ],
    });
    expect(validBill.success).toBe(true);

    // Invalid bill where total does not equal sum
    const invalidBill = bookingBillSchema.safeParse({
      booking_id: '11111111-1111-1111-1111-111111111101',
      labor_amount: 300,
      parts_amount: 250,
      other_charges: 50,
      total_amount: 9999, // Mismatched
      currency: 'INR',
      items: [{ description: 'Diagnostics', quantity: 1, unit_price: 300, line_total: 300 }],
    });
    expect(invalidBill.success).toBe(false);
  });

  test('Validates review rating range 1-5', () => {
    expect(
      reviewSchema.safeParse({
        booking_id: '11111111-1111-1111-1111-111111111101',
        rating: 5,
        comment: 'Great professional service!',
      }).success
    ).toBe(true);

    expect(
      reviewSchema.safeParse({
        booking_id: '11111111-1111-1111-1111-111111111101',
        rating: 6, // Out of bounds
        comment: 'Too high rating',
      }).success
    ).toBe(false);
  });
});
