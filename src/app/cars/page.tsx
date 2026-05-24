"use client";

import { useState, useEffect } from "react";

interface CarListing {
  id: string;
  title: string;
  price: number;
  year: number;
  make: string;
  model: string;
  odometer: number;
  transmission: "Manual" | "Automatic";
  fuel: string;
  body: string;
  location: string;
  url: string;
  source: string;
  sellerType: string;
  score: number;
  reason: string;
  description?: string;
  postedDate?: string;
}

export default function CarsPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("score");
  const [transmission, setTransmission] = useState("");
  const [makeFilter, setMakeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCar, setSelectedCar] = useState<CarListing | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchCars();
  }, [sortBy, transmission, makeFilter, search]);

  async function fetchCars() {
    setLoading(true);
    const params = new URLSearchParams();
    if (sortBy) params.set("sort", sortBy);
    if (transmission) params.set("transmission", transmission);
    if (makeFilter) params.set("make", makeFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/cars?${params.toString()}`);
    const data = await res.json();
    setCars(data.cars);
    setMakes(data.makes);
    setLoading(false);
  }

  function getScoreColor(score: number): string {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-amber-400";
    return "text-zinc-400";
  }

  function getScoreBg(score: number): string {
    if (score >= 8) return "bg-emerald-500/20 border-emerald-500/40";
    if (score >= 6) return "bg-amber-500/20 border-amber-500/40";
    return "bg-zinc-500/20 border-zinc-500/40";
  }

  function getSourceBadge(source: string): string {
    switch (source) {
      case "Gumtree": return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "Facebook": return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "Carsales": return "bg-red-500/20 text-red-300 border-red-500/40";
      default: return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    }
  }

  function formatKm(km: number): string {
    return km >= 1000 ? `${(km / 1000).toFixed(0)}k` : `${km}`;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-[#0d0d15]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Car Finder
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Private seller cars under $4,000 in Adelaide
              </p>
            </div>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-4">
              <a
                href="/"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Dashboard
              </a>
              {loading ? null : (
                <span className="text-xs text-zinc-600">{cars.length} cars</span>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex flex-col gap-1 p-2"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-[1.5px] bg-zinc-500 transition-transform ${menuOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-zinc-500 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-zinc-500 transition-transform ${menuOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
            </button>
          </div>

          {/* Mobile nav dropdown */}
          {menuOpen && (
            <div className="sm:hidden mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <a
                href="/"
                className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </a>
              <div className="text-xs text-zinc-600">{loading ? "Loading..." : `${cars.length} cars found`}</div>
            </div>
          )}

          {/* Search + Filters */}
          <div className="mt-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                Search
              </label>
              <input
                type="text"
                placeholder="Make, model, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#16161f] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#16161f] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="score">Best Value</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="year_desc">Newest First</option>
                <option value="km_asc">Lowest KMs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                Transmission
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="bg-[#16161f] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="">All</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">
                Make
              </label>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="bg-[#16161f] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="">All Makes</option>
                {makes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-zinc-600 pb-2">
              {loading ? "Loading..." : `${cars.length} cars found`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-[#0d0d15] border border-zinc-800 rounded-xl p-5 animate-pulse"
              >
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3" />
                <div className="h-8 bg-zinc-800 rounded w-1/3 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                  <div className="h-3 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">No cars found</div>
            <p className="text-zinc-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map((car) => (
              <div
                key={car.id}
                onClick={() => setSelectedCar(car)}
                className="bg-[#0d0d15] border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden group"
              >
                {/* Car Image Placeholder */}
                <div className="h-36 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative">
                  <div className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                    {/* Car emoji based on body type */}
                    {car.body === "Ute" ? "🛻" : car.body === "SUV/Wagon" ? "🚙" : "🚗"}
                  </div>
                  {/* Score Badge */}
                  <div
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-bold border ${getScoreBg(car.score)} ${getScoreColor(car.score)}`}
                  >
                    {car.score}/10
                  </div>
                  {/* Source Badge */}
                  <div
                    className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-medium border ${getSourceBadge(car.source)}`}
                  >
                    {car.source}
                  </div>
                  {/* Seller Type */}
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-zinc-400 border border-white/10">
                    {car.sellerType}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight text-white flex-1">
                      {car.title}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">
                      ${car.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-500">/ drive away</span>
                  </div>

                  {/* Specs */}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
                    <span>{car.year}</span>
                    <span className="text-zinc-700">|</span>
                    <span>{formatKm(car.odometer)} km</span>
                    <span className="text-zinc-700">|</span>
                    <span>{car.transmission}</span>
                    <span className="text-zinc-700">|</span>
                    <span>{car.fuel}</span>
                  </div>

                  {/* Reason */}
                  <p className="mt-2 text-xs text-zinc-500 leading-relaxed line-clamp-2">
                    {car.reason}
                  </p>

                  {/* Location + Date */}
                  <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-600">
                    <span>{car.location}</span>
                    {car.postedDate && <span>{car.postedDate}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCar && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCar(null)}
        >
          <div
            className="bg-[#0d0d15] border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative">
              <div className="text-6xl opacity-20">
                {selectedCar.body === "Ute" ? "🛻" : selectedCar.body === "SUV/Wagon" ? "🚙" : "🚗"}
              </div>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-lg text-sm font-bold border bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                {selectedCar.score}/10 -{" "}
                {selectedCar.score >= 8
                  ? "Great Buy"
                  : selectedCar.score >= 6
                  ? "Worth A Look"
                  : "Budget Option"}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedCar.title}</h2>
                <div className="text-3xl font-bold text-white mt-1">
                  ${selectedCar.price.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#16161f] rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Year</div>
                  <div className="text-white font-medium">{selectedCar.year}</div>
                </div>
                <div className="bg-[#16161f] rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Odometer</div>
                  <div className="text-white font-medium">{selectedCar.odometer.toLocaleString()} km</div>
                </div>
                <div className="bg-[#16161f] rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Transmission</div>
                  <div className="text-white font-medium">{selectedCar.transmission}</div>
                </div>
                <div className="bg-[#16161f] rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Fuel</div>
                  <div className="text-white font-medium">{selectedCar.fuel}</div>
                </div>
                <div className="bg-[#16161f] rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Body</div>
                  <div className="text-white font-medium">{selectedCar.body}</div>
                </div>
                <div className="bg-[#16161f] rounded-lg p-3">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Seller</div>
                  <div className="text-white font-medium">{selectedCar.sellerType}</div>
                </div>
              </div>

              {selectedCar.description && (
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Description</div>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {selectedCar.description}
                  </p>
                </div>
              )}

              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Why we picked it</div>
                <p className="text-sm text-zinc-300 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                  {selectedCar.reason}
                </p>
              </div>

              <button
                onClick={() => setSelectedCar(null)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
