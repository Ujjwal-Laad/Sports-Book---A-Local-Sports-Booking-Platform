import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(request: Request) {
  try {
    const { searchParams, pathname } = new URL(request.url);
    console.log("Search Params:", searchParams.toString());
    console.log("Pathname:", pathname);

    // Handle featured venues endpoint
    if (pathname.includes('/featured')) {
      const featuredVenues = await prisma.venue.findMany({
        where: {
          approved: true,
        },
        include: {
          Court: {
            select: {
              id: true,
              name: true,
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
        take: 6, // Limit to 6 featured venues
        orderBy: {
          rating: 'desc', // Order by rating to get best venues first
        },
      });

      // Transform venues for featured display
      const transformedFeatured = featuredVenues.map((venue) => {
        // Calculate average rating
        const avgRating =
          venue.Review.length > 0
            ? venue.Review.reduce((sum, review) => sum + review.rating, 0) /
              venue.Review.length
            : 0;

        // Get unique sports
        const sports = [...new Set(venue.Court.map((court) => court.sport))];

        // Get minimum price
        const prices = venue.Court.map((court) => Number(court.pricePerHour));
        const minPricePerHour = prices.length > 0 ? Math.min(...prices) : 0;

        // Generate tags
        const tags = [];
        if (avgRating >= 4.5) tags.push("Top Rated");
        if (minPricePerHour < 500) tags.push("Budget Friendly");
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
          minPricePerHour,
          currency: venue.Court[0]?.currency || "INR",
          amenities: venue.amenities,
          image: venue.image || null,
          tags: tags.slice(0, 3),
        };
      });

      return NextResponse.json(transformedFeatured);
    }

    // Parse query parameters
    const search = searchParams.get("search") || "";
    const sport = searchParams.get("sport") || "";
    const city = searchParams.get("city") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const rating = searchParams.get("rating");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build where clause
    const whereConditions: object[] = [];
    const where: { [key: string]: unknown } = {
      approved: true,
    };

    // Search filter
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    // City filter
    if (city) {
      whereConditions.push({
        city: { equals: city, mode: "insensitive" },
      });
    }

    // Sport filter
    if (sport) {
      whereConditions.push({
        Court: {
          some: {
            sport: { equals: sport, mode: "insensitive" },
          },
        },
      });
    }

    // Price filter
    if (minPrice || maxPrice) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);

      whereConditions.push({
        Court: {
          some: {
            pricePerHour: priceFilter,
          },
        },
      });
    }

    // Rating filter
    if (rating) {
      whereConditions.push({
        rating: {
          gte: parseFloat(rating),
        },
      });
    }

    // Apply conditions to where clause
    if (whereConditions.length > 0) {
      where.AND = whereConditions;
    }
    console.log("Prisma Where Clause:", JSON.stringify(where, null, 2));

    // Calculate offset
    const skip = (page - 1) * limit;

    // Build order by clause
    let orderBy: { [key: string]: unknown } = {};
    switch (sortBy) {
      case "price":
        orderBy = {
          Court: {
            _min: {
              pricePerHour: sortOrder as "asc" | "desc",
            },
          },
        };
        break;
      case "rating":
        orderBy = { rating: sortOrder as "asc" | "desc" };
        break;
      case "name":
      default:
        orderBy = { name: sortOrder as "asc" | "desc" };
        break;
    }

    // Get venues with related data
    const [venues, totalCount] = await Promise.all([
      prisma.venue.findMany({
        where,
        include: {
          Court: {
            select: {
              id: true,
              name: true,
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
        skip,
        take: limit,
        orderBy,
      }),
      prisma.venue.count({ where }),
    ]);
    console.log("Venues from DB:", venues.length);

    // Transform venues with computed fields
    const transformedVenues = venues.map((venue) => {
      // Calculate average rating
      const avgRating =
        venue.Review.length > 0
          ? venue.Review.reduce((sum, review) => sum + review.rating, 0) /
            venue.Review.length
          : 0;

      // Get unique sports
      const sports = [...new Set(venue.Court.map((court) => court.sport))];

      // Get price range (convert Decimal to number)
      const prices = venue.Court.map((court) => Number(court.pricePerHour));
      const minPricePerHour = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPricePerHour = prices.length > 0 ? Math.max(...prices) : 0;

      // Generate tags
      const tags = [];
      if (avgRating >= 4.5) tags.push("Top Rated");
      if (minPricePerHour < 500) tags.push("Budget Friendly"); // Less than ₹500
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
        minPricePerHour,
        maxPricePerHour,
        currency: venue.Court[0]?.currency || "INR",
        amenities: venue.amenities,
        image: venue.image || null,
        tags: tags.slice(0, 3),
        courts: venue.Court,
      };
    });

    // Get available filters for the sidebar
    const [allCities, allSports] = await Promise.all([
      prisma.venue.findMany({
        where: { approved: true },
        select: { city: true },
        distinct: ["city"],
      }),
      prisma.court.findMany({
        where: { Venue: { approved: true } },
        select: { sport: true },
        distinct: ["sport"],
      }),
    ]);

    const filters = {
      cities: allCities.map((v: { city: string }) => v.city).sort(),
      sports: allSports.map((c: { sport: string }) => c.sport).sort(),
    };

    return NextResponse.json({
      venues: transformedVenues,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      filters,
    });
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}
