import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DocumentAutofillProps {
  onAutoFillData: (data: any) => void;
}

const DocumentAutofill = ({ onAutoFillData }: DocumentAutofillProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Validate file type - only PDF allowed
      const allowedTypes = ['application/pdf'];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid PDF document only');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }

      // Upload to Supabase storage
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      setUploadedFile(file);
      toast.success('Document uploaded successfully');

      // Start parsing
      await parseDocument(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const parseDocument = async (file: File) => {
    setIsParsing(true);
    try {
      // Create FormData to send binary file to n8n webhook
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);
      
      // Call the n8n webhook for document parsing
      const response = await fetch('https://ekarbotproject.duckdns.org/webhook/document-parsing', {
        method: 'POST',
        body: formData // Send as FormData (binary file)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Object.keys(data).length > 0) {
        // Clean the data by removing the "=" prefix from values
        const cleanedData = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [
            key,
            typeof value === 'string' && value.startsWith('=') 
              ? value.substring(1) 
              : value
          ])
        );
        setExtractedData(cleanedData);
        toast.success('Document parsed successfully! Click "Apply Autofill" to use the data.');
      } else {
        toast.warning('No data could be extracted from the document');
      }

    } catch (error) {
      console.error('Parsing error:', error);
      toast.error('Failed to parse document. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:mime;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applyAutofill = () => {
    if (extractedData) {
      onAutoFillData(extractedData);
      toast.success('Form fields populated with extracted data!');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Autofill
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-4">
                Upload a project document to automatically fill form fields
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supported format: PDF only (Max 50MB)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelection}
                accept=".pdf"
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{uploadedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center p-4 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Parsing document...
                </div>
              )}

              {extractedData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Data extracted successfully!</span>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 mb-2">Preview of extracted data:</p>
                    <div className="text-xs text-green-600 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                      {Object.entries(extractedData).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <strong>{key}:</strong> {String(value).substring(0, 100)}
                          {String(value).length > 100 && '...'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={applyAutofill}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Apply Autofill to Form
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentAutofill;