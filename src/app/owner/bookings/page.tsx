"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface Booking {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  user: {
    fullName: string;
    email: string;
  };
  court: {
    name: string;
    sport: string;
    venue: {
      name: string;
    };
  };
  payment: {
    amount: number;
    status: string;
  } | null;
}

export default function OwnerBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "OWNER") {
      router.push("/auth/login");
      return;
    }

    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/owner/bookings");
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          console.error("Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [session, status, router]);

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status.toLowerCase() === filter;
  });

  const getStatusChip = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ExclamationCircleIcon className="w-4 h-4 mr-1" />
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Bookings</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all bookings for your venues.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">All Bookings</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("confirmed")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "confirmed"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("cancelled")}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === "cancelled"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue & Court</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserCircleIcon className="w-6 h-6 text-gray-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{booking.user.fullName}</div>
                          <div className="text-sm text-gray-500">{booking.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.court.venue.name}</div>
                      <div className="text-sm text-gray-500">{booking.court.name} ({booking.court.sport})</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.startTime).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.startTime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusChip(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{booking.payment ? Math.round(booking.payment.amount / 100) : 'N/A'}</div>
                      <div className={`text-sm ${booking.payment?.status === 'SUCCEEDED' ? 'text-green-600' : 'text-gray-500'}`}>
                        {booking.payment?.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900">No Bookings Found</h3>
              <p className="text-gray-500 mt-2">There are no bookings that match the selected filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
