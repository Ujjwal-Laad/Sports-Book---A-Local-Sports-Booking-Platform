import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get featured venues (approved venues with high ratings or recent activity)
    const featuredVenues = await prisma.venue.findMany({
      where: {
        approved: true,
      },
      include: {
        Court: {
          select: {
            sport: true,
            pricePerHour: true,
            currency: true,
          },
        },
        Review: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            Review: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      take: 6,
    });

    // Transform the data to include computed fields
    const transformedVenues = featuredVenues.map((venue) => {
      // Calculate average rating
      const avgRating =
        venue.Review.length > 0
          ? venue.Review.reduce((sum, review) => sum + review.rating, 0) /
            venue.Review.length
          : 0;

      // Get unique sports
      const sports = [...new Set(venue.Court.map((court) => court.sport))];

      // Get minimum price per hour
      const minPrice = 
        venue.Court.length > 0
          ? Math.min(...venue.Court.map((court) => Number(court.pricePerHour))) // Already in Rupees
          : 0;

      // Generate tags based on venue data
      const tags = [];
      if (avgRating >= 4.5) tags.push("Top Rated");
      if (minPrice < 500) tags.push("Budget Friendly"); // Less than ₹500
      if (venue.amenities.includes("Parking")) tags.push("Parking");
      if (venue.amenities.includes("Lighting")) tags.push("Night Play");

      return {
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        description: venue.description,
        address: venue.address,
        city: venue.city,
        state: venue.state,
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: venue._count.Review,
        sports,
        minPricePerHour: minPrice,
        currency: venue.Court[0]?.currency || "INR",
        amenities: venue.amenities,
        image: venue.image, // Include the image field
        tags: tags.slice(0, 3), // Limit to 3 tags
                Court: venue.Court // Map Court to courts for frontend compatibility

      };
    });

    return NextResponse.json(transformedVenues);
  } catch (error) {
    console.error("Error fetching featured venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured venues" },
      { status: 500 }
    );
  }
}
