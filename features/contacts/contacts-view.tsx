"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Pencil, Phone, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ContactFormDialog } from "@/features/contacts/contact-form-dialog";
import { deleteContactAction } from "@/actions/contacts";
import type { EmergencyContactDTO } from "@/features/contacts/contact-dto";

export function ContactsView({ initialContacts }: { initialContacts: EmergencyContactDTO[] }) {
  const [contacts, setContacts] = useState(initialContacts);

  async function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    const result = await deleteContactAction(id);
    if (!result.success) toast.error(result.error);
  }

  return (
    <div>
      <PageHeader
        title="Emergency Contacts"
        description="People you can reach in a hurry"
        action={<ContactFormDialog />}
      />

      {contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your parents, guardian, warden, or family doctor so they're one tap away."
          action={<ContactFormDialog />}
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
                        <Button variant="ghost" size="icon" className="size-7">
                          <Pencil className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="size-7">
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
