export interface Invoice {
  id: string;
  fileName: string;
  fileSize: number;
  clientName: string;
  amount: number;
  uploadDate: string;
  status: 'Pending' | 'Processing' | 'Processed' | 'Failed';
  filePath: string;
  processingStartTime?: string;
  processingEndTime?: string;
}

export interface InvoiceListResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadResponse {
  success: boolean;
  invoices: Invoice[];
  message: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  status: string;
  search: string;
}