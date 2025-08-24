import React, { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, Copy, CheckCircle, Upload, FileText, Image, Loader2 } from 'lucide-react';
import { PaymentPackage, PaymentOrder } from '../types/payment';
import { usePayments } from '../hooks/usePayments';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PaymentPackage | null;
}

export default function PaymentModal({ isOpen, onClose, selectedPackage }: PaymentModalProps) {
  const [step, setStep] = useState<'select' | 'payment' | 'proof' | 'success'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_money' | 'cash'>('bank_transfer');
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { createOrder, updateOrderPaymentProof, formatMMK } = usePayments();

  const handleCreateOrder = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    const order = await createOrder(selectedPackage.id);
    if (order) {
      setCurrentOrder(order);
      setStep('payment');
    }
    setLoading(false);
  };

  const uploadFileToImgur = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.data.link;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setPaymentProofFile(file);
    
    // Auto-upload to get URL
    setUploadingFile(true);
    try {
      const url = await uploadFileToImgur(file);
      setPaymentProofUrl(url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
      setPaymentProofFile(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitPaymentProof = async () => {
    if (!currentOrder || (!paymentProofUrl.trim() && !paymentProofFile)) return;

    setLoading(true);
    
    let finalUrl = paymentProofUrl;
    
    // If we have a file but no URL yet, upload it
    if (paymentProofFile && !paymentProofUrl.trim()) {
      try {
        finalUrl = await uploadFileToImgur(paymentProofFile);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload image. Please try again.');
        setLoading(false);
        return;
      }
    }
    
    const success = await updateOrderPaymentProof(currentOrder.id, finalUrl, paymentNotes);
    if (success) {
      setStep('success');
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClose = () => {
    setStep('select');
    setCurrentOrder(null);
    setPaymentProofFile(null);
    setPaymentProofUrl('');
    setUploadingFile(false);
    setPaymentNotes('');
    onClose();
  };

  if (!isOpen || !selectedPackage) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-md border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <CreditCard className="w-6 h-6 mr-2" />
            {step === 'select' && 'Purchase Package'}
            {step === 'payment' && 'Payment Instructions'}
            {step === 'proof' && 'Upload Payment Proof'}
            {step === 'success' && 'Order Submitted'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Step 1: Package Selection */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">{selectedPackage.name}</h3>
              <p className="text-gray-300 mb-4">{selectedPackage.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{selectedPackage.generations}</p>
                  <p className="text-gray-400 text-sm">AI Generations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{formatMMK(selectedPackage.price_mmk)}</p>
                  <p className="text-gray-400 text-sm">Myanmar Kyat</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Select Payment Method</h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <Banknote className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Bank Transfer</p>
                    <p className="text-gray-400 text-sm">Transfer to our bank account</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mobile_money"
                    checked={paymentMethod === 'mobile_money'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <Smartphone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Mobile Money</p>
                    <p className="text-gray-400 text-sm">KBZPay, WavePay, AYAPay</p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all"
            >
              {loading ? 'Creating Order...' : 'Continue to Payment'}
            </button>
          </div>
        )}

        {/* Step 2: Payment Instructions */}
        {step === 'payment' && currentOrder && (
          <div className="space-y-6">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Order Reference:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono">{currentOrder.order_reference}</span>
                  <button
                    onClick={() => copyToClipboard(currentOrder.order_reference)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount:</span>
                <span className="text-green-400 font-bold">{formatMMK(currentOrder.amount_mmk)}</span>
              </div>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Banknote className="w-5 h-5 mr-2" />
                  Bank Transfer Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Bank Name:</span>
                    <span className="text-white">KBZ Bank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Account Name:</span>
                    <span className="text-white">MuzAI Myanmar</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Account Number:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono">123-456-789-012</span>
                      <button
                        onClick={() => copyToClipboard('123-456-789-012')}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'mobile_money' && (
              <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Mobile Money Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-white font-medium mb-2">KBZPay</h5>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Phone:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono">09-123-456-789</span>
                        <button
                          onClick={() => copyToClipboard('09-123-456-789')}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-white font-medium mb-2">WavePay</h5>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Phone:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono">09-987-654-321</span>
                        <button
                          onClick={() => copyToClipboard('09-987-654-321')}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
              <p className="text-yellow-300 text-sm">
                <strong>Important:</strong> Please include your order reference "{currentOrder.order_reference}" in the payment description or memo.
              </p>
            </div>

            <button
              onClick={() => setStep('proof')}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all"
            >
              I've Made the Payment
            </button>
          </div>
        )}

        {/* Step 3: Payment Proof */}
        {step === 'proof' && (
          <div className="space-y-6">
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-4">Upload Payment Proof</h4>
              <p className="text-gray-300 text-sm mb-4">
                Please provide a screenshot or photo of your payment confirmation.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Payment Proof
                  </label>
                  
                  {/* File Upload */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingFile ? (
                            <>
                              <Loader2 className="w-8 h-8 mb-2 text-purple-400 animate-spin" />
                              <p className="text-sm text-gray-400">Uploading...</p>
                            </>
                          ) : paymentProofFile ? (
                            <>
                              <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
                              <p className="text-sm text-green-400 font-medium">{paymentProofFile.name}</p>
                              <p className="text-xs text-gray-500">File uploaded successfully</p>
                            </>
                          ) : (
                            <>
                              <Image className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="text-sm text-gray-400">
                                <span className="font-semibold">Click to upload</span> payment screenshot
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={uploadingFile}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Alternative URL Input */}
                  <div className="text-center mb-2">
                    <span className="text-xs text-gray-500">Or paste image URL directly</span>
                  </div>
                  <input
                    type="url"
                    value={paymentProofUrl}
                    onChange={(e) => {
                      setPaymentProofUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setPaymentProofFile(null);
                      }
                    }}
                    placeholder="https://example.com/payment-screenshot.jpg"
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={uploadingFile}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Any additional information about your payment..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('payment')}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmitPaymentProof}
                disabled={loading || uploadingFile || (!paymentProofUrl.trim() && !paymentProofFile)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center space-x-2"
              >
                {loading || uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadingFile ? 'Uploading...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Submit for Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="bg-green-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Order Submitted Successfully!</h3>
              <p className="text-gray-300">
                Your payment proof has been submitted for review. We'll process your order within 24 hours.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-gray-300 text-sm">
                <strong>Order Reference:</strong> {currentOrder?.order_reference}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                You can check your order status in the "My Orders" section.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 px-4 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}