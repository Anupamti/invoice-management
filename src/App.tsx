import React, { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Upload as UploadIcon } from "lucide-react";
import InvoiceTable from "./components/InvoiceTable";
import FilterBar from "./components/FilterBar";
import Pagination from "./components/Pagination";
import FileUpload from "./components/FileUpload";
import { Invoice, SortConfig, FilterConfig } from "./types";
import { api } from "./services/api";

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<"list" | "upload">("list");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "uploadDate",
    direction: "desc",
  });

  const [filters, setFilters] = useState<FilterConfig>({
    status: "all",
    search: "",
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getInvoices({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
        status: filters.status === "all" ? undefined : filters.status,
        search: filters.search,
      });

      setInvoices(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
      setTotalItems(response.total);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortConfig, filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Auto-refresh to get real-time updates for processing invoices
  useEffect(() => {
    const hasProcessingInvoices = invoices.some(
      (invoice) =>
        invoice.status === "Pending" || invoice.status === "Processing"
    );

    if (hasProcessingInvoices) {
      const interval = setInterval(fetchInvoices, 3000);
      return () => clearInterval(interval);
    }
  }, [invoices, fetchInvoices]);

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: FilterConfig) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUploadSuccess = () => {
    fetchInvoices();
    setActiveTab("list");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            Invoice Management System
          </h1>
          <p className="mt-2 text-gray-600">
            Upload, process, and manage your invoices with real-time status
            updates
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("list")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "list"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Invoice List
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === "upload"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Upload Invoices
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "list" ? (
          <div className="space-y-6">
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
            <InvoiceTable
              invoices={invoices}
              sortConfig={sortConfig}
              onSort={handleSort}
              loading={loading}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            )}
          </div>
        ) : (
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        )}
      </div>
    </div>
  );
}

export default App;
