## 1. Architecture design

```mermaid
graph TD
    A[Admin Dashboard - Next.js] --> B[Supabase Client SDK]
    C[Mobile Scanner - Flutter] --> B
    D[Web User Mini App - Next.js] --> B
    
    B --> E[Supabase Auth]
    B --> F[Supabase Realtime]
    B --> G[Supabase Database]
    
    H[Stripe Webhook] --> G
    
    I[Edge Functions] --> J[DeepSeek API]
    I --> K[LangGraph]
    I --> G
    
    L[LPR Camera] --> I
    M[WhatsApp API] --> I
    
    N[Cloudflare R2] --> O[Image Storage]
    
    P[V2X Receiver] --> I
    
    subgraph "Frontend Layer"
        A
        C
        D
    end
    
    subgraph "Supabase Services"
        E
        F
        G
        I
    end
    
    subgraph "AI Services"
        J
        K
    end
    
    subgraph "External Services"
        H
        L
        M
        N
        P
    end
```

## 2. Technology Description
- **Web Frontend**: Next.js@14 + React@18 + TypeScript + Tailwind CSS
- **Mobile Frontend**: Flutter + Dart
- **Initialization Tool**: create-next-app (web), flutter create (mobile)
- **Backend**: Supabase (PostgreSQL + Realtime + Auth + Edge Functions)
- **AI Integration**: DeepSeek-R1 API + LangGraph for reasoning
- **Primary Data Source**: Stripe Webhooks → Supabase
- **Image Storage**: Cloudflare R2 (WebP format, max 1200px)
- **Optional**: WhatsApp Cloud API (Meta Business), LPR hardware-agnostic API
- **Design System**: Tactical UI with AI Violet (#6D28D9) and Dark Indigo (#1E1B4B)

## 3. Route definitions

### Admin Dashboard (Next.js)
| Route | Purpose |
|-------|---------|
| /admin/login | Role-based authentication (Admin vs Officer) |
| /admin/dashboard | Tactical dashboard with high-density real-time analytics |
| /admin/payments | Stripe revenue dashboard and payout management |
| /admin/users | User management with tactical data density |
| /admin/analytics | AI Analytics with DeepSeek Chatbot |
| /admin/enforcement | Cases and violation management |
| /admin/locations | Locations & Lots management |
| /admin/settings | Dynamic pricing rules and system configuration |
| /admin/integrations | LPR, Smart Sign, Smart Sticker configuration |

### Mobile Scanner (Flutter)
| Route | Purpose |
|-------|---------|
| /scanner | Tactical LPR Camera HUD with auto-detect |
| /scanner/results | Display scan results with tactical information |
| /scanner/violations | Report violations with tactical form interface |
| /scanner/history | Enforcement officer scan history |

### Web User Mini App (Next.js)
| Route | Purpose |
|-------|---------|
| / | Landing with phone authentication |
| /session | Current session validation and details |
| /payment | Stripe payment processing |
| /history | User parking history |
| /extend | Session extension with new Stripe link |

## 4. API definitions

### 4.1 Edge Functions (Supabase)
```typescript
// Plate Validation & Fuzzy Matching
POST /edge-functions/validate-plate
```
Request:
| Param Name| Param Type  | isRequired  | Description |
|-----------|-------------|-------------|-------------|
| plate     | string      | true        | License plate text (OCR raw) |
| source    | string      | true        | Source: 'lpr', 'whatsapp', 'manual' |
| location  | string      | false       | Location identifier |

Response:
| Param Name| Param Type  | Description |
|-----------|-------------|-------------|
| cleaned_plate | string | DeepSeek cleaned plate |
| confidence | number   | OCR confidence score |
| fuzzy_matches | array | Similar active sessions |

### 4.2 WhatsApp Webhook
```typescript
POST /edge-functions/whatsapp-webhook
```
Processes incoming WhatsApp messages through DeepSeek for plate extraction and session linking.

### 4.3 V2X Receiver
```typescript
POST /edge-functions/v2x-receiver
```
Ingests traffic data for dynamic pricing adjustments via lot_occupancy updates.

### 4.4 MCP Server Endpoints
```typescript
// AI Agent Integration
GET /mcp/list_spots
GET /mcp/check_price
POST /mcp/reserve_spot
GET /mcp/getLotAvailability
POST /mcp/createBooking
```

## 5. Server architecture diagram

```mermaid
graph TD
    A[Client Applications] --> B[Supabase Edge Functions]
    
    B --> C[DeepSeek Validation]
    B --> D[LangGraph Reasoning]
    B --> E[Database Operations]
    
    F[Stripe Webhook] --> G[Supabase Database]
    H[LPR Hardware] --> B
    I[WhatsApp API] --> B
    
    G --> J[Supabase Realtime]
    J --> A
    
    K[Cloudflare R2] --> L[Image Processing]
    L --> B
    
    subgraph "Client Layer"
        A
    end
    
    subgraph "Edge Computing"
        B
        C
        D
    end
    
    subgraph "Data Layer"
        G
        J
    end
    
    subgraph "External Services"
        F
        H
        I
        K
    end
```

## 6. Data model

### 6.1 Data model definition
```mermaid
erDiagram
    USERS ||--o{ PARKING_SESSIONS : creates
    PARKING_SESSIONS ||--o{ PAYMENTS : has
    PARKING_SESSIONS ||--o{ SCANS : tracked_by
    PARKING_SESSIONS ||--o{ VIOLATIONS : has
    LOCATIONS ||--o{ PARKING_SESSIONS : hosts
    PRICING_SETTINGS ||--o{ PARKING_SESSIONS : applies_to

    USERS {
        UUID id PK
        STRING email
        STRING phone
        STRING role
        STRING location_access
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    PARKING_SESSIONS {
        UUID id PK
        STRING plate
        STRING mobile
        STRING email
        STRING name
        UUID location_id FK
        TIMESTAMP entry_time
        TIMESTAMP exit_time
        INTEGER duration
        DECIMAL price
        STRING stripe_session_id
        STRING payment_status
        STRING evidence_r2_url
        DECIMAL ai_risk_score
        TEXT ai_reasoning
        STRING source
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    PAYMENTS {
        UUID id PK
        UUID session_id FK
        STRING stripe_payment_id
        DECIMAL amount
        STRING currency
        STRING status
        JSON metadata
        TIMESTAMP created_at
    }
    
    SCANS {
        UUID id PK
        UUID session_id FK
        UUID officer_id FK
        STRING plate_raw
        STRING plate_cleaned
        STRING image_url
        JSON location
        STRING source
        TIMESTAMP scanned_at
    }
    
    VIOLATIONS {
        UUID id PK
        UUID session_id FK
        STRING type
        STRING status
        DECIMAL fine_amount
        STRING evidence_url
        JSON metadata
        TIMESTAMP created_at
    }
    
    LOCATIONS {
        UUID id PK
        STRING name
        JSON coordinates
        INTEGER capacity
        DECIMAL base_rate
        BOOLEAN is_active
    }
    
    PRICING_SETTINGS {
        UUID id PK
        STRING location_id
        TEXT rules_text
        BOOLEAN is_active
        TIMESTAMP created_at
    }
```

### 6.2 Data Definition Language

**Core Parking Sessions Table**
```sql
-- parking_sessions (Primary data from Stripe webhooks)
CREATE TABLE parking_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate VARCHAR(20) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255),
    name VARCHAR(100),
    location_id UUID REFERENCES locations(id),
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    stripe_session_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'pending',
    evidence_r2_url TEXT,
    ai_risk_score DECIMAL(3,2) DEFAULT 0.00,
    ai_reasoning TEXT,
    source VARCHAR(20) DEFAULT 'stripe',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_plate ON parking_sessions(plate);
CREATE INDEX idx_sessions_location_id ON parking_sessions(location_id);
CREATE INDEX idx_sessions_stripe_session ON parking_sessions(stripe_session_id);
CREATE INDEX idx_sessions_payment_status ON parking_sessions(payment_status);
CREATE INDEX idx_sessions_created_at ON parking_sessions(created_at DESC);

-- Enable realtime
ALTER TABLE parking_sessions REPLICA IDENTITY FULL;

-- RLS Policies
GRANT SELECT ON parking_sessions TO anon;
GRANT ALL PRIVILEGES ON parking_sessions TO authenticated;

-- Row Level Security
ALTER TABLE parking_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins see all sessions" ON parking_sessions FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Officers see location sessions" ON parking_sessions FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'officer' AND location_id = ANY(string_to_array(auth.jwt() ->> 'locations', ',')::UUID[]));
CREATE POLICY "Users see own sessions" ON parking_sessions FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'user' AND email = auth.jwt() ->> 'email');
```

**Pricing Settings Table**
```sql
-- Dynamic pricing rules (text-based for DeepSeek processing)
CREATE TABLE pricing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    rules_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample data
INSERT INTO pricing_settings (location_id, rules_text, is_active) VALUES
('location_uuid', 'Base rate: $2/hour. Peak hours (8AM-6PM): +50%. Weekend: +25%. Overstay violation: $25 flat fee.', true);
```

**Scans Table**
```sql
-- All LPR/WhatsApp/manual plate inputs
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES parking_sessions(id),
    officer_id UUID REFERENCES users(id),
    plate_raw VARCHAR(50) NOT NULL,
    plate_cleaned VARCHAR(20),
    image_url TEXT,
    location JSONB,
    source VARCHAR(20) NOT NULL CHECK (source IN ('lpr', 'whatsapp', 'manual', 'mobile')),
    confidence_score DECIMAL(3,2),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scans_session_id ON scans(session_id);
CREATE INDEX idx_scans_plate_cleaned ON scans(plate_cleaned);
CREATE INDEX idx_scans_source ON scans(source);
CREATE INDEX idx_scans_scanned_at ON scans(scanned_at DESC);
```