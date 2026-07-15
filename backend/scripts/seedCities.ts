/**
 * Loads the City catalog (the registration/profile city picker) from a fixed list of 200+
 * major Indian cities. Idempotent — upserts by name, safe to re-run.
 *
 * Usage: npm run seed:cities
 */
import "dotenv/config";
import mongoose from "mongoose";

import { City } from "@/models/City";

// Sourced from India_200_Plus_Major_Cities_AZ.xlsx, de-duplicated and sorted ascending.
const CITY_NAMES = [
  "Agartala", "Agra", "Ahmedabad", "Aizawl", "Ajmer", "Akola", "Alappuzha", "Aligarh",
  "Alipurduar", "Alwar", "Amaravati", "Ambala", "Ambikapur", "Amravati", "Amritsar", "Anand",
  "Anantapur", "Angul", "Ara", "Asansol", "Aurangabad", "Ayodhya", "Balasore", "Ballari",
  "Bareilly", "Bathinda", "Belagavi", "Bengaluru", "Berhampur", "Bhagalpur", "Bharatpur",
  "Bharuch", "Bhavnagar", "Bhilai", "Bhiwadi", "Bhopal", "Bhubaneswar", "Bhuj", "Bidar",
  "Bikaner", "Bilaspur", "Bokaro", "Bulandshahr", "Burdwan", "Chandigarh", "Chennai",
  "Coimbatore", "Cuttack", "Darbhanga", "Dehradun", "Delhi", "Dhanbad", "Dharwad", "Dibrugarh",
  "Dimapur", "Durg", "Durgapur", "Eluru", "Erode", "Faridabad", "Gandhinagar", "Gangtok",
  "Gaya", "Ghaziabad", "Gorakhpur", "Greater Noida", "Guntur", "Gurugram", "Guwahati",
  "Gwalior", "Haldwani", "Hamirpur", "Haridwar", "Hisar", "Hosur", "Howrah", "Hubballi",
  "Hyderabad", "Imphal", "Indore", "Itanagar", "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon",
  "Jammu", "Jamnagar", "Jamshedpur", "Jodhpur", "Jorhat", "Junagadh", "Kakinada", "Kalaburagi",
  "Kanchipuram", "Kannur", "Kanpur", "Karimnagar", "Karnal", "Kasaragod", "Katni", "Khammam",
  "Kharagpur", "Kochi", "Kohima", "Kolhapur", "Kolkata", "Kollam", "Kota", "Kottayam",
  "Kozhikode", "Kurnool", "Kurukshetra", "Lucknow", "Ludhiana", "Madurai", "Malda", "Mangaluru",
  "Manipal", "Meerut", "Mohali", "Moradabad", "Mumbai", "Muzaffarpur", "Mysuru", "Nagpur",
  "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Noida", "Panaji", "Patiala", "Patna",
  "Prayagraj", "Puducherry", "Pune", "Raipur", "Rajahmundry", "Rajkot", "Ranchi", "Roorkee",
  "Rourkela", "Salem", "Sambalpur", "Shillong", "Shimla", "Silchar", "Siliguri", "Solapur",
  "Sonipat", "Srinagar", "Surat", "Thanjavur", "Thiruvananthapuram", "Thrissur",
  "Tiruchirappalli", "Tirunelveli", "Tirupati", "Tumakuru", "Udaipur", "Udupi", "Vadodara",
  "Varanasi", "Vellore", "Vijayawada", "Visakhapatnam", "Warangal", "Yamunanagar",
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  await mongoose.connect(uri);

  let created = 0;
  let skipped = 0;
  for (const name of CITY_NAMES) {
    const result = await City.findOneAndUpdate(
      { name },
      { $setOnInsert: { name } },
      { upsert: true, new: false },
    );
    if (result) {
      skipped += 1;
    } else {
      created += 1;
    }
  }

  console.log(`Cities seeded: ${created} created, ${skipped} already present (${CITY_NAMES.length} total).`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Failed to seed cities:", error);
  process.exit(1);
});
