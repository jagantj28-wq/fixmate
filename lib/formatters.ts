/**
 * FixMate Formatting and Monetary Calculation Utilities
 */

import { BillItem } from '@/types/database';

/**
 * Formats a monetary amount into standard Indian Rupee (INR) representation
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'INR'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  // Format with INR symbol
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);

  return formatted;
}

/**
 * Formats a YYYY-MM-DD date string into human readable editorial date
 * e.g., "Thursday, 24 Oct 2026"
 */
export function formatBookingDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats slot time "09:00:00" -> "9:00 AM"
 */
export function formatSlotTime(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parts[1] || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
}

/**
 * Formats full slot range e.g. "9:00 AM – 11:00 AM"
 */
export function formatSlotRange(start: string, end: string): string {
  return `${formatSlotTime(start)} – ${formatSlotTime(end)}`;
}

/**
 * Decimal-safe line item and bill total calculation
 */
export function calculateBillTotals(
  laborAmount: number,
  partsAmount: number,
  otherCharges: number,
  items: Array<{ quantity: number; unit_price: number }>
): {
  itemsTotal: number;
  totalAmount: number;
} {
  // Safe integer cents calculation to avoid floating point precision issues
  const itemsTotalCents = items.reduce((acc, item) => {
    const qty = Math.max(0, item.quantity);
    const price = Math.max(0, item.unit_price);
    const lineCents = Math.round(qty * price * 100);
    return acc + lineCents;
  }, 0);

  const laborCents = Math.round(Math.max(0, laborAmount) * 100);
  const partsCents = Math.round(Math.max(0, partsAmount) * 100);
  const otherCents = Math.round(Math.max(0, otherCharges) * 100);

  const totalCents = laborCents + partsCents + otherCents;

  return {
    itemsTotal: itemsTotalCents / 100,
    totalAmount: totalCents / 100,
  };
}

/**
 * Generates an architectural field-ticket serial number: FIX-YEAR-RANDOM
 */
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FIX-${year}-${random}`;
}
