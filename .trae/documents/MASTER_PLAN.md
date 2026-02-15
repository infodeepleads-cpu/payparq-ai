# PayParq.ai - Master Execution Plan (Phase 1 Focused)

## Phase 1: Foundation & Core Operations
**Goal:** Deliver a fully working system (Dashboard + Scanner + Stripe Flow) without AI/LPR/WhatsApp complexity.

### 1. Architecture & Infrastructure
- [x] **Monorepo Structure**: `apps/admin-dashboard`, `apps/mobile-scanner`, `apps/user-web-app`.
- [x] **Database Schema**: Supabase tables (`parking_sessions`, `lots`, `scans`, `violations`, `payouts`) with RLS.
- [ ] **Storage**: Cloudflare R2 setup for image storage (WebP compressed).
- [x] **Stripe Integration**: Webhook handler to sync payments to Supabase `parking_sessions` (`api/webhooks/stripe`).

### 2. Admin Dashboard (Web - Next.js)
- [x] **Auth System**:
    - Dedicated Login Page (`/login`).
    - Role-based redirect (Admin → Dashboard, Officer → Scanner/Limited View) - *Mocked*.
- [x] **Core Layout**:
    - **Sidebar** (Tactical Navigation).
    - **Primary Action Hub** (Manual actions).
- [ ] **Realtime Dashboard**:
    - Subscription to `parking_sessions` - *Pending Integration*.
    - High-density table view (virtualized) - *UI Ready*.
    - <1s latency updates.

### 3. Mobile Scanner (Flutter)
- [x] **Tactical HUD**: Custom reticle, status badges (Implemented).
- [ ] **Photo Workflow**:
    - **Warning**: Capture 1 photo → Upload R2 → Create Session (Status: Warning).
    - **Daily Ticket**: Capture 1st photo → Upload R2 → Create Session (Status: Pending 2nd Scan).
- [ ] **Image Handling**: Client-side compression (WebP, max 1200px).

### 4. User Web App (Web - Next.js)
- [x] **Success Page**:
    - Landing after Stripe payment / QR scan.
    - Show session status (Active/Expired).
    - Realtime updates (e.g., if Officer scans) - *UI Ready*.
- [x] **Extend Session**: Button triggers new Stripe Checkout - *UI Ready*.

## Phase 2 (Deferred)
- WhatsApp Integration (Cloud API).
- LPR Automation (DeepSeek OCR).
- Dynamic Pricing Engine.
- MCP Server & Admin Chatbot.

## Phase 3 (Deferred)
- Smart Sign Integration.
- Full Hardware LPR.
- Advanced AI Reasoning.
