import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
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

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id
      },
      include: {
        Payment: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel a completed booking" },
        { status: 400 }
      );
    }

    // Check if booking is within cancellation window (at least 2 hours before start time)
    const now = new Date();
    const minCancellationTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
    
    if (booking.startTime < minCancellationTime) {
      return NextResponse.json(
        { error: "Booking cannot be cancelled less than 2 hours before start time" },
        { status: 400 }
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED"
      },
      include: {
        Court: {
          include: {
            Venue: {
              select: {
                name: true
              }
            }
            
          }
        }
      }
    });

    // If there's a payment, we should initiate a refund process
    // For now, we'll just update the payment status to indicate a refund is needed
    if (booking.Payment && booking.Payment.status === "SUCCEEDED") {
      await prisma.payment.update({
        where: { id: booking.Payment.id },
        data: {
          status: "REFUNDED"
        }
      });
    }

    // TODO: Send cancellation email notification
    // TODO: Integrate with payment provider for automatic refund

    return NextResponse.json({
      id: updatedBooking.id,
      status: updatedBooking.status,
      message: "Booking cancelled successfully. Refund will be processed within 5-7 business days."
    });

  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}