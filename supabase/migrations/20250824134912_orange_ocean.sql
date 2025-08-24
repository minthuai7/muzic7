/*
  # Complete Payment System Setup

  1. New Tables
    - `payment_packages` - Available AI music generation packages
    - `payment_orders` - User payment orders and status tracking
    - `payment_transactions` - Transaction history for approved payments
    - `admin_users` - Admin user management with roles and permissions

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user access control
    - Admin-only access for order management
    - Public access for viewing active packages

  3. Functions
    - `approve_payment_order` - Handles payment approval and user credit updates
    - `update_updated_at_column` - Automatic timestamp updates
    - `handle_updated_at` - Trigger function for updated_at columns

  4. Triggers
    - Automatic updated_at timestamp management
    - User subscription creation on approval

  5. Indexes
    - Performance optimization for common queries
    - User-based filtering and date sorting
*/

-- Create payment packages table
CREATE TABLE IF NOT EXISTS payment_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_mm text NOT NULL,
  generations integer NOT NULL,
  price_mmk integer NOT NULL,
  description text,
  description_mm text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment orders table
CREATE TABLE IF NOT EXISTS payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES payment_packages(id),
  order_reference text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'approved', 'rejected', 'expired')),
  payment_method text NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash')),
  amount_mmk integer NOT NULL,
  generations integer NOT NULL,
  payment_proof_url text,
  payment_notes text,
  admin_notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  permissions text[] DEFAULT ARRAY['manage_payments'],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment transactions table
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

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or replace the approve_payment_order function
CREATE OR REPLACE FUNCTION approve_payment_order(
  order_id_param uuid,
  admin_id_param uuid,
  admin_notes_param text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  order_record payment_orders%ROWTYPE;
  user_subscription_record user_subscriptions%ROWTYPE;
  result json;
BEGIN
  -- Get the order details
  SELECT * INTO order_record
  FROM payment_orders
  WHERE id = order_id_param AND status = 'paid';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found or not in paid status');
  END IF;

  -- Update the order status
  UPDATE payment_orders
  SET 
    status = 'approved',
    approved_by = admin_id_param,
    approved_at = now(),
    admin_notes = admin_notes_param,
    updated_at = now()
  WHERE id = order_id_param;

  -- Get or create user subscription
  SELECT * INTO user_subscription_record
  FROM user_subscriptions
  WHERE user_id = order_record.user_id;

  IF FOUND THEN
    -- Update existing subscription
    UPDATE user_subscriptions
    SET 
      current_usage = GREATEST(0, current_usage - order_record.generations),
      monthly_limit = monthly_limit + order_record.generations,
      updated_at = now()
    WHERE user_id = order_record.user_id;
  ELSE
    -- Create new subscription
    INSERT INTO user_subscriptions (user_id, monthly_limit, current_usage)
    VALUES (order_record.user_id, order_record.generations + 1, 0);
  END IF;

  -- Create transaction record
  INSERT INTO payment_transactions (
    order_id,
    user_id,
    type,
    generations_added,
    amount_mmk,
    description
  ) VALUES (
    order_id_param,
    order_record.user_id,
    'purchase',
    order_record.generations,
    order_record.amount_mmk,
    'Payment approved for ' || order_record.generations || ' generations'
  );

  RETURN json_build_object('success', true, 'message', 'Order approved successfully');

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE payment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Payment packages policies
CREATE POLICY "Anyone can view active packages" ON payment_packages
  FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage packages" ON payment_packages
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND is_active = true
  ));

-- Payment orders policies
CREATE POLICY "Users can view their own orders" ON payment_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON payment_orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending orders" ON payment_orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders" ON payment_orders
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admins can update orders" ON payment_orders
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND is_active = true
  ));

-- Admin users policies
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users admin_users_1
    WHERE admin_users_1.id = auth.uid() AND admin_users_1.is_active = true
  ));

-- Payment transactions policies
CREATE POLICY "Users can view their own transactions" ON payment_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON payment_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() AND is_active = true
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_payment_packages_updated_at
  BEFORE UPDATE ON payment_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment packages
INSERT INTO payment_packages (name, name_mm, generations, price_mmk, description, description_mm) VALUES
  ('Leaf Pack', 'ရွက်ပက်ကေ့ချ်', 30, 20000, '30 AI music generations for creative projects', '၃၀ ကြိမ် AI ဂီတထုတ်လုပ်နိုင်သည့် ပက်ကေ့ချ်'),
  ('Bamboo Pack', 'ဝါးပက်ကေ့ချ်', 90, 50000, '90 AI music generations - Most popular choice!', '၉၀ ကြိမ် AI ဂီတထုတ်လုပ်နိုင်သည့် ရေပန်းစားဆုံး ပက်ကေ့ချ်')
ON CONFLICT DO NOTHING;