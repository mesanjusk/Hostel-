import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ElementLayoutOverrideSchema = new Schema(
  {
    x: { type: Number },
    y: { type: Number },
    scale: { type: Number },
    rotation: { type: Number },
    visible: { type: Boolean },
    zIndex: { type: Number },
  },
  { _id: false },
);

const ElementOverrideSchema = new Schema(
  {
    id: { type: String, required: true },
    section: { type: Number },
    kind: { type: String },
    src: { type: String },
    alt: { type: String },
    emoji: { type: String },
    // `default: undefined` stops Mongoose's usual "arrays default to []" behavior — without
    // it, saving an override that never touched `lines` (e.g. a pure drag/resize) would still
    // come back from Mongo as `lines: []`, which then wins over `?? base.lines` in the merge
    // logic on the frontend and wipes that card's text even though it was never edited.
    lines: { type: [String], default: undefined },
    ctaLabel: { type: String },
    href: { type: String },
    background: { type: String },
    shape: { type: String },
    textStyle: { type: String },
    textColor: { type: String },
    fontSize: { type: String },
    bold: { type: Boolean },
    isCustom: { type: Boolean },
    layouts: {
      mobile: { type: ElementLayoutOverrideSchema },
      desktop: { type: ElementLayoutOverrideSchema },
    },
  },
  { _id: false },
);

const SectionBackgroundOverrideSchema = new Schema(
  {
    id: { type: String, required: true },
    background: { type: String, required: true },
  },
  { _id: false },
);

const LandingDesignSchema = new Schema(
  {
    page: { type: String, required: true, unique: true, index: true },
    elements: { type: [ElementOverrideSchema], default: [] },
    sectionBackgrounds: { type: [SectionBackgroundOverrideSchema], default: [] },
  },
  { timestamps: true },
);

export type LandingDesignDocument = InferSchemaType<typeof LandingDesignSchema>;

export const LandingDesign: Model<LandingDesignDocument> =
  models.LandingDesign || model<LandingDesignDocument>("LandingDesign", LandingDesignSchema);
