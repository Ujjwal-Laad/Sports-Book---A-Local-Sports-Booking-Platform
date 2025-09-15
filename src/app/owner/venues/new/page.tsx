"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrashIcon, PlusIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { venueSchema } from "@/lib/schemas/venue";

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
  "Lighting",
  "Air Conditioning",
  "Shower",
  "Equipment Rental",
  "Cafeteria",
  "Wi-Fi",
  "Seating Area",
];

type VenueFormValues = z.infer<typeof venueSchema>;

export default function NewVenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      country: "India",
      amenities: [],
      courts: [
        {
          name: "Court 1",
          sport: "Badminton",
          pricePerHour: 500,
          currency: "INR",
          openTime: 6,
          closeTime: 22,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "courts",
  });

  useEffect(() => {
    if (status === "loading") return;
    // Redirect if user is not authenticated or not an owner
    if (!session || session.user.role !== "OWNER") {
      router.push("/auth/login");
    }
  }, [session, status, router]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedFile(null);
    setUploadPreview(null);
    // Reset file input
    const fileInput = document.getElementById('venue-image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Use SubmitHandler to explicitly type the function
  const onSubmit: SubmitHandler<VenueFormValues> = async (data) => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      let res;
      
      if (selectedFile) {
        // Send as FormData if image is selected
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('venueData', JSON.stringify(data));
        
        res = await fetch("/api/owner/venues", {
          method: "POST",
          body: formData,
        });
      } else {
        // Send as JSON if no image
        res = await fetch("/api/owner/venues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create venue");
      }

      router.push("/owner/venues?success=created");
    } catch (error: any) {
      console.error("Error creating venue:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Venue</h1>
          <p className="text-gray-600 mt-2">
            Create a new sports facility listing
          </p>
        </div>

        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information - CORRECTED SECTION */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Basic Information
            </h2>

            {/* Grid for Name and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  {...register("name")}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Elite Sports Complex"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  {...register("city")}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Mumbai"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.city.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="Describe your venue, facilities, and what makes it special..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="mt-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                {...register("address")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
                placeholder="123 Sports Street, Andheri West"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Grid for State and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  {...register("state")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  {...register("country")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  readOnly
                />
              </div>
            </div>

          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Amenities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AMENITIES_OPTIONS.map((amenity) => (
                <label key={amenity} className="flex items-center">
                  <input
                    type="checkbox"
                    value={amenity}
                    {...register("amenities")}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Courts */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Courts</h2>
              <button
                type="button"
                onClick={() =>
                  append({
                    name: `Court ${fields.length + 1}`,
                    sport: "Badminton",
                    pricePerHour: 500,
                    currency: "INR",
                    openTime: 6,
                    closeTime: 22,
                  })
                }
                className="inline-flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Court
              </button>
            </div>
            {errors.courts && (
              <p className="mb-4 text-sm text-red-600">
                {errors.courts.message}
              </p>
            )}
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Court {index + 1}
                    </h3>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Court Name *
                      </label>
                      <input
                        {...register(`courts.${index}.name`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Court 1"
                      />
                      {errors.courts?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.courts[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sport *
                      </label>
                      <select
                        {...register(`courts.${index}.sport`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {SPORTS_OPTIONS.map((sport) => (
                          <option key={sport} value={sport}>
                            {sport}
                          </option>
                        ))}
                      </select>
                      {errors.courts?.[index]?.sport && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.courts[index]?.sport?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per Hour (₹) *
                      </label>
                      <input
                        type="number"
                        {...register(`courts.${index}.pricePerHour`, {
                          valueAsNumber: true,
                        })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="500"
                      />
                      {errors.courts?.[index]?.pricePerHour && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.courts[index]?.pricePerHour?.message}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Open Time
                        </label>
                        <select
                          {...register(`courts.${index}.openTime`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, "0")}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Close Time
                        </label>
                        <select
                          {...register(`courts.${index}.closeTime`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                </div>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Photos</h2>
            
            {/* Upload Area */}
            <div className="mb-6">
              <input
                type="file"
                id="venue-image"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="venue-image"
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors block"
              >
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click to upload venue photo
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP up to 5MB
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {uploadPreview && (
              <div className="mb-6">
                <div className="relative inline-block">
                  <img
                    src={uploadPreview}
                    alt="Venue preview"
                    className="w-48 h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                    {selectedFile?.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Creating..." : "Create Venue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
