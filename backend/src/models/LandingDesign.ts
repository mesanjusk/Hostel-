import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ElementLayoutOverrideSchema = new Schema(
  {
    x: { type: Number },
    y: { type: Number },
    scale: { type: Number },
    rotation: { type: Number },
    visible: { type: Boolean },
  },
  { _id: false },
);

const ElementOverrideSchema = new Schema(
  {
    id: { type: String, required: true },
    lines: { type: [String] },
    ctaLabel: { type: String },
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
