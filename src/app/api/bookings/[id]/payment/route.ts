import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { BookingStatus } from "@/generated/prisma";

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

    const { status, paymentIntentId, paymentMethodId } = await request.json();

    console.log("Received payment callback:", { bookingId, status, paymentIntentId, paymentMethodId });

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Payment status is required" },
        { status: 400 }
      );
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Get booking with payment details
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id // Ensure user owns the booking
      },
      include: {
        Payment: true,
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
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    if (!booking.Payment) {
      return NextResponse.json(
        { error: "No payment record found for this booking" },
        { status: 404 }
      );
    }

    // Check if payment is already completed
    if (booking.Payment.status === "SUCCEEDED") {
      return NextResponse.json(
        { error: "Payment already completed" },
        { status: 400 }
      );
    }

    // Use a transaction to update both payment and booking status atomically
    const result = await prisma.$transaction(async (tx) => {
      let paymentStatus = "SUCCEEDED";
      let bookingStatus: "CONFIRMED" | "CANCELLED" | "PENDING" = BookingStatus.CONFIRMED;

      // Handle different payment scenarios
      if (status === "succeeded") {
        paymentStatus = "SUCCEEDED";
        bookingStatus = BookingStatus.CONFIRMED;
      } else if (status === "failed" || status === "canceled") {
        paymentStatus = "FAILED";
        bookingStatus = BookingStatus.CANCELLED;
      } else {
        throw new Error("Invalid payment status");
      }

      // Verify the payment intent with Stripe
      if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
        throw new Error("Invalid payment intent ID");
      }

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === "succeeded") {
          paymentStatus = "SUCCEEDED";
          bookingStatus = BookingStatus.CONFIRMED;
        } else if (paymentIntent.status === "canceled") {
          paymentStatus = "FAILED";
          bookingStatus = BookingStatus.CANCELLED;
        } else {
          paymentStatus = "PENDING";
          bookingStatus = BookingStatus.PENDING;
        }
      } catch (stripeError) {
        console.error("Error retrieving payment intent from Stripe:", stripeError);
        throw new Error("Failed to verify payment with Stripe");
      }

      // Update payment record
      const updatedPayment = await tx.payment.update({
        where: { id: booking.Payment!.id },
        data: {
          status: paymentStatus as any,
          stripePaymentIntentId: paymentIntentId || booking.Payment!.stripePaymentIntentId,
          paymentMethod: paymentMethodId || booking.Payment!.paymentMethod
        }
      });

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: bookingStatus
        },
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
          }
        }
      });

      return { updatedPayment, updatedBooking };
    });

    // Transform the response data
    const responseData = {
      id: result.updatedBooking.id,
      status: result.updatedBooking.status,
      startTime: result.updatedBooking.startTime.toISOString(),
      endTime: result.updatedBooking.endTime.toISOString(),
      court: {
        id: result.updatedBooking.Court.id,
        name: result.updatedBooking.Court.name,
        sport: result.updatedBooking.Court.sport,
        pricePerHour: result.updatedBooking.Court.pricePerHour,
        venue: result.updatedBooking.Court.Venue
      },
      payment: {
        id: result.updatedPayment.id,
        status: result.updatedPayment.status,
        amount: result.updatedPayment.amount,
        paymentMethod: result.updatedPayment.paymentMethod
      }
    };

    return NextResponse.json({
      success: true,
      booking: responseData,
      message: result.updatedPayment.status === "SUCCEEDED" 
        ? "Payment completed successfully" 
        : "Payment processing completed"
    });

  } catch (error) {
    console.error("Payment processing error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (error.message === "Invalid payment status") {
        return NextResponse.json(
          { error: "Invalid payment status provided" },
          { status: 400 }
        );
      }

      if (error.message.includes("Stripe")) {
        return NextResponse.json(
          { error: "Payment service error. Please try again later." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process payment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Get payment details for the booking
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id
      },
      include: {
        Payment: true // Changed from 'payment' to 'Payment'
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    if (!booking.Payment) { // Changed from 'booking.payment' to 'booking.Payment'
      return NextResponse.json(
        { error: "No payment record found for this booking" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      payment: {
        id: booking.Payment.id,
        status: booking.Payment.status,
        amount: booking.Payment.amount,
        currency: booking.Payment.currency,
        paymentMethod: booking.Payment.paymentMethod,
        stripePaymentIntentId: booking.Payment.stripePaymentIntentId,
        receiptUrl: booking.Payment.receiptUrl
      }
    });

  } catch (error) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment details" },
      { status: 500 }
    );
  }
}