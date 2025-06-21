import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Invoice } from '../types';
import { api } from '../services/api';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

interface UploadingFile {
  file: File;
  id: string;
  status: 'uploading' | 'pending' | 'processing' | 'processed' | 'failed';
  invoice?: Invoice;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    
    if (files.length > 0) {
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const pollInvoiceStatus = async (invoiceId: string) => {
    const maxAttempts = 60; // Poll for up to 1 minute
    let attempts = 0;

    const poll = async () => {
      try {
        const invoice = await api.getInvoice(invoiceId);
        
        setUploadingFiles(prev =>
          prev.map(file =>
            file.invoice?.id === invoiceId
              ? { ...file, status: invoice.status.toLowerCase() as any, invoice }
              : file
          )
        );

        if (invoice.status === 'Processed' || invoice.status === 'Failed' || attempts >= maxAttempts) {
          return;
        }

        attempts++;
        setTimeout(poll, 2000); // Poll every 2 seconds
      } catch (error) {
        console.error('Error polling invoice status:', error);
      }
    };

    setTimeout(poll, 1000); // Start polling after 1 second
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    
    // Initialize uploading files
    const initialUploadingFiles: UploadingFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading'
    }));
    
    setUploadingFiles(initialUploadingFiles);
    setSelectedFiles([]);

    try {
      const response = await api.uploadInvoices(selectedFiles);
      
      // Update with actual invoice data
      const updatedUploadingFiles = response.invoices.map((invoice, index) => ({
        file: initialUploadingFiles[index].file,
        id: initialUploadingFiles[index].id,
        status: 'pending' as const,
        invoice
      }));
      
      setUploadingFiles(updatedUploadingFiles);
      
      // Start polling for each uploaded invoice
      response.invoices.forEach(invoice => {
        pollInvoiceStatus(invoice.id);
      });
      
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev =>
        prev.map(file => ({ ...file, status: 'failed' }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing...';
      case 'processed':
        return 'Processed';
      case 'failed':
        return 'Failed';
    }
  };

  const clearCompleted = () => {
    setUploadingFiles(prev =>
      prev.filter(file => file.status !== 'processed' && file.status !== 'failed')
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Invoices</h2>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Drop PDF files here or click to browse
          </h3>
          <p className="text-gray-500 mb-4">
            Upload multiple invoice PDFs at once (max 10MB per file)
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Selected Files ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload Progress</h3>
            {uploadingFiles.some(f => f.status === 'processed' || f.status === 'failed') && (
              <button
                onClick={clearCompleted}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear Completed
              </button>
            )}
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center flex-1">
                  <FileText className="w-5 h-5 text-red-500 mr-3" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{file.file.name}</div>
                    <div className="text-sm text-gray-500">
                      {file.invoice ? file.invoice.clientName : 'Processing...'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(file.status)}
                  <span className="text-sm font-medium text-gray-700">
                    {getStatusText(file.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;