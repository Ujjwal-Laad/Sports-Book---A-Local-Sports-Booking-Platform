// src/lib/schemas/venue.ts
import { z } from "zod";

export const venueSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  amenities: z.array(z.string()).optional(),
  courts: z.array(z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Court name is required"),
    sport: z.string().min(1, "Sport is required"),
    pricePerHour: z.number().positive("Price must be positive").min(1, "Price must be at least ₹1").max(10000, "Price cannot exceed ₹10,000"),
    currency: z.string(), // Changed to required string
    openTime: z.number().min(0).max(23),
    closeTime: z.number().min(1).max(24),
  })).min(1, "At least one court is required"),
});

export type VenueFormData = z.infer<typeof venueSchema>;
