"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PrinterIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
// Native JavaScript date utility functions
const formatDate = (date: Date, formatType: string): string => {
  if (formatType === "MMM d, yyyy") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (formatType === "h:mm a") {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  if (formatType === "MMM d, yyyy 'at' h:mm a") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
  if (formatType === "EEEE, MMMM d, yyyy") {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  return date.toString();
};

const parseISO = (dateString: string): Date => {
  return new Date(dateString);
};

const isFuture = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

interface BookingDetail {
  id: number;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  cancelledAt?: string;
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
      phone?: string;
    };
  };
  payment?: {
    id: number;
    status: string;
    amount: number;
    paymentMethod?: string;
  };
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}

export default function BookingDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const bookingId = parseInt(params.id as string);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && bookingId) {
      fetchBookingDetail();
    }
  }, [status, bookingId]);

  const fetchBookingDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (response.ok) {
        const bookingData = await response.json();
        setBooking(bookingData);
        setError(null);
      } else if (response.status === 404) {
        setError("Booking not found");
      } else {
        setError("Failed to load booking details");
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      setError("Failed to load booking details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        setBooking(prev => prev ? { ...prev, status: "CANCELLED", cancelledAt: new Date().toISOString() } : null);
        alert(result.message || "Booking cancelled successfully");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircleIcon className="w-5 h-5" />;
      case "PENDING":
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case "CANCELLED":
        return <XCircleIcon className="w-5 h-5" />;
      case "COMPLETED":
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5" />;
    }
  };

  const canCancelBooking = () => {
    if (!booking) return false;
    return (
      (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
      isFuture(parseISO(booking.startTime))
    );
  };

  const calculateDuration = () => {
    if (!booking) return 0;
    const start = parseISO(booking.startTime);
    const end = parseISO(booking.endTime);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {error || "Booking Not Found"}
          </h1>
          <p className="text-gray-600 mt-2">
            The booking you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/bookings"
            className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/bookings"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to My Bookings
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Booking #{booking.id}
              </h1>
              <p className="text-gray-600 mt-1">
                Created on {formatDate(parseISO(booking.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  booking.status
                )}`}
              >
                {getStatusIcon(booking.status)}
                <span className="ml-1">{booking.status}</span>
              </span>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Print"
                >
                  <PrinterIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Venue Details
              </h2>
              
              <div className="flex items-start">
                <BuildingOfficeIcon className="w-8 h-8 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {booking.court.venue.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {booking.court.name} - {booking.court.sport}
                  </p>
                  <div className="flex items-center text-gray-500 mt-2">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>
                      {booking.court.venue.address}, {booking.court.venue.city}, {booking.court.venue.state}
                    </span>
                  </div>
                  {booking.court.venue.phone && (
                    <div className="flex items-center text-gray-500 mt-1">
                      <span className="text-sm">Phone: {booking.court.venue.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <CalendarDaysIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-gray-900">
                        {formatDate(parseISO(booking.startTime), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Time</p>
                      <p className="text-gray-900">
                        {formatDate(parseISO(booking.startTime), "h:mm a")} - {formatDate(parseISO(booking.endTime), "h:mm a")}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {calculateDuration()} hour{calculateDuration() !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center mb-4">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Booked by</p>
                      <p className="text-gray-900">{booking.user.fullName}</p>
                      <p className="text-sm text-gray-500">{booking.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{Math.round(booking.totalAmount / 100)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{Number(booking.court.pricePerHour).toFixed(0)}/hour × {calculateDuration()} hour{calculateDuration() !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {booking.payment && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Information
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Payment Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.payment.status === "SUCCEEDED" ? "bg-green-100 text-green-800" :
                        booking.payment.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        booking.payment.status === "FAILED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {booking.payment.status}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Payment Method</p>
                    <p className="text-gray-900">
                      {booking.payment.paymentMethod || "Online Payment"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h3>
                
                <div className="space-y-3">
                  {canCancelBooking() && (
                    <button
                      onClick={handleCancelBooking}
                      disabled={isCancelling}
                      className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircleIcon className="w-4 h-4 mr-2" />
                      {isCancelling ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  )}
                  
                  {booking.payment?.status === "PENDING" && (
                    <button className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                      Pay Now
                    </button>
                  )}
                  
                  <Link
                    href={`/venues/${booking.court.venue.id}`}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                    View Venue
                  </Link>
                  
                  {booking.status === "COMPLETED" && (
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      ⭐ Write Review
                    </button>
                  )}
                </div>
              </div>

              {/* Booking Status Timeline */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Booking Status
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Booking Created</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(parseISO(booking.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  
                  {booking.status === "CONFIRMED" && (
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Booking Confirmed</p>
                        <p className="text-xs text-gray-500">Payment successful</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.status === "CANCELLED" && booking.cancelledAt && (
                    <div className="flex items-center">
                      <XCircleIcon className="w-5 h-5 text-red-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Booking Cancelled</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(parseISO(booking.cancelledAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {booking.status === "COMPLETED" && (
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Booking Completed</p>
                        <p className="text-xs text-gray-500">Session finished</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}