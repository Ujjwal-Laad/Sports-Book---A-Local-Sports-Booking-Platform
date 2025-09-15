"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable");
}
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Native JavaScript date utility functions
const formatDate = (date: Date, formatType: string): string => {
  if (formatType === "MMM d, yyyy") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (formatType === "h:mm a") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (formatType === "yyyy-MM-dd") {
    return date.toISOString().split("T")[0];
  }
  if (formatType === "EEE") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (formatType === "d") {
    return date.getDate().toString();
  }
  if (formatType === "MMM") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  if (formatType === "EEEE, MMMM d, yyyy") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return date.toString();
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

const isToday = (date: Date): boolean => {
  return date.toDateString() === new Date().toDateString();
};

const isBefore = (date1: Date, date2: Date): boolean => {
  return date1 < date2;
};

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

interface TimeSlot {
  hour: number;
  time: string;
  available: boolean;
  isPast: boolean;
  hasConflict: boolean;
  price: number;
}

interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface Court {
  id: number;
  name: string;
  sport: string;
  pricePerHour: number;
  openTime: number;
  closeTime: number;
}

interface Booking {
  startTime: string;
  endTime: string;
  status: string;
}

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const venueId = parseInt(params?.id as string || "0");
  const courtIdParam = searchParams?.get("courtId");
  const courtId = parseInt(courtIdParam || "0");

  const [venue, setVenue] = useState<Venue | null>(null);
  const [court, setCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  const [duration, setDuration] = useState<number>(1);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [userNotes, setUserNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Generate next 7 days for date selection
  const availableDates = Array.from({ length: 7 }, (_, i) =>
    addDays(new Date(), i)
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated" && venueId && courtId) {
      fetchCourtDetails();
    }
  }, [status, venueId, courtId]);

  useEffect(() => {
    if (court && selectedDate) {
      fetchAvailableSlots();
    }
  }, [court, selectedDate]);

  const fetchCourtDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/venues/${venueId}`);

      if (response.ok) {
        const venueData = await response.json();
        setVenue({
          id: venueData.id,
          name: venueData.name,
          address: venueData.address,
          city: venueData.city,
          state: venueData.state,
        });

        const courtData = venueData.courts.find((c: any) => c.id === courtId);
        if (courtData) {
          setCourt(courtData);
        } else {
          setError("Court not found");
        }
      } else {
        setError("Failed to load court details");
      }
    } catch (error) {
      console.error("Error fetching court details:", error);
      setError("Failed to load court details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!court) return;

    try {
      const dateStr = formatDate(selectedDate, "yyyy-MM-dd");
      const response = await fetch(
        `/api/bookings/availability?courtId=${courtId}&date=${dateStr}`
      );

      if (response.ok) {
        const data = await response.json();
        setExistingBookings(data.bookings || []);
        setTimeSlots(data.timeSlots || []);
        setAvailableSlots(data.timeSlots || []); // ✅ properly set
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch availability:", response.status, errorText);
        setExistingBookings([]);
        setTimeSlots([]);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setExistingBookings([]);
      setTimeSlots([]);
      setAvailableSlots([]);
    }
  };

  const handleTimeSlotSelect = (hour: number) => {
    const slot = availableSlots.find((s) => s.hour === hour);
    if (!slot || !slot.available) return;

    // For single slot selection with duration
    setSelectedTimeSlots([hour]);
  };

  const isSlotSelected = (hour: number) => {
    if (selectedTimeSlots.length === 0) return false;
    const startHour = selectedTimeSlots[0];
    return hour >= startHour && hour < startHour + duration;
  };

  const isSlotAvailable = (hour: number) => {
    if (selectedTimeSlots.length === 0) return true;

    const startHour = selectedTimeSlots[0];
    const endHour = startHour + duration;

    // Check if all slots in the duration are available
    for (let h = startHour; h < endHour; h++) {
      const slot = availableSlots.find((s) => s.hour === h);
      if (!slot || !slot.available) return false;
    }

    return true;
  };

  const getTotalPrice = () => {
    if (!court || selectedTimeSlots.length === 0) return 0;
    return Math.round(Number(court.pricePerHour) * duration);
  };

  const handleBooking = async () => {
    if (!court || !venue || selectedTimeSlots.length === 0) return;

    setIsBooking(true);
    setError(null);
    try {
      const startHour = selectedTimeSlots[0];
      const startTime = new Date(selectedDate);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startHour + duration, 0, 0, 0);

      // Generate a unique idempotency key for this booking attempt
      const idempotencyKey = crypto.randomUUID();

      // 1. Create booking record in your database
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey, // Add idempotency key
        },
        body: JSON.stringify({
          courtId,
          date: formatDate(selectedDate, "yyyy-MM-dd"), // Send date string
          startTime: selectedTimeSlots[0], // Send hour as number
          duration, // Send duration as number
          notes: userNotes, // Send userNotes as notes
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      const { booking } = await bookingResponse.json();

      // 2. Create Payment Intent with Stripe (required for payment)
      const paymentIntentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      if (!paymentIntentResponse.ok) {
        const errorData = await paymentIntentResponse.json();
        throw new Error(errorData.error || "Failed to initialize payment");
      }

      const { clientSecret } = await paymentIntentResponse.json();

      if (!clientSecret) {
        throw new Error("Failed to initialize payment. Please try again.");
      }

      // 3. Redirect to payment page with client secret
      router.push(
        `/booking/${booking.id}/payment?client_secret=${clientSecret}`
      );
    } catch (err: any) {
      console.error("Error during booking or payment:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsBooking(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!venueId || !courtId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Invalid Booking Request
          </h1>
          <p className="text-gray-600 mt-2">
            The venue or court information is missing.
          </p>
          <Link
            href="/venues"
            className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Venues
          </Link>
        </div>
      </div>
    );
  }

  if (!venue || !court) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Booking Not Available
          </h1>
          <p className="text-gray-600 mt-2">
            The venue or court you're trying to book doesn't exist.
          </p>
          <Link
            href="/venues"
            className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Venues
          </Link>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600 mb-6">
              Your booking has been successfully created. You'll receive a
              confirmation email shortly.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">
                Booking Details:
              </h3>
              <p className="text-sm text-gray-600">
                {venue.name} - {court.name}
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                {selectedTimeSlots.length > 0
                  ? `${selectedTimeSlots[0].toString().padStart(2, "0")}:00`
                  : ""}
              </p>
              <p className="text-sm text-gray-600">
                Duration: {duration} hour(s)
              </p>
              <p className="text-sm font-medium text-gray-900">
                Total: ₹{getTotalPrice()}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/bookings"
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 font-medium transition-colors duration-200 text-center"
              >
                View My Bookings
              </Link>
              <Link
                href="/venues"
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200 text-center"
              >
                Book Another
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link
                  href="/venues"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Venues
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <Link
                  href={`/venues/${venue.id}`}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {venue.name}
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">
                  Book {court.name}
                </span>
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Venue & Court Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <BuildingOfficeIcon className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {venue.name}
                    </h1>
                    <p className="text-gray-600">
                      {venue.address}, {venue.city}
                    </p>
                  </div>
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h2 className="font-semibold text-primary-900 mb-1">
                    {court.name}
                  </h2>
                  <p className="text-primary-700">{court.sport}</p>
                  <p className="text-lg font-semibold text-primary-900 mt-2">
                    ₹{Number(court.pricePerHour)} per hour
                  </p>
                </div>
              </div>

              {/* Date Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarDaysIcon className="w-5 h-5 mr-2" />
                  Select Date
                </h3>

                <div className="grid grid-cols-7 gap-2">
                  {availableDates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isPast = isBefore(date, startOfDay(new Date()));

                    return (
                      <button
                        key={index}
                        onClick={() => !isPast && setSelectedDate(date)}
                        disabled={isPast}
                        className={`p-3 text-center rounded-lg border transition-colors ${
                          isPast
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary-600 text-white border-primary-600"
                            : "border-gray-300 hover:border-primary-300 hover:bg-primary-50"
                        }`}
                      >
                        <div className="text-xs font-medium">
                          {formatDate(date, "EEE")}
                        </div>
                        <div className="text-lg font-bold">
                          {formatDate(date, "d")}
                        </div>
                        <div className="text-xs">{formatDate(date, "MMM")}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  Select Time Slot
                </h3>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {timeSlots.map((slot) => {
                    const isSelected = isSlotSelected(slot.hour);
                    const canSelect = slot.available;

                    return (
                      <button
                        key={slot.hour}
                        onClick={() => handleTimeSlotSelect(slot.hour)}
                        disabled={!canSelect}
                        className={`p-3 text-center rounded-lg border transition-colors ${
                          !canSelect
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary-600 text-white border-primary-600"
                            : "border-gray-300 hover:border-primary-300 hover:bg-primary-50"
                        }`}
                      >
                        <div className="font-medium">{slot.time}</div>
                        <div className="text-xs">
                          {canSelect
                            ? "Available"
                            : slot.isPast
                            ? "Past"
                            : "Booked"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {timeSlots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No time slots available for the selected date.</p>
                  </div>
                )}

                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center mr-6">
                    <div className="w-3 h-3 bg-white border border-gray-300 rounded mr-2"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center mr-6">
                    <div className="w-3 h-3 bg-primary-50 border border-primary-500 rounded mr-2"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded mr-2"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Duration
                </h3>

                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hours:
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {[1, 2, 3, 4].map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} hour{hours > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Booking Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Booking Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Summary
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Court:</span>
                      <span className="font-medium">{court.name}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedDate, "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {selectedTimeSlots.length > 0
                          ? `${selectedTimeSlots[0]
                              .toString()
                              .padStart(2, "0")}:00 - ${(
                              selectedTimeSlots[0] + duration
                            )
                              .toString()
                              .padStart(2, "0")}:00`
                          : "-"}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {duration} hour{duration > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price per hour:</span>
                      <span className="font-medium">
                        ₹{Number(court.pricePerHour).toFixed(0)}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">
                          Total:
                        </span>
                        <span className="font-semibold text-gray-900">
                          ₹{getTotalPrice()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={selectedTimeSlots.length === 0 || isBooking}
                    className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                      selectedTimeSlots.length === 0 || isBooking
                        ? "bg-gray-400 text-gray-500 cursor-not-allowed"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    {isBooking ? "Processing..." : "Confirm Booking"}
                  </button>

                  <p className="text-xs text-gray-500 mt-3 text-center">
                    You'll be redirected to payment after confirmation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
