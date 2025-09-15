"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserIcon,
  CheckCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

interface Venue {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  reviewCount: number;
  sports: string[];
  minPrice: number;
  maxPrice: number;
  currency: string;
  operatingHours: {
    open: number;
    close: number;
  };
  amenities: string[];
  photos: string[];
  courts: Array<{
    id: number;
    name: string;
    sport: string;
    pricePerHour: number;
    currency: string;
    openTime: number;
    closeTime: number;
  }>;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      name: string;
      avatar: string | null;
    };
  }>;
  owner: {
    name: string;
    businessName?: string | null;
    phone?: string | null;
  };
}

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const venueId = parseInt(params.id as string);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/venues/${venueId}`);
        if (response.ok) {
          const venueData = await response.json();
          setVenue(venueData);
        } else if (response.status === 404) {
          setError("Venue not found");
        } else {
          setError("Failed to load venue");
        }
      } catch (error) {
        console.error("Error fetching venue:", error);
        setError("Failed to load venue");
      } finally {
        setIsLoading(false);
      }
    };

    if (venueId) {
      fetchVenue();
    }
  }, [venueId]);

  const handleBookCourt = (courtId: number) => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Navigate to booking page
    router.push(`/venues/${venueId}/book?courtId=${courtId}`);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarSolidIcon
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {error || "Venue Not Found"}
          </h1>
          <p className="text-gray-600 mt-2">
            {error === "Venue not found"
              ? "The venue you're looking for doesn't exist."
              : "Something went wrong while loading the venue."}
          </p>
          <Link
            href="/venues"
            className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link
                href="/venues"
                className="text-gray-500 hover:text-gray-700"
              >
                Venues
              </Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">{venue.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Photo Gallery */}
              <div className="h-64 relative bg-gray-100 rounded-lg overflow-hidden mb-6">
                {venue.photos && venue.photos.length > 0 ? (
                  <img
                    src={venue.photos[0]}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-24 h-24 text-primary-600" />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {venue.name}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    <span>
                      {venue.address}, {venue.city}, {venue.state}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {venue.sports.map((sport) => (
                      <span
                        key={sport}
                        className="bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  {venue.rating > 0 && (
                    <div className="flex items-center mb-1">
                      {renderStars(venue.rating)}
                      <span className="ml-2 text-lg font-semibold">
                        {venue.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    {venue.reviewCount} review
                    {venue.reviewCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">
                {venue.description}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>
                    Open {venue.operatingHours.open.toString().padStart(2, "0")}
                    :00 -
                    {venue.operatingHours.close.toString().padStart(2, "0")}:00
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                  <span>Starting from ₹{Number(venue.minPrice).toFixed(0)}/hour</span>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {venue.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Available Courts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venue.courts.map((court) => (
                  <div
                    key={court.id}
                    className={`border-2 rounded-lg p-4 transition-colors cursor-pointer ${
                      selectedCourt === court.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedCourt(court.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {court.name}
                        </h3>
                        <p className="text-sm text-gray-600">{court.sport}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₹{Number(court.pricePerHour).toFixed(0)}
                        </p>
                        <p className="text-xs text-gray-500">per hour</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>
                        {court.openTime.toString().padStart(2, "0")}:00 -
                        {court.closeTime.toString().padStart(2, "0")}:00
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookCourt(court.id);
                      }}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      Book This Court
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reviews ({venue.reviewCount})
                </h2>
                {venue.rating > 0 && (
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.floor(venue.rating)
                              ? "fill-current"
                              : star <= venue.rating
                              ? "fill-current opacity-50"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {venue.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {venue.reviews && venue.reviews.length > 0 ? (
                <div className="space-y-6">
                  {venue.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {review.user.avatar ? (
                              <img
                                src={review.user.avatar}
                                alt={review.user.name}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                <UserCircleIcon className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{review.user.name}</p>
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIcon
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? "fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 ml-11">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet</p>
                  <p className="text-sm text-gray-400">Be the first to review this venue!</p>
                </div>
              )}
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
}
