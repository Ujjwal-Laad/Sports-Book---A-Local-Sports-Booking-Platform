"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { format, addDays, startOfDay, isBefore, isAfter, isSameDay } from "date-fns";

const bookingSchema = z.object({
  date: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select a start time"),
  duration: z.number().min(1, "Duration must be at least 1 hour").max(8, "Maximum 8 hours per booking"),
  notes: z.string().optional(),
});

type BookingForm = z.infer<typeof bookingSchema>;

interface Court {
  id: number;
  name: string;
  sport: string;
  pricePerHour: number;
  currency: string;
  openTime: number;
  closeTime: number;
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
  };
}

interface TimeSlot {
  hour: number;
  available: boolean;
  reason?: string;
}

interface BookingAvailability {
  date: string;
  timeSlots: TimeSlot[];
}

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const venueId = searchParams.get("venueId");
  const courtId = searchParams.get("courtId");

  const [court, setCourt] = useState<Court | null>(null);
  const [availability, setAvailability] = useState<BookingAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      duration: 1,
    },
  });

  const selectedDate = watch("date");
  const selectedStartTime = watch("startTime");
  const duration = watch("duration");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=/book?venueId=${venueId}&courtId=${courtId}`);
    }
  }, [status, router, venueId, courtId]);

  // Fetch court details and availability
  useEffect(() => {
    if (venueId && courtId && session) {
      fetchCourtDetails();
      fetchAvailability();
    }
  }, [venueId, courtId, session]);

  const fetchCourtDetails = async () => {
    try {
      const response = await fetch(`/api/venues/${venueId}/courts/${courtId}`);
      if (response.ok) {
        const data = await response.json();
        setCourt(data);
      } else {
        setError("Court not found");
      }
    } catch (error) {
      console.error("Error fetching court:", error);
      setError("Failed to load court details");
    }
  };

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      const dates = Array.from({ length: 7 }, (_, i) => 
        format(addDays(today, i), "yyyy-MM-dd")
      );
      
      const availabilityPromises = dates.map(async (date) => {
        const response = await fetch(
          `/api/bookings/availability?courtId=${courtId}&date=${date}`
        );
        if (response.ok) {
          const data = await response.json();
          return { date, ...data };
        }
        return { date, timeSlots: [] };
      });

      const availabilityData = await Promise.all(availabilityPromises);
      setAvailability(availabilityData);
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeSlots = (openTime: number, closeTime: number) => {
    const slots = [];
    for (let hour = openTime; hour < closeTime; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const formatTime = (hour: number) => {
    if (hour === 0) return "12:00 AM";
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return "12:00 PM";
    return `${hour - 12}:00 PM`;
  };

  const isTimeSlotAvailable = (date: string, startHour: number, duration: number) => {
    const dayAvailability = availability.find(a => a.date === date);
    if (!dayAvailability) return false;

    for (let i = 0; i < duration; i++) {
      const hourSlot = dayAvailability.timeSlots.find(slot => slot.hour === startHour + i);
      if (!hourSlot || !hourSlot.available) {
        return false;
      }
    }
    return true;
  };

  const calculateTotalPrice = () => {
    if (!court || !duration) return 0;
    return Math.round(Number(court.pricePerHour) * duration); // Price already in rupees
  };

  const onSubmit = async (data: BookingForm) => {
    if (!court || !session) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Create the booking
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courtId: court.id,
          date: data.date,
          startTime: parseInt(data.startTime),
          duration: data.duration,
          notes: data.notes,
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      const booking = await bookingResponse.json();

      // Create payment intent
      const paymentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: court.pricePerHour * data.duration,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Failed to initialize payment");
      }

      const { clientSecret } = await paymentResponse.json();
      
      // Redirect to payment page or handle Stripe payment
      router.push(`/booking/${booking.id}/payment?client_secret=${clientSecret}`);

    } catch (error: any) {
      setError(error.message || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  if (error && !court) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <Link
            href="/venues"
            className="text-green-600 hover:text-green-500 font-medium"
          >
            ← Back to venues
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date();
  const availableDates = availability.filter(a => 
    !isBefore(new Date(a.date), startOfDay(today))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li>
              <Link href="/venues" className="text-green-600 hover:text-green-500">
                Venues
              </Link>
            </li>
            <li>
              <span className="mx-2 text-gray-500">/</span>
              <Link
                href={`/venues/${venueId}`}
                className="text-green-600 hover:text-green-500"
              >
                {court?.venue.name}
              </Link>
            </li>
            <li>
              <span className="mx-2 text-gray-500">/</span>
              <span className="text-gray-700">Book Court</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Court</h1>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableDates.map((dayData) => {
                      const date = new Date(dayData.date);
                      const isSelected = selectedDate === dayData.date;
                      const hasAvailableSlots = dayData.timeSlots.some(slot => slot.available);
                      
                      return (
                        <button
                          key={dayData.date}
                          type="button"
                          disabled={!hasAvailableSlots}
                          onClick={() => setValue("date", dayData.date)}
                          className={`p-3 text-sm rounded-lg border transition-colors ${
                            isSelected
                              ? "border-green-500 bg-green-50 text-green-700"
                              : hasAvailableSlots
                              ? "border-gray-300 hover:border-green-300 text-gray-700"
                              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <div className="font-medium">
                            {format(date, "EEE")}
                          </div>
                          <div>
                            {format(date, "MMM d")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                {/* Time Selection */}
                {selectedDate && court && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Time
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {generateTimeSlots(court.openTime, court.closeTime).map((hour) => {
                        const isSelected = selectedStartTime === hour.toString();
                        const isAvailable = isTimeSlotAvailable(selectedDate, hour, duration);
                        
                        return (
                          <button
                            key={hour}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setValue("startTime", hour.toString())}
                            className={`p-2 text-sm rounded-md border transition-colors ${
                              isSelected
                                ? "border-green-500 bg-green-50 text-green-700"
                                : isAvailable
                                ? "border-gray-300 hover:border-green-300 text-gray-700"
                                : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {formatTime(hour)}
                          </button>
                        );
                      })}
                    </div>
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                    )}
                  </div>
                )}

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours)
                  </label>
                  <select
                    {...register("duration", { valueAsNumber: true })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                      <option key={hours} value={hours}>
                        {hours} hour{hours > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Any special requests or notes..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDate || !selectedStartTime}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Booking...
                    </div>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            {/* Court Details */}
            {court && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Court Details</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{court.name}</h4>
                    <p className="text-sm text-gray-600">{court.sport}</p>
                  </div>
                  
                  <div className="flex items-start text-sm">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600">{court.venue.name}</p>
                      <p className="text-gray-500">{court.venue.address}</p>
                      <p className="text-gray-500">{court.venue.city}, {court.venue.state}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {formatTime(court.openTime)} - {formatTime(court.closeTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <CurrencyRupeeIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      ₹{Number(court.pricePerHour).toFixed(0)}/hour
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Summary */}
            {selectedDate && selectedStartTime && duration && court && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {format(new Date(selectedDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">
                      {formatTime(parseInt(selectedStartTime))} - {formatTime(parseInt(selectedStartTime) + duration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{duration} hour{duration > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 mt-3">
                    <span>Total:</span>
                    <span className="text-green-600">₹{calculateTotalPrice()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Policy */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Booking Policy</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Bookings can be cancelled up to 2 hours in advance</li>
                <li>• Late cancellations may incur charges</li>
                <li>• Please arrive on time for your booking</li>
                <li>• Contact the venue for any issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>}>
      <BookingPageContent />
    </Suspense>
  );
}
