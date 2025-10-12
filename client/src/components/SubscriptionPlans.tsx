import React, { useState } from 'react';

interface SubscriptionPlansProps {
  onSelectPlan: (planId: string, planName: string, price: number, billingPeriod: 'monthly' | 'annually') => void;
  onBack: () => void;
}

export default function SubscriptionPlans({
  onSelectPlan,
  onBack
}: SubscriptionPlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: [
        'Personalized workout plans',
        'Weekly coach check-ins',
        'Progress tracking',
        'Basic nutrition tips'
      ],
      recommended: false
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        'Everything in Basic',
        'Unlimited coach messaging',
        'Custom meal plans',
        'Video form checks',
        'Priority support'
      ],
      recommended: true
    },
    {
      id: 'elite',
      name: 'Elite',
      monthlyPrice: 29.99,
      yearlyPrice: 299.99,
      features: [
        'Everything in Premium',
        'Daily coach check-ins',
        'Advanced body metrics',
        'Exclusive workout library',
        'Goal prioritization'
      ],
      recommended: false
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-8 px-6">
        <button onClick={onBack} className="flex items-center mb-4 text-white/80 hover:text-white">
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </button>
        <h1 className="text-2xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-white/80">Select the subscription that fits your needs</p>
      </div>
      
      {/* Billing period toggle */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="bg-gray-100 rounded-full p-1 flex items-center justify-between">
          <button 
            className={`py-2 px-4 rounded-full ${billingPeriod === 'monthly' ? 'bg-white shadow-sm' : ''} text-sm font-medium transition-all flex-1 text-center`}
            onClick={() => setBillingPeriod('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`py-2 px-4 rounded-full ${billingPeriod === 'annually' ? 'bg-white shadow-sm' : ''} text-sm font-medium transition-all flex-1 text-center`}
            onClick={() => setBillingPeriod('annually')}
          >
            Annually <span className="text-green-600">(Save 15%)</span>
          </button>
        </div>
      </div>
      
      {/* Plans */}
      <div className="flex-1 px-6 py-6 space-y-6">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`border rounded-xl overflow-hidden ${plan.recommended ? 'border-primary' : 'border-gray-200'} relative`}
          >
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                Recommended
              </div>
            )}
            
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold">${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}</span>
                <span className="text-gray-500">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <i className="fas fa-check text-green-500 mt-1 mr-2"></i>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => onSelectPlan(
                  plan.id,
                  plan.name,
                  billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
                  billingPeriod
                )}
                className={`w-full py-3 rounded-lg font-medium ${
                  plan.recommended 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-primary border border-primary'
                }`}
              >
                Select {plan.name} Plan
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-center text-xs text-gray-500">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}