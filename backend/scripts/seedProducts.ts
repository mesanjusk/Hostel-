/**
 * Loads the Shopping page catalog: everyday things a student needs when moving into a hostel
 * in a new city. Idempotent — upserts by { name, store }, safe to re-run.
 *
 * Two deliberate conventions here, both carried over from the original seed:
 *
 * 1. Buy links point at store *searches*, never at a specific listing. Listings go out of
 *    stock, get relisted under new IDs, and swing in price; a search always resolves to
 *    what's actually buyable today, and never 404s.
 * 2. Because there's no single listing behind an item, there's no product photo to show —
 *    each item carries an `icon` name instead (see the frontend's lib/product-icons.ts).
 *
 * Prices are INDICATIVE typical street prices, not quotes — the schema requires a number and
 * the card renders it as "₹399", but the real figure is whatever the search shows on the day.
 * Ratings are editorial (how strongly this is recommended for hostel life), not review scores.
 * Both are here to match the 8 products the original seed already ships; revise them freely.
 *
 * Unlike `npm run seed`, this touches nothing but the Product collection — that one also
 * upserts guide articles, which would overwrite anything an admin has edited in the Guide
 * editor. This is the safe one to run against a live deployment.
 *
 * Usage: npm run seed:products
 */
import "dotenv/config";
import mongoose from "mongoose";

import { Product } from "@/models/Product";

const amazon = (q: string) => `https://www.amazon.in/s?k=${q.split(" ").join("+")}`;
const flipkart = (q: string) => `https://www.flipkart.com/search?q=${q.split(" ").join("+")}`;

const products = [
  {
    name: "Pillow with Cotton Cover",
    icon: "BedDouble",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 449,
    discountPercent: 10,
    rating: 4.3,
    pros: ["Hostel beds rarely come with one", "Cover is washable and cheap to replace"],
    cons: ["Bulky to carry on a train or flight — consider buying after you arrive"],
    buyLinks: { amazon: amazon("pillow for bed"), flipkart: flipkart("pillow for bed") },
    featured: true,
  },
  {
    name: "Single Bedsheet Set",
    icon: "Bed",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 599,
    discountPercent: 15,
    rating: 4.2,
    pros: ["Bring two so one can be in the wash", "Cotton breathes better in warm hostels"],
    cons: ["Check your bed size — hostel singles vary"],
    buyLinks: { amazon: amazon("single bedsheet set cotton"), flipkart: flipkart("single bedsheet") },
    featured: true,
  },
  {
    name: "Waterproof Mattress Protector",
    icon: "ShieldCheck",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 549,
    discountPercent: 0,
    rating: 4.4,
    pros: ["Hostel mattresses are shared and reused", "Saves your deposit from spills"],
    cons: ["Cheaper ones can sleep hot"],
    buyLinks: { amazon: amazon("waterproof mattress protector single bed") },
    featured: false,
  },
  {
    name: "Lightweight Comforter / Blanket",
    icon: "Layers",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 899,
    discountPercent: 20,
    rating: 4.1,
    pros: ["Doubles as a bedspread during the day", "Packs down smaller than a quilt"],
    cons: ["Not warm enough for a north-Indian winter on its own"],
    buyLinks: { amazon: amazon("single bed comforter light"), flipkart: flipkart("single comforter") },
    featured: false,
  },
  {
    name: "Small Magnetic Whiteboard",
    icon: "Presentation",
    category: "Stationery" as const,
    store: "Amazon",
    price: 449,
    discountPercent: 0,
    rating: 4.2,
    pros: ["Deadlines and reminders where you can't ignore them", "Reusable — no paper waste"],
    cons: ["Check whether your hostel allows wall mounting; get a standing one if not"],
    buyLinks: { amazon: amazon("small magnetic whiteboard for wall"), flipkart: flipkart("small whiteboard") },
    featured: true,
  },
  {
    name: "Cork Vision Board with Pins",
    icon: "Pin",
    category: "Stationery" as const,
    store: "Amazon",
    price: 599,
    discountPercent: 10,
    rating: 4.0,
    pros: ["Goals, photos and timetables in one place", "Softens a bare hostel wall"],
    cons: ["Pins can leave marks — use adhesive strips to mount it"],
    buyLinks: { amazon: amazon("cork notice board with pins"), flipkart: flipkart("cork bulletin board") },
    featured: false,
  },
  {
    name: "LED Fairy String Lights",
    icon: "Lightbulb",
    category: "Miscellaneous" as const,
    store: "Amazon",
    price: 299,
    discountPercent: 25,
    rating: 4.3,
    pros: ["Cheapest way to make a bare room feel yours", "USB ones run off a power bank"],
    cons: ["Battery versions eat cells — prefer USB"],
    buyLinks: { amazon: amazon("led fairy string lights usb"), flipkart: flipkart("fairy lights") },
    featured: true,
  },
  {
    name: "Wall Posters / Photo Collage Kit",
    icon: "Frame",
    category: "Miscellaneous" as const,
    store: "Amazon",
    price: 349,
    discountPercent: 0,
    rating: 4.0,
    pros: ["Instant personality on an empty wall", "Light and flat — easy to carry"],
    cons: ["Use removable strips; tape and putty can pull paint off"],
    buyLinks: { amazon: amazon("wall posters for room aesthetic") },
    featured: false,
  },
  {
    name: "Under-Bed Storage Bag",
    icon: "Box",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 499,
    discountPercent: 15,
    rating: 4.1,
    pros: ["Turns dead space under the bed into storage", "Keeps off-season clothes dust-free"],
    cons: ["Measure your under-bed clearance first"],
    buyLinks: { amazon: amazon("under bed storage bag organizer") },
    featured: false,
  },
  {
    name: "Clothes Hangers (Set of 12)",
    icon: "Shirt",
    category: "Laundry" as const,
    store: "Amazon",
    price: 349,
    discountPercent: 0,
    rating: 4.2,
    pros: ["Hostel cupboards almost never include them", "Slim ones fit far more per rod"],
    cons: ["The cheapest plastic ones snap under heavy coats"],
    buyLinks: { amazon: amazon("cloth hangers set of 12"), flipkart: flipkart("cloth hangers") },
    featured: false,
  },
  {
    name: "Laundry Bag with Handles",
    icon: "WashingMachine",
    category: "Laundry" as const,
    store: "Amazon",
    price: 299,
    discountPercent: 10,
    rating: 4.1,
    pros: ["Carries a full load to the dhobi or laundry room", "Collapses flat when empty"],
    cons: ["Mesh ones tear if you overload them"],
    buyLinks: { amazon: amazon("laundry bag with handles"), flipkart: flipkart("laundry bag") },
    featured: false,
  },
  {
    name: "Adhesive Wall Hooks",
    icon: "Paperclip",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 199,
    discountPercent: 0,
    rating: 4.0,
    pros: ["Hang towels and bags without drilling", "Removable — your deposit survives"],
    cons: ["Weak on rough or whitewashed walls"],
    buyLinks: { amazon: amazon("adhesive wall hooks heavy duty") },
    featured: false,
  },
  {
    name: "Insulated Water Bottle (1L)",
    icon: "GlassWater",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 699,
    discountPercent: 20,
    rating: 4.5,
    pros: ["Saves buying bottled water daily", "Keeps water cold through a long class day"],
    cons: ["Steel ones are heavy when full"],
    buyLinks: { amazon: amazon("insulated water bottle 1 litre"), flipkart: flipkart("insulated water bottle") },
    featured: true,
  },
  {
    name: "Desk Organizer",
    icon: "PenTool",
    category: "Stationery" as const,
    store: "Amazon",
    price: 449,
    discountPercent: 10,
    rating: 4.1,
    pros: ["Keeps a small desk usable", "Stops pens migrating around the room"],
    cons: ["Takes desk space you may not have — measure first"],
    buyLinks: { amazon: amazon("desk organizer stationery") },
    featured: false,
  },
  {
    name: "Heavy-Duty Padlock",
    icon: "Lock",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 349,
    discountPercent: 0,
    rating: 4.4,
    pros: ["Most hostels expect you to bring your own", "Buy two — cupboard and trunk"],
    cons: ["Keep a spare key somewhere other than your room"],
    buyLinks: { amazon: amazon("heavy duty padlock with keys"), flipkart: flipkart("padlock") },
    featured: true,
  },
  {
    name: "Quick-Dry Microfibre Towel",
    icon: "Droplets",
    category: "Toiletries" as const,
    store: "Amazon",
    price: 399,
    discountPercent: 15,
    rating: 4.2,
    pros: ["Dries fast in a shared bathroom", "Packs to a fraction of a cotton towel"],
    cons: ["Feels different from cotton — some people never take to it"],
    buyLinks: { amazon: amazon("quick dry microfibre towel") },
    featured: false,
  },
  {
    name: "Bathroom Slippers",
    icon: "Footprints",
    category: "Footwear" as const,
    store: "Amazon",
    price: 249,
    discountPercent: 0,
    rating: 4.0,
    pros: ["Non-negotiable for shared bathrooms", "Anti-slip soles matter on wet floors"],
    cons: ["Sizing runs small on many Indian brands"],
    buyLinks: { amazon: amazon("bathroom slippers anti slip") },
    featured: false,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  let created = 0;
  for (const product of products) {
    const res = await Product.findOneAndUpdate(
      { name: product.name, store: product.store },
      product,
      { upsert: true, returnDocument: "after", includeResultMetadata: true },
    );
    if (!res.lastErrorObject?.updatedExisting) created += 1;
  }

  console.log(`Seeded ${products.length} products (${created} new, ${products.length - created} updated)`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
