import { createAsyncRouter } from "@/lib/asyncRouter";

import { CHECKLIST_GENDER_OPTIONS } from "@/types";
import { requireAdmin, requireAuth } from "@/middleware/auth";
import { getAdminAnalytics } from "@/services/analyticsService";
import {
  adminUpdateUser,
  createUserByAdmin,
  deleteUserByAdmin,
  listUsers,
  regeneratePin,
} from "@/services/userService";
import {
  bulkUpsertProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/services/productService";
import {
  createGuideArticle,
  deleteGuideArticle,
  updateGuideArticle,
} from "@/services/guideService";
import { saveDashboardLayout, saveHomeLayout, saveNavLayout } from "@/services/uiLayoutService";
import { saveLandingDesign } from "@/services/landingDesignService";
import { getLandingPageSettings, updateLandingPageSettings } from "@/services/landingPageSettingsService";
import { createCity, deleteCity, listCities, updateCity } from "@/services/cityService";
import {
  GENDER_THEME_KEYS,
  getAllGenderThemeSettings,
  updateGenderThemeSettings,
  type GenderThemeKey,
} from "@/services/genderThemeService";
import { createPlace, deletePlace, listPlaces, updatePlace } from "@/services/placeService";
import { createListing, deleteListing, listListings, updateListing } from "@/services/listingService";
import {
  adminDeleteDirectoryContact,
  listReportedContacts,
  verifyDirectoryContact,
} from "@/services/directoryContactService";
import {
  createUserByAdminSchema,
  citySchema,
  cityUpdateSchema,
  bulkImportProductsSchema,
  genderThemeUpdateSchema,
  guideArticleSchema,
  guideArticleUpdateSchema,
  landingDesignSchema,
  landingPageSettingsUpdateSchema,
  listingSchema,
  listingUpdateSchema,
  placeSchema,
  placeUpdateSchema,
  productSchema,
  productUpdateSchema,
  uiLayoutSchema,
  updateUserByAdminSchema,
} from "@/validations/admin";
import {
  createCollegeCategory,
  deleteCollegeCategory,
  listAllCollegeCategories,
  updateCollegeCategory,
} from "@/services/collegeCategoryService";
import { createCourse, deleteCourse, listAllCourses, updateCourse } from "@/services/courseService";
import { createCollege, deleteCollege, listAllColleges, updateCollege } from "@/services/collegeService";
import {
  createChecklistTemplate,
  listChecklistTemplates,
  updateChecklistTemplate,
} from "@/services/checklistTemplateService";
import {
  bulkDeleteDefaultChecklistItems,
  bulkImportDefaultChecklistItems,
  bulkSetActive,
  createDefaultChecklistItem,
  deleteDefaultChecklistItem,
  listCategoryOrderForAdmin,
  listDefaultChecklistItemsForAdmin,
  listDistinctCategories,
  saveCategoryOrder,
  updateDefaultChecklistItem,
} from "@/services/defaultChecklistItemService";
import { addSuggestedItemToDefault, getSuggestedItemUsers, listSuggestedItems } from "@/services/suggestedItemsService";
import { getChecklistDashboardStats, getDefaultItemAnalytics } from "@/services/checklistAnalyticsService";
import { getChecklistHealthSnapshot } from "@/services/checklistHealthService";
import { deleteTempUserById, listTempUsers } from "@/services/tempUserService";
import {
  addSuggestedToDefaultSchema,
  bulkIdsSchema,
  bulkImportDefaultItemsSchema,
  bulkSetActiveSchema,
  categoryOrderSchema,
  checklistTemplateSchema,
  checklistTemplateUpdateSchema,
  collegeCategorySchema,
  collegeCategoryUpdateSchema,
  collegeSchema,
  collegeUpdateSchema,
  courseSchema,
  courseUpdateSchema,
  defaultChecklistItemSchema,
  defaultChecklistItemUpdateSchema,
} from "@/validations/checklistAdmin";
import {
  adminAddMemberByMobile,
  adminBulkAddMembers,
  adminDeleteCommunity,
  adminRestoreCommunity,
  adminSetCommunityStatus,
  adminUpdateCommunity,
  listAllCommunitiesForAdmin,
  listMembers,
  removeMember,
  setMemberModeration,
  updateMemberRole,
} from "@/services/communityService";
import {
  adminAddMemberSchema,
  adminBulkAddMembersSchema,
  adminListCommunitiesQuerySchema,
  adminUpdateCommunitySchema,
  moderateMemberSchema,
  updateMemberRoleSchema,
} from "@/validations/community";
import type { CommunityRole } from "@/types";

export const adminRouter = createAsyncRouter();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/analytics", async (_req, res) => {
  const analytics = await getAdminAnalytics();
  res.json({ analytics });
});

adminRouter.get("/users", async (req, res) => {
  const page = Number(req.query.page ?? 1) || 1;
  const pageSize = Number(req.query.pageSize ?? 20) || 20;
  const { users, total } = await listUsers(page, pageSize);
  const sanitized = users.map((user) => ({
    id: user._id.toString(),
    name: user.name ?? null,
    mobile: user.mobile,
    gender: user.gender ?? null,
    college: user.college ?? null,
    collegeCategory: user.collegeCategory ?? null,
    role: user.role,
    verified: Boolean(user.verified),
    hasPinSet: Boolean(user.loginPinHash),
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
  }));
  res.json({ users: sanitized, total });
});

adminRouter.post("/users", async (req, res) => {
  const parsed = createUserByAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await createUserByAdmin(parsed.data.mobile);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true, mobile: result.user.mobile, pin: result.pin });
});

adminRouter.patch("/users/:id", async (req, res) => {
  const parsed = updateUserByAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await adminUpdateUser(req.params.id, parsed.data);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

adminRouter.post("/users/:id/regenerate-pin", async (req, res) => {
  const result = await regeneratePin(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true, pin: result.pin });
});

adminRouter.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user!._id.toString()) {
    res.status(400).json({ error: "You can't delete your own account" });
    return;
  }
  const result = await deleteUserByAdmin(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

adminRouter.post("/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const product = await createProduct(parsed.data);
  res.json({ product });
});

adminRouter.patch("/products/:id", async (req, res) => {
  const parsed = productUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const product = await updateProduct(parsed.data);
  res.json({ product });
});

adminRouter.delete("/products/:id", async (req, res) => {
  await deleteProduct(req.params.id);
  res.json({ success: true });
});

adminRouter.post("/products/bulk-import", async (req, res) => {
  const parsed = bulkImportProductsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await bulkUpsertProducts(parsed.data.products);
  res.json({ success: true, ...result });
});

adminRouter.post("/guide", async (req, res) => {
  const parsed = guideArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const article = await createGuideArticle(parsed.data);
  res.json({ article });
});

adminRouter.patch("/guide/:id", async (req, res) => {
  const parsed = guideArticleUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const article = await updateGuideArticle(parsed.data);
  res.json({ article });
});

adminRouter.delete("/guide/:id", async (req, res) => {
  await deleteGuideArticle(req.params.id);
  res.json({ success: true });
});

adminRouter.put("/layout", async (req, res) => {
  const parsed = uiLayoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const widgets = await saveDashboardLayout(parsed.data.widgets);
  res.json({ widgets });
});

adminRouter.put("/nav-layout", async (req, res) => {
  const parsed = uiLayoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const widgets = await saveNavLayout(parsed.data.widgets);
  res.json({ widgets });
});

adminRouter.put("/home-layout", async (req, res) => {
  const parsed = uiLayoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const widgets = await saveHomeLayout(parsed.data.widgets);
  res.json({ widgets });
});

adminRouter.put("/landing-design", async (req, res) => {
  const parsed = landingDesignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const design = await saveLandingDesign(
    parsed.data.page,
    parsed.data.elements,
    parsed.data.sectionBackgrounds ?? [],
  );
  res.json(design);
});

// --- Cities ---

adminRouter.get("/cities", async (_req, res) => {
  res.json({ cities: await listCities() });
});

adminRouter.post("/cities", async (req, res) => {
  const parsed = citySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const city = await createCity(parsed.data);
  res.json({ city });
});

adminRouter.patch("/cities/:id", async (req, res) => {
  const parsed = cityUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const city = await updateCity(parsed.data);
  res.json({ city });
});

adminRouter.delete("/cities/:id", async (req, res) => {
  await deleteCity(req.params.id);
  res.json({ success: true });
});

// --- Gender theme (colors + stickers per gender, tunable without a deploy) ---

adminRouter.get("/gender-theme", async (_req, res) => {
  res.json({ settings: await getAllGenderThemeSettings() });
});

adminRouter.patch("/gender-theme/:key", async (req, res) => {
  const key = req.params.key;
  if (!GENDER_THEME_KEYS.includes(key as GenderThemeKey)) {
    res.status(400).json({ error: "Invalid gender key" });
    return;
  }
  const parsed = genderThemeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const {
    stickerSlugs,
    customStickers,
    backgroundColor,
    primaryColor,
    secondaryColor,
    accentColor,
    gradientFrom,
    gradientTo,
    noteColors,
  } = parsed.data;
  // "" from the form means "clear this override back to the frontend default" — store as null,
  // not an empty string, so getAllGenderThemeSettings's DTO stays `string | null` throughout.
  const asColor = (v: string) => (v === "" ? null : v);
  const settings = await updateGenderThemeSettings(key as GenderThemeKey, {
    backgroundColor: asColor(backgroundColor),
    primaryColor: asColor(primaryColor),
    secondaryColor: asColor(secondaryColor),
    accentColor: asColor(accentColor),
    gradientFrom: asColor(gradientFrom),
    gradientTo: asColor(gradientTo),
    stickerSlugs,
    customStickers,
    noteColors: {
      yellow: asColor(noteColors.yellow),
      pink: asColor(noteColors.pink),
      blue: asColor(noteColors.blue),
      lavender: asColor(noteColors.lavender),
    },
  });
  res.json({ settings });
});

// --- Landing page settings (girl/boy placeholder images for the pre-login /welcome cards) ---

adminRouter.get("/landing-settings", async (_req, res) => {
  res.json({ settings: await getLandingPageSettings() });
});

adminRouter.put("/landing-settings", async (req, res) => {
  const parsed = landingPageSettingsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  // "" from the form means "clear this image back to the neutral placeholder" — store as null,
  // not an empty string, same asColor pattern as gender-theme above.
  const asUrl = (v: string) => (v === "" ? null : v);
  const settings = await updateLandingPageSettings({
    girlImageUrl: asUrl(parsed.data.girlImageUrl),
    boyImageUrl: asUrl(parsed.data.boyImageUrl),
  });
  res.json({ settings });
});

// --- Places ---

adminRouter.get("/places", async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city : undefined;
  res.json({ places: await listPlaces(city) });
});

adminRouter.post("/places", async (req, res) => {
  const parsed = placeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const place = await createPlace(parsed.data);
  res.json({ place });
});

adminRouter.patch("/places/:id", async (req, res) => {
  const parsed = placeUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const place = await updatePlace(parsed.data);
  res.json({ place });
});

adminRouter.delete("/places/:id", async (req, res) => {
  await deletePlace(req.params.id);
  res.json({ success: true });
});

// --- Listings (Hostel, PG, Flat) ---

adminRouter.get("/listings", async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city : undefined;
  res.json({ listings: await listListings(city) });
});

adminRouter.post("/listings", async (req, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const listing = await createListing(parsed.data);
  res.json({ listing });
});

adminRouter.patch("/listings/:id", async (req, res) => {
  const parsed = listingUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const listing = await updateListing(parsed.data);
  res.json({ listing });
});

adminRouter.delete("/listings/:id", async (req, res) => {
  await deleteListing(req.params.id);
  res.json({ success: true });
});

// --- Directory contact moderation ---

adminRouter.get("/directory-contacts/reported", async (_req, res) => {
  res.json({ contacts: await listReportedContacts() });
});

adminRouter.post("/directory-contacts/:id/verify", async (req, res) => {
  const contact = await verifyDirectoryContact(req.params.id, req.body?.verified !== false);
  res.json({ contact });
});

adminRouter.delete("/directory-contacts/:id", async (req, res) => {
  await adminDeleteDirectoryContact(req.params.id);
  res.json({ success: true });
});

// --- College categories ---

adminRouter.get("/college-categories", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  res.json({ collegeCategories: await listAllCollegeCategories(search) });
});

adminRouter.post("/college-categories", async (req, res) => {
  const parsed = collegeCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await createCollegeCategory(parsed.data);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ category: result.category });
});

adminRouter.patch("/college-categories/:id", async (req, res) => {
  const parsed = collegeCategoryUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { id, ...rest } = parsed.data;
  const result = await updateCollegeCategory(id, rest);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ category: result.category });
});

adminRouter.delete("/college-categories/:id", async (req, res) => {
  const result = await deleteCollegeCategory(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

// --- Courses ---

adminRouter.get("/courses", async (req, res) => {
  const collegeCategoryId = typeof req.query.collegeCategoryId === "string" ? req.query.collegeCategoryId : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  res.json({ courses: await listAllCourses({ collegeCategoryId, search }) });
});

adminRouter.post("/courses", async (req, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await createCourse(parsed.data);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ course: result.course });
});

adminRouter.patch("/courses/:id", async (req, res) => {
  const parsed = courseUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { id, ...rest } = parsed.data;
  const result = await updateCourse(id, rest);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ course: result.course });
});

adminRouter.delete("/courses/:id", async (req, res) => {
  const result = await deleteCourse(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

// --- Colleges ---

adminRouter.get("/colleges", async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city : undefined;
  const collegeCategoryId = typeof req.query.collegeCategoryId === "string" ? req.query.collegeCategoryId : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  res.json({ colleges: await listAllColleges({ city, collegeCategoryId, search }) });
});

adminRouter.post("/colleges", async (req, res) => {
  const parsed = collegeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await createCollege(parsed.data);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ college: result.college });
});

adminRouter.patch("/colleges/:id", async (req, res) => {
  const parsed = collegeUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { id, ...rest } = parsed.data;
  const result = await updateCollege(id, rest);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ college: result.college });
});

adminRouter.delete("/colleges/:id", async (req, res) => {
  const result = await deleteCollege(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

// --- Checklist templates ---

adminRouter.get("/checklist-templates", async (_req, res) => {
  res.json({ templates: await listChecklistTemplates() });
});

adminRouter.post("/checklist-templates", async (req, res) => {
  const parsed = checklistTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await createChecklistTemplate(parsed.data);
  res.json({ template: result.template });
});

adminRouter.patch("/checklist-templates/:id", async (req, res) => {
  const parsed = checklistTemplateUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { id, ...rest } = parsed.data;
  const result = await updateChecklistTemplate(id, rest);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ template: result.template });
});

// --- Default checklist items (master data) ---

adminRouter.get("/default-checklist-items", async (req, res) => {
  const { search, category, collegeCategoryId, courseId, gender, active, page, pageSize } = req.query;
  const result = await listDefaultChecklistItemsForAdmin({
    search: typeof search === "string" ? search : undefined,
    category: typeof category === "string" ? category : undefined,
    collegeCategoryId: typeof collegeCategoryId === "string" ? collegeCategoryId : undefined,
    courseId: typeof courseId === "string" ? courseId : undefined,
    gender: CHECKLIST_GENDER_OPTIONS.includes(gender as (typeof CHECKLIST_GENDER_OPTIONS)[number])
      ? (gender as (typeof CHECKLIST_GENDER_OPTIONS)[number])
      : undefined,
    active: active === "true" ? true : active === "false" ? false : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  const analytics = await getDefaultItemAnalytics(result.items.map((i) => String(i._id)));
  const items = result.items.map((item) => ({ ...item, analytics: analytics.get(String(item._id)) ?? null }));

  res.json({ ...result, items });
});

adminRouter.get("/default-checklist-items/categories", async (_req, res) => {
  res.json({ categories: await listDistinctCategories() });
});

// Display order for checklist categories (Documents, Clothes, ...) — feeds every student's
// checklist (notebook + list views) via categoryService.listCategories.
adminRouter.get("/default-checklist-items/category-order", async (_req, res) => {
  res.json({ categories: await listCategoryOrderForAdmin() });
});

adminRouter.put("/default-checklist-items/category-order", async (req, res) => {
  const parsed = categoryOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  await saveCategoryOrder(parsed.data.categories);
  res.json({ success: true });
});

adminRouter.post("/default-checklist-items", async (req, res) => {
  const parsed = defaultChecklistItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await createDefaultChecklistItem(parsed.data, req.user!._id.toString());
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ item: result.item });
});

adminRouter.patch("/default-checklist-items/:id", async (req, res) => {
  const parsed = defaultChecklistItemUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { id, ...rest } = parsed.data;
  const result = await updateDefaultChecklistItem(id, rest, req.user!._id.toString());
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ item: result.item });
});

adminRouter.delete("/default-checklist-items/:id", async (req, res) => {
  const result = await deleteDefaultChecklistItem(req.params.id);
  res.json({ success: true, detachedCount: result.detachedCount });
});

adminRouter.post("/default-checklist-items/bulk-delete", async (req, res) => {
  const parsed = bulkIdsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await bulkDeleteDefaultChecklistItems(parsed.data.ids);
  res.json({ success: true, ...result });
});

adminRouter.post("/default-checklist-items/bulk-set-active", async (req, res) => {
  const parsed = bulkSetActiveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await bulkSetActive(parsed.data.ids, parsed.data.active);
  res.json({ success: true, ...result });
});

adminRouter.post("/default-checklist-items/bulk-import", async (req, res) => {
  const parsed = bulkImportDefaultItemsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  // Resolve any `collegeCategoryNames` in each row to ids (best-effort — unmatched names are
  // dropped, the row still imports as "all categories" if none match).
  const allCategories = await listAllCollegeCategories();
  const idByName = new Map(allCategories.map((c) => [c.name.trim().toLowerCase(), String(c._id)]));

  const rows = parsed.data.rows.map((row) => {
    const ids = (row.collegeCategoryNames ?? [])
      .map((name) => idByName.get(name.trim().toLowerCase()))
      .filter((id): id is string => Boolean(id));
    return {
      ...row,
      applicableCollegeCategories: ids,
      isForAllCollegeCategories: ids.length === 0,
    };
  });

  const result = await bulkImportDefaultChecklistItems(rows, req.user!._id.toString());
  res.json({ success: true, ...result });
});

// --- Suggested items (user-created items not yet in the master catalog) ---

adminRouter.get("/suggested-items", async (_req, res) => {
  res.json({ suggestions: await listSuggestedItems() });
});

adminRouter.get("/suggested-items/:key/users", async (req, res) => {
  res.json({ users: await getSuggestedItemUsers(req.params.key) });
});

adminRouter.post("/suggested-items/add-to-default", async (req, res) => {
  const parsed = addSuggestedToDefaultSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await addSuggestedItemToDefault(parsed.data, req.user!._id.toString());
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ item: result.item, convertedCount: result.convertedCount });
});

// --- Checklist dashboard ---

adminRouter.get("/checklist-dashboard", async (_req, res) => {
  res.json({ stats: await getChecklistDashboardStats() });
});

// --- Checklist health (diagnostic snapshot of the self-healing seed + one user's state) ---

adminRouter.get("/checklist-health", async (req, res) => {
  const mobile = typeof req.query.mobile === "string" ? req.query.mobile : undefined;
  res.json(await getChecklistHealthSnapshot(mobile));
});

// --- /wa-login safety net: mobile numbers that started but never finished registration ---

adminRouter.get("/temp-users", async (_req, res) => {
  const tempUsers = await listTempUsers();
  res.json({
    tempUsers: tempUsers.map((t) => ({
      id: t._id.toString(),
      mobile: t.mobile,
      createdAt: (t as unknown as { createdAt: Date }).createdAt.toISOString(),
    })),
  });
});

adminRouter.delete("/temp-users/:id", async (req, res) => {
  await deleteTempUserById(req.params.id);
  res.json({ success: true });
});

// --- Communities ---
// A site admin manages every community — admin-created or student-created, already existing or
// brand new — the same way its owner would: approve/suspend/delete it, edit its details, and
// add/edit/remove its members. See communityService.ts's "Site-admin management" section.

adminRouter.get("/communities", async (req, res) => {
  const parsed = adminListCommunitiesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid query" });
    return;
  }
  const result = await listAllCommunitiesForAdmin(parsed.data);
  res.json(result);
});

adminRouter.patch("/communities/:id", async (req, res) => {
  const parsed = adminUpdateCommunitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await adminUpdateCommunity(req.params.id, parsed.data);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ community: result.community });
});

adminRouter.post("/communities/:id/approve", async (req, res) => {
  const result = await adminSetCommunityStatus(req.params.id, "approved");
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ community: result.community });
});

adminRouter.post("/communities/:id/suspend", async (req, res) => {
  const result = await adminSetCommunityStatus(req.params.id, "suspended");
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ community: result.community });
});

adminRouter.delete("/communities/:id", async (req, res) => {
  const result = await adminDeleteCommunity(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

adminRouter.post("/communities/:id/restore", async (req, res) => {
  const result = await adminRestoreCommunity(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ community: result.community });
});

adminRouter.get("/communities/:id/members", async (req, res) => {
  const page = Number(req.query.page ?? 1) || 1;
  const pageSize = Math.min(Number(req.query.pageSize ?? 30) || 30, 100);
  const result = await listMembers(req.params.id, page, pageSize);
  res.json(result);
});

adminRouter.post("/communities/:id/members", async (req, res) => {
  const parsed = adminAddMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await adminAddMemberByMobile(req.params.id, parsed.data.mobile, parsed.data.role);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
});

adminRouter.post("/communities/:id/members/bulk-add", async (req, res) => {
  const parsed = adminBulkAddMembersSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const { role, ...filter } = parsed.data;
  const result = await adminBulkAddMembers(req.params.id, filter, role);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ matched: result.matched, added: result.added });
});

adminRouter.patch("/communities/:id/members/:userId/role", async (req, res) => {
  const parsed = updateMemberRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await updateMemberRole("owner" as CommunityRole, req.params.id, req.params.userId, parsed.data.role, true);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
});

adminRouter.patch("/communities/:id/members/:userId/moderation", async (req, res) => {
  const parsed = moderateMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await setMemberModeration("owner" as CommunityRole, req.params.id, req.params.userId, parsed.data, true);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ membership: result.membership });
});

adminRouter.delete("/communities/:id/members/:userId", async (req, res) => {
  const result = await removeMember("owner" as CommunityRole, req.params.id, req.params.userId, true);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});
