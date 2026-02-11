"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail,
  MailOpen,
  Trash2,
  Check,
  Archive,
  Filter,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  adminNotes?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageStats {
  new: number;
  read: number;
  replied: number;
  total: number;
}

const statusColors = {
  NEW: "bg-blue-500/10 text-blue-600 border-blue-200",
  READ: "bg-amber-500/10 text-amber-600 border-amber-200",
  REPLIED: "bg-green-500/10 text-green-600 border-green-200",
  ARCHIVED: "bg-gray-500/10 text-gray-600 border-gray-200",
};

const statusLabels = {
  NEW: "Nouveau",
  READ: "Lu",
  REPLIED: "Répondu",
  ARCHIVED: "Archivé",
};

export default function MessagesClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    new: 0,
    read: 0,
    replied: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/messages?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setMessages(result.data.messages);
        setStats(result.data.stats);
      } else {
        toast.error("Erreur lors du chargement des messages");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message);
    setAdminNotes(message.adminNotes || "");
    setIsDialogOpen(true);

    // Mark as read if it's new
    if (message.status === "NEW") {
      await updateMessageStatus(message._id, "READ");
    }
  };

  const updateMessageStatus = async (
    messageId: string,
    status: string,
    notes?: string
  ) => {
    try {
      const response = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          status,
          adminNotes: notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Statut mis à jour");
        fetchMessages();
        setIsDialogOpen(false);
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;

    try {
      const response = await fetch(`/api/messages?id=${messageId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Message supprimé");
        fetchMessages();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Gérez les messages de contact des visiteurs
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-xs text-muted-foreground">Nouveaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <MailOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.read}</p>
                <p className="text-xs text-muted-foreground">Lus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.replied}</p>
                <p className="text-xs text-muted-foreground">Répondus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Archive className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des messages</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="new">Nouveaux</SelectItem>
                  <SelectItem value="read">Lus</SelectItem>
                  <SelectItem value="replied">Répondus</SelectItem>
                  <SelectItem value="archived">Archivés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun message trouvé
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={cn(
                    "p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                    message.status === "NEW" &&
                      "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                  onClick={() => handleViewMessage(message)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{message.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            statusColors[message.status]
                          )}
                        >
                          {statusLabels[message.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {message.email}
                        {message.phone && ` • ${message.phone}`}
                      </p>
                      <p className="text-sm line-clamp-2">{message.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(message.createdAt), "PPp", {
                          locale: fr,
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(message._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du message</DialogTitle>
            <DialogDescription>
              Message de {selectedMessage?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedMessage.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedMessage.createdAt), "PPp", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Message</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Notes administrateur
                </p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes internes..."
                  className="min-h-[80px]"
                />
              </div>

              <DialogFooter>
                <div className="flex gap-2 flex-wrap">
                  {selectedMessage.status !== "REPLIED" && (
                    <Button
                      onClick={() =>
                        updateMessageStatus(
                          selectedMessage._id,
                          "REPLIED",
                          adminNotes
                        )
                      }
                      variant="default"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marquer comme répondu
                    </Button>
                  )}
                  {selectedMessage.status !== "ARCHIVED" && (
                    <Button
                      onClick={() =>
                        updateMessageStatus(
                          selectedMessage._id,
                          "ARCHIVED",
                          adminNotes
                        )
                      }
                      variant="outline"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archiver
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(selectedMessage._id)}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
