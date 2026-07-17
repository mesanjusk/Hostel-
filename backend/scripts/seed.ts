import "dotenv/config";
import mongoose from "mongoose";

import { Product } from "@/models/Product";
import { GuideArticle } from "@/models/GuideArticle";
import type { DEFAULT_CHECKLIST_CATEGORIES } from "@/types";

const guideArticles = [
  {
    title: "How to Pack Smart for Hostel Life",
    slug: "how-to-pack-smart",
    category: "Packing" as const,
    icon: "Backpack",
    summary: "A room in a hostel is a fraction of your bedroom at home — pack accordingly.",
    order: 1,
    content: `Hostel rooms are small and usually shared, so the goal is fewer, more useful things — not everything you own.

## Pack in layers, not bulk
- Bring 7-10 days of clothing rather than a whole wardrobe; you'll do laundry regularly anyway.
- Use packing cubes or cloth bags to compress clothes and keep your trunk organized.
- Roll clothes instead of folding — it saves real space and reduces creasing.

## Prioritize by how often you'll use it
- Daily essentials (toiletries, chargers, one set of bedding) should be the easiest things to reach.
- Seasonal items (heavy jackets, extra blankets) can go at the bottom of your trunk or under the bed.

## Leave room to grow
- Don't fully pack your storage on day one. You'll acquire hostel essentials (bucket, hangers, extension board) locally — leave 20% space for that.
- A collapsible bag or duffel is useful for laundry runs, weekend trips home, and future packing.`,
  },
  {
    title: "NIFT-Specific Packing Advice",
    slug: "nift-specific-packing-advice",
    category: "Packing" as const,
    icon: "Scissors",
    summary: "Design school hostel life has its own rules — pack (and plan) accordingly.",
    order: 2,
    content: `NIFT hostel life comes with a few things generic packing guides don't cover — late-night submissions, borrowed stationery, and small rooms that fill up fast.

## Expect late nights
- Submissions and juries mean genuinely late nights are normal, not occasional — keep snacks and something caffeinated on hand rather than running out at 2am.
- A table lamp earns its space; overhead hostel lighting is rarely enough for detailed work.

## Stationery disappears
- Carry extra pencils, erasers, and fineliners beyond what you think you need — people borrow constantly, and you rarely get it back the same day.
- Keep one "emergency" set you never lend out, for the day before a submission.

## Back up your work
- Keep both digital and physical backups of ongoing work. A crashed laptop or a misplaced sketchbook the night before a jury is a real, common disaster.
- A cheap USB drive or a synced cloud folder is enough — just make it a habit, not an afterthought.

## Pack for your campus and climate
- Mumbai and similarly warm campuses: prioritize light, breathable clothing over bulky layers.
- Whatever the city, hostel rooms are small — avoid overpacking bulky, rarely-used items "just in case." You can always get more from home later.

## What to bring now vs. later
- Bring now: documents, bedding, a full toiletries kit, your core design tools, and enough clothing for 10-14 days.
- Bring later (once you know your routine): specialty art supplies for specific projects, seasonal clothing, and anything your seniors say is easy to buy locally.`,
  },
  {
    title: "Doing Laundry Without a Washing Machine",
    slug: "laundry-without-a-machine",
    category: "Laundry" as const,
    icon: "WashingMachine",
    summary: "Most hostels have shared machines or none at all — here's how to manage either way.",
    order: 1,
    content: `Laundry is one of the first things new hostellers underestimate. Plan for it before you run out of clean clothes.

## If your hostel has shared machines
- Check the laundry room's schedule/booking system on day one — slots fill up fast during exams.
- Always use a mesh bag for socks and small items so they don't get lost in shared machines.
- Never leave clothes in a machine after the cycle ends — it's the #1 cause of hostel laundry room fights.

## If you're washing by hand
- A bucket, a bar of detergent soap, and a drying line/stand are the essential kit — buy these locally in your first two days.
- Wash in the evening so clothes have all night to dry before your morning schedule.
- Turn dark and printed clothes inside out before washing to protect the color.

## General tips
- Keep a small mesh laundry bag in your cupboard to collect dirty clothes through the week instead of a pile on the floor.
- Do a load every 4-5 days rather than waiting until you're out of clean clothes — it's less overwhelming and dries faster in smaller batches.`,
  },
  {
    title: "Hostel Etiquette 101",
    slug: "hostel-etiquette-101",
    category: "Etiquette" as const,
    icon: "HeartHandshake",
    summary: "Small habits that make you a good roommate and a welcome neighbor.",
    order: 1,
    content: `You're sharing walls, bathrooms, and sometimes a room with people who didn't choose to live with a stranger either. A little consideration goes a long way.

## In your room
- Use headphones after a reasonable hour, and ask your roommate about their sleep/study schedule in the first week.
- Keep shared space (desk, shelves, floor) tidy — clutter creep is the most common roommate friction point.
- Knock before entering, even your own room, if your roommate could have a guest.

## In common areas
- Clean up after cooking or eating in shared kitchens immediately, not "later."
- Don't leave dishes in the common sink overnight.
- Keep phone calls and video calls out of shared study spaces.

## Building goodwill early
- Introduce yourself to your floor/wing within the first few days — it makes borrowing a charger or asking for help much easier later.
- Offer help before asking for it; hostel communities run on reciprocity.`,
  },
  {
    title: "Everyday Safety Tips for Hostel Students",
    slug: "everyday-safety-tips",
    category: "Safety" as const,
    icon: "ShieldAlert",
    summary: "Practical habits to keep your belongings and yourself safe.",
    order: 1,
    content: `Most hostel safety issues are preventable with a few consistent habits.

## Protecting your belongings
- Always lock your room, even for "just a minute" trips to the bathroom or common room.
- Keep a small lockbox or locker for cash, documents, and electronics when you're not around.
- Don't leave laptops or phones unattended in the library, mess, or common room.

## Personal safety
- Save your hostel warden's number and at least two floor-mates' numbers in your phone on day one.
- Let a roommate or friend know if you're heading out late or traveling somewhere new.
- Keep your emergency contacts updated in this app so they're one tap away.

## Fire and electrical safety
- Don't overload extension boards — spread high-wattage appliances (heater, iron) across different sockets.
- Know where the nearest fire extinguisher and exit are on your floor.
- Never leave an iron, heater, or induction plate switched on unattended.`,
  },
  {
    title: "Women's Safety in Hostel Life",
    slug: "womens-safety-guide",
    category: "Women Safety" as const,
    icon: "ShieldCheck",
    summary: "Specific precautions and resources for women moving into a hostel for the first time.",
    order: 1,
    content: `Feeling safe should never be optional. Here are concrete steps to set yourself up well.

## Before you settle in
- Locate the women's helpline/warden contact for your hostel and save it under a quick-access name in your phone.
- Check whether your hostel has CCTV coverage at entry points and inform yourself of the gate closing time.
- Share your room number and hostel address with your family and one trusted friend outside the hostel.

## Daily habits
- Share your live location with a trusted contact when traveling alone at night, even short distances.
- Trust your instincts about people or situations — it's always okay to leave, say no, or ask for help.
- Keep a personal safety alarm or whistle accessible, especially during odd hours.

## Know your resources
- Familiarize yourself with your institution's Internal Complaints Committee (ICC) or equivalent grievance body.
- Local women's helpline: 1091 (India). Save it, and note that it works from any phone, even without balance.
- Build a small trusted circle on your floor in the first week — a known support network matters more than any gadget.`,
  },
  {
    title: "Medical Checklist Before You Move",
    slug: "medical-checklist",
    category: "Medical" as const,
    icon: "Stethoscope",
    summary: "The health prep that's easy to forget until you actually need it.",
    order: 1,
    content: `Getting sick away from home for the first time is stressful — a little prep removes most of the panic.

## Before you leave home
- Get a basic health check-up and note down your blood group.
- Ask your doctor for a short letter listing any ongoing prescriptions or allergies — useful if you need a new doctor near campus.
- Stock a basic first-aid kit: band-aids, antiseptic, ORS sachets, digital thermometer, and any regular medication for at least a month.

## Around campus
- Locate the campus health center or nearest clinic/pharmacy within your first week, not after you're already unwell.
- Save your health insurance details (policy number, helpline) in your phone and on paper in your room.
- Keep a "sick day" stash: electrolyte powder, basic fever/headache medicine, and something easy to eat.

## Ongoing habits
- Set reminders if you're on any regular medication — it's easy to forget without a parent around.
- Don't skip meals during exam weeks; low blood sugar mimics stress and makes everything feel worse.`,
  },
  {
    title: "Important Documents to Carry (and Copies to Leave Behind)",
    slug: "important-documents-checklist",
    category: "Documents" as const,
    icon: "FileText",
    summary: "The paperwork that will actually get asked for in your first month.",
    order: 1,
    content: `Missing documents cause more first-week stress than almost anything else. Sort this before you travel.

## Carry the originals
- Admission/allotment letter and ID proof (Aadhaar/passport).
- Class 10 and 12 mark sheets and migration/transfer certificate, if required by your institution.
- Passport-size photographs (carry at least 10 — you'll need them for ID cards, mess registration, and more).
- Medical certificate / fitness certificate if your institution requires one.

## Keep digital copies too
- Scan everything above and store it in a cloud folder (Drive/Photos) you can access from any device.
- Add key documents to the Documents section of this app so they're searchable and accessible offline-ready.

## Leave copies at home
- Give your family a physical folder with copies of everything you're carrying, in case you lose the originals.
- Note down document numbers (Aadhaar, passport) separately from the documents themselves.`,
  },
  {
    title: "Emergency Checklist for Hostel Students",
    slug: "emergency-checklist",
    category: "Emergency" as const,
    icon: "Siren",
    summary: "What to have ready before an emergency happens, not during one.",
    order: 1,
    content: `You can't predict emergencies, but you can prepare for them.

## Numbers to save right now
- National emergency number: 112 (India)
- Hostel warden and floor in-charge
- Two hostel friends who know your daily routine
- Family emergency contact
- Campus health center / nearest hospital

## What to keep ready
- A charged power bank at all times — emergencies rarely wait for your phone to charge.
- Cash for emergencies (₹500-1000) kept separately from your everyday wallet.
- Your blood group and any critical allergy info written on a card in your wallet.

## What to do first
- In a medical emergency, alert your warden/floor in-charge immediately — hostels have protocols and often faster access to help than you do alone.
- In case of fire, prioritize getting out over collecting belongings.
- Use the Emergency Contacts section in this app so you (or a friend) can act fast without hunting for numbers.`,
  },
  {
    title: "Your First Week: A Day-by-Day Guide",
    slug: "first-week-guide",
    category: "First Week" as const,
    icon: "CalendarDays",
    summary: "What to prioritize in your first seven days so the rest of the semester goes smoothly.",
    order: 1,
    content: `The first week sets the tone for the semester. Here's a simple order of priorities.

## Day 1-2: Settle in
- Unpack essentials first: bedding, toiletries, chargers. The rest can wait.
- Meet your roommate and agree on basics — sleep times, guests, shared space.
- Locate the mess/canteen, nearest store, and washroom facilities.

## Day 3-4: Get official
- Complete hostel registration, mess registration, and ID card formalities.
- Submit any pending documents (see the Documents guide).
- Set up Wi-Fi/internet access for your room.

## Day 5-7: Build your routine
- Buy remaining hostel essentials locally (bucket, hangers, extension board, study lamp).
- Explore the campus: library, health center, ATM, laundry area.
- Start building your emergency contacts and a small friend circle on your floor.

## Ongoing
- Don't try to have your whole routine figured out in week one — give yourself a full month to settle in properly.`,
  },
  {
    title: "Planning Your Hostel Budget",
    slug: "budget-planning-guide",
    category: "Budget Planning" as const,
    icon: "PiggyBank",
    summary: "A simple framework to avoid running out of money mid-semester.",
    order: 1,
    content: `Most students overspend in the first month simply because they haven't planned. A simple framework fixes that.

## Split your budget into three buckets
- **Fixed costs**: mess fees, hostel fees, recurring subscriptions.
- **Variable essentials**: toiletries, laundry, stationery, occasional travel.
- **Discretionary**: eating out, entertainment, shopping.

## A simple starting rule
- Track every expense for your first two weeks, even small ones — you'll be surprised where the money actually goes.
- Use the Budget tab in this app to log a "planned" amount per category, then track real expenses against it.
- Set a soft weekly spending limit for discretionary costs rather than a vague monthly one — weekly limits are much easier to self-correct.

## Avoiding common budget mistakes
- Don't front-load spending in week one buying things you might not actually need — wait and observe what your hostel routine actually requires.
- Keep a small emergency buffer (5-10% of your monthly budget) untouched for unexpected costs.
- Revisit your budget categories after the first month and adjust — your real spending pattern will differ from your first guess.`,
  },
];

const curatedProducts = [
  {
    name: "Compact Study Table Lamp",
    category: "Hostel Essentials" as const,
    store: "Amazon",
    price: 699,
    discountPercent: 15,
    rating: 4.3,
    pros: ["Foldable and saves desk space", "Adjustable brightness", "USB rechargeable"],
    cons: ["Light isn't very wide-angle"],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=led+study+table+lamp",
      flipkart: "https://www.flipkart.com/search?q=led+study+table+lamp",
    },
    featured: true,
  },
  {
    name: "Steel Storage Trunk (Medium)",
    category: "Hostel Essentials" as const,
    store: "Local Store",
    price: 1800,
    discountPercent: 0,
    rating: 4.1,
    pros: ["Durable and lockable", "Doubles as extra seating", "Water-resistant"],
    cons: ["Heavier than plastic alternatives"],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=steel+storage+trunk",
      local: "https://www.google.com/maps/search/steel+trunk+shop+near+me",
    },
    featured: false,
  },
  {
    name: "Bucket & Mug Set with Lid",
    category: "Toiletries" as const,
    store: "Local Store",
    price: 250,
    discountPercent: 0,
    rating: 4.0,
    pros: ["Essential for hand-washing clothes", "Lid keeps it clean when stored"],
    cons: [],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=bucket+mug+set+with+lid",
    },
    featured: false,
  },
  {
    name: "Extension Board with Surge Protection",
    category: "Electronics" as const,
    store: "Amazon",
    price: 549,
    discountPercent: 10,
    rating: 4.5,
    pros: ["Surge protection saves your electronics", "6 sockets is enough for a shared room", "Individual switches per socket"],
    cons: ["Cable could be longer for bigger rooms"],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=extension+board+surge+protector",
      flipkart: "https://www.flipkart.com/search?q=extension+board+surge+protector",
    },
    featured: true,
  },
  {
    name: "20000mAh Power Bank",
    category: "Electronics" as const,
    store: "Flipkart",
    price: 1499,
    discountPercent: 20,
    rating: 4.4,
    pros: ["Charges laptop and phone both", "Fast charging support", "Reliable during power cuts"],
    cons: ["Adds noticeable weight to your bag"],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=20000mah+power+bank",
      flipkart: "https://www.flipkart.com/search?q=20000mah+power+bank",
    },
    featured: true,
  },
  {
    name: "Foldable Laundry Drying Stand",
    category: "Laundry" as const,
    store: "Amazon",
    price: 899,
    discountPercent: 5,
    rating: 4.2,
    pros: ["Folds flat for storage", "Fits in small rooms", "Stainless steel — doesn't rust"],
    cons: ["Limited capacity for a full week's laundry"],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=foldable+laundry+drying+stand",
    },
    featured: false,
  },
  {
    name: "Electric Kettle (1L)",
    category: "Kitchen" as const,
    store: "Amazon",
    price: 799,
    discountPercent: 12,
    rating: 4.3,
    pros: ["Boils water in minutes", "Auto shut-off for safety", "Great for instant noodles/tea"],
    cons: ["Check your hostel's appliance rules before buying"],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=electric+kettle+1+litre",
      flipkart: "https://www.flipkart.com/search?q=electric+kettle+1+litre",
    },
    featured: false,
  },
  {
    name: "First Aid Kit (Compact)",
    category: "Medicines" as const,
    store: "Amazon",
    price: 399,
    discountPercent: 0,
    rating: 4.6,
    pros: ["Covers most minor injuries and illnesses", "Compact enough for a drawer", "Includes ORS and basic medication"],
    cons: [],
    buyLinks: {
      amazon: "https://www.amazon.in/s?k=compact+first+aid+kit",
    },
    featured: true,
  },
];

type ProductCategory = (typeof DEFAULT_CHECKLIST_CATEGORIES)[number];

/** Bare-minimum starter entry for a hostel packing-list item, pointing at an Amazon *search*
 * (not a specific listing) — price/rating are rough, uneditorialized placeholders so the
 * shopping page has something to show; admins should curate real listings, prices, and
 * pros/cons for these from the admin Products page over time. */
function starterProduct(name: string, category: ProductCategory, price: number, amazonSearchUrl: string) {
  return {
    name,
    category,
    store: "Amazon",
    price,
    discountPercent: 0,
    rating: 4,
    pros: ["Widely available — a reasonable everyday pick for hostel life"],
    cons: ["This is an Amazon search link, not a specific listing — compare brand, price, and reviews before buying"],
    buyLinks: { amazon: amazonSearchUrl },
    featured: false,
  };
}

// [name, category, estimated price (INR), Amazon search URL]
const starterShoppingItems: Array<[string, ProductCategory, number, string]> = [
  ["Laptop", "Electronics", 35999, "https://www.amazon.in/s?k=laptop"],
  ["Laptop Charger", "Electronics", 999, "https://www.amazon.in/s?k=laptop+charger"],
  ["USB Drive", "Electronics", 399, "https://www.amazon.in/s?k=usb+flash+drive"],
  ["External Hard Disk", "Electronics", 3499, "https://www.amazon.in/s?k=external+hard+disk"],
  ["Headphones / Earbuds", "Electronics", 1299, "https://www.amazon.in/s?k=wireless+earbuds"],
  ["Table Lamp", "Hostel Essentials", 599, "https://www.amazon.in/s?k=study+table+lamp"],
  ["Extension Board", "Electronics", 549, "https://www.amazon.in/s?k=extension+board"],
  ["Power Bank", "Electronics", 999, "https://www.amazon.in/s?k=power+bank"],
  ["Toothbrush", "Toiletries", 49, "https://www.amazon.in/s?k=toothbrush"],
  ["Toothpaste", "Toiletries", 99, "https://www.amazon.in/s?k=toothpaste"],
  ["Face Wash", "Toiletries", 199, "https://www.amazon.in/s?k=face+wash"],
  ["Soap / Body Wash", "Toiletries", 149, "https://www.amazon.in/s?k=body+wash"],
  ["Shampoo", "Toiletries", 199, "https://www.amazon.in/s?k=shampoo"],
  ["Conditioner", "Toiletries", 199, "https://www.amazon.in/s?k=conditioner"],
  ["Hair Oil", "Toiletries", 149, "https://www.amazon.in/s?k=hair+oil"],
  ["Comb", "Toiletries", 49, "https://www.amazon.in/s?k=comb"],
  ["Hair Brush", "Toiletries", 199, "https://www.amazon.in/s?k=hair+brush"],
  ["Trimmer", "Electronics", 799, "https://www.amazon.in/s?k=trimmer"],
  ["Razor", "Toiletries", 149, "https://www.amazon.in/s?k=razor"],
  ["Towel", "Toiletries", 349, "https://www.amazon.in/s?k=bath+towel"],
  ["Hand Towel", "Toiletries", 149, "https://www.amazon.in/s?k=hand+towel"],
  ["Nail Cutter", "Toiletries", 99, "https://www.amazon.in/s?k=nail+cutter"],
  ["Deodorant", "Toiletries", 199, "https://www.amazon.in/s?k=deodorant"],
  ["Perfume", "Toiletries", 499, "https://www.amazon.in/s?k=perfume"],
  ["Sanitary Pads", "Toiletries", 199, "https://www.amazon.in/s?k=sanitary+pads"],
  ["Laundry Bag", "Laundry", 249, "https://www.amazon.in/s?k=laundry+bag"],
  ["Detergent", "Laundry", 199, "https://www.amazon.in/s?k=laundry+detergent"],
  ["Bucket", "Toiletries", 249, "https://www.amazon.in/s?k=plastic+bucket"],
  ["Mug", "Toiletries", 79, "https://www.amazon.in/s?k=plastic+mug"],
  ["Cloth Clips", "Laundry", 99, "https://www.amazon.in/s?k=cloth+clips"],
  ["Foldable Drying Stand", "Laundry", 899, "https://www.amazon.in/s?k=foldable+clothes+drying+stand"],
  ["Disinfectant Spray", "Hostel Essentials", 199, "https://www.amazon.in/s?k=disinfectant+spray"],
  ["Water Bottle", "Hostel Essentials", 299, "https://www.amazon.in/s?k=water+bottle"],
  ["Electric Kettle", "Kitchen", 799, "https://www.amazon.in/s?k=electric+kettle"],
  ["Bowl", "Kitchen", 299, "https://www.amazon.in/s?k=stainless+steel+bowl"],
  ["Spoon & Fork Set", "Kitchen", 249, "https://www.amazon.in/s?k=spoon+fork+set"],
  ["Airtight Containers", "Kitchen", 499, "https://www.amazon.in/s?k=airtight+food+containers"],
  ["Plate", "Kitchen", 249, "https://www.amazon.in/s?k=stainless+steel+plate"],
  ["Bedsheets", "Hostel Essentials", 599, "https://www.amazon.in/s?k=single+bed+bedsheet"],
  ["Pillow", "Hostel Essentials", 399, "https://www.amazon.in/s?k=pillow"],
  ["Pillow Covers", "Hostel Essentials", 199, "https://www.amazon.in/s?k=pillow+covers"],
  ["Blanket", "Hostel Essentials", 899, "https://www.amazon.in/s?k=blanket"],
  ["Comforter", "Hostel Essentials", 1499, "https://www.amazon.in/s?k=comforter"],
  ["Mattress Protector", "Hostel Essentials", 599, "https://www.amazon.in/s?k=mattress+protector+single+bed"],
  ["Storage Boxes", "Hostel Essentials", 499, "https://www.amazon.in/s?k=storage+box"],
  ["Hangers", "Hostel Essentials", 199, "https://www.amazon.in/s?k=clothes+hangers"],
  ["Adhesive Hooks", "Hostel Essentials", 149, "https://www.amazon.in/s?k=adhesive+wall+hooks"],
  ["Mirror", "Hostel Essentials", 299, "https://www.amazon.in/s?k=table+mirror"],
  ["Bedside Organizer", "Hostel Essentials", 349, "https://www.amazon.in/s?k=bedside+organizer"],
  ["Iron", "Electronics", 899, "https://www.amazon.in/s?k=travel+steam+iron"],
  ["Sketchbook A3", "Fashion Design Tools", 349, "https://www.amazon.in/s?k=a3+sketchbook"],
  ["Sketchbook A4", "Fashion Design Tools", 199, "https://www.amazon.in/s?k=a4+sketchbook"],
  ["Drawing Sheets", "Fashion Design Tools", 249, "https://www.amazon.in/s?k=drawing+sheets"],
  ["Color Pencils", "Fashion Design Tools", 199, "https://www.amazon.in/s?k=color+pencils"],
  ["Watercolors", "Fashion Design Tools", 299, "https://www.amazon.in/s?k=watercolor+set"],
  ["Poster Colors", "Fashion Design Tools", 249, "https://www.amazon.in/s?k=poster+colors"],
  ["Paint Brushes", "Fashion Design Tools", 349, "https://www.amazon.in/s?k=artist+paint+brush+set"],
  ["Cutting Mat", "Fashion Design Tools", 599, "https://www.amazon.in/s?k=a3+cutting+mat"],
  ["Portfolio File", "Fashion Design Tools", 499, "https://www.amazon.in/s?k=portfolio+file"],
  ["Submission Folder", "Fashion Design Tools", 299, "https://www.amazon.in/s?k=presentation+folder"],
  ["Sewing Kit", "Fashion Design Tools", 299, "https://www.amazon.in/s?k=sewing+kit"],
  ["Measuring Tape", "Fashion Design Tools", 99, "https://www.amazon.in/s?k=tailor+measuring+tape"],
  ["Scale", "Fashion Design Tools", 49, "https://www.amazon.in/s?k=30cm+scale"],
  ["Cutter", "Fashion Design Tools", 149, "https://www.amazon.in/s?k=paper+cutter"],
  ["Scissors", "Fashion Design Tools", 99, "https://www.amazon.in/s?k=craft+scissors"],
  ["Glue / Fevicol", "Fashion Design Tools", 49, "https://www.amazon.in/s?k=fevicol"],
  ["Fineliner Pens", "Fashion Design Tools", 349, "https://www.amazon.in/s?k=fineliner+pens"],
  ["Pencils", "Fashion Design Tools", 199, "https://www.amazon.in/s?k=drawing+pencils+set"],
  ["Eraser", "Fashion Design Tools", 29, "https://www.amazon.in/s?k=eraser"],
  ["Sharpener", "Fashion Design Tools", 49, "https://www.amazon.in/s?k=pencil+sharpener"],
  ["First Aid Kit", "Medicines", 399, "https://www.amazon.in/s?k=first+aid+kit"],
  ["Band-Aids", "Medicines", 49, "https://www.amazon.in/s?k=band+aid"],
  ["Small Lock", "Hostel Essentials", 199, "https://www.amazon.in/s?k=padlock"],
  ["Extra Lock", "Hostel Essentials", 199, "https://www.amazon.in/s?k=padlock"],
  ["Umbrella", "Miscellaneous", 399, "https://www.amazon.in/s?k=compact+umbrella"],
  ["Daily Backpack", "Miscellaneous", 999, "https://www.amazon.in/s?k=college+backpack"],
  ["Journal", "Stationery", 199, "https://www.amazon.in/s?k=journal+notebook"],
  ["Eye Mask", "Hostel Essentials", 149, "https://www.amazon.in/s?k=sleep+eye+mask"],
  ["Earplugs", "Hostel Essentials", 99, "https://www.amazon.in/s?k=earplugs"],
];

const products = [
  ...curatedProducts,
  ...starterShoppingItems.map(([name, category, price, amazonSearchUrl]) =>
    starterProduct(name, category, price, amazonSearchUrl),
  ),
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  for (const article of guideArticles) {
    await GuideArticle.findOneAndUpdate({ slug: article.slug }, article, {
      upsert: true,
      returnDocument: "after",
    });
  }
  console.log(`Seeded ${guideArticles.length} guide articles`);

  for (const product of products) {
    await Product.findOneAndUpdate(
      { name: product.name, store: product.store },
      product,
      { upsert: true, returnDocument: "after" },
    );
  }
  console.log(`Seeded ${products.length} products`);

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
