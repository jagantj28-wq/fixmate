/**
 * FixMate Data Service & Storage Engine
 * Manages all queries, mutations, role authorization, and state transitions
 * Seamlessly switches between live Supabase cloud backend and local sandbox store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppNotification,
  Booking,
  BookingBill,
  BookingStatus,
  BookingStatusHistory,
  CustomerAddress,
  IssueReport,
  Profile,
  ProviderProfile,
  ProviderService,
  Review,
  ServiceCategory,
  UserRole,
} from '@/types/database';
import {
  SEED_ADDRESSES,
  SEED_BOOKINGS,
  SEED_CATEGORIES,
  SEED_NOTIFICATIONS,
  SEED_PROFILES,
  SEED_PROVIDER_SERVICES,
  SEED_PROVIDERS,
  SEED_REVIEWS,
} from './mockData';
import { generateBookingReference } from '@/lib/formatters';
import { validateStateTransition } from '@/lib/stateMachine';

const STORAGE_KEYS = {
  CATEGORIES: '@fixmate_categories',
  PROFILES: '@fixmate_profiles',
  PROVIDERS: '@fixmate_providers',
  PROVIDER_SERVICES: '@fixmate_provider_services',
  ADDRESSES: '@fixmate_addresses',
  BOOKINGS: '@fixmate_bookings',
  BILLS: '@fixmate_bills',
  REVIEWS: '@fixmate_reviews',
  NOTIFICATIONS: '@fixmate_notifications',
  ISSUES: '@fixmate_issues',
  CURRENT_USER_ID: '@fixmate_current_user_id',
};

// Check if live Supabase is configured with actual non-placeholder values
export function isLiveSupabaseConfigured(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes('placeholder') &&
      !url.includes('your-project') &&
      url.startsWith('https://')
  );
}

class FixMateDataStore {
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const categoriesRaw = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!categoriesRaw) {
        // First boot: Seed initial data into AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
        await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
        await AsyncStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(SEED_PROVIDERS));
        await AsyncStorage.setItem(STORAGE_KEYS.PROVIDER_SERVICES, JSON.stringify(SEED_PROVIDER_SERVICES));
        await AsyncStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(SEED_ADDRESSES));
        await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(SEED_BOOKINGS));
        await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
        await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify([]));
        // Default login: Customer
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, SEED_PROFILES[0].id);
      }
      this.initialized = true;
    } catch (e) {
      console.warn('Failed to initialize FixMate local store', e);
      this.initialized = true;
    }
  }

  // -------------------------------------------------------------
  // AUTHENTICATION & PROFILES
  // -------------------------------------------------------------
  public async getCurrentUser(): Promise<Profile | null> {
    await this.initialize();
    const currentId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === currentId) || null;
  }

  public async setCurrentUser(userId: string): Promise<Profile | null> {
    await this.initialize();
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    return this.getCurrentUser();
  }

  public async getProfiles(): Promise<Profile[]> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILES);
    return raw ? JSON.parse(raw) : SEED_PROFILES;
  }

  public async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    await this.initialize();
    const profiles = await this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profile not found');

    // Protect role escalation: clients cannot promote themselves to admin
    const updated: Profile = {
      ...profiles[index],
      ...updates,
      role: profiles[index].role, // keep role unchanged via profile update
      updated_at: new Date().toISOString(),
    };
    profiles[index] = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    return updated;
  }

  // -------------------------------------------------------------
  // SERVICE CATEGORIES
  // -------------------------------------------------------------
  public async getCategories(): Promise<ServiceCategory[]> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return raw ? JSON.parse(raw) : SEED_CATEGORIES;
  }

  public async updateCategory(id: string, updates: Partial<ServiceCategory>): Promise<ServiceCategory> {
    await this.initialize();
    const categories = await this.getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categories[index] = { ...categories[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories[index];
  }

  // -------------------------------------------------------------
  // PROVIDER PROFILES & SERVICES
  // -------------------------------------------------------------
  public async getProviders(filter?: {
    categoryId?: string;
    searchQuery?: string;
    verifiedOnly?: boolean;
  }): Promise<ProviderProfile[]> {
    await this.initialize();
    const rawProviders = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
    const rawServices = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDER_SERVICES);
    const rawProfiles = await AsyncStorage.getItem(STORAGE_KEYS.PROFILES);

    const providers: ProviderProfile[] = rawProviders ? JSON.parse(rawProviders) : SEED_PROVIDERS;
    const services: ProviderService[] = rawServices ? JSON.parse(rawServices) : SEED_PROVIDER_SERVICES;
    const profiles: Profile[] = rawProfiles ? JSON.parse(rawProfiles) : SEED_PROFILES;
    const categories = await this.getCategories();

    // Attach user profile & services
    let result = providers.map((prov) => {
      const user = profiles.find((p) => p.id === prov.user_id);
      const provServices = services
        .filter((s) => s.provider_id === prov.id && s.active)
        .map((s) => ({
          ...s,
          category: categories.find((c) => c.id === s.category_id),
        }));
      return {
        ...prov,
        user,
        services: provServices,
      };
    });

    if (filter?.verifiedOnly !== false) {
      // By default for customers, only show approved providers
      result = result.filter((p) => p.verification_status === 'approved');
    }

    if (filter?.categoryId) {
      result = result.filter((p) => p.services?.some((s) => s.category_id === filter.categoryId));
    }

    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.professional_name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.service_area.toLowerCase().includes(q) ||
          p.services?.some((s) => s.category?.name.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public async getProviderById(id: string): Promise<ProviderProfile | null> {
    const list = await this.getProviders({ verifiedOnly: false });
    return list.find((p) => p.id === id || p.user_id === id) || null;
  }

  public async updateProviderVerification(
    providerId: string,
    status: 'approved' | 'rejected' | 'pending'
  ): Promise<ProviderProfile> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
    const providers: ProviderProfile[] = raw ? JSON.parse(raw) : SEED_PROVIDERS;
    const index = providers.findIndex((p) => p.id === providerId);
    if (index === -1) throw new Error('Provider not found');

    providers[index].verification_status = status;
    providers[index].updated_at = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
    return providers[index];
  }

  public async submitProviderApplication(data: {
    userId: string;
    professional_name: string;
    description: string;
    service_area: string;
    category_ids: string[];
    indicative_price: number;
    call_out_fee: number;
  }): Promise<ProviderProfile> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
    const providers: ProviderProfile[] = raw ? JSON.parse(raw) : SEED_PROVIDERS;

    const newProvider: ProviderProfile = {
      id: `f0000000-0000-0000-0000-00000000000${providers.length + 1}`,
      user_id: data.userId,
      professional_name: data.professional_name,
      description: data.description,
      verification_status: 'pending',
      service_area: data.service_area,
      average_rating: 5.0,
      total_reviews: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    providers.push(newProvider);
    await AsyncStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));

    // Save services
    const rawServices = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDER_SERVICES);
    const services: ProviderService[] = rawServices ? JSON.parse(rawServices) : SEED_PROVIDER_SERVICES;

    for (const catId of data.category_ids) {
      services.push({
        id: `ps-${Date.now()}-${catId.slice(0, 4)}`,
        provider_id: newProvider.id,
        category_id: catId,
        indicative_price: data.indicative_price,
        call_out_fee: data.call_out_fee,
        price_description: 'Standard diagnostic call-out with inspection',
        active: true,
        created_at: new Date().toISOString(),
      });
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PROVIDER_SERVICES, JSON.stringify(services));
    return newProvider;
  }

  // -------------------------------------------------------------
  // CUSTOMER ADDRESSES
  // -------------------------------------------------------------
  public async getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ADDRESSES);
    const addresses: CustomerAddress[] = raw ? JSON.parse(raw) : SEED_ADDRESSES;
    return addresses.filter((a) => a.customer_id === customerId);
  }

  public async saveCustomerAddress(
    customerId: string,
    address: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>
  ): Promise<CustomerAddress> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ADDRESSES);
    const addresses: CustomerAddress[] = raw ? JSON.parse(raw) : SEED_ADDRESSES;

    if (address.is_default) {
      addresses.forEach((a) => {
        if (a.customer_id === customerId) a.is_default = false;
      });
    }

    const newAddress: CustomerAddress = {
      ...address,
      id: `addr-${Date.now()}`,
      customer_id: customerId,
      created_at: new Date().toISOString(),
    };

    addresses.push(newAddress);
    await AsyncStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
    return newAddress;
  }

  // -------------------------------------------------------------
  // BOOKINGS & WORKFLOW ENGINE
  // -------------------------------------------------------------
  public async getBookings(filter?: {
    customerId?: string;
    providerUserId?: string;
    status?: BookingStatus;
  }): Promise<Booking[]> {
    await this.initialize();
    const rawBookings = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
    let bookings: Booking[] = rawBookings ? JSON.parse(rawBookings) : SEED_BOOKINGS;

    const categories = await this.getCategories();
    const providers = await this.getProviders({ verifiedOnly: false });
    const profiles = await this.getProfiles();
    const rawBills = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    const bills: BookingBill[] = rawBills ? JSON.parse(rawBills) : [];
    const reviews = await this.getReviews();

    // Populate relations
    bookings = bookings.map((b) => ({
      ...b,
      service_category: categories.find((c) => c.id === b.service_category_id),
      provider: providers.find((p) => p.id === b.provider_id),
      customer: profiles.find((p) => p.id === b.customer_id),
      bill: bills.find((bill) => bill.booking_id === b.id),
      review: reviews.find((r) => r.booking_id === b.id),
    }));

    if (filter?.customerId) {
      bookings = bookings.filter((b) => b.customer_id === filter.customerId);
    }
    if (filter?.providerUserId) {
      bookings = bookings.filter((b) => b.provider?.user_id === filter.providerUserId);
    }
    if (filter?.status) {
      bookings = bookings.filter((b) => b.status === filter.status);
    }

    return bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async getBookingById(bookingId: string): Promise<Booking | null> {
    const list = await this.getBookings();
    return list.find((b) => b.id === bookingId || b.booking_reference === bookingId) || null;
  }

  public async createBooking(data: {
    customerId: string;
    providerId: string;
    serviceCategoryId: string;
    addressId?: string | null;
    addressSnapshot: Booking['address_snapshot'];
    scheduledDate: string;
    scheduledSlotStart: string;
    scheduledSlotEnd: string;
    problemDescription: string;
    estimateAmount: number;
    currency?: string;
  }): Promise<Booking> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const bookings: Booking[] = raw ? JSON.parse(raw) : SEED_BOOKINGS;

    const newBooking: Booking = {
      id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      booking_reference: generateBookingReference(),
      customer_id: data.customerId,
      provider_id: data.providerId,
      service_category_id: data.serviceCategoryId,
      address_id: data.addressId || null,
      address_snapshot: data.addressSnapshot,
      scheduled_date: data.scheduledDate,
      scheduled_slot_start: data.scheduledSlotStart,
      scheduled_slot_end: data.scheduledSlotEnd,
      problem_description: data.problemDescription,
      status: 'pending',
      estimate_amount: data.estimateAmount,
      currency: data.currency || 'INR',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    bookings.unshift(newBooking);
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Send notification to provider
    const provider = await this.getProviderById(data.providerId);
    if (provider) {
      await this.sendNotification({
        recipient_user_id: provider.user_id,
        type: 'new_booking_request',
        title: 'New Service Request',
        body: `New request #${newBooking.booking_reference} for ${newBooking.scheduled_date}. Review details.`,
        related_booking_id: newBooking.id,
      });
    }

    return newBooking;
  }

  public async updateBookingStatus(params: {
    bookingId: string;
    newStatus: BookingStatus;
    actorUserId: string;
    actorRole: UserRole;
    reason?: string;
  }): Promise<Booking> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
    const bookings: Booking[] = raw ? JSON.parse(raw) : SEED_BOOKINGS;
    const index = bookings.findIndex((b) => b.id === params.bookingId);
    if (index === -1) throw new Error('Booking not found');

    const booking = bookings[index];
    const provider = await this.getProviderById(booking.provider_id);

    // Validate state transition through the central state machine
    const validation = validateStateTransition({
      bookingId: booking.id,
      currentStatus: booking.status,
      newStatus: params.newStatus,
      actorRole: params.actorRole,
      actorUserId: params.actorUserId,
      assignedProviderUserId: provider?.user_id,
      bookingCustomerId: booking.customer_id,
    });

    if (!validation.allowed) {
      throw new Error(validation.reason || 'Invalid state transition');
    }

    booking.status = params.newStatus;
    booking.updated_at = new Date().toISOString();
    if (params.newStatus === 'cancelled') {
      booking.cancellation_reason = params.reason || 'Cancelled by user';
      booking.cancelled_by_role = params.actorRole;
    }

    bookings[index] = booking;
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Create notifications for the other party
    if (params.actorRole === 'provider') {
      const messages: Record<string, string> = {
        accepted: 'Your booking has been accepted! The technician will arrive during the scheduled window.',
        rejected: 'Your booking request was declined by the provider. Please select another technician.',
        in_progress: 'Your service visit is now in progress. Technician is on-site.',
        completed: 'Your service has been completed! View your itemized bill and review your service.',
      };
      await this.sendNotification({
        recipient_user_id: booking.customer_id,
        type: `booking_${params.newStatus}`,
        title: `Service #${booking.booking_reference}: ${params.newStatus.toUpperCase()}`,
        body: messages[params.newStatus] || `Booking status updated to ${params.newStatus}`,
        related_booking_id: booking.id,
      });
    } else if (params.actorRole === 'customer' && provider) {
      await this.sendNotification({
        recipient_user_id: provider.user_id,
        type: `booking_${params.newStatus}`,
        title: `Booking #${booking.booking_reference} Update`,
        body: `Customer ${params.newStatus === 'cancelled' ? 'cancelled' : 'updated'} booking #${booking.booking_reference}.`,
        related_booking_id: booking.id,
      });
    }

    return booking;
  }

  // -------------------------------------------------------------
  // BILLING & INVOICING
  // -------------------------------------------------------------
  public async submitBill(bill: Omit<BookingBill, 'id' | 'submitted_at'>): Promise<BookingBill> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.BILLS);
    const bills: BookingBill[] = raw ? JSON.parse(raw) : [];

    const existingIndex = bills.findIndex((b) => b.booking_id === bill.booking_id);
    const newBill: BookingBill = {
      ...bill,
      id: `bill-${Date.now()}`,
      submitted_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      bills[existingIndex] = newBill;
    } else {
      bills.push(newBill);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    return newBill;
  }

  // -------------------------------------------------------------
  // REVIEWS
  // -------------------------------------------------------------
  public async getReviews(providerId?: string): Promise<Review[]> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = raw ? JSON.parse(raw) : SEED_REVIEWS;
    const profiles = await this.getProfiles();

    const populated = reviews.map((r) => ({
      ...r,
      customer: profiles.find((p) => p.id === r.customer_id),
    }));

    if (providerId) {
      return populated.filter((r) => r.provider_id === providerId && r.moderation_status === 'published');
    }
    return populated;
  }

  public async submitReview(data: {
    bookingId: string;
    customerId: string;
    providerId: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = raw ? JSON.parse(raw) : SEED_REVIEWS;

    // Enforce 1 review per booking
    if (reviews.some((r) => r.booking_id === data.bookingId)) {
      throw new Error('A review has already been submitted for this booking');
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      booking_id: data.bookingId,
      customer_id: data.customerId,
      provider_id: data.providerId,
      rating: data.rating,
      comment: data.comment,
      moderation_status: 'published',
      created_at: new Date().toISOString(),
    };

    reviews.push(newReview);
    await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Update provider's average rating
    const providerReviews = reviews.filter((r) => r.provider_id === data.providerId);
    const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;

    const rawProviders = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDERS);
    const providers: ProviderProfile[] = rawProviders ? JSON.parse(rawProviders) : SEED_PROVIDERS;
    const pIdx = providers.findIndex((p) => p.id === data.providerId);
    if (pIdx >= 0) {
      providers[pIdx].average_rating = Math.round(avg * 100) / 100;
      providers[pIdx].total_reviews = providerReviews.length;
      await AsyncStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
    }

    return newReview;
  }

  public async moderateReview(reviewId: string, status: 'published' | 'hidden' | 'flagged'): Promise<Review> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REVIEWS);
    const reviews: Review[] = raw ? JSON.parse(raw) : SEED_REVIEWS;
    const index = reviews.findIndex((r) => r.id === reviewId);
    if (index === -1) throw new Error('Review not found');

    reviews[index].moderation_status = status;
    await AsyncStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    return reviews[index];
  }

  // -------------------------------------------------------------
  // NOTIFICATIONS
  // -------------------------------------------------------------
  public async getNotifications(userId: string): Promise<AppNotification[]> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const notifications: AppNotification[] = raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
    return notifications
      .filter((n) => n.recipient_user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async markNotificationRead(id: string): Promise<void> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const notifications: AppNotification[] = raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;
    const item = notifications.find((n) => n.id === id);
    if (item) {
      item.read_at = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
  }

  public async sendNotification(data: Omit<AppNotification, 'id' | 'read_at' | 'created_at'>): Promise<AppNotification> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const notifications: AppNotification[] = raw ? JSON.parse(raw) : SEED_NOTIFICATIONS;

    const notif: AppNotification = {
      ...data,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    notifications.unshift(notif);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    return notif;
  }

  // -------------------------------------------------------------
  // ISSUE REPORTS & DISPUTES
  // -------------------------------------------------------------
  public async reportIssue(data: {
    bookingId: string;
    reporterUserId: string;
    category: string;
    description: string;
  }): Promise<IssueReport> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ISSUES);
    const issues: IssueReport[] = raw ? JSON.parse(raw) : [];

    const newIssue: IssueReport = {
      id: `issue-${Date.now()}`,
      booking_id: data.bookingId,
      reporter_user_id: data.reporterUserId,
      category: data.category,
      description: data.description,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    issues.unshift(newIssue);
    await AsyncStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));

    // Transition booking to disputed if not already
    const bookings = await this.getBookings();
    const b = bookings.find((item) => item.id === data.bookingId);
    if (b && b.status === 'completed') {
      await this.updateBookingStatus({
        bookingId: b.id,
        newStatus: 'disputed',
        actorRole: 'customer',
        actorUserId: data.reporterUserId,
        reason: data.description,
      });
    }

    return newIssue;
  }

  public async getIssues(): Promise<IssueReport[]> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ISSUES);
    const issues: IssueReport[] = raw ? JSON.parse(raw) : [];
    const profiles = await this.getProfiles();
    return issues.map((i) => ({
      ...i,
      reporter: profiles.find((p) => p.id === i.reporter_user_id),
    }));
  }

  public async resolveIssue(issueId: string, resolutionNotes: string): Promise<IssueReport> {
    await this.initialize();
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ISSUES);
    const issues: IssueReport[] = raw ? JSON.parse(raw) : [];
    const index = issues.findIndex((i) => i.id === issueId);
    if (index === -1) throw new Error('Issue not found');

    issues[index].status = 'resolved';
    issues[index].resolution_notes = resolutionNotes;
    issues[index].updated_at = new Date().toISOString();

    await AsyncStorage.setItem(STORAGE_KEYS.ISSUES, JSON.stringify(issues));
    return issues[index];
  }

  // -------------------------------------------------------------
  // ADMIN METRICS
  // -------------------------------------------------------------
  public async getAdminMetrics() {
    await this.initialize();
    const bookings = await this.getBookings();
    const providers = await this.getProviders({ verifiedOnly: false });
    const issues = await this.getIssues();
    const categories = await this.getCategories();

    const pendingProviders = providers.filter((p) => p.verification_status === 'pending');
    const openDisputes = issues.filter((i) => i.status === 'open' || i.status === 'under_review');
    const activeBookings = bookings.filter((b) => ['pending', 'accepted', 'in_progress'].includes(b.status));
    const completedBookings = bookings.filter((b) => b.status === 'completed');

    const totalRevenueINR = completedBookings.reduce((sum, b) => sum + (b.bill?.total_amount || b.estimate_amount || 0), 0);

    return {
      totalBookings: bookings.length,
      activeBookingsCount: activeBookings.length,
      completedBookingsCount: completedBookings.length,
      totalProviders: providers.length,
      pendingProvidersCount: pendingProviders.length,
      openDisputesCount: openDisputes.length,
      activeCategoriesCount: categories.filter((c) => c.active).length,
      totalRevenueINR,
    };
  }
}

export const dataStore = new FixMateDataStore();
