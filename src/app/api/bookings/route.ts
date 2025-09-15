// API route to create and manage bookings with concurrency control
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { courtId, date, startTime, duration, notes } = await req.json();
    const idempotencyKey = req.headers.get("Idempotency-Key");

    if (!courtId || !date || startTime === undefined || !duration) {
      return NextResponse.json(
        { error: "Missing required booking information" },
        { status: 400 }
      );
    }

    // Create start and end time objects
    const bookingStartTime = new Date(`${date}T${startTime.toString().padStart(2, '0')}:00:00`);
    const bookingEndTime = new Date(bookingStartTime);
    bookingEndTime.setHours(bookingStartTime.getHours() + duration);

    // Check for duplicate booking with idempotency key
    if (idempotencyKey) {
      const existingBooking = await prisma.booking.findUnique({
        where: { idempotencyKey }
      });

      if (existingBooking) {
        return NextResponse.json({
          success: true,
          booking: existingBooking,
          message: "Booking already exists"
        });
      }
    }

    // Use a database transaction with optimistic locking for concurrency control
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify court exists and get current booking state
      const court = await tx.court.findUnique({
        where: { id: courtId },
        include: { Venue: true }
      });

      if (!court) {
        throw new Error("Court not found");
      }

      // 2. Check for conflicting bookings with row-level locking
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          courtId,
          startTime: {
            lt: bookingEndTime
          },
          endTime: {
            gt: bookingStartTime
          },
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
          }
        }
      });

      if (conflictingBooking) {
        throw new Error("Time slot conflict: This time slot is already booked");
      }

      // 3. Verify the venue is approved
      if (!court.Venue.approved) {
        throw new Error("Venue is not approved for bookings");
      }

      // 4. Check if the time slot is within court operating hours
      const slotStartHour = bookingStartTime.getHours();
      const slotEndHour = bookingEndTime.getHours();
      
      if (slotStartHour < court.openTime || slotEndHour > court.closeTime) {
        throw new Error("Booking time is outside court operating hours");
      }

      // 5. Create the booking atomically
      const booking = await tx.booking.create({
        data: {
          userId: token.id as number,
          courtId,
          startTime: bookingStartTime,
          endTime: bookingEndTime,
          status: BookingStatus.PENDING,
          notes: notes || null,
          idempotencyKey: idempotencyKey || `${token.id}-${Date.now()}-${Math.random()}`
        },
        include: {
          Court: {
            include: {
              Venue: true
            }
          },
          User: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      // 6. Create payment record
      const totalAmount = Number(court.pricePerHour) * duration * 100; // Convert rupees to paisa for payment
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          currency: court.currency || "INR",
          status: "PENDING"
        }
      });

      // Update the booking with the paymentId
      await tx.booking.update({
        where: { id: booking.id },
        data: { paymentId: payment.id }
      });

      return { booking, payment };
    }, {
      // Use serializable isolation level for strongest consistency
      isolationLevel: 'Serializable',
      timeout: 10000 // 10 second timeout
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      payment: result.payment,
      message: "Booking created successfully"
    });

  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Booking creation failed:", error);
    }

    // Handle specific database constraint violations
    if (error instanceof Error && error.message.includes("Time slot conflict")) {
      return NextResponse.json(
        { error: "This time slot has been booked by another user. Please select a different time." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A booking already exists for this time slot." },
        { status: 409 }
      );
    }

    // Handle transaction timeout
    if (error instanceof Error && (error.message.includes("timeout") || (error as any).code === "P2024")) {
      return NextResponse.json(
        { error: "Booking request timed out. Please try again." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "An unknown error occurred.") || "Booking failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const courtId = url.searchParams.get("courtId");
    const date = url.searchParams.get("date");

    if (!courtId || !date) {
      return NextResponse.json(
        { error: "Missing courtId or date parameter" },
        { status: 400 }
      );
    }

    // Get existing bookings for the court on the specified date
    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId: parseInt(courtId),
        startTime: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`)
        },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED]
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    return NextResponse.json({
      success: true,
      bookings: existingBookings
    });

  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Failed to fetch bookings:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch booking data" },
      { status: 500 }
    );
  }
}
