import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceListResponse, UploadResponse } from './types.js';

const app = express();
const PORT = 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory invoice storage
const invoices = new Map<string, Invoice>();

// Mock client names for random assignment
const mockClients = [
  'Acme Corporation',
  'TechFlow Solutions',
  'Global Dynamics',
  'Innovate Industries',
  'NextGen Systems',
  'Prime Enterprises',
  'Digital Horizons',
  'Strategic Partners',
  'Future Ventures',
  'Elite Services'
];

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper functions
const generateMockAmount = (): number => {
  return Math.floor(Math.random() * 10000) + 100; // $1.00 to $100.00
};

const getRandomClient = (): string => {
  return mockClients[Math.floor(Math.random() * mockClients.length)];
};

const simulateProcessing = (invoiceId: string): void => {
  const invoice = invoices.get(invoiceId);
  if (!invoice) return;

  // Set status to processing
  invoice.status = 'Processing';
  invoice.processingStartTime = new Date();

  // Simulate processing time between 15-45 seconds
  const processingTime = Math.floor(Math.random() * 30000) + 15000;

  setTimeout(() => {
    const updatedInvoice = invoices.get(invoiceId);
    if (!updatedInvoice) return;

    // 80% chance of success, 20% chance of failure
    const isSuccess = Math.random() < 0.8;
    updatedInvoice.status = isSuccess ? 'Processed' : 'Failed';
    updatedInvoice.processingEndTime = new Date();

    console.log(`Invoice ${invoiceId} processing completed: ${updatedInvoice.status}`);
  }, processingTime);
};

// API Routes

// GET /api/invoices - List invoices with pagination, sorting, and filtering
app.get('/api/invoices', (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'uploadDate';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const status = req.query.status as string;
    const search = req.query.search as string;

    let filteredInvoices = Array.from(invoices.values());

    // Apply status filter
    if (status && status !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInvoices = filteredInvoices.filter(invoice =>
        invoice.fileName.toLowerCase().includes(searchLower) ||
        invoice.clientName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filteredInvoices.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Invoice];
      let bValue: any = b[sortBy as keyof Invoice];

      if (sortBy === 'uploadDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    const response: InvoiceListResponse = {
      data: paginatedInvoices,
      total: filteredInvoices.length,
      page,
      limit
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices/:id - Get single invoice
app.get('/api/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const invoice = invoices.get(id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invoices/upload - Upload multiple invoices
app.post('/api/invoices/upload', upload.array('invoices'), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const createdInvoices: Invoice[] = [];

    files.forEach(file => {
      const invoice: Invoice = {
        id: uuidv4(),
        fileName: file.originalname,
        fileSize: file.size,
        clientName: getRandomClient(),
        amount: generateMockAmount(),
        uploadDate: new Date(),
        status: 'Pending',
        filePath: file.path
      };

      invoices.set(invoice.id, invoice);
      createdInvoices.push(invoice);

      // Start processing simulation
      setTimeout(() => simulateProcessing(invoice.id), 1000);
    });

    const response: UploadResponse = {
      success: true,
      invoices: createdInvoices,
      message: `Successfully uploaded ${files.length} invoice(s)`
    };

    res.json(response);
  } catch (error) {
    console.error('Error uploading invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: 'Only PDF files are allowed' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});