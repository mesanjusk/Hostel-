export interface EmergencyContactDTO {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

/** Raw shape returned by the API (Mongo doc with `_id`). */
export interface EmergencyContactRaw {
  _id: string;
  name: string;
  relation: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export function toEmergencyContactDTO(raw: EmergencyContactRaw): EmergencyContactDTO {
  return {
    id: raw._id,
    name: raw.name,
    relation: raw.relation,
    phone: raw.phone,
  };
}
