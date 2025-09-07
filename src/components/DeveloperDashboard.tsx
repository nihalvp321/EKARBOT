
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Building, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperAuth } from '@/hooks/useDeveloperAuth';
import { toast } from 'sonner';
import ProjectForm from './ProjectForm';
import MyProjects from './MyProjects';

const DeveloperDashboard = () => {
  const [activeTab, setActiveTab] = useState('add-project'); // Default to add-project
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [autoFillData, setAutoFillData] = useState<any>(null);
  const { user, profile } = useDeveloperAuth();

  const tabs = [
    { id: 'add-project', label: 'Add New Project', icon: Building },
    { id: 'my-projects', label: 'My Projects', icon: FileText },
  ];

  const handleDocumentUpload = async (file: File) => {
    setIsProcessingDocument(true);
    setUploadedDocument(file);
    
    try {
      const fileName = `${Date.now()}_${file.name}`;
      console.log('Uploading document for auto-fill:', fileName);
      
      // Upload to project-documents bucket
      const { data, error } = await supabase.storage
        .from('project-documents')
        .upload(`auto-fill/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload document');
        setIsProcessingDocument(false);
        setUploadedDocument(null);
        return;
      }

      console.log('Document uploaded successfully:', data);

      // Simulate document processing and extract mock data
      setTimeout(() => {
        const mockData = {
          project_title: `${file.name.replace(/\.[^/.]+$/, "")} Development`,
          project_type: 'Apartment',
          project_status: 'Under Construction',
          description: `Auto-filled from document: ${file.name}. This project features modern amenities and strategic location with excellent connectivity and premium facilities.`,
          emirate: 'Dubai',
          region_area: 'Business Bay',
          developer_name: profile?.developer_name || 'Developer Name',
          starting_price_aed: 850000,
          price_per_sqft: 1200,
          service_charges: 15,
          ownership_type: 'Freehold',
          amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', 'Garden'],
        };
        
        setAutoFillData(mockData);
        setIsProcessingDocument(false);
        toast.success('Document processed successfully! Form fields have been auto-filled.');
      }, 2000);
      
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Failed to process document');
      setIsProcessingDocument(false);
      setUploadedDocument(null);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      handleDocumentUpload(file);
    }
  };

  const removeUploadedDocument = () => {
    setUploadedDocument(null);
    setAutoFillData(null);
    setIsProcessingDocument(false);
    const fileInput = document.getElementById('document-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Auto-fill Document Upload - Show at top */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="text-center">
            <div className="mb-4">
              <Upload className="h-8 sm:h-10 w-8 sm:w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Auto-Fill Project Details</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Upload a project document (PDF, DOC, DOCX, TXT) to automatically fill the form fields
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelection}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-4 sm:px-6"
                  disabled={isProcessingDocument}
                  asChild
                >
                  <span className="cursor-pointer flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {isProcessingDocument ? 'Processing...' : 'Upload Document to Auto-Fill'}
                  </span>
                </Button>
              </label>
            </div>
            {uploadedDocument && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-700">
                    📄 {uploadedDocument.name}
                    {isProcessingDocument && ' - Processing...'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeUploadedDocument}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {autoFillData && !isProcessingDocument && (
              <div className="mt-3">
                <div className="text-sm text-green-700 mb-2">✅ Document processed successfully!</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAutoFillData(null);
                    removeUploadedDocument();
                  }}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Clear Auto-Fill Data
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap space-x-2 sm:space-x-4">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? "default" : "outline"}
                className={`px-3 sm:px-6 py-2 flex items-center gap-2 text-sm sm:text-base ${
                  activeTab === tab.id 
                    ? 'bg-[#455560] hover:bg-[#394650] text-white' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {activeTab === 'add-project' && (
          <ProjectForm autoFillData={autoFillData} />
        )}

        {activeTab === 'my-projects' && (
          <MyProjects />
        )}
      </div>
    </div>
  );
};

export default DeveloperDashboard;
