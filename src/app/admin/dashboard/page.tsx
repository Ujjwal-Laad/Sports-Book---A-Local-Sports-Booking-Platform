"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

interface AdminStats {
  totalUsers: number;
  totalFacilityOwners: number;
  totalVenues: number;
  totalBookings: number;
  pendingApprovals: number;
  totalRevenue: number;
  activeUsers: number;
  reportedIssues: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalFacilityOwners: 0,
    totalVenues: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    totalRevenue: 0,
    activeUsers: 0,
    reportedIssues: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Fetch actual stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch admin stats:', response.statusText);
          // Fallback to empty stats on error
          setStats({
            totalUsers: 0,
            totalFacilityOwners: 0,
            totalVenues: 0,
            totalBookings: 0,
            pendingApprovals: 0,
            totalRevenue: 0,
            activeUsers: 0,
            reportedIssues: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        // Fallback to empty stats on error
        setStats({
          totalUsers: 0,
          totalFacilityOwners: 0,
          totalVenues: 0,
          totalBookings: 0,
          pendingApprovals: 0,
          totalRevenue: 0,
          activeUsers: 0,
          reportedIssues: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
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
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: UserGroupIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+15% from last month",
      changeType: "increase"
    },
    {
      title: "Facility Owners",
      value: stats.totalFacilityOwners,
      icon: BuildingOfficeIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+8 new this month",
      changeType: "increase"
    },
    {
      title: "Total Venues",
      value: stats.totalVenues,
      icon: BuildingOfficeIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+12 this month",
      changeType: "increase"
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings.toLocaleString(),
      icon: CalendarDaysIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      change: "+22% from last month",
      changeType: "increase"
    },
    {
      title: "Platform Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      change: "+18% from last month",
      changeType: "increase"
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: UserGroupIcon,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      change: "Online now",
      changeType: "neutral"
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: ClockIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "Requires attention",
      changeType: "warning"
    },
    {
      title: "Reported Issues",
      value: stats.reportedIssues,
      icon: ExclamationTriangleIcon,
      color: "text-red-600",
      bgColor: "bg-red-100",
      change: "2 resolved today",
      changeType: "neutral"
    }
  ];

  const pendingActions = [
    {
      id: 1,
      type: "venue_approval",
      title: "Elite Sports Complex - Pending Approval",
      description: "New venue registration requires review",
      urgency: "high",
      time: "2 hours ago"
    },
    {
      id: 2,
      type: "user_report",
      title: "User Report - Inappropriate Behavior",
      description: "User reported for violation of community guidelines",
      urgency: "medium",
      time: "1 day ago"
    },
    {
      id: 3,
      type: "venue_approval",
      title: "Tennis Academy Pro - Pending Approval",
      description: "New venue registration requires review",
      urgency: "low",
      time: "3 days ago"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Platform overview and management tools
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/facilities"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <BuildingOfficeIcon className="w-5 h-5 mr-2" />
              Review Facilities ({stats.pendingApprovals})
            </Link>
            
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    className={`text-sm ${
                      stat.changeType === "increase"
                        ? "text-green-600"
                        : stat.changeType === "decrease"
                        ? "text-red-600"
                        : stat.changeType === "warning"
                        ? "text-orange-600"
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

        {/* Pending Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Actions</h3>
          <div className="space-y-4">
            {pendingActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    action.urgency === "high"
                      ? "bg-red-100"
                      : action.urgency === "medium"
                      ? "bg-yellow-100"
                      : "bg-gray-100"
                  }`}>
                    {action.type === "venue_approval" ? (
                      <BuildingOfficeIcon className={`w-5 h-5 ${
                        action.urgency === "high"
                          ? "text-red-600"
                          : action.urgency === "medium"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`} />
                    ) : (
                      <ExclamationTriangleIcon className={`w-5 h-5 ${
                        action.urgency === "high"
                          ? "text-red-600"
                          : action.urgency === "medium"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`} />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{action.title}</p>
                    <p className="text-xs text-gray-600">{action.description}</p>
                    <p className="text-xs text-gray-500">{action.time}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors">
                    <CheckCircleIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors">
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/admin/actions"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All Pending Actions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
