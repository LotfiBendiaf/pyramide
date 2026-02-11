"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download, FileText, Loader2 } from "lucide-react";
import { DocumentTemplate } from "@/lib/documents/template-config";
import {
  generateDocument,
  GenerateDocumentResult,
  fetchClientsForSelect,
  fetchListingsForSelect,
  fetchAgentsForSelect,
  fetchClientByReferenceCode,
  fetchListingByReferenceCode,
  ClientOption,
  ListingOption,
  AgentOption,
} from "@/lib/actions/document.action";
import { Combobox } from "@/components/ui/combobox";

type FormFieldValue = string | number | boolean | Date | undefined;

interface DocumentGenerationFormProps {
  template: DocumentTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillData?: Record<string, FormFieldValue>;
}

export function DocumentGenerationForm({
  template,
  open,
  onOpenChange,
  prefillData = {},
}: DocumentGenerationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [generatedDoc, setGeneratedDoc] =
    useState<GenerateDocumentResult | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedListingId, setSelectedListingId] = useState<string>("");

  // Check if template needs any entity data
  const needsClients = template.variables.some((v) => v.type === "client");
  const needsListings = template.variables.some((v) => v.type === "listing");
  const needsAgents = template.variables.some((v) => v.type === "agent");

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && (needsClients || needsListings || needsAgents)) {
      setIsLoadingData(true);
      Promise.all([
        needsClients
          ? fetchClientsForSelect()
          : Promise.resolve({ success: true, data: [] }),
        needsListings
          ? fetchListingsForSelect()
          : Promise.resolve({ success: true, data: [] }),
        needsAgents
          ? fetchAgentsForSelect()
          : Promise.resolve({ success: true, data: [] }),
      ])
        .then(([clientsRes, listingsRes, agentsRes]) => {
          if (clientsRes.success && clientsRes.data)
            setClients(clientsRes.data);
          if (listingsRes.success && listingsRes.data)
            setListings(listingsRes.data);
          if (agentsRes.success && agentsRes.data) setAgents(agentsRes.data);
        })
        .finally(() => setIsLoadingData(false));
    }
  }, [open, needsClients, needsListings, needsAgents]);

  // Build Zod schema dynamically from template variables
  const buildSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    template.variables.forEach((variable) => {
      let fieldSchema: z.ZodTypeAny;

      switch (variable.type) {
        case "number":
          // Allow both number and empty string for optional number fields
          fieldSchema = variable.required
            ? z.number()
            : z.union([z.number(), z.string().length(0)]).optional();
          break;
        case "date":
          fieldSchema = z.date();
          break;
        case "textarea":
        case "text":
        case "client":
        case "listing":
        case "agent":
        case "select":
        default:
          fieldSchema = z.string();
          break;
      }

      if (!variable.required && variable.type !== "number") {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[variable.key] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  // Build default values
  const buildDefaultValues = () => {
    const defaults: Record<string, FormFieldValue> = {};

    template.variables.forEach((variable) => {
      if (prefillData[variable.key] !== undefined) {
        defaults[variable.key] = prefillData[variable.key];
      } else if (variable.defaultValue !== undefined) {
        defaults[variable.key] = variable.defaultValue;
      } else if (variable.type === "date") {
        // For optional date fields, use undefined but handle in the schema
        defaults[variable.key] = variable.required ? new Date() : undefined;
      } else if (variable.type === "number") {
        defaults[variable.key] = variable.required ? 0 : "";
      } else {
        // Always use empty string for text, select, and other string-based fields
        defaults[variable.key] = "";
      }
    });

    return defaults;
  };

  const form = useForm({
    resolver: zodResolver(buildSchema()),
    defaultValues: buildDefaultValues(),
  });

  // Handle client selection and autofill
  const handleClientSelect = async (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.value === clientId);
    if (!client?.referenceCode) return;

    // Fetch full client data
    const result = await fetchClientByReferenceCode(client.referenceCode);
    if (result.success && result.data) {
      const clientData = result.data;

      // Autofill all client-related fields
      template.variables.forEach((variable) => {
        if (variable.key.toLowerCase().includes("client")) {
          const key = variable.key.toLowerCase();
          if (key.includes("name") || key.includes("nom")) {
            form.setValue(
              variable.key,
              `${clientData.firstName} ${clientData.lastName}`
            );
          } else if (key.includes("phone") || key.includes("telephone")) {
            form.setValue(variable.key, clientData.phone || "");
          } else if (key.includes("email")) {
            form.setValue(variable.key, clientData.email || "");
          } else if (key.includes("address") || key.includes("adresse")) {
            form.setValue(variable.key, clientData.city || "");
          } else if (key.includes("city") || key.includes("ville")) {
            form.setValue(variable.key, clientData.city || "");
          }
        }
      });
    }
  };

  // Handle listing selection and autofill
  const handleListingSelect = async (listingId: string) => {
    setSelectedListingId(listingId);
    const listing = listings.find((l) => l.value === listingId);
    if (!listing?.referenceCode) return;

    // Fetch full listing data
    const result = await fetchListingByReferenceCode(listing.referenceCode);
    if (result.success && result.data) {
      const listingData = result.data;

      // Autofill all listing-related fields
      template.variables.forEach((variable) => {
        if (
          variable.key.toLowerCase().includes("listing") ||
          variable.key.toLowerCase().includes("bien") ||
          variable.key.toLowerCase().includes("property")
        ) {
          const key = variable.key.toLowerCase();
          if (key.includes("title") || key.includes("titre")) {
            form.setValue(variable.key, listingData.title || "");
          } else if (key.includes("address") || key.includes("adresse")) {
            form.setValue(variable.key, listingData.location?.address || "");
          } else if (key.includes("city") || key.includes("ville")) {
            form.setValue(variable.key, listingData.location?.city || "");
          } else if (key.includes("type")) {
            form.setValue(variable.key, listingData.propertyType || "");
          } else if (key.includes("price") || key.includes("prix")) {
            form.setValue(variable.key, listingData.price || 0);
          } else if (key.includes("description")) {
            form.setValue(variable.key, listingData.description || "");
          } else if (key.includes("bedroom") || key.includes("chambre")) {
            form.setValue(variable.key, listingData.features?.bedrooms || 0);
          } else if (key.includes("bathroom") || key.includes("salle")) {
            form.setValue(variable.key, listingData.features?.bathrooms || 0);
          } else if (key.includes("area") || key.includes("surface")) {
            form.setValue(variable.key, listingData.features?.area || 0);
          }
        }
      });
    }
  };

  const onSubmit = (data: Record<string, FormFieldValue>) => {
    startTransition(async () => {
      try {
        const result = await generateDocument({
          templateId: template.id,
          data,
        });

        if (!result.success || !result.data) {
          toast.error("Erreur", {
            description: result.error?.message || "Échec de la génération",
          });
          return;
        }

        setGeneratedDoc(result.data);
        toast.success("Document généré", {
          description: "Le document est prêt à être téléchargé",
        });
      } catch (error) {
        toast.error("Erreur", {
          description:
            error instanceof Error
              ? error.message
              : "Une erreur est survenue lors de la génération",
        });
      }
    });
  };

  const handleClose = () => {
    form.reset();
    setGeneratedDoc(null);
    onOpenChange(false);
  };

  // Get selected entity label for display
  const getAgentLabel = (agentId: string) => {
    const agent = agents.find((a) => a.value === agentId);
    return agent?.label || "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement des données...</span>
          </div>
        ) : !generatedDoc ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {template.variables.map((variable) => (
                  <FormField
                    key={variable.key}
                    control={form.control}
                    name={variable.key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {variable.label}
                          {variable.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </FormLabel>

                        {/* Client Select */}
                        {variable.type === "client" && (
                          <>
                            <FormControl>
                              <Combobox
                                options={clients.map((client) => ({
                                  value: client.value,
                                  label: client.label,
                                  searchableText: `${client.referenceCode} ${client.label} ${client.phone || ""}`,
                                  metadata: `${client.referenceCode}${client.phone ? ` • ${client.phone}` : ""}`,
                                }))}
                                value={selectedClientId}
                                onSelect={handleClientSelect}
                                placeholder="Rechercher par code ou nom..."
                                searchPlaceholder="Code référence, nom, téléphone..."
                                emptyText="Aucun client trouvé"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Recherchez par code référence (ex: BUY-001) pour
                              remplir automatiquement les champs
                            </FormDescription>
                          </>
                        )}

                        {/* Listing Select */}
                        {variable.type === "listing" && (
                          <>
                            <FormControl>
                              <Combobox
                                options={listings.map((listing) => ({
                                  value: listing.value,
                                  label: listing.label,
                                  searchableText: `${listing.referenceCode} ${listing.label} ${listing.address || ""}`,
                                  metadata: `${listing.referenceCode}${listing.address ? ` • ${listing.address}` : ""}`,
                                }))}
                                value={selectedListingId}
                                onSelect={handleListingSelect}
                                placeholder="Rechercher par code référence..."
                                searchPlaceholder="Code référence, titre, adresse..."
                                emptyText="Aucun bien trouvé"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Recherchez par code référence (ex: VA-001) pour
                              remplir automatiquement les champs
                            </FormDescription>
                          </>
                        )}

                        {/* Agent Select */}
                        {variable.type === "agent" && (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(getAgentLabel(value));
                            }}
                            value={(field.value as string) || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un agent..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem
                                  key={agent.value}
                                  value={agent.value}
                                >
                                  <div className="flex flex-col">
                                    <span>{agent.label}</span>
                                    {agent.email && (
                                      <span className="text-xs text-muted-foreground">
                                        {agent.email}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Text Input */}
                        {variable.type === "text" && (
                          <FormControl>
                            <Input
                              placeholder={
                                variable.description || variable.label
                              }
                              {...field}
                              value={(field.value as string) || ""}
                            />
                          </FormControl>
                        )}

                        {/* Number Input */}
                        {variable.type === "number" && (
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={variable.description}
                              {...field}
                              value={
                                field.value === ""
                                  ? ""
                                  : (field.value as number)
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? Number(e.target.value) : ""
                                )
                              }
                            />
                          </FormControl>
                        )}

                        {/* Textarea */}
                        {variable.type === "textarea" && (
                          <FormControl>
                            <Textarea
                              placeholder={variable.description}
                              className="min-h-[100px]"
                              {...field}
                              value={(field.value as string) || ""}
                            />
                          </FormControl>
                        )}

                        {/* Regular Select (for predefined options) */}
                        {variable.type === "select" && variable.options && (
                          <Select
                            onValueChange={field.onChange}
                            value={(field.value as string) || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {variable.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Date Picker */}
                        {variable.type === "date" && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value &&
                                  field.value instanceof Date ? (
                                    format(field.value, "PPP", {
                                      locale: fr,
                                    })
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value instanceof Date
                                    ? field.value
                                    : undefined
                                }
                                onSelect={field.onChange}
                                initialFocus
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                        )}

                        {variable.description &&
                          variable.type !== "client" &&
                          variable.type !== "listing" &&
                          variable.type !== "agent" && (
                            <FormDescription>
                              {variable.description}
                            </FormDescription>
                          )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Générer le document
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-2">
              <FileText className="h-16 w-16 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold">
                Document généré avec succès!
              </h3>
              <p className="text-sm text-muted-foreground">
                Votre document est prêt à être téléchargé
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a href={generatedDoc.docxPath} download className="inline-block">
                <Button className="w-full" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le document Word
                </Button>
              </a>
            </div>

            <div className="flex justify-center pt-4 border-t">
              <Button variant="ghost" onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
