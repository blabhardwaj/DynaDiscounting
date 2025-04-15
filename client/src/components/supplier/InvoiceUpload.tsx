import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';
import { InvoiceCSV } from '@/types';
import Papa from 'papaparse';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUIRED_COLUMNS = ['InvoiceID', 'InvoiceAmount', 'InvoiceDate', 'DueDate', 'BuyerName', 'Status'];

const InvoiceUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const showErrorToast = (title: string, description: string) => {
    toast({ variant: 'destructive', title, description });
  };

  const validateFile = (file: File): boolean => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      showErrorToast('Invalid file format', 'Please upload a CSV file.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      showErrorToast('File too large', 'Maximum file size is 10MB.');
      return false;
    }

    return true;
  };

  const validateCSVStructure = (invoices: InvoiceCSV[]): boolean => {
    const headers = Object.keys(invoices[0] || {});
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      showErrorToast('Invalid CSV format', `Missing columns: ${missingColumns.join(', ')}`);
      return false;
    }

    return true;
  };

  const uploadInvoices = async (invoices: InvoiceCSV[]) => {
    if (!user?.id) {
      showErrorToast('Authentication Error', 'Your user ID could not be found. Please try logging out and back in.');
      return;
    }

    try {
      const supplierId = "supplier1"; // Hardcoded supplier ID for demo purposes
      await apiRequest('POST', '/api/invoices/upload', { invoices, supplierId });

      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });

      toast({
        title: 'Invoices uploaded',
        description: `Successfully uploaded ${invoices.length} invoices.`,
      });
    } catch (error) {
      showErrorToast('Upload failed', error instanceof Error ? error.message : 'Failed to upload invoices.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      resetFileInput();
      return;
    }

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: async (results) => {
        const invoices = results.data as InvoiceCSV[];

        if (!validateCSVStructure(invoices)) {
          setIsUploading(false);
          resetFileInput();
          return;
        }

        await uploadInvoices(invoices);
        setIsUploading(false);
        resetFileInput();
      },
      error: (error) => {
        showErrorToast('CSV parsing failed', error.message);
        setIsUploading(false);
        resetFileInput();
      },
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Upload Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex items-center justify-center w-full cursor-pointer"
          onClick={handleUploadClick}
        >
          <label className="flex flex-col w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="h-12 w-12 text-gray-400 mb-2" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">CSV files only (max 10MB)</p>
              {isUploading && (
                <div className="mt-2">
                  <Button disabled variant="outline" size="sm">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                    Uploading...
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceUpload;
