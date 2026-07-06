import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Pencil, Phone, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ContactFormDialog } from "@/features/contacts/contact-form-dialog";
import { api, ApiError } from "@/lib/api";
import { emitRefresh, subscribeRefresh } from "@/lib/refresh-bus";
import {
  toEmergencyContactDTO,
  type EmergencyContactDTO,
  type EmergencyContactRaw,
} from "@/features/contacts/contact-dto";

export function ContactsView() {
  const [contacts, setContacts] = useState<EmergencyContactDTO[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const { contacts: raw } = await api.get<{ contacts: EmergencyContactRaw[] }>("/api/contacts");
      setContacts(raw.map(toEmergencyContactDTO));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    return subscribeRefresh(fetchData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    try {
      await api.delete(`/api/contacts/${id}`);
      emitRefresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete contact");
      fetchData();
    }
  }

  return (
    <div>
      <PageHeader title="Emergency Contacts" description="People you can reach in a hurry" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Tap the + button below to add your parents, guardian, warden, or family doctor so they're one tap away."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="h-full gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display line-clamp-1 font-semibold">{contact.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {contact.relation}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ContactFormDialog
                      contact={contact}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Edit contact">
                          <Pencil className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Delete contact">
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                      title="Delete this contact?"
                      description="This can't be undone."
                      onConfirm={() => handleDelete(contact.id)}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{contact.phone}</p>
                <div className="flex items-center gap-2">
                  <a href={`tel:${contact.phone}`} className="flex-1">
                    <Button className="w-full" size="sm">
                      <Phone className="size-3.5" />
                      Call
                    </Button>
                  </a>
                  <a
                    href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      <MessageCircle className="size-3.5" />
                      WhatsApp
                    </Button>
                  </a>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
