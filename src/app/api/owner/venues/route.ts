// /src/app/api/owner/venues/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import slugify from "slugify";
import { Prisma } from "@prisma/client";
import { venueSchema } from "@/lib/schemas/venue";
import { z } from "zod";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "@/lib/cloudinary";

type VenueFormData = z.infer<typeof venueSchema>;

// POST /api/owner/venues
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let cloudinaryResult: { public_id: string; secure_url: string } | null = null;

  try {
    const contentType = request.headers.get("content-type");
    let venueData: VenueFormData;

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const venueDataString = formData.get("venueData") as string;
      if (!venueDataString) {
        return NextResponse.json(
          { message: "Missing venueData" },
          { status: 400 }
        );
      }
      venueData = JSON.parse(venueDataString);

      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            {
              message: `Invalid file type: ${imageFile.type}. Only JPEG, PNG, and WebP are allowed.`,
            },
            { status: 400 }
          );
        }
        if (imageFile.size > maxSize) {
          return NextResponse.json(
            { message: "File too large (max 10MB)" },
            { status: 400 }
          );
        }

        try {
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          cloudinaryResult = await uploadImageToCloudinary(buffer, "venues");
        } catch (err) {
          console.error("Cloudinary upload failed:", err);
          return NextResponse.json(
            { message: "Failed to upload image" },
            { status: 500 }
          );
        }
      }
    } else {
      venueData = await request.json();
    }

    const validated = venueSchema.safeParse(venueData);
    if (!validated.success) {
      return NextResponse.json(
        {
          message: "Invalid data",
          errors: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { courts, ...venueFields } = validated.data;

    const slug = slugify(venueFields.name, { lower: true, strict: true });

    const newVenue = await prisma.$transaction(async (tx) => {
      // Check if venue with this slug already exists
      const existingVenue = await tx.venue.findUnique({ where: { slug } });
      if (existingVenue) {
        throw new Error(
          "Venue with this name already exists. Please choose a different name."
        );
      }

      // Find or create owner within transaction
      let owner = await tx.facilityOwner.findUnique({
        where: { userId: session.user.id },
      });

      if (!owner) {
        owner = await tx.facilityOwner.create({
          data: { userId: session.user.id },
        });
      }

      // Create the venue with courts
      return tx.venue.create({
        data: {
          ...venueFields,
          ownerId: owner.id,
          slug,
          image: cloudinaryResult?.secure_url || null,
          imagePublicId: cloudinaryResult?.public_id || null,
          approved: false, // Default to not approved
          Court: {
            create: courts.map((court) => ({
              ...court,
              pricePerHour: court.pricePerHour,
            })),
          },
        },
      });
    });

    return NextResponse.json(newVenue, { status: 201 });
  } catch (error) {
    console.error("Error creating venue:", error);

    if (cloudinaryResult?.public_id) {
      try {
        await deleteImageFromCloudinary(cloudinaryResult.public_id);
      } catch (cleanupError) {
        console.error("Failed to cleanup Cloudinary image:", cleanupError);
      }
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      return NextResponse.json(
        { message: "A venue with this name already exists." },
        { status: 409 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET /api/owner/venues
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create owner
    let owner = await prisma.facilityOwner.findUnique({
      where: { userId: session.user.id },
    });

    if (!owner) {
      owner = await prisma.facilityOwner.create({
        data: { userId: session.user.id },
      });
    }

    const venues = await prisma.venue.findMany({
      where: { ownerId: owner.id },
      include: { Court: true },
    });

    // Transform the response to match frontend expectations
    const transformedVenues = venues.map((venue) => ({
      ...venue,
      courts: venue.Court.map(court => ({
        ...court,
        pricePerHour: court.pricePerHour, // Already in correct format
      })),
    }));

    return NextResponse.json(transformedVenues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}
