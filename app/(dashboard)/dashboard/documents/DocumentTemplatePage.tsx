"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Key,
  Home,
  Receipt,
  DollarSign,
  Star,
  FileSignature,
  File,
  Search,
  FileDown,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  DOCUMENT_TEMPLATES,
  DocumentTemplate,
  getAllCategories,
} from "@/lib/documents/template-config";
import { DocumentGenerationForm } from "@/components/documents/DocumentGenerationForm";
import { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const ICONS: Record<string, LucideIcon> = {
  FileText,
  Key,
  Home,
  Receipt,
  DollarSign,
  Star,
  FileSignature,
  File,
};

export default function DocumentTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = ["all", ...getAllCategories()];

  const filteredTemplates = (category: string) => {
    let templates =
      category === "all"
        ? DOCUMENT_TEMPLATES
        : DOCUMENT_TEMPLATES.filter((t) => t.category === category);

    if (searchQuery) {
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return templates;
  };

  const handleGenerateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SectionHeader
            title="Documents Automatisés"
            subtitle="Générez vos documents immobiliers en quelques clics"
          />
        </div>
        <Badge variant="outline" className="text-sm">
          {DOCUMENT_TEMPLATES.length} modèles
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un document..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Tous</TabsTrigger>
          {getAllCategories().map((category) => (
            <TabsTrigger key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates(category).map((template) => {
                const Icon = ICONS[template.icon] || FileText;

                return (
                  <Card
                    key={template.id}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg p-3 bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[template.category]}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">{template.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Variables:
                          </span>
                          <Badge variant="outline">
                            {template.variables.length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => handleGenerateDocument(template)}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Générer le document
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {filteredTemplates(category).length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun document trouvé</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Generation Dialog */}
      {selectedTemplate && (
        <DocumentGenerationForm
          template={selectedTemplate}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
