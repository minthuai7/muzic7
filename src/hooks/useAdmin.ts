import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PaymentOrder, AdminUser } from '../types/payment';
import { useAuth } from './useAuth';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [allOrders, setAllOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
      setAdminUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadAllOrders();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setIsAdmin(true);
        setAdminUser(data);
      } else {
        setIsAdmin(false);
        setAdminUser(null);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
      setAdminUser(null);
    }
  };

  const loadAllOrders = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_orders')
        .select(`
          *,
          payment_packages (*),
          user_profiles (username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails from auth.users (this requires service role)
      const ordersWithEmails = await Promise.all(
        (data || []).map(async (order) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
            return {
              ...order,
              user_email: userData.user?.email || 'Unknown'
            };
          } catch {
            return {
              ...order,
              user_email: 'Unknown'
            };
          }
        })
      );

      setAllOrders(ordersWithEmails);
    } catch (err) {
      console.error('Error loading all orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (orderId: string, adminNotes?: string): Promise<boolean> => {
    if (!isAdmin || !user) return false;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('approve_payment_order', {
        order_id_param: orderId,
        admin_id_param: user.id,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      if (data.success) {
        await loadAllOrders();
        return true;
      } else {
        setError(data.error);
        return false;
      }
    } catch (err) {
      console.error('Error approving order:', err);
      setError('Failed to approve order');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectOrder = async (orderId: string, adminNotes?: string): Promise<boolean> => {
    if (!isAdmin || !user) return false;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('payment_orders')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      await loadAllOrders();
      return true;
    } catch (err) {
      console.error('Error rejecting order:', err);
      setError('Failed to reject order');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getOrderStats = () => {
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      paid: allOrders.filter(o => o.status === 'paid').length,
      approved: allOrders.filter(o => o.status === 'approved').length,
      rejected: allOrders.filter(o => o.status === 'rejected').length,
      totalRevenue: allOrders
        .filter(o => o.status === 'approved')
        .reduce((sum, o) => sum + o.amount_mmk, 0)
    };
    return stats;
  };

  return {
    isAdmin,
    adminUser,
    allOrders,
    loading,
    error,
    approveOrder,
    rejectOrder,
    refreshOrders: loadAllOrders,
    getOrderStats
  };
}

export { useAdmin }