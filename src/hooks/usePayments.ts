import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PaymentPackage, PaymentOrder, PaymentTransaction } from '../types/payment';
import { useAuth } from './useAuth';

export function usePayments() {
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadPackages();
    if (user) {
      loadUserOrders();
      loadUserTransactions();
    }
  }, [user]);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_packages')
        .select('*')
        .eq('is_active', true)
        .order('price_mmk', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      console.error('Error loading packages:', err);
      setError('Failed to load payment packages');
    }
  };

  const loadUserOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .select(`
          *,
          payment_packages (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    }
  };

  const loadUserTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions');
    }
  };

  const createOrder = async (packageId: string): Promise<PaymentOrder | null> => {
    if (!user) {
      setError('You must be signed in to create an order');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedPackage = packages.find(p => p.id === packageId);
      if (!selectedPackage) {
        throw new Error('Package not found');
      }

      // Generate order reference
      const orderRef = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { data, error } = await supabase
        .from('payment_orders')
        .insert({
          user_id: user.id,
          package_id: packageId,
          order_reference: orderRef,
          amount_mmk: selectedPackage.price_mmk,
          generations: selectedPackage.generations,
          status: 'pending'
        })
        .select(`
          *,
          payment_packages (*)
        `)
        .single();

      if (error) throw error;

      setOrders(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating order:', err);
      setError('Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderPaymentProof = async (
    orderId: string, 
    paymentProofUrl: string, 
    paymentNotes: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('payment_orders')
        .update({
          payment_proof_url: paymentProofUrl,
          payment_notes: paymentNotes,
          status: 'paid'
        })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadUserOrders();
      return true;
    } catch (err) {
      console.error('Error updating payment proof:', err);
      setError('Failed to update payment proof');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const formatMMK = (amount: number): string => {
    return new Intl.NumberFormat('my-MM', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return {
    packages,
    orders,
    transactions,
    loading,
    error,
    createOrder,
    updateOrderPaymentProof,
    refreshOrders: loadUserOrders,
    refreshTransactions: loadUserTransactions,
    formatMMK
  };
}