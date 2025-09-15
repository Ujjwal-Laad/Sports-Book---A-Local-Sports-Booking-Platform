import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token || !token.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Payment: true,
        Court: {
          select: {
            pricePerHour: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.Payment?.status === "SUCCEEDED") {
      return NextResponse.json(
        { error: "Payment already succeeded for this booking" },
        { status: 400 }
      );
    }

    // Calculate amount in smallest currency unit (paisa for INR)
    // pricePerHour is stored in rupees, convert to paisa for Stripe
    const durationInMilliseconds = booking.endTime.getTime() - booking.startTime.getTime();
    const durationInHours = durationInMilliseconds / (1000 * 60 * 60);
    const amountInRupees = Number(booking.Court.pricePerHour) * durationInHours;
    const amount = Math.round(amountInRupees * 100); // Convert rupees to paisa

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "inr", // Assuming INR, adjust as needed
      metadata: { bookingId: booking.id.toString() },
    });

    // Update the payment record with the PaymentIntent ID
    if (booking.Payment) {
      await prisma.payment.update({
        where: { id: booking.Payment.id },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          amount: amount, // Ensure amount is consistent
          status: "PENDING", // Keep as PENDING until webhook confirms
        },
      });
    } else {
      // This case should ideally not happen if booking creation always creates a payment record
      console.warn("Booking found without an associated payment record.");
      // Optionally create a new payment record here if robust error handling is needed
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: `Failed to create payment intent: ${errorMessage}` },
      { status: 500 }
    );
  }
}
