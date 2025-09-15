import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, BookingStatus } from "@/generated/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    // Calculate offset
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BookingWhereInput = {
      userId: session.user.id
    };

    if (status && status !== "ALL") {
      where.status = status as BookingStatus;
    }

    // Get bookings with related data
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          Court: {
            include: {
              Venue: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  state: true
                }
              }
            }
          },
          Payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    // Transform booking data
    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      totalAmount: booking.Payment?.amount || 0,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      court: {
        id: booking.Court.id,
        name: booking.Court.name,
        sport: booking.Court.sport,
        venue: {
          id: booking.Court.Venue?.id,
          name: booking.Court.Venue?.name,
          address: booking.Court.Venue?.address,
          city: booking.Court.Venue?.city,
          state: booking.Court.Venue?.state
        }
      },
      payment: booking.Payment ? {
        id: booking.Payment.id,
        status: booking.Payment.status,
        amount: booking.Payment.amount
      } : null
    }));

    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
