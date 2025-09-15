import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

// Schema for creating a review (working with current database schema)
const createReviewSchema = z.object({
  venueId: z.number().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
});

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createReviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validation.error.format() 
        },
        { status: 400 }
      );
    }

    const { venueId, rating, comment } = validation.data;

    // Check if venue exists and is approved
    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
        approved: true,
      }
    });

    if (!venue) {
      return NextResponse.json(
        { error: "Venue not found" },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this venue
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        venueId: venueId,
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this venue" },
        { status: 409 }
      );
    }

    // Check if user has a completed booking for this venue (optional verification)
    const userBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
        Court: {
          venueId: venueId
        }
      }
    });

    if (!userBooking) {
      return NextResponse.json(
        { error: "You can only review venues where you have completed bookings" },
        { status: 403 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        venueId: venueId,
        rating: rating,
        comment: comment || null,
      },
      include: {
        User: {
          select: {
            fullName: true,
            avatarUrl: true,
          }
        }
      }
    });

    // Update venue's average rating
    await updateVenueRating(venueId);

    return NextResponse.json(
      {
        message: "Review created successfully",
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          user: {
            name: review.User.fullName,
            avatar: review.User.avatarUrl,
          }
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/reviews - Get reviews for a venue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueIdParam = searchParams.get("venueId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!venueIdParam) {
      return NextResponse.json({ error: "Venue ID is required" }, { status: 400 });
    }

    const venueId = parseInt(venueIdParam);
    if (isNaN(venueId)) {
      return NextResponse.json({ error: "Invalid venue ID" }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Get reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { venueId },
        include: {
          User: {
            select: {
              fullName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.review.count({ where: { venueId } })
    ]);

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        name: review.User.fullName,
        avatar: review.User.avatarUrl,
      }
    }));

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to update venue rating
async function updateVenueRating(venueId: number) {
  try {
    const reviews = await prisma.review.findMany({
      where: { venueId },
      select: { rating: true }
    });

    if (reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      await prisma.venue.update({
        where: { id: venueId },
        data: { 
          rating: Math.round(averageRating * 100) / 100 // Round to 2 decimal places
        }
      });
    }
  } catch (error) {
    console.error("Error updating venue rating:", error);
  }
}