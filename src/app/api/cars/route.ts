import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Car listing type
export interface CarListing {
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
  source: "Gumtree" | "Facebook" | "Carsales" | "Pickles" | "Other";
  imageUrl?: string;
  description?: string;
  postedDate?: string;
  sellerType: "Private" | "Dealer" | "Auction";
  score: number;
  reason: string;
}

// Seed data for when scraper hasn't run yet
const seedListings: CarListing[] = [
  {
    id: "1",
    title: "2010 Suzuki Swift GLX 5dr Hatch",
    price: 3800,
    year: 2010,
    make: "Suzuki",
    model: "Swift GLX",
    odometer: 140000,
    transmission: "Manual",
    fuel: "Petrol",
    body: "Hatchback",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 9,
    reason: "Low km for year, Japanese build quality, genuinely fun to drive. Swifts hold their value well. Best value proposition here.",
    postedDate: "2026-05-22",
  },
  {
    id: "2",
    title: "2011 Toyota Yaris YRS 3dr Hatch",
    price: 3900,
    year: 2011,
    make: "Toyota",
    model: "Yaris YRS",
    odometer: 155000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "Hatchback",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 9,
    reason: "Best-in-class reliability. Auto transmission, under 160k kms, 2011 model all for under $4k. These are the benchmark for cheap used cars.",
    postedDate: "2026-05-21",
  },
  {
    id: "3",
    title: "2009 Mazda 2 Neo 5dr Hatch",
    price: 3800,
    year: 2009,
    make: "Mazda",
    model: "2 Neo",
    odometer: 165000,
    transmission: "Manual",
    fuel: "Petrol",
    body: "Hatchback",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 8,
    reason: "Reliable Japanese hatch, cheap to run, great first car. Manuals are getting harder to find.",
    postedDate: "2026-05-20",
  },
  {
    id: "4",
    title: "2006 Honda Civic VTi-S 5dr Hatch",
    price: 3900,
    year: 2006,
    make: "Honda",
    model: "Civic VTi-S",
    odometer: 190000,
    transmission: "Manual",
    fuel: "Petrol",
    body: "Hatchback",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 8,
    reason: "Sporty Civic with the famous Honda VTEC engine. Great handling, fun to drive, bulletproof reliability.",
    postedDate: "2026-05-19",
  },
  {
    id: "5",
    title: "2009 Holden Commodore VE Omega Sedan",
    price: 3500,
    year: 2009,
    make: "Holden",
    model: "Commodore VE Omega",
    odometer: 230000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "Sedan",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 6,
    reason: "Lots of car for $3.5k. V6 power, huge boot, comfortable highway car. Parts everywhere. Fuel economy is average.",
    postedDate: "2026-05-23",
  },
  {
    id: "6",
    title: "2007 Ford Falcon BF MkII XT Sedan",
    price: 2500,
    year: 2007,
    make: "Ford",
    model: "Falcon BF MkII XT",
    odometer: 260000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "Sedan",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 5,
    reason: "Aussie icon, parts everywhere, comfortable highway cruiser. High kms but the Barra 6 is legendary. Expect 15L/100km.",
    postedDate: "2026-05-18",
  },
  {
    id: "7",
    title: "2008 Hyundai Getz 1.4L 3dr Hatch",
    price: 2800,
    year: 2008,
    make: "Hyundai",
    model: "Getz",
    odometer: 180000,
    transmission: "Manual",
    fuel: "Petrol",
    body: "Hatchback",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 7,
    reason: "Cheap as chips. Getz are tough little cars, cheap to insure and run. Under $3k is a steal.",
    postedDate: "2026-05-23",
  },
  {
    id: "8",
    title: "2005 Subaru Forester 2.5X AWD Wagon",
    price: 3500,
    year: 2005,
    make: "Subaru",
    model: "Forester 2.5X",
    odometer: 240000,
    transmission: "Manual",
    fuel: "Petrol",
    body: "SUV/Wagon",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 6,
    reason: "AWD wagon with heaps of space. Good for camping/moving gear. Known head gasket risk at this age. Check service history carefully.",
    postedDate: "2026-05-21",
  },
  {
    id: "9",
    title: "2004 Toyota Corolla Ascent Sedan",
    price: 3500,
    year: 2004,
    make: "Toyota",
    model: "Corolla Ascent",
    odometer: 220000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "Sedan",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 7,
    reason: "Toyota reliability, auto trans, parts are everywhere. High kms but Corollas run forever with basic maintenance.",
    postedDate: "2026-05-22",
  },
  {
    id: "10",
    title: "2003 Mitsubishi Lancer ES Sedan",
    price: 2000,
    year: 2003,
    make: "Mitsubishi",
    model: "Lancer ES",
    odometer: 195000,
    transmission: "Manual",
    fuel: "Petrol",
    body: "Sedan",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 6,
    reason: "Absolute budget option. Rock bottom price. If you need a car for under $2k and it runs, this is it. Check for rust.",
    postedDate: "2026-05-20",
  },
  {
    id: "11",
    title: "2006 Volkswagen Golf 2.0 FSI Comfortline",
    price: 3500,
    year: 2006,
    make: "Volkswagen",
    model: "Golf 2.0 FSI Comfortline",
    odometer: 175000,
    transmission: "Manual",
    fuel: "Petrol",
    body: "Hatchback",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 7,
    reason: "German build quality, nice interior, great handling. Higher maintenance cost than Japanese cars but a nicer drive.",
    postedDate: "2026-05-19",
  },
  {
    id: "12",
    title: "2007 Mazda BT-50 2.5L Dual Cab 4x2 Ute",
    price: 3900,
    year: 2007,
    make: "Mazda",
    model: "BT-50 Dual Cab",
    odometer: 290000,
    transmission: "Manual",
    fuel: "Diesel",
    body: "Ute",
    location: "Adelaide SA",
    url: "",
    source: "Other",
    sellerType: "Private",
    score: 5,
    reason: "Diesel ute with a tray, practical as. High kms but the 2.5 diesel is known to go 400k+. Check for clutch and rust.",
    postedDate: "2026-05-17",
  },
];

// Try to load scraped data from the public directory
function loadListings(): CarListing[] {
  try {
    // In production (Vercel), try static file first
    const publicPath = path.join(process.cwd(), "public", "data", "cars.json");
    if (fs.existsSync(publicPath)) {
      const raw = fs.readFileSync(publicPath, "utf-8");
      const data = JSON.parse(raw);
      if (data.cars && data.cars.length > 0) {
        console.log(`Loaded ${data.cars.length} cars from scraped data`);
        return data.cars;
      }
    }
  } catch (e) {
    console.log("No scraped data file found, using seed data");
  }
  return [...seedListings];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const maxPrice = parseInt(searchParams.get("maxPrice") || "4000");
  const minYear = parseInt(searchParams.get("minYear") || "0");
  const sortBy = searchParams.get("sort") || "score";
  const transmission = searchParams.get("transmission") || "";
  const make = searchParams.get("make") || "";
  const search = searchParams.get("search") || "";

  let listings = loadListings();

  let filtered = listings.filter((c) => c.price <= maxPrice);

  if (minYear > 0) filtered = filtered.filter((c) => c.year >= minYear);
  if (transmission) filtered = filtered.filter((c) => c.transmission === transmission);
  if (make) filtered = filtered.filter((c) => c.make.toLowerCase() === make.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q)
    );
  }

  switch (sortBy) {
    case "price_asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "year_desc":
      filtered.sort((a, b) => b.year - a.year);
      break;
    case "year_asc":
      filtered.sort((a, b) => a.year - b.year);
      break;
    case "km_asc":
      filtered.sort((a, b) => a.odometer - b.odometer);
      break;
    case "score":
    default:
      filtered.sort((a, b) => b.score - a.score);
      break;
  }

  const makes = [...new Set(listings.map((c) => c.make))].sort();

  return NextResponse.json({
    cars: filtered,
    total: filtered.length,
    makes,
    filters: {
      maxPrice,
      minYear,
      sortBy,
      transmission,
      make,
      search,
    },
  });
}
