import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courtIdParam = searchParams.get("courtId");
    const dateParam = searchParams.get("date");

    if (!courtIdParam || !dateParam) {
      return NextResponse.json(
        { error: "Court ID and date are required" },
        { status: 400 }
      );
    }

    const courtId = parseInt(courtIdParam);
    const selectedDate = new Date(dateParam);

    if (isNaN(courtId) || isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid court ID or date format" },
        { status: 400 }
      );
    }

    // Check if court exists
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        Venue: {
          select: {
            approved: true
          }
        }
      }
    });

    if (!court || !court.Venue.approved) {
      return NextResponse.json(
        { error: "Court not found or venue not approved" },
        { status: 404 }
      );
    }

    // Get all bookings for the specified court and date
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        courtId,
        startTime: {
          gte: startDate,
          lt: endDate
        },
        status: {
          in: ["PENDING", "CONFIRMED", "COMPLETED"]
        }
      },
      select: {
        startTime: true,
        endTime: true,
        status: true
      },
      orderBy: {
        startTime: "asc"
      }
    });

    // Transform booking data for frontend
    const bookings = existingBookings.map(booking => ({
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: booking.status
    }));

    // Generate time slots with availability
    const timeSlots = [];
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    
    // Ensure we use proper timezone handling
    const selectedDateLocal = new Date(selectedDate.toLocaleDateString());

    for (let hour = court.openTime; hour < court.closeTime; hour++) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if slot is in the past
      const isPast = isToday && hour <= currentHour;

      // Check if slot conflicts with existing bookings
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = booking.startTime;
        const bookingEnd = booking.endTime;
        
        // Check if there's any overlap
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });

      timeSlots.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: !isPast && !hasConflict,
        isPast,
        hasConflict,
        price: Number(court.pricePerHour) // Ensure price is a number
      });
    }

    return NextResponse.json({
      courtId,
      date: dateParam,
      timeSlots,
      bookings,
      court: {
        name: court.name,
        sport: court.sport,
        pricePerHour: court.pricePerHour,
        openTime: court.openTime,
        closeTime: court.closeTime
      }
    });

  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}