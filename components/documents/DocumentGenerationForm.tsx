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
  ClientOption,
  ListingOption,
  AgentOption,
} from "@/lib/actions/document.action";

type FormFieldValue = string | number | boolean | Date;

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
  const [generatedDoc, setGeneratedDoc] = useState<GenerateDocumentResult | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Check if template needs any entity data
  const needsClients = template.variables.some((v) => v.type === "client");
  const needsListings = template.variables.some((v) => v.type === "listing");
  const needsAgents = template.variables.some((v) => v.type === "agent");

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && (needsClients || needsListings || needsAgents)) {
      setIsLoadingData(true);
      Promise.all([
        needsClients ? fetchClientsForSelect() : Promise.resolve({ success: true, data: [] }),
        needsListings ? fetchListingsForSelect() : Promise.resolve({ success: true, data: [] }),
        needsAgents ? fetchAgentsForSelect() : Promise.resolve({ success: true, data: [] }),
      ])
        .then(([clientsRes, listingsRes, agentsRes]) => {
          if (clientsRes.success && clientsRes.data) setClients(clientsRes.data);
          if (listingsRes.success && listingsRes.data) setListings(listingsRes.data);
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
          fieldSchema = z.number();
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

      if (!variable.required) {
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
      if (prefillData[variable.key]) {
        defaults[variable.key] = prefillData[variable.key];
      } else if (variable.defaultValue !== undefined) {
        defaults[variable.key] = variable.defaultValue;
      } else if (variable.type === "date") {
        defaults[variable.key] = new Date();
      } else if (variable.type === "number") {
        defaults[variable.key] = 0;
      } else {
        defaults[variable.key] = "";
      }
    });

    return defaults;
  };

  const form = useForm({
    resolver: zodResolver(buildSchema()),
    defaultValues: buildDefaultValues(),
  });

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
  const getClientLabel = (clientId: string) => {
    const client = clients.find((c) => c.value === clientId);
    return client?.label || "";
  };

  const getListingLabel = (listingId: string) => {
    const listing = listings.find((l) => l.value === listingId);
    return listing ? `${listing.label}${listing.address ? ` - ${listing.address}` : ""}` : "";
  };

  const getAgentLabel = (agentId: string) => {
    const agent = agents.find((a) => a.value === agentId);
    return agent?.label || "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid gap-4 md:grid-cols-2">
                {template.variables.map((variable) => (
                  <FormField
                    key={variable.key}
                    control={form.control}
                    name={variable.key}
                    render={({ field }) => (
                      <FormItem
                        className={
                          variable.type === "textarea" ? "md:col-span-2" : ""
                        }
                      >
                        <FormLabel>
                          {variable.label}
                          {variable.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </FormLabel>

                        {/* Client Select */}
                        {variable.type === "client" && (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(getClientLabel(value));
                            }}
                            defaultValue=""
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un client..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.value} value={client.value}>
                                  <div className="flex flex-col">
                                    <span>{client.label}</span>
                                    {client.phone && (
                                      <span className="text-xs text-muted-foreground">
                                        {client.phone}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Listing Select */}
                        {variable.type === "listing" && (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(getListingLabel(value));
                            }}
                            defaultValue=""
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un bien..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {listings.map((listing) => (
                                <SelectItem key={listing.value} value={listing.value}>
                                  <div className="flex flex-col">
                                    <span>{listing.label}</span>
                                    {listing.address && (
                                      <span className="text-xs text-muted-foreground">
                                        {listing.address}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Agent Select */}
                        {variable.type === "agent" && (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(getAgentLabel(value));
                            }}
                            defaultValue=""
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un agent..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {agents.map((agent) => (
                                <SelectItem key={agent.value} value={agent.value}>
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
                              placeholder={variable.description || variable.label}
                              {...field}
                              value={field.value as string}
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
                              value={field.value as number}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value ? Number(e.target.value) : 0
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
                              value={field.value as string}
                            />
                          </FormControl>
                        )}

                        {/* Regular Select (for predefined options) */}
                        {variable.type === "select" && variable.options && (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value as string}
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
                                  {field.value ? (
                                    format(field.value as Date, "PPP", { locale: fr })
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
                                selected={field.value as Date}
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
              <a
                href={generatedDoc.docxPath}
                download
                className="inline-block"
              >
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
