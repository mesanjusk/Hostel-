import type { UserRole } from "@/types";

export interface AdminUserDTO {
  id: string;
  name: string | null;
  mobile: string;
  college: string | null;
  hostel: string | null;
  roomNumber: string | null;
  role: UserRole;
  hasPinSet: boolean;
  createdAt: string;
}
