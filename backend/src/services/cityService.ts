import { connectDB } from "@/db";
import { City } from "@/models/City";
import { INDIAN_CITY_NAMES } from "@/lib/indianCities";
import { escapeRegex } from "@/lib/regex";
import type { CityInput, CityUpdateInput } from "@/validations/admin";

/** Auto-seeds the City catalog from the starter Indian-cities list the first time the
 * collection is empty, so the registration/profile city picker isn't blocked on someone
 * remembering to run `npm run seed:cities` by hand after a fresh deploy. No-op once cities
 * exist (including admin-added ones) — cheap count check on every boot, not a full write. */
export async function ensureCitiesSeeded() {
  await connectDB();
  const count = await City.estimatedDocumentCount();
  if (count > 0) return;

  await City.insertMany(
    INDIAN_CITY_NAMES.map((name) => ({ name })),
    { ordered: false },
  ).catch((error) => {
    // Duplicate-key races (e.g. multiple instances booting at once) are expected and harmless.
    console.error("City auto-seed encountered an error (may be a harmless race):", error.message ?? error);
  });
}

export async function listCities(search?: string) {
  await connectDB();
  const filter = search ? { name: new RegExp(escapeRegex(search), "i") } : {};
  return City.find(filter).sort({ featured: -1, name: 1 }).lean();
}

export async function createCity(input: CityInput) {
  await connectDB();
  return City.create(input);
}

export async function updateCity(input: CityUpdateInput) {
  await connectDB();
  const { id, ...rest } = input;
  return City.findByIdAndUpdate(id, rest, { returnDocument: "after" }).lean();
}

export async function deleteCity(id: string) {
  await connectDB();
  return City.deleteOne({ _id: id });
}
