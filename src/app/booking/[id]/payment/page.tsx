"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

// Initialize Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error(
    "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable"
  );
}
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

interface Booking {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  court: {
    id: number;
    name: string;
    sport: string;
    pricePerHour: number;
    venue: {
      id: number;
      name: string;
      address: string;
      city: string;
      state: string;
    };
  };
  payment?: {
    id: number;
    amount: number;
    status: string;
  };
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const bookingId = params.id as string;
  const clientSecret = searchParams.get("client_secret");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "failed"
  >("pending");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (bookingId && session) {
      fetchBookingDetails();
    }
  }, [bookingId, session, status]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        setError("Booking not found");
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      setError("Failed to load booking details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;

    if (!clientSecret) {
      setError("Payment not initialized. Please refresh and try again.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      await handleStripePayment();
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus("failed");
      setError(
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Stripe failed to load. Please refresh and try again.");
    }

    // In a real implementation, you would collect payment method details
    // For now, we'll use a test payment method for demonstration
    const { error: stripeError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret!, {
        payment_method: "pm_card_visa", // Test payment method
      });

    if (stripeError) {
      throw new Error(stripeError.message || "Payment failed");
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Update our backend with the successful payment
      await completePayment(
        "succeeded",
        paymentIntent.id,
        paymentIntent.payment_method as string
      );
      setPaymentStatus("success");
      setTimeout(() => {
        router.push("/bookings?success=payment-completed");
      }, 2000);
    } else {
      throw new Error("Payment was not completed successfully");
    }
  };

  const completePayment = async (
    status: string,
    paymentIntentId: string,
    paymentMethodId: string
  ) => {
    const response = await fetch(`/api/bookings/${bookingId}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        paymentIntentId,
        paymentMethodId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Payment processing failed");
    }

    return response.json();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <Link
            href="/bookings"
            className="text-green-600 hover:text-green-500 font-medium"
          >
            ← Back to bookings
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your booking has been confirmed. You'll receive a confirmation email
            shortly.
          </p>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">
              Booking Details
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Venue:</span>
                <span>{booking?.court.venue.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Court:</span>
                <span>{booking?.court.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>
                  {booking &&
                    format(new Date(booking.startTime), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>
                  {booking && format(new Date(booking.startTime), "h:mm a")} -{" "}
                  {booking && format(new Date(booking.endTime), "h:mm a")}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to your bookings...
          </p>
        </div>
      </div>
    );
  }

  const calculateTotalPrice = () => {
    if (!booking) return 0;
    const duration =
      (new Date(booking.endTime).getTime() -
        new Date(booking.startTime).getTime()) /
      (1000 * 60 * 60);
    return Math.round(Number(booking.court.pricePerHour) * duration);
  };

  return (
    <Suspense>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Payment
            </h1>
            <p className="text-gray-600 mt-2">Secure your court booking</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Booking Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Booking Summary
              </h2>

              {booking && (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="font-semibold text-gray-900">
                      {booking.court.venue.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {booking.court.name} - {booking.court.sport}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span>
                        {booking.court.venue.address},{" "}
                        {booking.court.venue.city}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="flex items-center text-gray-600">
                        <CalendarDaysIcon className="w-4 h-4 mr-2" />
                        <span>Date</span>
                      </div>
                      <span className="font-medium">
                        {format(new Date(booking.startTime), "MMM d, yyyy")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <div className="flex items-center text-gray-600">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span>Time</span>
                      </div>
                      <span className="font-medium">
                        {format(new Date(booking.startTime), "h:mm a")} -{" "}
                        {format(new Date(booking.endTime), "h:mm a")}
                      </span>
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 mt-3">
                      <div className="flex items-center">
                        <CurrencyRupeeIcon className="w-5 h-5 mr-1" />
                        <span>Total Amount</span>
                      </div>
                      <span className="text-green-600">
                        ₹{calculateTotalPrice()}
                      </span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Payment Details
              </h2>

              {paymentStatus === "failed" && error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="space-y-6">
                <div className="p-4 border border-gray-300 rounded-lg">
                  <CreditCardIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                    Stripe Payment
                  </h3>
                  <p className="text-gray-600 text-sm text-center mb-4">
                    {clientSecret
                      ? "Ready to process payment with Stripe"
                      : "Payment intent not found. Please go back and try again."}
                  </p>
                  {clientSecret && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Test Mode:</strong> Use card number 4242 4242
                        4242 4242 with any future date and CVC.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || !clientSecret}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                      </div>
                    ) : (
                      `Pay ₹${calculateTotalPrice()}`
                    )}
                  </button>

                  <Link
                    href={`/bookings`}
                    className="block w-full text-center py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel and Return to Bookings
                  </Link>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <h4 className="font-medium text-blue-900">
                      Secure Payment
                    </h4>
                    <p className="text-blue-700 mt-1">
                      Your payment information is protected by industry-standard
                      encryption.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
