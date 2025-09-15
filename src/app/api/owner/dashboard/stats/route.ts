import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { BookingStatus } from "@/generated/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const owner = await prisma.facilityOwner.findUnique({
      where: { userId: session.user.id },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    if (!owner) {
      // Check if user is OWNER role but doesn't have a facility owner profile
      if (session.user.role === "OWNER") {
        // Create facility owner profile
        const newOwner = await prisma.facilityOwner.create({
          data: {
            userId: session.user.id
          },
          include: {
            User: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true
              }
            }
          }
        });
        
        // Return empty stats for new owner
        return NextResponse.json({
          totalVenues: 0,
          totalBookings: 0,
          totalEarnings: 0,
          activeVenues: 0,
          todayBookings: 0,
          pendingApprovals: 0,
          bookingGrowth: 0,
          earningsGrowth: 0,
          recentActivity: []
        });
      }
      
      return NextResponse.json(
        { message: "Owner profile not found. User role: " + session.user.role },
        { status: 404 }
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Get last month's date range for comparison
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get venue statistics first
    
    const venueStats = await prisma.venue.groupBy({
      by: ['approved'],
      where: { ownerId: owner.id },
      _count: { id: true }
    });
    
    

    // Get booking counts
    const totalBookings = await prisma.booking.count({
      where: {
        Court: {
          Venue: {
            ownerId: owner.id
          }
        }
      }
    });

    const thisMonthBookings = await prisma.booking.count({
      where: {
        Court: {
          Venue: {
            ownerId: owner.id
          }
        },
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth
        }
      }
    });

    const lastMonthBookings = await prisma.booking.count({
      where: {
        Court: {
          Venue: {
            ownerId: owner.id
          }
        },
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfMonth
        }
      }
    });

    const todayBookings = await prisma.booking.count({
      where: {
        Court: {
          Venue: {
            ownerId: owner.id
          }
        },
        startTime: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get venue counts
    const pendingVenues = await prisma.venue.count({
      where: {
        ownerId: owner.id,
        approved: false
      }
    });

    // Get earnings data
    const totalEarnings = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        Booking: {
          Court: {
            Venue: {
              ownerId: owner.id
            }
          }
        },
        status: "SUCCEEDED"
      }
    });

    const thisMonthEarnings = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        Booking: {
          Court: {
            Venue: {
              ownerId: owner.id
            }
          }
        },
        status: "SUCCEEDED",
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth
        }
      }
    });

    const lastMonthEarnings = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        Booking: {
          Court: {
            Venue: {
              ownerId: owner.id
            }
          }
        },
        status: "SUCCEEDED",
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfMonth
        }
      }
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: {
        Court: {
          Venue: {
            ownerId: owner.id
          }
        }
      },
      include: {
        Court: {
          include: {
            Venue: true
          }
        },
        User: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Process venue statistics
    let totalVenues = 0;
    let activeVenues = 0;

    venueStats.forEach(stat => {
      totalVenues += stat._count.id;
      if (stat.approved) {
        activeVenues += stat._count.id;
      }
    });

    // Calculate percentage changes
    const bookingGrowth = lastMonthBookings > 0 
      ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : thisMonthBookings > 0 ? 100 : 0;

    const thisMonthAmount = Number(thisMonthEarnings._sum.amount || 0);
    const lastMonthAmount = Number(lastMonthEarnings._sum.amount || 0);
    
    const earningsGrowth = lastMonthAmount > 0
      ? Math.round(((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100)
      : thisMonthAmount > 0 ? 100 : 0;

    const totalEarningsValue = Math.round(Number(totalEarnings._sum.amount || 0) / 100); // Convert from paise to rupees

    const stats = {
      totalVenues,
      totalBookings,
      totalEarnings: totalEarningsValue,
      activeVenues,
      todayBookings,
      pendingApprovals: pendingVenues,
      bookingGrowth,
      earningsGrowth,
      recentActivity: recentBookings.map(booking => ({
        id: booking.id,
        type: booking.status === BookingStatus.CONFIRMED ? 'booking' : 'pending_booking',
        message: `${booking.status === BookingStatus.CONFIRMED ? 'New booking' : 'Pending booking'} at ${booking.Court.name} - ${booking.Court.Venue.name}`,
        user: booking.User.fullName,
        amount: null, // We'll get payment info separately if needed
        createdAt: booking.createdAt,
        timeAgo: getTimeAgo(booking.createdAt)
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes > 0 ? `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago` : 'Just now';
  }
}
