-- ==============================================================================
-- FIXMATE: SEED DATA (Fictional Seed Data for Demo & Development)
-- ==============================================================================

-- 1. SERVICE CATEGORIES
INSERT INTO public.service_categories (id, name, slug, description, icon_identifier, active, base_call_out_fee)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'Plumbing Diagnostics & Repair', 'plumbing', 'Pipes, leaks, drain unclogging, bathroom fittings, pressure relief & water heater repairs.', 'tool', true, 249.00),
    ('11111111-1111-1111-1111-111111111102', 'Electrical Services & Wiring', 'electrical', 'Short circuits, MCB trip diagnostics, switchboard repair, fan installation, heavy appliance wiring.', 'zap', true, 299.00),
    ('11111111-1111-1111-1111-111111111103', 'Appliance Diagnostics & Fix', 'appliances', 'Washing machines, microwave ovens, refrigerators, chimney maintenance & fault repair.', 'cpu', true, 349.00),
    ('11111111-1111-1111-1111-111111111104', 'Air Conditioning & HVAC Service', 'ac-service', 'AC deep jet cleaning, gas pressure recharge, compressor check, pipe leak sealing.', 'wind', true, 399.00),
    ('11111111-1111-1111-1111-111111111105', 'Carpentry & Wood Restoration', 'carpentry', 'Door alignment, lock replacements, modular kitchen hinge adjustments, furniture repairs.', 'package', true, 249.00),
    ('11111111-1111-1111-1111-111111111106', 'Deep Cleaning & Sanitization', 'cleaning', 'Full bathroom scrubbing, kitchen de-greasing, balcony pressure washing, intensive sanitation.', 'sparkles', true, 499.00)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    base_call_out_fee = EXCLUDED.base_call_out_fee;

-- 2. DEMO PROFILES (UUIDs for standard seed users)
-- Customers:
--   c1: Aarav Sharma (customer)
-- Providers:
--   p1: Rajesh Kumar (Master Plumber)
--   p2: Priya Sundaram (Certified High-Voltage Electrician)
--   p3: Arjun Verma (Appliance Tech)
--   p4: Devendra Patel (HVAC & AC Specialist)
-- Admin:
--   a1: FixMate Admin Ops

INSERT INTO public.profiles (id, display_name, phone, role, account_status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Aarav Sharma', '+91 98765 43210', 'customer', 'active'),
    ('p0000000-0000-0000-0000-000000000001', 'Rajesh Kumar', '+91 98450 11223', 'provider', 'active'),
    ('p0000000-0000-0000-0000-000000000002', 'Priya Sundaram', '+91 97412 33445', 'provider', 'active'),
    ('p0000000-0000-0000-0000-000000000003', 'Arjun Verma', '+91 96112 55667', 'provider', 'active'),
    ('p0000000-0000-0000-0000-000000000004', 'Devendra Patel', '+91 95350 77889', 'provider', 'active'),
    ('a0000000-0000-0000-0000-000000000001', 'FixMate Platform Admin', '+91 80000 99999', 'admin', 'active')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

-- 3. PROVIDER PROFILES
INSERT INTO public.provider_profiles (id, user_id, professional_name, description, verification_status, service_area, average_rating, total_reviews)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Kumar Plumbing Works', 'Licensed master plumber with 14 years of commercial & residential pipe diagnostics. Specializes in concealed leakage detection and pressurized water lines.', 'approved', 'Indiranagar, Koramangala, Domlur', 4.92, 48),
    ('f0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'Priya Electrical Engineering', 'Govt-certified Wireman & electrical technician. Precision troubleshooting for recurring breaker trips, earthing faults, and heavy inverter setups.', 'approved', 'HSR Layout, BTM, Jayanagar', 4.95, 62),
    ('f0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'Verma Appliance Solutions', 'Factory-trained specialist for front-load washers, frost-free refrigerators, and auto-clean chimneys. Genuine OEM component sourcing.', 'approved', 'Whitefield, Marathahalli, Bellandur', 4.86, 37),
    ('f0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000004', 'Patel Climate Care', 'HVAC diagnostics, eco-friendly refrigerant recovery, and high-pressure jet washing for split and inverter AC units.', 'pending', 'MG Road, Richmond Town, Ulsoor', 5.00, 3)
ON CONFLICT (id) DO NOTHING;

-- 4. PROVIDER SERVICES
INSERT INTO public.provider_services (provider_id, category_id, indicative_price, call_out_fee, price_description, active)
VALUES
    ('f0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111101', 349.00, 199.00, 'Diagnostic call-out fee is ₹199. Minor repairs include first 30 mins labor.', true),
    ('f0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111102', 399.00, 249.00, 'Call-out includes full board safety check and earthing voltage testing.', true),
    ('f0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111103', 449.00, 299.00, 'Comprehensive multimeter diagnostics. Parts billed transparently at MRP.', true),
    ('f0000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111104', 599.00, 349.00, 'Includes temperature differential measurement and coil coil-clean check.', true)
ON CONFLICT DO NOTHING;

-- 5. CUSTOMER ADDRESSES
INSERT INTO public.customer_addresses (id, customer_id, label, street_address, unit_apartment, city, postal_code, is_default, service_instructions)
VALUES
    ('a1111111-1111-1111-1111-111111111101', 'c0000000-0000-0000-0000-000000000001', 'Home (Indiranagar)', '104, 12th Main Road, HAL 2nd Stage', 'Flat 3B, Palm Grove Residences', 'Bengaluru', '560038', true, 'Ring bell 3B. Gate security code is 4492.'),
    ('a1111111-1111-1111-1111-111111111102', 'c0000000-0000-0000-0000-000000000001', 'Studio / Workshop', '44, CMH Road, Near Metro Pillar 68', '2nd Floor Work Studio', 'Bengaluru', '560038', false, 'Service lift available on the rear corridor.')
ON CONFLICT DO NOTHING;
