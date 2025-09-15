import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { Role, BookingStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    // Check if user is admin
    if (!token || token.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalFacilityOwners,
      totalVenues,
      totalBookings,
      pendingApprovals,
      totalRevenueResult,
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),

      // Total facility owners count
      prisma.user.count({
        where: { role: Role.OWNER },
      }),

      // Total venues count
      prisma.venue.count(),

      // Total bookings count
      prisma.booking.count(),

      // Pending venue approvals
      prisma.venue.count({
        where: { approved: false },
      }),

      // Total revenue (sum of all succeeded payments)
      prisma.payment.aggregate({
        where: { status: "SUCCEEDED" },
        _sum: { amount: true },
      }),
    ]);
    const stats = {
      totalUsers,
      totalFacilityOwners,
      totalVenues,
      totalBookings,
      pendingApprovals,
      totalRevenue: Math.round(Number(totalRevenueResult._sum.amount ?? 0) / 100), // Convert from paise to rupees
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
