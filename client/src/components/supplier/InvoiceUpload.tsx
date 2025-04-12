import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud } from 'lucide-react';
import { InvoiceCSV } from '@/types';
import Papa from 'papaparse';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

const InvoiceUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file format',
        description: 'Please upload a CSV file.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Try to automatically convert numeric values
        complete: async (results) => {
          console.log("CSV parse results:", results);
          const invoices = results.data as InvoiceCSV[];
          
          // Validate CSV structure
          const requiredColumns = ['InvoiceID', 'InvoiceAmount', 'InvoiceDate', 'DueDate', 'BuyerName', 'Status'];
          const headers = Object.keys(invoices[0] || {});
          
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          
          if (missingColumns.length > 0) {
            toast({
              variant: 'destructive',
              title: 'Invalid CSV format',
              description: `Missing columns: ${missingColumns.join(', ')}`,
            });
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
          
          // Process and upload invoices
          try {
            if (!user?.id) {
              toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'Your user ID could not be found. Please try logging out and back in.',
              });
              setIsUploading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              return;
            }
            
            console.log('Uploading invoices with supplier ID:', user.id);
            
            await apiRequest('POST', '/api/invoices/upload', { 
              invoices,
              supplierId: user.id
            });
            
            // Invalidate invoices query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
            
            toast({
              title: 'Invoices uploaded',
              description: `Successfully uploaded ${invoices.length} invoices.`,
            });
          } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Upload failed',
              description: error instanceof Error ? error.message : 'Failed to upload invoices.',
            });
          }
          
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: (error) => {
          toast({
            variant: 'destructive',
            title: 'CSV parsing failed',
            description: error.message,
          });
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error processing file',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
