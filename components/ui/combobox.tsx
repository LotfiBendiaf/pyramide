"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  value: string;
  label: string;
  searchableText?: string;
  metadata?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
}

export function Combobox({
  options,
  value,
  onSelect,
  placeholder = "Sélectionner...",
  emptyText = "Aucun résultat.",
  searchPlaceholder = "Rechercher...",
  className,
  disabled = false,
  onSearchChange,
  loading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = React.useMemo(() => {
    if (onSearchChange) return options;
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const searchText = (option.searchableText || option.label).toLowerCase();
      return searchText.includes(query);
    });
  }, [options, searchQuery, onSearchChange]);

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    onSearchChange?.(q);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate text-left">
            {selectedOption
              ? selectedOption.metadata
                ? `${selectedOption.metadata} – ${selectedOption.label}`
                : selectedOption.label
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <div className="flex flex-col">
          <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="overflow-y-auto max-h-[250px] p-1">
            {loading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className="w-full justify-start font-normal h-auto py-2 px-2"
                  onClick={() => {
                    onSelect(option.value);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col items-start flex-1 min-w-0 text-left">
                    <span className="truncate w-full">{option.label}</span>
                    {option.metadata && (
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {option.metadata}
                      </span>
                    )}
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
