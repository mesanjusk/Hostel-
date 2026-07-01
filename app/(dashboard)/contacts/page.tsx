import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listContacts } from "@/services/contactService";
import { toPlain } from "@/lib/serialize";
import { ContactsView } from "@/features/contacts/contacts-view";
import type { EmergencyContactDTO } from "@/features/contacts/contact-dto";

export const metadata: Metadata = { title: "Emergency Contacts — Hostel Essentials" };

export default async function ContactsPage() {
  const session = await auth();
  const contacts = await listContacts(session!.user.id);

  const initialContacts: EmergencyContactDTO[] = toPlain(contacts).map((c) => ({
    id: c._id,
    name: c.name,
    relation: c.relation,
    phone: c.phone,
  }));

  return <ContactsView initialContacts={initialContacts} />;
}
