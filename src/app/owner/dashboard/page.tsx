"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
  totalVenues: number;
  totalBookings: number;
  totalEarnings: number;
  activeVenues: number;
  todayBookings: number;
  pendingApprovals: number;
  bookingGrowth: number;
  earningsGrowth: number;
  recentActivity: Array<{
    id: number;
    type: string;
    message: string;
    user: string;
    amount: number | null;
    createdAt: string;
    timeAgo: string;
  }>;
}

interface PopularSport {
  name: string;
  venueCount: number;
  image: string;
}

export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalVenues: 0,
    totalBookings: 0,
    totalEarnings: 0,
    activeVenues: 0,
    todayBookings: 0,
    pendingApprovals: 0,
    bookingGrowth: 0,
    earningsGrowth: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);
  const [popularSports, setPopularSports] = useState<PopularSport[]>([]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Fetch actual stats and venues from API
    const fetchData = async () => {
      try {
        const [statsResponse, venuesResponse] = await Promise.all([
          fetch("/api/owner/dashboard/stats"),
          fetch("/api/owner/venues"),
        ]);

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.error("Failed to fetch dashboard stats");
        }

        if (venuesResponse.ok) {
          const venuesData = await venuesResponse.json();
          setVenues(venuesData);
        } else {
          console.error("Failed to fetch venues");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Venues",
      value: stats.totalVenues,
      icon: BuildingOfficeIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: `${stats.totalVenues > 0 ? "All venues" : "No venues yet"}`,
      changeType: "neutral",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: CalendarDaysIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: `${stats.bookingGrowth > 0 ? "+" : ""}${
        stats.bookingGrowth
      }% from last month`,
      changeType:
        stats.bookingGrowth > 0
          ? "increase"
          : stats.bookingGrowth < 0
          ? "decrease"
          : "neutral",
    },
    {
      title: "Total Earnings",
      value: `₹${stats.totalEarnings.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: `${stats.earningsGrowth > 0 ? "+" : ""}${
        stats.earningsGrowth
      }% from last month`,
      changeType:
        stats.earningsGrowth > 0
          ? "increase"
          : stats.earningsGrowth < 0
          ? "decrease"
          : "neutral",
    },
    {
      title: "Active Venues",
      value: stats.activeVenues,
      icon: ChartBarIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: `${stats.activeVenues}/${stats.totalVenues} venues active`,
      changeType:
        stats.activeVenues === stats.totalVenues && stats.totalVenues > 0
          ? "increase"
          : "neutral",
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: UserGroupIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      change:
        stats.todayBookings > 0
          ? `${stats.todayBookings} booking${
              stats.todayBookings > 1 ? "s" : ""
            } today`
          : "No bookings today",
      changeType: stats.todayBookings > 0 ? "increase" : "neutral",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: BuildingOfficeIcon,
      color: "text-red-600",
      bgColor: "bg-red-100",
      change:
        stats.pendingApprovals > 0
          ? `${stats.pendingApprovals} awaiting approval`
          : "All venues approved",
      changeType: stats.pendingApprovals > 0 ? "neutral" : "increase",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.fullName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your sports facilities today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/owner/venues/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add New Venue
            </Link>
            <Link
              href="/owner/venues"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BuildingOfficeIcon className="w-5 h-5 mr-2" />
              Manage Venues
            </Link>
            <Link
              href="/owner/bookings"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CalendarDaysIcon className="w-5 h-5 mr-2" />
              View Bookings
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    className={`text-sm ${
                      stat.changeType === "increase"
                        ? "text-green-600"
                        : stat.changeType === "decrease"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Venues Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Venues
              </h3>
              <Link
                href="/owner/venues"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {venues.length > 0 ? (
                venues.slice(0, 3).map((venue) => (
                  <div
                    key={venue.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={venue.image || "/placeholder.svg"}
                      alt={venue.name}
                      className="w-16 h-16 rounded-md object-cover mr-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {venue.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {venue.courts?.length || 0} court
                        {(venue.courts?.length || 0) !== 1 ? "s" : ""} •{" "}
                        {venue.city}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        venue.approved
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {venue.approved ? "Active" : "Pending"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 mb-3">No venues yet</p>
                  <Link
                    href="/owner/venues/new"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Your First Venue
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "booking"
                          ? "bg-green-100"
                          : activity.type === "payment"
                          ? "bg-blue-100"
                          : "bg-yellow-100"
                      }`}
                    >
                      {activity.type === "booking" ? (
                        <CalendarDaysIcon
                          className={`w-4 h-4 ${
                            activity.type === "booking"
                              ? "text-green-600"
                              : activity.type === "payment"
                              ? "text-blue-600"
                              : "text-yellow-600"
                          }`}
                        />
                      ) : activity.type === "payment" ? (
                        <CurrencyDollarIcon className="w-4 h-4 text-blue-600" />
                      ) : (
                        <BuildingOfficeIcon className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {activity.message}
                        {activity.amount &&
                          ` - ₹${activity.amount.toLocaleString()}`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {activity.user && `by ${activity.user} • `}
                        {activity.timeAgo}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <Link
                href="/owner/bookings"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All Bookings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
