import { Invoice, InvoiceListResponse, UploadResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  async getInvoices(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    search?: string;
  }): Promise<InvoiceListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/invoices?${searchParams}`);
    if (!response.ok) {
      throw new Error("Failed to fetch invoices");
    }
    return response.json();
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await fetch(`${API_BASE_URL}/invoices/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch invoice");
    }
    return response.json();
  },

  async uploadInvoices(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("invoices", file);
    });

    const response = await fetch(`${API_BASE_URL}/invoices/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload invoices");
    }

    return response.json();
  },
};
