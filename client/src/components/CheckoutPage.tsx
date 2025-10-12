import React, { useState } from 'react';

interface CheckoutPageProps {
  planName: string;
  price: number;
  billingPeriod: 'monthly' | 'annually';
  onBack: () => void;
  onComplete: () => void;
}

export default function CheckoutPage({
  planName,
  price,
  billingPeriod,
  onBack,
  onComplete
}: CheckoutPageProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!cardNumber || !expiryDate || !cvv || !name) {
      setError('All fields are required');
      return;
    }
    
    // Format validation
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      setError('Invalid card number format');
      return;
    }
    
    setError('');
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onComplete();
    }, 2000);
  };
  
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-8 px-6">
        <button onClick={onBack} className="flex items-center mb-4 text-white/80 hover:text-white">
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </button>
        <h1 className="text-2xl font-bold mb-2">Checkout</h1>
        <p className="text-white/80">Complete your purchase</p>
      </div>
      
      <div className="flex-1 p-6">
        {/* Order summary */}
        <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{planName} Plan ({billingPeriod})</span>
            <span className="font-medium">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">$0.00</span>
          </div>
          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg">${price.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Payment form */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">Name on card</label>
              <input
                type="text"
                id="cardName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Smith"
              />
            </div>
            
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card number</label>
              <div className="relative">
                <input
                  type="text"
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <i className="fab fa-cc-visa text-blue-800"></i>
                  <i className="fab fa-cc-mastercard text-red-600"></i>
                  <i className="fab fa-cc-amex text-purple-500"></i>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">Expiry date</label>
                <input
                  type="text"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  type="text"
                  id="cvv"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full mt-8 py-4 rounded-xl font-medium text-white ${
              isProcessing ? 'bg-primary-dark' : 'bg-primary hover:bg-primary-dark'
            } transition-colors shadow-md`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              `Pay $${price.toFixed(2)}`
            )}
          </button>
        </form>
      </div>
      
      {/* Security notice */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-center text-gray-500 text-sm">
          <i className="fas fa-lock mr-2"></i>
          <span>Secure payment processing</span>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          Your payment information is encrypted and secure.
          You will receive a receipt via email after payment.
        </p>
      </div>
    </div>
  );
}