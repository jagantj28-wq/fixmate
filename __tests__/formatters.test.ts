import {
  calculateBillTotals,
  formatBookingDate,
  formatCurrency,
  formatSlotRange,
  formatSlotTime,
  generateBookingReference,
} from '@/lib/formatters';

describe('FixMate Formatting & Calculations', () => {
  test('Formats INR currency properly', () => {
    const formatted = formatCurrency(349);
    expect(formatted).toContain('349');
    expect(formatted).toMatch(/₹/);

    expect(formatCurrency(0)).toContain('0');
    expect(formatCurrency(null)).toContain('0');
  });

  test('Calculates decimal-safe bill totals', () => {
    const result = calculateBillTotals(299.5, 149.25, 50.25, [
      { quantity: 1, unit_price: 299.5 },
      { quantity: 2, unit_price: 74.625 },
    ]);
    expect(result.totalAmount).toBe(499);
  });

  test('Formats booking dates into readable strings', () => {
    const formatted = formatBookingDate('2026-10-24');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('24');
  });

  test('Formats time slots', () => {
    expect(formatSlotTime('09:00:00')).toBe('9:00 AM');
    expect(formatSlotTime('14:30:00')).toBe('2:30 PM');
    expect(formatSlotRange('10:00:00', '12:00:00')).toBe('10:00 AM – 12:00 PM');
  });

  test('Generates serial booking reference', () => {
    const ref = generateBookingReference();
    expect(ref).toMatch(/^FIX-\d{4}-\d{4}$/);
  });
});
