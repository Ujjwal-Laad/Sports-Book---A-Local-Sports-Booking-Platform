import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint can be called by a cron job to update booking statuses
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    
    // Update bookings that have passed their end time to COMPLETED
    const updatedBookings = await prisma.booking.updateMany({
      where: {
        status: "CONFIRMED",
        endTime: {
          lt: now
        }
      },
      data: {
        status: "COMPLETED"
      }
    });

    console.log(`Updated ${updatedBookings.count} bookings to COMPLETED status`);

    return NextResponse.json({
      success: true,
      updatedCount: updatedBookings.count,
      message: `Updated ${updatedBookings.count} bookings to COMPLETED status`
    });

  } catch (error) {
    console.error("Error updating booking statuses:", error);
    return NextResponse.json(
      { error: "Failed to update booking statuses" },
      { status: 500 }
    );
  }
}

// GET endpoint to check which bookings need status updates (for debugging)
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    const bookingsToUpdate = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        endTime: {
          lt: now
        }
      },
      include: {
        User: {
          select: {
            fullName: true,
            email: true
          }
        },
        Court: {
          include: {
            Venue: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        endTime: "desc"
      }
    });

    return NextResponse.json({
      bookingsToUpdate: bookingsToUpdate.map(booking => ({
        id: booking.id,
        user: booking.User.fullName,
        venue: booking.Court.Venue.name,
        court: booking.Court.name,
        endTime: booking.endTime,
        status: booking.status
      })),
      count: bookingsToUpdate.length
    });

  } catch (error) {
    console.error("Error fetching bookings to update:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}