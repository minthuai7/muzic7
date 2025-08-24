import React, { useState } from 'react';
import { Crown, Zap, Star, ShoppingCart, Clock, CheckCircle } from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import { useUserUsage } from '../hooks/useUserUsage';
import PaymentModal from './PaymentModal';
import { PaymentPackage } from '../types/payment';

export default function PaymentPackages() {
  const { packages, orders, formatMMK } = usePayments();
  const { usage } = useUserUsage();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);

  const handlePurchase = (pkg: PaymentPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const getPackageIcon = (name: string) => {
    if (name.toLowerCase().includes('leaf')) return <Zap className="w-8 h-8" />;
    if (name.toLowerCase().includes('bamboo')) return <Crown className="w-8 h-8" />;
    return <Star className="w-8 h-8" />;
  };

  const getPackageColor = (name: string) => {
    if (name.toLowerCase().includes('leaf')) return 'from-green-600 to-emerald-600';
    if (name.toLowerCase().includes('bamboo')) return 'from-yellow-600 to-orange-600';
    return 'from-purple-600 to-pink-600';
  };

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">AI Music Generation Packages</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Unlock unlimited creativity with our AI music generation packages. Perfect for musicians, content creators, and music enthusiasts.
        </p>
      </div>

      {/* Current Usage */}
      {usage && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Current Usage</h3>
            <div className="flex items-center space-x-2">
              <Crown className={`w-5 h-5 ${usage.planType === 'premium' ? 'text-yellow-400' : 'text-gray-400'}`} />
              <span className="text-white font-medium capitalize">{usage.planType} Plan</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{usage.current}</p>
              <p className="text-gray-400 text-sm">Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{usage.remaining}</p>
              <p className="text-gray-400 text-sm">Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{usage.limit}</p>
              <p className="text-gray-400 text-sm">Total Limit</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min((usage.current / usage.limit) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Resets on {new Date(usage.resetDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all relative overflow-hidden"
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getPackageColor(pkg.name)} opacity-5`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${getPackageColor(pkg.name)} p-3 rounded-xl text-white`}>
                  {getPackageIcon(pkg.name)}
                </div>
                {pkg.name.toLowerCase().includes('bamboo') && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                    POPULAR
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
              <p className="text-gray-300 mb-4">{pkg.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">AI Generations:</span>
                  <span className="text-white font-bold text-lg">{pkg.generations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-green-400 font-bold text-xl">{formatMMK(pkg.price_mmk)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Per Generation:</span>
                  <span className="text-gray-300">{formatMMK(Math.round(pkg.price_mmk / pkg.generations))}</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(pkg)}
                className={`w-full bg-gradient-to-r ${getPackageColor(pkg.name)} hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2 shadow-lg`}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Purchase Package</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{order.package?.name}</p>
                  <p className="text-gray-400 text-sm">Order: {order.order_reference}</p>
                  <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">{formatMMK(order.amount_mmk)}</p>
                  <div className="flex items-center space-x-1">
                    {order.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                      order.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedPackage={selectedPackage}
      />
    </div>
  );
}