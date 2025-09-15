import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";

// GET: fetch pending venues for admin
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || token.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const pendingVenues = await prisma.venue.findMany({
      where: { approved: false },
      include: {
        FacilityOwner: {
          include: {
            User: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        Court: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const transformed = pendingVenues.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      address: v.address,
      city: v.city,
      state: v.state,
      country: v.country,
      amenities: v.amenities,
      photos: v.image ? [v.image] : [],
      approved: v.approved,
      owner: {
        id: v.FacilityOwner.User.id,
        fullName: v.FacilityOwner.User.fullName,
        email: v.FacilityOwner.User.email,
        businessName: v.FacilityOwner.businessName || undefined,
      },
      courts: v.Court.map((c) => ({
        id: c.id,
        name: c.name,
        sport: c.sport,
        pricePerHour: c.pricePerHour,
        currency: c.currency,
        openTime: c.openTime,
        closeTime: c.closeTime,
      })),
      createdAt: v.createdAt.toISOString(),
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("GET admin facilities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending facilities" },
      { status: 500 }
    );
  }
}

// PATCH: approve a venue
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || token.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { venueId } = await req.json();
    if (!venueId)
      return NextResponse.json(
        { error: "venueId is required" },
        { status: 400 }
      );

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });
    if (!venue)
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    if (venue.approved)
      return NextResponse.json(
        { error: "Venue already approved" },
        { status: 400 }
      );

    await prisma.venue.update({
      where: { id: venueId },
      data: { approved: true },
    });

    return NextResponse.json({
      success: true,
      message: "Venue approved successfully",
    });
  } catch (error) {
    console.error("PATCH admin facility error:", error);
    return NextResponse.json(
      { error: "Failed to approve venue" },
      { status: 500 }
    );
  }
}


// DELETE: reject a venue
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || token.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const venueId = Number(searchParams.get("venueId"));
    if (!venueId)
      return NextResponse.json(
        { error: "venueId is required" },
        { status: 400 }
      );

    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue)
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });

    await prisma.venue.delete({ where: { id: venueId } });

    return NextResponse.json({
      success: true,
      message: "Venue rejected and removed",
    });
  } catch (error) {
    console.error("DELETE admin facility error:", error);
    return NextResponse.json(
      { error: "Failed to reject venue" },
      { status: 500 }
    );
  }
}
