"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { venueSchema } from "@/lib/schemas/venue";
import Link from "next/link";

const SPORTS_OPTIONS = [
  "Badminton",
  "Tennis",
  "Football",
  "Cricket",
  "Basketball",
  "Volleyball",
  "Squash",
  "Table Tennis",
];

const AMENITIES_OPTIONS = [
  "Parking",
  "Changing Rooms",
  "Showers",
  "Refreshments",
  "Equipment Rental",
  "Air Conditioning",
  "Lighting",
  "Sound System",
];

// Use schema-inferred type everywhere
type VenueFormValues = z.infer<typeof venueSchema> & {
  courts: Array<{
    name: string;
    sport: string;
    pricePerHour: number;
    currency: string; // Explicitly define as string
    openTime: number;
    closeTime: number;
    id?: number;
  }>;
};

export default function EditVenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [venue, setVenue] = useState<VenueFormValues | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    mode: 'onChange', // Validate on change to get real-time validation
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      amenities: [],
      courts: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "courts",
  });

  // Debug form validation
  useEffect(() => {
    console.log("📋 Form validation state:", { isValid, errors, isLoading });
    if (Object.keys(errors).length > 0) {
      console.log("❌ Form validation errors:", errors);

      // Log specific error details for debugging
      Object.entries(errors).forEach(([field, error]) => {
        console.log(`🚨 Field "${field}" error:`, error?.message || error);
      });
    }
  }, [isValid, errors, isLoading]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "OWNER") {
      router.push("/auth/login");
      return;
    };

    const fetchVenue = async () => {
      try {
        const response = await fetch(`/api/owner/venues/${venueId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch venue");
        }

        const venueData: VenueFormValues = await response.json();

        // Ensure currency is always a string for each court, defaulting to 'INR' if undefined
        // Also remove latitude/longitude as they're not in the schema
        const { latitude, longitude, ...venueDataWithoutCoords } = venueData as any;
        const processedVenueData = {
          ...venueDataWithoutCoords,
          courts: venueData.courts.map(court => ({
            ...court,
            currency: court.currency || "INR",
          })),
        };

        setVenue(processedVenueData);

        // Reset form with fetched venue data
        console.log("🔄 Resetting form with venue data:", processedVenueData);
        reset(processedVenueData);
      } catch (error: unknown) {
        console.error("Error fetching venue:", error);
        setFetchError(
          error instanceof Error ? error.message : "Failed to fetch venue"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (venueId) {
      fetchVenue();
    }
  }, [session, status, router, venueId, reset]);

  const onSubmit = async (data: VenueFormValues) => {
    console.log("🚀 onSubmit called with data:", data);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create a deep copy and ensure prices are in the correct format for the API
      const payload = JSON.parse(JSON.stringify(data));
      
      const response = await fetch(`/api/owner/venues/${venueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Submit payload:", JSON.stringify(payload, null, 2));

      // Log specific court price details
      if (payload.courts) {
        payload.courts.forEach((court: any, index: number) => {
          console.log(`🏟️ Court ${index + 1} price details:`, {
            name: court.name,
            pricePerHour: court.pricePerHour,
            priceType: typeof court.pricePerHour
          });
        });
      }

      if (response.ok) {
        console.log("Venue updated successfully");
        router.push("/owner/venues");
      } else {
        const errorData = await response.json();
        console.error("Update failed with response:", response.status, errorData);

        if (errorData.details) {
          // Handle validation errors
          if (typeof errorData.details === 'string') {
            setSubmitError(`Submission failed: ${errorData.details}`);
          } else if (errorData.details._errors) {
            const firstError = errorData.details._errors[0];
            setSubmitError(`Submission failed: ${firstError}`);
          } else {
            // Handle nested validation errors
            const firstFieldError = Object.values(errorData.details)[0];
            if (firstFieldError && typeof firstFieldError === 'object' && '_errors' in firstFieldError) {
              setSubmitError(`Submission failed: ${(firstFieldError as any)._errors[0]}`);
            } else {
              setSubmitError("Please check your input for validation errors.");
            }
          }
        } else {
          setSubmitError(
            errorData.error || "An unknown error occurred on the server."
          );
        }
      }
    } catch (error) {
      console.error("Error updating venue:", error);
      setSubmitError(
        "Failed to connect to the server. Please check your network and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <Link
            href="/owner/venues"
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/owner/venues"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Venues
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Venue</h1>
          <p className="text-gray-600 mt-2">
            Update your venue information and courts
          </p>
        </div>

        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
            <span className="block sm:inline">{submitError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(
            onSubmit,
            (errors) => {
              console.log("❌ Form submission failed due to validation errors:", errors);
              setSubmitError("Please check all required fields and fix any validation errors.");
            }
          )}
          className="space-y-8"
        >
          {/* Venue Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Venue Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  {...register("name")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter venue name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  {...register("city")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.city.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe your venue..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                {...register("address")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter complete address"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  {...register("state")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  {...register("country")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter country"
                />
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.country.message}
                  </p>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AMENITIES_OPTIONS.map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      value={amenity}
                      {...register("amenities")}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {amenity}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Courts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Courts</h2>
              <button
                type="button"
                onClick={() =>
                  append({
                    name: "",
                    sport: "",
                    pricePerHour: 0,
                    currency: "INR",
                    openTime: 6,
                    closeTime: 22,
                  })
                }
                className="inline-flex items-center px-3 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Court
              </button>
            </div>

            {fields.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No courts added yet. Click "Add Court" to get started.
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-gray-200 rounded-lg p-4 mb-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Court {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Court Name *
                    </label>
                    <input
                      {...register(`courts.${index}.name`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Court A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport *
                    </label>
                    <select
                      {...register(`courts.${index}.sport`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Sport</option>
                      {SPORTS_OPTIONS.map((sport) => (
                        <option key={sport} value={sport}>
                          {sport}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Hour (₹) *
                    </label>
                    <input
                      type="number"
                      {...register(`courts.${index}.pricePerHour`, {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., 1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency *
                    </label>
                    <select
                      {...register(`courts.${index}.currency`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="INR">INR (₹)</option>
                    
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opening Time *
                    </label>
                    <select
                      {...register(`courts.${index}.openTime`, {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Closing Time *
                    </label>
                    <select
                      {...register(`courts.${index}.closeTime`, {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {(i + 1).toString().padStart(2, "0")}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/owner/venues"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              onClick={(e) => {
                console.log("🔘 Update button clicked!", e);
                console.log("📊 Button state:", { isSubmitting, isValid, isLoading });
                // Don't prevent default - let the form submission happen
              }}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Venue"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
