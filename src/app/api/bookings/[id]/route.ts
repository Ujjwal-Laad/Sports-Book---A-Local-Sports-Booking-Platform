import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const bookingId = parseInt(resolvedParams.id);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Court: {
          include: {
            Venue: true,
          },
        },
        Payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Ensure the user requesting the booking is the one who made it
    if (booking.userId !== token.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this booking" },
        { status: 403 }
      );
    }

    // Transform booking data to use camelCase for relationships
    const transformedBooking = {
      id: booking.id,
      userId: booking.userId,
      courtId: booking.courtId,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      court: {
        id: booking.Court.id,
        name: booking.Court.name,
        sport: booking.Court.sport,
        pricePerHour: Number(booking.Court.pricePerHour),
        venue: {
          id: booking.Court.Venue.id,
          name: booking.Court.Venue.name,
          address: booking.Court.Venue.address,
          city: booking.Court.Venue.city,
          state: booking.Court.Venue.state,
        },
      },
      payment: booking.Payment ? {
        id: booking.Payment.id,
        amount: Number(booking.Payment.amount),
        status: booking.Payment.status,
      } : null,
    };

    return NextResponse.json(transformedBooking);
  } catch (error) {
    console.error("Failed to fetch booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking data" },
      { status: 500 }
    );
  }
}
