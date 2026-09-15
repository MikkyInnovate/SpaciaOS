"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ColumnSortDirection = "asc" | "desc" | null;

export interface ColumnDef<TData> {
  id: string;
  header: React.ReactNode | ((props: { sortDirection: ColumnSortDirection }) => React.ReactNode);
  accessorKey?: keyof TData;
  accessorFn?: (item: TData) => unknown;
  cell?: (props: { item: TData; index: number }) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  keyExtractor: (item: TData, index: number) => string;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  // Search & Filter
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchFn?: (item: TData, query: string) => boolean;
  searchKey?: keyof TData;
  toolbarActions?: React.ReactNode;
  // Pagination
  showPagination?: boolean;
  pageSize?: number;
  // Row interaction
  onRowClick?: (item: TData) => void;
  selectedRowId?: string;
  // Custom states
  emptyState?: React.ReactNode;
  className?: string;
}

export function DataTable<TData>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  error = null,
  onRetry,
  showSearch = true,
  searchPlaceholder = "Search records...",
  searchFn,
  searchKey,
  toolbarActions,
  showPagination = true,
  pageSize = 10,
  onRowClick,
  selectedRowId,
  emptyState,
  className,
}: DataTableProps<TData>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortColumnId, setSortColumnId] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<ColumnSortDirection>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  // 1. Search Filtering
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.trim().toLowerCase();

    return data.filter((item) => {
      if (searchFn) {
        return searchFn(item, query);
      }
      if (searchKey) {
        const value = item[searchKey];
        return String(value ?? "").toLowerCase().includes(query);
      }
      // Fallback: search across all string/number fields of item
      return Object.values(item as Record<string, unknown>).some((val) => {
        if (typeof val === "string" || typeof val === "number") {
          return String(val).toLowerCase().includes(query);
        }
        return false;
      });
    });
  }, [data, searchQuery, searchFn, searchKey]);

  // 2. Sorting
  const sortedData = React.useMemo(() => {
    if (!sortColumnId || !sortDirection) return filteredData;

    const column = columns.find((col) => col.id === sortColumnId);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      if (column.accessorFn) {
        aVal = column.accessorFn(a);
        bVal = column.accessorFn(b);
      } else if (column.accessorKey) {
        aVal = a[column.accessorKey];
        bVal = b[column.accessorKey];
      }

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (sortDirection === "asc") {
        return strA.localeCompare(strB);
      }
      return strB.localeCompare(strA);
    });
  }, [filteredData, sortColumnId, sortDirection, columns]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = React.useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validCurrentPage, pageSize, showPagination]);

  const handleSortToggle = (colId: string) => {
    if (sortColumnId !== colId) {
      setSortColumnId(colId);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortColumnId(null);
      setSortDirection(null);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <TableSkeleton
        rows={pageSize}
        columns={columns.length}
        showToolbar={showSearch || Boolean(toolbarActions)}
        showPagination={showPagination}
      />
    );
  }

  // Error State
  if (error) {
    return (
      <ErrorState
        errorDetails={error}
        onRetry={onRetry}
        resetText="Retry Loading"
      />
    );
  }

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Search & Actions Toolbar */}
      {(showSearch || toolbarActions) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-lg border border-stone-200 bg-white p-2.5 shadow-2xs">
          {showSearch ? (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-8 h-8 text-xs bg-stone-50 border-stone-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {toolbarActions && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {toolbarActions}
            </div>
          )}
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50/70 hover:bg-stone-50/70 border-b border-stone-200">
                {columns.map((col) => {
                  const isSorted = sortColumnId === col.id;
                  const alignClass =
                    col.align === "right"
                      ? "text-right justify-end"
                      : col.align === "center"
                      ? "text-center justify-center"
                      : "text-left justify-start";

                  return (
                    <TableHead
                      key={col.id}
                      style={{ width: col.width }}
                      className={cn("py-2.5 text-xs font-semibold text-stone-700", col.className)}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSortToggle(col.id)}
                          className={cn(
                            "flex items-center gap-1 hover:text-stone-900 cursor-pointer transition-colors select-none font-semibold",
                            alignClass
                          )}
                        >
                          <span>
                            {typeof col.header === "function"
                              ? col.header({ sortDirection: isSorted ? sortDirection : null })
                              : col.header}
                          </span>
                          {isSorted && sortDirection === "asc" && (
                            <ArrowUp className="h-3 w-3 text-stone-900 stroke-[2.5]" />
                          )}
                          {isSorted && sortDirection === "desc" && (
                            <ArrowDown className="h-3 w-3 text-stone-900 stroke-[2.5]" />
                          )}
                          {!isSorted && (
                            <ArrowUpDown className="h-3 w-3 text-stone-400 opacity-60" />
                          )}
                        </button>
                      ) : (
                        <div className={cn("flex items-center", alignClass)}>
                          {typeof col.header === "function"
                            ? col.header({ sortDirection: null })
                            : col.header}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0 border-0">
                    {searchQuery ? (
                      <EmptyState
                        preset="no-search-results"
                        onActionClick={() => setSearchQuery("")}
                        size="compact"
                        className="border-0 rounded-none bg-transparent"
                      />
                    ) : (
                      emptyState || (
                        <EmptyState
                          preset="no-data"
                          size="compact"
                          className="border-0 rounded-none bg-transparent"
                        />
                      )
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => {
                  const key = keyExtractor(item, index);
                  const isSelected = selectedRowId === key;

                  return (
                    <TableRow
                      key={key}
                      onClick={() => onRowClick && onRowClick(item)}
                      className={cn(
                        "text-xs transition-colors border-b border-stone-100",
                        onRowClick && "cursor-pointer hover:bg-stone-50/80",
                        isSelected &&
                          "bg-stone-100/70 hover:bg-stone-100/90 font-medium border-l-3 border-l-stone-900"
                      )}
                    >
                      {columns.map((col) => {
                        const alignClass =
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                            ? "text-center"
                            : "text-left";

                        return (
                          <TableCell
                            key={`${key}-${col.id}`}
                            className={cn("py-2.5", alignClass, col.className)}
                          >
                            {col.cell
                              ? col.cell({ item, index })
                              : col.accessorKey
                              ? String(item[col.accessorKey] ?? "")
                              : col.accessorFn
                              ? String(col.accessorFn(item) ?? "")
                              : null}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      {showPagination && sortedData.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-xs text-stone-500">
            Showing{" "}
            <span className="font-medium text-stone-800">
              {paginatedData.length ? (validCurrentPage - 1) * pageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-stone-800">
              {Math.min(validCurrentPage * pageSize, sortedData.length)}
            </span>{" "}
            of <span className="font-medium text-stone-800">{sortedData.length}</span> records
          </div>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text="Previous"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (validCurrentPage > 1) {
                      setCurrentPage((p) => p - 1);
                    }
                  }}
                  className={validCurrentPage <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={validCurrentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    href="#"
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  text="Next"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (validCurrentPage < totalPages) {
                      setCurrentPage((p) => p + 1);
                    }
                  }}
                  className={validCurrentPage >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
