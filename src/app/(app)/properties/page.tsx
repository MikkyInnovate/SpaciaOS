"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PropertyCard,
  PropertyDetailPresentation,
  propertiesService,
  type Property,
  type PropertyAvailability,
} from "@/features/properties";
import { Search, Building2, RefreshCw, Filter, Sparkles } from "lucide-react";
import { useWorkspace } from "@/lib/context/workspace-context";

export default function PropertiesPage() {
  const { currentWorkspace } = useWorkspace();
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = React.useState<PropertyAvailability | "ALL">("ALL");
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);
  const [adapterHealth, setAdapterHealth] = React.useState<any>(null);

  const fetchProperties = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, health] = await Promise.all([
        propertiesService.getProperties({
          search: searchQuery || undefined,
          availability: availabilityFilter !== "ALL" ? availabilityFilter : undefined,
        }),
        propertiesService.checkHealth().catch(() => null),
      ]);
      setProperties(res.properties);
      setTotalCount(res.total);
      if (health) setAdapterHealth(health);
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, availabilityFilter]);

  React.useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const availabilityOptions: Array<{ label: string; value: PropertyAvailability | "ALL" }> = [
    { label: "All Statuses", value: "ALL" },
    { label: "Available", value: "Available" },
    { label: "Under Offer", value: "Under Offer" },
    { label: "Sold", value: "Sold" },
    { label: "Reserved", value: "Reserved" },
  ];

  return (
    <Container size="lg" className="space-y-6">
      <PageHeader
        title="Properties"
        description={`Portfolio inventory for ${currentWorkspace?.name || "your workspace"} unified via the Property Adapter Layer.`}
        actions={
          <div className="flex items-center gap-2">
            {adapterHealth && (
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-medium gap-1.5 py-1 px-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Live Adapter: {adapterHealth.providerName || "Neon DB"} ({adapterHealth.latencyMs ?? 12}ms)
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProperties}
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs text-stone-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, location, or estate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-muted/30"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
          {availabilityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAvailabilityFilter(opt.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                availabilityFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-xl border border-border bg-card animate-pulse p-4 space-y-4">
              <div className="h-48 bg-muted rounded-lg" />
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-full pt-4" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl bg-card">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">No properties found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No properties matched "${searchQuery}". Try clearing your search filters.`
              : "No property inventory found in this workspace."}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-4 text-xs"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{properties.length}</strong> of {totalCount} properties in workspace
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onInspectFullSpecs={(prop) => setSelectedProperty(prop)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Deep-Dive Property Detail Dossier Modal */}
      <PropertyDetailPresentation
        property={selectedProperty}
        open={!!selectedProperty}
        onOpenChange={(open) => {
          if (!open) setSelectedProperty(null);
        }}
      />
    </Container>
  );
}
