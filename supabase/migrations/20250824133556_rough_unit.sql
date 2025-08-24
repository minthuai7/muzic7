/*
  # Payment System for Myanmar

  1. New Tables
    - `payment_packages` - Available AI music generation packages
    - `payment_orders` - User payment orders
    - `admin_users` - Admin users for payment management
    - `payment_transactions` - Transaction history

  2. Security
    - Enable RLS on all tables
    - Add policies for users and admins
    - Secure admin access

  3. Functions
    - Update user subscription after payment approval
    - Generate order reference numbers
*/

-- Payment Packages Table
CREATE TABLE IF NOT EXISTS payment_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_mm text NOT NULL, -- Myanmar language name
  generations integer NOT NULL,
  price_mmk integer NOT NULL, -- Price in Myanmar Kyat
  description text,
  description_mm text, -- Myanmar language description
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Orders Table
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES payment_packages(id),
  order_reference text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'approved', 'rejected', 'expired')),
  payment_method text NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash')),
  amount_mmk integer NOT NULL,
  generations integer NOT NULL,
  
  -- Payment proof
  payment_proof_url text,
  payment_notes text,
  
  -- Admin fields
  admin_notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions text[] DEFAULT ARRAY['manage_payments'],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Transactions Table (for history)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('purchase', 'refund', 'bonus')),
  generations_added integer NOT NULL,
  amount_mmk integer,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_packages
CREATE POLICY "Anyone can view active packages"
  ON payment_packages
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON payment_packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for payment_orders
CREATE POLICY "Users can view their own orders"
  ON payment_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders"
  ON payment_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending orders"
  ON payment_orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON payment_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Admins can update orders"
  ON payment_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for admin_users
CREATE POLICY "Admins can view admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);

-- Function to generate order reference
CREATE OR REPLACE FUNCTION generate_order_reference()
RETURNS text AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to approve payment and update user subscription
CREATE OR REPLACE FUNCTION approve_payment_order(
  order_id_param uuid,
  admin_id_param uuid,
  admin_notes_param text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  order_record payment_orders%ROWTYPE;
  user_subscription_record user_subscriptions%ROWTYPE;
BEGIN
  -- Get the order
  SELECT * INTO order_record FROM payment_orders WHERE id = order_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  IF order_record.status != 'paid' THEN
    RETURN json_build_object('success', false, 'error', 'Order is not in paid status');
  END IF;
  
  -- Update order status
  UPDATE payment_orders 
  SET 
    status = 'approved',
    approved_by = admin_id_param,
    approved_at = NOW(),
    admin_notes = admin_notes_param,
    updated_at = NOW()
  WHERE id = order_id_param;
  
  -- Get user subscription
  SELECT * INTO user_subscription_record 
  FROM user_subscriptions 
  WHERE user_id = order_record.user_id;
  
  -- Update user subscription
  IF FOUND THEN
    UPDATE user_subscriptions 
    SET 
      monthly_limit = monthly_limit + order_record.generations,
      updated_at = NOW()
    WHERE user_id = order_record.user_id;
  ELSE
    INSERT INTO user_subscriptions (user_id, plan_type, monthly_limit, current_usage)
    VALUES (order_record.user_id, 'free', order_record.generations, 0);
  END IF;
  
  -- Create transaction record
  INSERT INTO payment_transactions (order_id, user_id, type, generations_added, amount_mmk, description)
  VALUES (
    order_id_param,
    order_record.user_id,
    'purchase',
    order_record.generations,
    order_record.amount_mmk,
    'Payment approved for ' || order_record.generations || ' AI music generations'
  );
  
  RETURN json_build_object('success', true, 'message', 'Payment approved successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default payment packages
INSERT INTO payment_packages (name, name_mm, generations, price_mmk, description, description_mm) VALUES
(
  'Leaf Pack',
  'ရွက်ပက်ကေ့ခ်',
  30,
  20000,
  '30 AI music generations for creative musicians',
  'ဖန်တီးမှုရှင်များအတွက် AI ဂီတ ၃၀ ခု ထုတ်လုပ်နိုင်သည်'
),
(
  'Bamboo Pack',
  'ဝါးပက်ကေ့ခ်',
  90,
  50000,
  '90 AI music generations for professional creators',
  'ပရော်ဖက်ရှင်နယ် ဖန်တီးသူများအတွက် AI ဂီတ ၉၀ ခု ထုတ်လုပ်နိုင်သည်'
)
ON CONFLICT DO NOTHING;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_packages_updated_at
  BEFORE UPDATE ON payment_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();