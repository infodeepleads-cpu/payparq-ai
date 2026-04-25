-- Enhanced push_subscriptions to support both FCM and Web Push
ALTER TABLE IF EXISTS push_subscriptions
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT, -- 'web', 'android', 'ios'
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_used TIMESTAMP DEFAULT NOW();

-- Notification events log (for debugging/analytics)
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'p2t_checkout', 'enforcement_ticket', 'driver_approaching', etc.
  triggered_by UUID REFERENCES auth.users(id),
  lot_id UUID REFERENCES locations(id),
  metadata JSONB,
  sent_to_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ride requests (for P&T checkout → driver assignment)
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id),
  driver_id UUID REFERENCES auth.users(id),
  checkout_session_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'accepted', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  assigned_at TIMESTAMP,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  metadata JSONB
);

-- Driver scores/performance tracking
CREATE TABLE IF NOT EXISTS driver_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_rides INT DEFAULT 0,
  declined_rides INT DEFAULT 0,
  completed_rides INT DEFAULT 0,
  last_decline_was_final BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_subscriptions" ON push_subscriptions
FOR ALL USING (auth.uid() = user_id);

-- RLS for ride_requests
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_view_own_rides" ON ride_requests
FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "driver_view_assigned_rides" ON ride_requests
FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "manager_view_lot_rides" ON ride_requests
FOR SELECT USING (
  lot_id IN (
    SELECT lot_id FROM officer_assignments
    WHERE city_manager_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_device ON push_subscriptions(user_id, device_type);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fcm ON push_subscriptions(fcm_token) WHERE fcm_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_requests_lot ON ride_requests(lot_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver ON ride_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_notification_events_type ON notification_events(event_type, created_at DESC);
