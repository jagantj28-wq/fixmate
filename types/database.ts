/**
 * FixMate Database and Business Entity Types
 */

export type UserRole = 'customer' | 'provider' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export type VerificationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'in_progress'
  | 'completed'
  | 'disputed';

export type PaymentMethod = 'cash_on_service' | 'upi_pay' | 'pending';
export type PaymentStatus = 'unpaid' | 'paid';

export type ModerationStatus = 'published' | 'flagged' | 'hidden';

export interface Profile {
  id: string;
  display_name: string;
  phone: string | null;
  avatar_path: string | null;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  professional_name: string;
  description: string | null;
  verification_status: VerificationStatus;
  service_area: string;
  average_rating: number;
  total_reviews: number;
  application_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // joined fields
  user?: Profile;
  services?: ProviderService[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_identifier: string;
  active: boolean;
  base_call_out_fee: number;
  created_at: string;
}

export interface ProviderService {
  id: string;
  provider_id: string;
  category_id: string;
  indicative_price: number;
  call_out_fee: number;
  price_description: string | null;
  active: boolean;
  created_at: string;
  // joined fields
  category?: ServiceCategory;
}

export interface ProviderAvailability {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
  specific_date?: string | null;
  created_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  street_address: string;
  unit_apartment: string | null;
  city: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  service_instructions: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  customer_id: string;
  provider_id: string;
  service_category_id: string;
  address_id: string | null;
  address_snapshot: {
    label: string;
    street_address: string;
    unit_apartment?: string | null;
    city: string;
    postal_code: string;
    service_instructions?: string | null;
  };
  scheduled_date: string;
  scheduled_slot_start: string;
  scheduled_slot_end: string;
  problem_description: string;
  status: BookingStatus;
  estimate_amount: number;
  currency: string;
  cancellation_reason?: string | null;
  cancelled_by_role?: UserRole | null;
  created_at: string;
  updated_at: string;
  // joined relations
  customer?: Profile;
  provider?: ProviderProfile;
  service_category?: ServiceCategory;
  bill?: BookingBill;
  status_history?: BookingStatusHistory[];
  review?: Review;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  previous_status: BookingStatus | null;
  new_status: BookingStatus;
  actor_user_id: string;
  actor_role: string;
  reason?: string | null;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface BookingBill {
  id: string;
  booking_id: string;
  labor_amount: number;
  parts_amount: number;
  other_charges: number;
  total_amount: number;
  currency: string;
  notes?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  submitted_at: string;
  items?: BillItem[];
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  moderation_status: ModerationStatus;
  created_at: string;
  customer?: Profile;
}

export interface AppNotification {
  id: string;
  recipient_user_id: string;
  type: string;
  title: string;
  body: string;
  related_booking_id?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface IssueReport {
  id: string;
  booking_id: string;
  reporter_user_id: string;
  category: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolution_notes?: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  actor?: Profile;
}
