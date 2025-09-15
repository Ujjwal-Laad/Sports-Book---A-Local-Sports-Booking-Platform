


// API route to fetch specific court details for booking
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const resolvedParams = await params;
    const venueId = parseInt(resolvedParams.id);
    const courtId = parseInt(resolvedParams.courtId);

    if (isNaN(venueId) || isNaN(courtId)) {
      return NextResponse.json(
        { error: "Invalid venue ID or court ID" },
        { status: 400 }
      );
    }

    const court = await prisma.court.findFirst({
      where: {
        id: courtId,
        venueId: venueId,
        Venue: {
          approved: true
        }
      },
      include: {
        Venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            approved: true
          }
        }
      }
    });

    if (!court) {
      return NextResponse.json(
        { error: "Court not found or venue not approved" },
        { status: 404 }
      );
    }

    return NextResponse.json(court);

  } catch (error) {
    // Log error for debugging purposes
    if (process.env.NODE_ENV === 'development') {
      console.error("Court fetch error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch court details" },
      { status: 500 }
    );
  }
}
