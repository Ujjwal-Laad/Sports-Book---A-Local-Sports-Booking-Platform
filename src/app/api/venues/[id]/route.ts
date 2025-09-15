// API route to fetch individual venue details with courts, reviews, and statistics
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const venueId = parseInt(resolvedParams.id);

    if (isNaN(venueId)) {
      return NextResponse.json({ error: "Invalid venue ID" }, { status: 400 });
    }

    const venue = await prisma.venue.findUnique({
      where: {
        id: venueId,
        approved: true,
      },
      include: {
        FacilityOwner: {
          include: {
            User: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        Court: {
          orderBy: {
            name: "asc",
          },
        },
        Review: {
          include: {
            User: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            Review: true,
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Calculate average rating
    const avgRating =
      venue.Review.length > 0
        ? venue.Review.reduce((sum, review) => sum + review.rating, 0) /
          venue.Review.length
        : 0;

    // Get unique sports
    const sports = [...new Set(venue.Court.map((court) => court.sport))];

    // Get price range
    const prices = venue.Court.map((court) => Number(court.pricePerHour));
    const minPrice = prices.length > 0 ? Math.min(...prices)  : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices)  : 0;

    // Get operating hours
    const openTimes = venue.Court.map((court) => court.openTime);
    const closeTimes = venue.Court.map((court) => court.closeTime);
    const earliestOpen = openTimes.length > 0 ? Math.min(...openTimes) : 6;
    const latestClose = closeTimes.length > 0 ? Math.max(...closeTimes) : 22;

    // Transform data
    const transformedVenue = {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      description: venue.description,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      latitude: venue.latitude,
      longitude: venue.longitude,
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: venue._count.Review,
      sports,
      minPrice,
      maxPrice,
      currency: venue.Court[0]?.currency || "INR",
      operatingHours: {
        open: earliestOpen,
        close: latestClose,
      },
      amenities: venue.amenities,
      photos: venue.image ? [venue.image] : [], // Map single image to photos array
      courts: venue.Court.map((court) => ({
        id: court.id,
        name: court.name,
        sport: court.sport,
        pricePerHour: court.pricePerHour, // Convert to Rupees
        currency: court.currency,
        openTime: court.openTime,
        closeTime: court.closeTime,
      })),
      reviews: venue.Review.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
          name: review.User.fullName,
          avatar: review.User.avatarUrl,
        },
      })),
      owner: {
        name: venue.FacilityOwner.User.fullName,
        businessName: venue.FacilityOwner.businessName,
        phone: venue.FacilityOwner.phone,
      },
    };

    return NextResponse.json(transformedVenue);
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error("Venue fetch error:", error);
    }
    return NextResponse.json(
      { error: "Failed to fetch venue" },
      { status: 500 }
    );
  }
}
