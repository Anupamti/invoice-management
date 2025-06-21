export interface Invoice {
  id: string;
  fileName: string;
  fileSize: number;
  clientName: string;
  amount: number;
  uploadDate: Date;
  status: 'Pending' | 'Processing' | 'Processed' | 'Failed';
  filePath: string;
  processingStartTime?: Date;
  processingEndTime?: Date;
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