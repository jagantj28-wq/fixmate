# FixMate — Full-Stack Home Services Marketplace

> **"Home services, without the guesswork."**

FixMate is a mobile-first, full-stack platform connecting homeowners and apartment residents with verified local trade specialists for plumbing, electrical diagnostics, appliance repairs, air conditioning servicing, carpentry, and deep sanitation.

The product implements **FixMate Fieldnotes** — a signature, editorial-style mobile UI/UX system inspired by architectural field notes, technical logbooks, modern utility brands, and physical printed service tickets.

---

## 🎨 1. The "FixMate Fieldnotes" Signature System

The application intentionally moves away from generic, rounded white-card SaaS templates in favor of a utilitarian, editorial identity:

- **Brand Palette Tokens**:
  - `Forest Green` (`#174D3A`): Primary action controls, active indicators, and brand marks.
  - `Deep Evergreen` (`#10372C`): Provider & admin field panels, high-contrast surfaces.
  - `Warm Ivory` (`#F7F5EE`): Primary app canvas.
  - `Paper White` (`#FFFEFA`): Physical ticket cards and form inputs.
  - `Citrus Lime` (`#D7F36A`): Tactical highlight accents, live status badges, verified tech mark.
  - `Charcoal` (`#242821`): High-legibility technical typography.
  - `Muted Gray-Green` (`#747B70`): Technical annotations, boundaries, and metadata.
  - `Subtle Border` (`#E5E5D9`): Perforated ticket lines and divider boundaries.
- **Typographic Pairings**: Editorial serif for headlines, clean geometric sans-serif for controls and pricing, and monospaced typography for serial work order references (`FIX-2026-XXXX`).
- **Signature Components**:
  - `BookingTicket`: Styled like a physical service work order with notched perforations, appointment times, provider badge, and status stamp.
  - `ServiceTimeline`: Annotated milestones tracking real progress (`Request Logged` → `Technician Confirmed` → `Work in Progress` → `Service Completed`).
  - `EstimatePanel`: Transparent breakdown distinguishing diagnostic call-out fee, labor, and parts at MRP.
  - `VerificationMark`: Understated mark displayed strictly for approved providers.

---

## 🚀 2. System Architecture & Tech Stack

```
fixmate/
├── app/                              # Expo Router file-based routes
│   ├── (tabs)/
│   │   ├── index.tsx                 # Signature Customer Home Screen
│   │   ├── explore.tsx               # Service discovery & search
│   │   ├── bookings.tsx              # Active tickets & service history
│   │   └── profile.tsx               # User account, addresses & role switcher
│   ├── book.tsx                      # Multi-step signature booking wizard
│   ├── booking/[id].tsx              # Work order details, timeline & invoicing
│   ├── provider/[id].tsx             # Technician field profile & reviews
│   ├── provider-workspace.tsx        # Dedicated technician field tool
│   ├── admin-dashboard.tsx           # Platform operations, approvals & disputes
│   ├── modal.tsx                     # About & platform guarantees
│   └── _layout.tsx                   # Root navigation & theme provider
├── components/
│   └── fieldnotes/                   # Reusable FixMate Fieldnotes components
│       ├── BookingTicket.tsx
│       ├── EmptyStateIllustration.tsx
│       ├── EstimatePanel.tsx
│       ├── FieldButton.tsx
│       ├── FieldInput.tsx
│       ├── FieldStatus.tsx
│       ├── PriceDisplay.tsx
│       ├── ProviderPortrait.tsx
│       ├── SectionEyebrow.tsx
│       ├── ServiceTile.tsx
│       ├── ServiceTimeline.tsx
│       └── VerificationMark.tsx
├── constants/
│   ├── Colors.ts                     # Fieldnotes color palette & semantic tokens
│   └── Theme.ts                      # Spacing, typography, radii & elevation
├── contexts/
│   └── AuthContext.tsx               # User sessions & instant role switching
├── lib/
│   ├── formatters.ts                 # INR currency, dates & booking serial generator
│   ├── stateMachine.ts               # Strict role-authorized state transitions
│   └── validation.ts                 # Zod validation schemas
├── services/
│   ├── dataStore.ts                  # Unified data layer (Supabase / local sandbox)
│   └── mockData.ts                   # Realistic seed data for Bangalore service zone
├── supabase/
│   ├── migrations/
│   │   ├── 20261022000000_initial_schema.sql
│   │   ├── 20261022000001_rls_policies.sql
│   │   └── 20261022000002_functions_and_triggers.sql
│   └── seed.sql                      # Fictional service categories & providers
├── __tests__/                        # Automated test suites
│   ├── formatters.test.ts
│   ├── stateMachine.test.ts
│   └── validation.test.ts
├── .env.example
├── jest.config.js
└── package.json
```

---

## 🔒 3. User Roles & Booking State Machine

### User Roles
1. **Customer**:
   - Discovers trade specialists in their neighborhood.
   - Books appointments with problem descriptions and preferred timeslots.
   - Tracks live service work orders with the `ServiceTimeline`.
   - Submits reviews for completed bookings (enforced: 1 review per booking).
   - Can cancel eligible bookings prior to technician dispatch.
2. **Service Provider**:
   - Practical field tool displaying daily assignments.
   - Incoming requests requiring immediate Accept / Decline.
   - Updates status from `accepted` → `in_progress`.
   - Submits an itemized bill (Labor + Parts + Surcharges) to mark work complete.
   - Real-time earnings summary.
3. **Platform Administrator**:
   - Platform operational overview (Gross service value, active orders, open disputes).
   - Background verification queue (Approve or Reject technician applications).
   - Service category manager (Enable/Disable categories, set base call-out rates).
   - Dispute resolution console with warranty rework tracking.

### State Transitions Matrix
```
[pending]      ──(Provider accepts)──> [accepted]
[pending]      ──(Provider rejects)──> [rejected] (Terminal)
[pending]      ──(Customer cancels)──> [cancelled] (Terminal)
[accepted]     ──(Provider starts)───> [in_progress]
[accepted]     ──(Customer cancels)──> [cancelled] (Subject to 2-hr window)
[in_progress]  ──(Provider bills)────> [completed]
[completed]    ──(Customer disputes)─> [disputed] (Under admin review)
```

---

## 🛠️ 4. Quick Start & Running the Project

### Prerequisites
- Node.js LTS (v20 or v24)
- npm or npx
- Expo CLI

### 1. Installation
```powershell
npm.cmd install
```

### 2. Run Tests
The automated test suite verifies Zod schema validations, state transitions, decimal-safe bill totals, and cancellation policies:
```powershell
npm.cmd test
```

### 3. Start Development Server
```powershell
npm.cmd start
```
- Press `w` in terminal to run the interactive web preview.
- Press `a` to open on a connected Android device / emulator.
- Press `i` to open in iOS simulator.

### 4. Running on an Android Device via Expo Go
1. Install **Expo Go** from the Google Play Store on your Android device.
2. Ensure your phone and development computer are on the same Wi-Fi network.
3. Start the project with LAN mode:
   ```powershell
   npx.cmd expo start --tunnel
   ```
4. Scan the terminal QR code with the Expo Go camera to launch FixMate directly!

---

## 🌐 5. Supabase Database Configuration

The application includes full SQL migration scripts in `supabase/migrations/`:

1. Create a new project on [Supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Execute the migration scripts in order:
   - `supabase/migrations/20261022000000_initial_schema.sql` (Creates all tables, constraints, foreign keys, and indexes)
   - `supabase/migrations/20261022000001_rls_policies.sql` (Enables and configures Row Level Security)
   - `supabase/migrations/20261022000002_functions_and_triggers.sql` (Triggers for profiles sync and review ratings)
   - `supabase/seed.sql` (Loads initial Bangalore categories and demo providers)
4. Copy your project credentials into `.env`:
   ```ini
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
*Note: If no Supabase URL is supplied, FixMate runs seamlessly in an isolated, persistent local sandbox mode with full state machine support!*

---

## 🧪 6. Testing & Role Verification Workflow

FixMate includes a built-in **Test Role Switcher** on the Profile tab (`/(tabs)/profile`):
1. **As Customer (`Aarav Sharma`)**:
   - Tap any category on Home (e.g., Plumbing).
   - Complete the 5-step service order wizard.
   - View the generated physical ticket with reference `FIX-2026-XXXX`.
2. **Switch to Provider (`Rajesh Kumar`)**:
   - Open Profile → Select `Rajesh Kumar (ROLE: PROVIDER)`.
   - Open **Provider Field Tool**.
   - Inspect the incoming dispatch request. Click **ACCEPT ASSIGNMENT**.
   - Click **ARRIVED (START WORK)** to update to `in_progress`.
   - Click **ITEMIZE BILL & COMPLETE** → Fill diagnostic and parts lines → Submit.
3. **Switch to Admin (`FixMate Ops Admin`)**:
   - Open Profile → Select `FixMate Ops Admin (ROLE: ADMIN)`.
   - Open **Platform Operations**.
   - Review platform metrics, approve pending provider applications, and inspect the dispute queue.

---

## 🛡️ 7. Security & Row Level Security (RLS)

- **Role Protection**: Roles (`customer`, `provider`, `admin`) are strictly server-controlled and protected from client tampering.
- **Address Privacy**: Customers can only view and manage their own saved addresses.
- **Job Authorization**: Only the assigned provider or platform admin can accept, reject, or mark work complete.
- **Review Integrity**: Reviews can only be submitted for completed service visits, with a strict unique constraint enforcing one review per booking.
- **Secrets Management**: No secret service-role keys are shipped in the client bundle. Only standard anonymous client keys are used.
