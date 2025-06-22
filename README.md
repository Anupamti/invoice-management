# Invoice Management System

A full-stack invoice management application built with React, TypeScript, and Node.js. Features real-time file upload progress, invoice processing simulation, and comprehensive invoice listing with filtering and sorting capabilities.

## Features

### Frontend (React + TypeScript)

- **Invoice Listing**: Paginated table with sorting and filtering
- **Multi-file Upload**: Drag-and-drop interface for PDF uploads
- **Real-time Updates**: Live status updates during invoice processing
- **Responsive Design**: Modern, mobile-friendly interface
- **Advanced Filtering**: Search by filename/client, filter by status
- **Sorting**: Sort by upload date, amount, or client name

### Backend (Node.js + Express + TypeScript)

- **RESTful API**: Clean API endpoints for invoice management
- **File Upload**: Secure PDF file handling with validation
- **Processing Simulation**: Realistic processing delays (15-45 seconds)
- **In-memory Storage**: Fast data access for development
- **CORS Support**: Cross-origin requests enabled
- **Error Handling**: Comprehensive error management

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript, Multer
- **Build Tools**: Vite, TSX, Concurrently
- **Development**: Hot reload for both frontend and backend

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Environment Setup

Before starting the application, create a `.env` file in the project root with the following configuration:

```
VITE_API_BASE_URL='http://localhost:3001/api'
```

### Installation

1. **Clone and setup**:

   ```bash
   git clone <repository-url>
   cd invoice-management-system
   npm install
   ```

2. **Start the application**:

   ```bash
   npm run dev
   ```

   This command starts both the backend server (port 3001) and frontend development server (port 5173) concurrently.

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

### Alternative Startup (Separate Terminals)

If you prefer to run servers separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## API Endpoints

### GET /api/invoices

Retrieve paginated invoice list with filtering and sorting.

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `sortBy` (string): Sort field (uploadDate, amount, clientName)
- `sortOrder` (string): Sort direction (asc, desc)
- `status` (string): Filter by status (Pending, Processing, Processed, Failed)
- `search` (string): Search by filename or client name

### POST /api/invoices/upload

Upload multiple PDF files.

**Body**: FormData with files under 'invoices' key

**Response**: Upload confirmation with created invoice IDs

### GET /api/invoices/:id

Retrieve single invoice by ID for status polling.

## Project Structure

```
├── server/
│   ├── index.ts          # Express server setup
│   └── types.ts          # Backend TypeScript interfaces
├── src/
│   ├── components/       # React components
│   │   ├── InvoiceTable.tsx
│   │   ├── FilterBar.tsx
│   │   ├── Pagination.tsx
│   │   └── FileUpload.tsx
│   ├── services/
│   │   └── api.ts        # API client functions
│   ├── types/
│   │   └── index.ts      # Frontend TypeScript interfaces
│   └── App.tsx           # Main application component
├── uploads/              # File storage directory (auto-created)
└── package.json
```

## Key Features Explained

### Real-time Processing Updates

- Frontend polls backend every 3 seconds for processing invoices
- Status transitions: Pending → Processing → Processed/Failed
- Visual indicators with loading spinners and status badges

### File Upload Flow

1. User selects/drops PDF files
2. Files validated on frontend and backend
3. Files uploaded to server storage
4. Mock invoice data generated (client names, amounts)
5. Processing simulation begins automatically
6. Status updates provided via polling

### Mock Data Generation

- Random client names from predefined list
- Random invoice amounts ($1.00 - $100.00)
- 80% success rate, 20% failure rate for processing
- Variable processing time (15-45 seconds)

## Development Notes

### File Storage

- Uploaded files stored in `/uploads` directory
- Unique filenames generated to prevent conflicts
- Only PDF files accepted (mime type validation)
- 10MB file size limit

### Error Handling

- Frontend displays user-friendly error messages
- Backend validates file types and sizes
- Graceful handling of network failures
- Loading states throughout the application

### Performance Considerations

- Efficient polling strategy (stops when processing complete)
- Debounced search input
- Pagination to handle large datasets
- Optimized re-renders with React keys
