import type { CollegeCategory, Gender, UserRole } from "@/types";

export interface AdminUserDTO {
  id: string;
  name: string | null;
  /** Null for a visitor who has only ever used the app anonymously. */
  mobile: string | null;
  gender: Gender | null;
  college: string | null;
  collegeCategory: CollegeCategory | null;
  role: UserRole;
  verified: boolean;
  hasPinSet: boolean;
  /** Per-browser id captured at account creation (see backend User model) — an internal
   * tracing aid, null for accounts created before this field existed. */
  deviceId: string | null;
  createdAt: string;
}
