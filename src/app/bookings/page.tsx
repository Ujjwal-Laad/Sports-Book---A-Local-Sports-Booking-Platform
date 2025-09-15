"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
// Utility functions to replace date-fns
const formatDate = (dateString: string, formatStr: string) => {
  const date = new Date(dateString);
  if (formatStr === "MMM d, yyyy") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else if (formatStr === "h:mm a") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return date.toLocaleString();
};

const parseISO = (dateString: string) => new Date(dateString);

const isFuture = (date: Date) => {
  return date.getTime() > Date.now();
};

interface Booking {
  id: number;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  court: {
    id: number;
    name: string;
    sport: string;
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
    status: string;
    amount: number;
  };
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function Bookings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Check for success message from URL params
  useEffect(() => {
    if (searchParams.get("success") === "booking-created") {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchBookings();
    }
  }, [status, currentPage]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());

      const response = await fetch(`/api/bookings/user?${params.toString()}`);

      if (response.ok) {
        const data: BookingsResponse = await response.json();
        setBookings(data.bookings);
        setTotalPages(data.pagination.pages);
        setError(null);
      } else {
        setError("Failed to load bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const canCancelBooking = (booking: Booking) => {
    return (
      (booking.status === "PENDING" || booking.status === "CONFIRMED") &&
      isFuture(parseISO(booking.startTime))
    );
  };

  const canReviewBooking = (booking: Booking) => {
    return (
      booking.status === "COMPLETED" && !isFuture(parseISO(booking.endTime)) // Booking has ended
    );
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
      });

      if (response.ok) {
        fetchBookings(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    }
  };

  const handleSubmitReview = async (booking: Booking) => {
    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5 stars");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          venueId: booking.court?.venue?.id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (response.ok) {
        alert("Review submitted successfully!");
        setReviewingBooking(null);
        setRating(5);
        setComment("");
        fetchBookings(); // Refresh to update UI
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
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
        return <CheckCircleIcon className="w-4 h-4" />;
      case "PENDING":
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircleIcon className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">
            View and manage your court bookings
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
            Booking created successfully! You'll receive a confirmation email
            shortly.
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      {/* Venue and Court Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.court?.venue?.name || "Unknown Venue"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.court?.name || "Unknown Court"} -{" "}
                            {booking.court?.sport || "Unknown Sport"}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            <span>
                              {booking.court?.venue?.address ||
                                "Unknown Address"}
                              , {booking.court?.venue?.city || "Unknown City"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{booking.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <CalendarDaysIcon className="w-4 h-4 mr-2" />
                          <span>
                            {formatDate(booking.startTime, "MMM d, yyyy")}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          <span>
                            {formatDate(booking.startTime, "h:mm a")} -{" "}
                            {formatDate(booking.endTime, "h:mm a")}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600">
                          <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            ₹{Math.round(booking.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Booking Date */}
                      <div className="mt-3 text-xs text-gray-500">
                        Booked on{" "}
                        {formatDate(booking.createdAt, "MMM d, yyyy")}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3 mt-4 lg:mt-0 lg:ml-6">
                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Cancel
                        </button>
                      )}
                      {canReviewBooking(booking) && (
                        <button
                          onClick={() => setReviewingBooking(booking.id)}
                          className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-700 hover:bg-yellow-50 transition-colors"
                        >
                          <StarIcon className="w-4 h-4 mr-1" />
                          Write Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 border rounded-md ${
                          page === currentPage
                            ? "bg-primary-600 text-white border-primary-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Review Modal */}
            {reviewingBooking && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Write a Review
                    </h3>
                    <button
                      onClick={() => {
                        setReviewingBooking(null);
                        setRating(5);
                        setComment("");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {(() => {
                    const booking = bookings.find(
                      (b) => b.id === reviewingBooking
                    );
                    return booking ? (
                      <div className="mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="font-medium text-gray-900">
                            {booking.court?.venue?.name || "Unknown Venue"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.court?.name || "Unknown Court"} -{" "}
                            {booking.court?.sport || "Unknown Sport"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.startTime, "MMM d, yyyy")}
                          </p>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rating
                          </label>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`text-2xl ${
                                  star <= rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                } hover:text-yellow-400 transition-colors`}
                              >
                                ★
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                              {rating} star{rating !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Comment (Optional)
                          </label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                            rows={3}
                            maxLength={1000}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {comment.length}/1000 characters
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setReviewingBooking(null);
                              setRating(5);
                              setComment("");
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200"
                            disabled={isSubmittingReview}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitReview(booking)}
                            disabled={isSubmittingReview}
                            className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors duration-200"
                          >
                            {isSubmittingReview
                              ? "Submitting..."
                              : "Submit Review"}
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CalendarDaysIcon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't made any bookings yet. Start by booking your first
              court!
            </p>
            <Link
              href="/venues"
              className="inline-flex items-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors duration-200"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Book a Court
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <Bookings />
    </Suspense>
  );
}
