"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BuildingOfficeIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
  PencilIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface VenueDetail {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  amenities: string[];
  approved: boolean;
  createdAt: string;
  courts: Array<{
    id: number;
    name: string;
    sport: string;
    pricePerHour: number;
    currency: string;
    openTime: number;
    closeTime: number;
  }>;
  owner: {
    user: {
      id: number;
      fullName: string;
      email: string;
    };
  };
}

export default function VenueDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const venueId = params.id as string;
  
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "OWNER") {
      router.push("/auth/login");
      return;
    }

    const fetchVenue = async () => {
      try {
        const response = await fetch(`/api/owner/venues/${venueId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch venue");
        }
        
        const venueData: VenueDetail = await response.json();
        setVenue(venueData);
      } catch (error: unknown) {
        console.error("Error fetching venue:", error);
        setError(error instanceof Error ? error.message : 'Failed to fetch venue');
      } finally {
        setIsLoading(false);
      }
    };

    if (venueId) {
      fetchVenue();
    }
  }, [session, status, router, venueId]);

  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
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

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/owner/venues"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Venues
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mr-4">{venue.name}</h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    venue.approved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {venue.approved ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Approved
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      Pending Approval
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span>{venue.address}, {venue.city}, {venue.state} {venue.country}</span>
              </div>
            </div>
            
            <Link
              href={`/owner/venues/${venue.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Venue
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Venue Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <BuildingOfficeIcon className="w-24 h-24 text-primary-600" />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Venue</h2>
              <p className="text-gray-700 leading-relaxed">{venue.description}</p>
            </div>

            {/* Amenities */}
            {venue.amenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {venue.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Courts ({venue.courts.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venue.courts.map((court) => (
                  <div key={court.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{court.name}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {court.sport}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                        <span>₹{court.pricePerHour}/hour</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        <span>
                          {formatTime(court.openTime)} - {formatTime(court.closeTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Courts</span>
                  <span className="font-semibold">{venue.courts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sports Available</span>
                  <span className="font-semibold">
                    {[...new Set(venue.courts.map(c => c.sport))].length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price Range</span>
                  <span className="font-semibold">
                    ₹{Math.min(...venue.courts.map(c => c.pricePerHour))} - 
                    ₹{Math.max(...venue.courts.map(c => c.pricePerHour))}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Approval Status</span>
                  <span className={`font-semibold ${venue.approved ? 'text-green-600' : 'text-yellow-600'}`}>
                    {venue.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold">
                    {new Date(venue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/owner/venues/${venue.id}/edit`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Venue
                </Link>
                <Link
                  href={`/venues/${venue.id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Public Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}