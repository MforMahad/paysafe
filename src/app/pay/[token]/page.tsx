'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function CheckoutPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(false);

  const handleStartPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/start?token=${token}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to start payment');

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert('Payment initialized successfully!');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-xl font-bold mb-4">Complete Payment</h1>
      <button
        onClick={handleStartPayment}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Connecting to Elavon...' : 'Pay Now'}
      </button>
    </div>
  );
}