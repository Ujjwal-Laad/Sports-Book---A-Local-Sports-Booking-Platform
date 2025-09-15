"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

interface Venue {
  id: number;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  sports: string[];
  minPricePerHour: number;
  maxPricePerHour: number;
  currency: string;
  amenities: string[];
  tags: string[];
  courts: any[];
  image: string | null;
}

interface VenuesResponse {
  venues: Venue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    cities: string[];
    sports: string[];
  };
}

export default function VenuesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State management
  const [data, setData] = useState<VenuesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedSport, setSelectedSport] = useState(
    searchParams.get("sport") || ""
  );
  const [selectedCity, setSelectedCity] = useState(
    searchParams.get("city") || ""
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minRating, setMinRating] = useState(searchParams.get("rating") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "name");
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  // Fetch venues
  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedSport) params.append("sport", selectedSport);
      if (selectedCity) params.append("city", selectedCity);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (minRating) params.append("rating", minRating);
      if (sortBy) params.append("sortBy", sortBy);
      params.append("page", currentPage.toString());

      const response = await fetch(`/api/venues?${params.toString()}`);
      if (response.ok) {
        const venuesData = await response.json();
        setData(venuesData);
      } else {
        console.error("API Response not ok:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update URL with current filters
  const updateURL = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedSport) params.append("sport", selectedSport);
    if (selectedCity) params.append("city", selectedCity);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (minRating) params.append("rating", minRating);
    if (sortBy !== "name") params.append("sortBy", sortBy);
    if (currentPage !== 1) params.append("page", currentPage.toString());

    const url = params.toString() ? `/venues?${params.toString()}` : "/venues";
    router.push(url, { scroll: false });
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setSelectedSport("");
    setSelectedCity("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setSortBy("name");
    setCurrentPage(1);
    router.push("/venues", { scroll: false });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVenues();
      updateURL();
    }, 500); // Debounce requests

    return () => {
      clearTimeout(handler);
    };
  }, [
    search,
    selectedSport,
    selectedCity,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    currentPage,
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Sports Venues
          </h1>
          <p className="mt-2 max-w-2xl mx-auto text-lg text-gray-500">
            Discover and book the best sports facilities near you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filters
              </h2>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-primary-600 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Venue name..."
                  className="block w-full rounded-lg border-gray-300 pl-10 pr-4 py-2 focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Sport Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport
              </label>
              <div className="relative">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500 pr-8"
                >
                  <option value="">All Sports</option>
                  {data?.filters.sports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                {selectedSport && (
                  <button onClick={() => setSelectedSport("")} className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <XMarkIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </div>
            </div>

            {/* City Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500 pr-8"
                >
                  <option value="">All Cities</option>
                  {data?.filters.cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {selectedCity && (
                  <button onClick={() => setSelectedCity("")} className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <XMarkIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (₹/hour)
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₹0</span>
                  <span>₹{maxPrice}</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button key={rating} onClick={() => setMinRating(rating.toString())} className={`p-1 rounded-full ${minRating >= rating.toString() ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                    <StarIcon className={`w-5 h-5 ${minRating >= rating.toString() ? 'text-white' : 'text-gray-400'}`} />
                  </button>
                ))}
                {minRating && (
                  <button onClick={() => setMinRating("")} className="ml-2">
                    <XMarkIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse"
                  >
                    <div className="h-48 bg-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.venues.length > 0 ? (
              <>
                {/* Results Info */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    Showing{" "}
                    {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
                    {Math.min(
                      data.pagination.page * data.pagination.limit,
                      data.pagination.total
                    )}{" "}
                    of {data.pagination.total} venues
                  </p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price">Sort by Price</option>
                    <option value="rating">Sort by Rating</option>
                  </select>

                  </div>

                {/* Venues Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.venues.map((venue) => (
                    <Link
                      key={venue.id}
                      href={`/venues/${venue.id}`}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="relative h-48">
                        {venue.image ? (
                          <img
                            src={venue.image}
                            alt={venue.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-lg">
                              {venue.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {venue.sports.length > 0 && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                              {venue.sports[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                            {venue.name}
                          </h3>
                          {venue.rating > 0 && (
                            <div className="flex items-center text-sm">
                              <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="font-medium">
                                {venue.rating.toFixed(1)}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({venue.reviewCount})
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          <span className="line-clamp-1">{venue.address}</span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {venue.description}
                        </p>

                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-bold text-primary-600">
                            ₹{Number(venue.minPricePerHour).toFixed(0)}/hour
                          </span>
                          <span className="text-sm text-gray-500">
                            {venue.courts.length} court
                            {venue.courts.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {venue.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {data.pagination.pages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>

                      {Array.from(
                        { length: data.pagination.pages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 border rounded-md ${
                            page === currentPage
                              ? "bg-primary-600 text-white border-primary-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() =>
                          setCurrentPage(
                            Math.min(data.pagination.pages, currentPage + 1)
                          )
                        }
                        disabled={currentPage === data.pagination.pages}
                        className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  No Venues Found
                </h3>
                <p className="text-gray-500 mt-2">
                  Try adjusting your search criteria or filters to find what
                  you're looking for.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
