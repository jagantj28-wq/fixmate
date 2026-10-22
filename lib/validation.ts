/**
 * FixMate Zod Validation Schemas
 * Type-safe input validation for web and mobile workflows
 */

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^[+0-9\s-]+$/, 'Invalid phone number format'),
  role: z.enum(['customer', 'provider']).default('customer'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const customerAddressSchema = z.object({
  label: z.string().min(1, 'Address label is required (e.g. Home, Office)'),
  street_address: z.string().min(5, 'Street address is required'),
  unit_apartment: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  postal_code: z.string().min(4, 'Postal code is required'),
  service_instructions: z.string().optional().nullable(),
  is_default: z.boolean().default(false),
});

export const bookingCreationSchema = z.object({
  service_category_id: z.string().uuid('Invalid service category'),
  provider_id: z.string().uuid('Invalid provider selected'),
  address_id: z.string().uuid().optional().nullable(),
  address_snapshot: z.object({
    label: z.string().min(1),
    street_address: z.string().min(3),
    unit_apartment: z.string().optional().nullable(),
    city: z.string().min(2),
    postal_code: z.string().min(3),
    service_instructions: z.string().optional().nullable(),
  }),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  scheduled_slot_start: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Slot start time must be in HH:MM format'),
  scheduled_slot_end: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Slot end time must be in HH:MM format'),
  problem_description: z
    .string()
    .min(10, 'Please describe the problem in at least 10 characters')
    .max(1000, 'Problem description is too long (max 1000 characters)'),
  estimate_amount: z.number().min(0, 'Estimate amount cannot be negative'),
  currency: z.string().default('INR'),
});

export const billItemSchema = z.object({
  description: z.string().min(2, 'Item description is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
  line_total: z.number().nonnegative('Line total must be non-negative'),
});

export const bookingBillSchema = z
  .object({
    booking_id: z.string().uuid('Invalid booking reference'),
    labor_amount: z.number().nonnegative('Labor amount must be 0 or more'),
    parts_amount: z.number().nonnegative('Parts amount must be 0 or more'),
    other_charges: z.number().nonnegative('Other charges must be 0 or more'),
    total_amount: z.number().positive('Total amount must be greater than 0'),
    currency: z.string().default('INR'),
    notes: z.string().optional().nullable(),
    payment_method: z.enum(['cash_on_service', 'upi_pay', 'pending']).default('cash_on_service'),
    items: z.array(billItemSchema).min(1, 'At least one line item is required'),
  })
  .refine(
    (data) => {
      // Validate that total_amount equals labor + parts + other_charges
      const sum = Math.round((data.labor_amount + data.parts_amount + data.other_charges) * 100) / 100;
      return Math.abs(sum - data.total_amount) < 0.05;
    },
    {
      message: 'Total amount must match the sum of labor, parts, and additional charges',
      path: ['total_amount'],
    }
  );

export const reviewSchema = z.object({
  booking_id: z.string().uuid('Invalid booking reference'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .min(5, 'Review comment must be at least 5 characters')
    .max(500, 'Review cannot exceed 500 characters'),
});

export const issueReportSchema = z.object({
  booking_id: z.string().uuid('Invalid booking reference'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(10, 'Please provide more details about the issue'),
});

export const providerOnboardingSchema = z.object({
  professional_name: z.string().min(3, 'Business or professional name is required'),
  description: z.string().min(15, 'Please provide a clear description of your services and experience'),
  service_area: z.string().min(3, 'Service coverage area is required'),
  category_ids: z.array(z.string().uuid()).min(1, 'Select at least one service category'),
  indicative_price: z.number().min(99, 'Minimum service charge must be at least ₹99'),
  call_out_fee: z.number().min(49, 'Call-out fee must be at least ₹49'),
});
