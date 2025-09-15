import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, FolderOpen, AlertCircle, Image, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectMediaImportProps {
  projectId?: string;
  onImport: (mediaData: any) => void;
  onClose: () => void;
  excelUnits?: string[]; // Unit codes from excel for validation
}

interface UnitMediaStructure {
  coverImage?: File;
  gallery: File[];
  brochure?: File;
  otherDocuments: File[];
}

interface MediaStructure {
  [unitNumber: string]: UnitMediaStructure;
}

const ProjectMediaImport: React.FC<ProjectMediaImportProps> = ({ projectId, onImport, onClose, excelUnits = [] }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const folderInputRef = useRef<HTMLInputElement>(null);

  const validateFolderStructure = (files: FileList): MediaStructure => {
    const mediaData: MediaStructure = {};
    const errors: string[] = [];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    // Group files by unit number and subfolder
    const unitStructure: { [unitNumber: string]: { [folderName: string]: File[] } } = {};
    
    Array.from(files).forEach(file => {
      const pathParts = file.webkitRelativePath.split('/');
      if (pathParts.length >= 3) {
        const unitNumber = pathParts[1]; // First level is unit number
        const folderName = pathParts[2].toLowerCase(); // Second level is media type folder
        
        if (!unitStructure[unitNumber]) {
          unitStructure[unitNumber] = {};
        }
        if (!unitStructure[unitNumber][folderName]) {
          unitStructure[unitNumber][folderName] = [];
        }
        unitStructure[unitNumber][folderName].push(file);
      }
    });

    // Validate unit numbers match Excel/form units if provided
    if (excelUnits.length > 0) {
      const normalize = (s: string) => s?.toString().trim();
      const folderUnitsRaw = Object.keys(unitStructure);
      const folderUnits = folderUnitsRaw.map(normalize);
      const excelUnitsNormalized = excelUnits.map(normalize);

      const excelUnitSet = new Set(excelUnitsNormalized);
      const folderUnitSet = new Set(folderUnits);
      
      // Extra folders not in the expected unit list
      const extraFolderUnits = folderUnitsRaw.filter((unit, idx) => !excelUnitSet.has(folderUnits[idx]));
      if (extraFolderUnits.length > 0) {
        errors.push(`Media folders found for units not in list: ${extraFolderUnits.join(', ')}`);
      }

      // Missing folders for expected units
      const missingFolderUnits = excelUnits.filter((unit, idx) => !folderUnitSet.has(excelUnitsNormalized[idx]));
      if (missingFolderUnits.length > 0) {
        errors.push(`No media folders found for expected units: ${missingFolderUnits.join(', ')}`);
      }
      
      // Count mismatch
      if (folderUnits.length !== excelUnitsNormalized.length) {
        errors.push(`Unit count mismatch: Expected ${excelUnitsNormalized.length} units, but media folders have ${folderUnits.length} units`);
      }
    }

    // Validate each unit's media structure
    Object.entries(unitStructure).forEach(([unitNumber, folderStructure]) => {
      mediaData[unitNumber] = {
        gallery: [],
        otherDocuments: []
      };

      // Validate Cover Image folder
      if (folderStructure['cover image'] || folderStructure['coverimage'] || folderStructure['cover_image']) {
        const coverFiles = folderStructure['cover image'] || folderStructure['coverimage'] || folderStructure['cover_image'];
        if (coverFiles.length > 1) {
          errors.push(`Unit ${unitNumber}: Cover Image folder can contain only 1 file`);
        } else if (coverFiles.length === 1) {
          const file = coverFiles[0];
          if (!allowedImageTypes.includes(file.type)) {
            errors.push(`Unit ${unitNumber}: Cover Image must be an image file (JPG, PNG, WEBP). Found: ${file.type}`);
          } else {
            mediaData[unitNumber].coverImage = file;
          }
        }
      }

      // Validate Gallery folder
      if (folderStructure['gallery']) {
        const galleryFiles = folderStructure['gallery'];
        galleryFiles.forEach(file => {
          if (!allowedImageTypes.includes(file.type)) {
            errors.push(`Unit ${unitNumber}: Gallery file "${file.name}" must be an image file (JPG, PNG, WEBP). Found: ${file.type}`);
          } else {
            mediaData[unitNumber].gallery.push(file);
          }
        });
      }

      // Validate Brochure folder
      if (folderStructure['brochure']) {
        const brochureFiles = folderStructure['brochure'];
        if (brochureFiles.length > 1) {
          errors.push(`Unit ${unitNumber}: Brochure folder can contain only 1 file`);
        } else if (brochureFiles.length === 1) {
          const file = brochureFiles[0];
          if (!allowedDocTypes.includes(file.type)) {
            errors.push(`Unit ${unitNumber}: Brochure must be a PDF or Word document. Found: ${file.type}`);
          } else {
            mediaData[unitNumber].brochure = file;
          }
        }
      }

      // Validate Other Documents folder
      if (folderStructure['other documents'] || folderStructure['otherdocuments'] || folderStructure['other_documents']) {
        const otherDocsFiles = folderStructure['other documents'] || folderStructure['otherdocuments'] || folderStructure['other_documents'];
        otherDocsFiles.forEach(file => {
          if (!allowedDocTypes.includes(file.type)) {
            errors.push(`Unit ${unitNumber}: Other Documents file "${file.name}" must be a PDF or Word document. Found: ${file.type}`);
          } else {
            mediaData[unitNumber].otherDocuments.push(file);
          }
        });
      }

      // Check for unexpected folders in this unit
      const expectedFolders = ['cover image', 'coverimage', 'cover_image', 'gallery', 'brochure', 'other documents', 'otherdocuments', 'other_documents'];
      Object.keys(folderStructure).forEach(folder => {
        if (!expectedFolders.includes(folder)) {
          errors.push(`Unit ${unitNumber}: Unexpected folder "${folder}". Only allowed: Cover Image, Gallery, Brochure, Other Documents`);
        }
      });
    });

    if (errors.length > 0) {
      throw new Error(`Folder structure validation failed:\n${errors.join('\n')}`);
    }

    return mediaData;
  };

  const uploadFileToSupabase = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const uploadMediaFiles = async (mediaData: MediaStructure): Promise<any> => {
    const uploadedData: any = {};
    const projectIdForPath = projectId || Date.now().toString();

    try {
      // Process each unit's media
      for (const [unitNumber, unitMedia] of Object.entries(mediaData)) {
        uploadedData[unitNumber] = {
          cover_image_url: '',
          gallery_images: [],
          brochure_url: '',
          other_documents: []
        };

        // Upload Cover Image for this unit
        if (unitMedia.coverImage) {
          setUploadProgress(prev => ({ ...prev, [`${unitNumber}-cover`]: 0 }));
          const coverPath = `projects/${projectIdForPath}/units/${unitNumber}/cover/${unitMedia.coverImage.name}`;
          uploadedData[unitNumber].cover_image_url = await uploadFileToSupabase(unitMedia.coverImage, 'project-images', coverPath);
          setUploadProgress(prev => ({ ...prev, [`${unitNumber}-cover`]: 100 }));
        }

        // Upload Gallery Images for this unit
        if (unitMedia.gallery.length > 0) {
          for (let i = 0; i < unitMedia.gallery.length; i++) {
            const file = unitMedia.gallery[i];
            setUploadProgress(prev => ({ ...prev, [`${unitNumber}-gallery-${i}`]: 0 }));
            const galleryPath = `projects/${projectIdForPath}/units/${unitNumber}/gallery/${file.name}`;
            const url = await uploadFileToSupabase(file, 'project-images', galleryPath);
            uploadedData[unitNumber].gallery_images.push(url);
            setUploadProgress(prev => ({ ...prev, [`${unitNumber}-gallery-${i}`]: 100 }));
          }
        }

        // Upload Brochure for this unit
        if (unitMedia.brochure) {
          setUploadProgress(prev => ({ ...prev, [`${unitNumber}-brochure`]: 0 }));
          const brochurePath = `projects/${projectIdForPath}/units/${unitNumber}/brochure/${unitMedia.brochure.name}`;
          uploadedData[unitNumber].brochure_url = await uploadFileToSupabase(unitMedia.brochure, 'project-documents', brochurePath);
          setUploadProgress(prev => ({ ...prev, [`${unitNumber}-brochure`]: 100 }));
        }

        // Upload Other Documents for this unit
        if (unitMedia.otherDocuments.length > 0) {
          for (let i = 0; i < unitMedia.otherDocuments.length; i++) {
            const file = unitMedia.otherDocuments[i];
            setUploadProgress(prev => ({ ...prev, [`${unitNumber}-doc-${i}`]: 0 }));
            const docPath = `projects/${projectIdForPath}/units/${unitNumber}/documents/${file.name}`;
            const url = await uploadFileToSupabase(file, 'project-documents', docPath);
            uploadedData[unitNumber].other_documents.push({
              name: file.name,
              url: url,
              size: file.size,
              type: file.type
            });
            setUploadProgress(prev => ({ ...prev, [`${unitNumber}-doc-${i}`]: 100 }));
          }
        }
      }

      return uploadedData;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if Excel data exists first
    if (excelUnits.length === 0) {
      toast.error('Please import Excel data first before importing media files');
      return;
    }

    setIsProcessing(true);
    setUploadProgress({});

    try {
      // Validate folder structure
      const mediaData = validateFolderStructure(files);
      
      // Check if any media was found across all units
      const hasMedia = Object.values(mediaData).some(unitMedia => 
        unitMedia.coverImage || 
        unitMedia.gallery.length > 0 || 
        unitMedia.brochure || 
        unitMedia.otherDocuments.length > 0
      );

      if (!hasMedia) {
        throw new Error('No valid media files found in the uploaded folder');
      }

      // Upload files to Supabase
      const uploadedData = await uploadMediaFiles(mediaData);
      
      // Show summary
      const unitCount = Object.keys(uploadedData).length;
      let totalFiles = 0;
      Object.values(uploadedData).forEach((unitData: any) => {
        if (unitData.cover_image_url) totalFiles++;
        totalFiles += unitData.gallery_images?.length || 0;
        if (unitData.brochure_url) totalFiles++;
        totalFiles += unitData.other_documents?.length || 0;
      });

      toast.success(`Media uploaded successfully for ${unitCount} unit(s): ${totalFiles} files total`);
      onImport(uploadedData);
    } catch (error) {
      toast.error(error.message);
      console.error('Media import error:', error);
    } finally {
      setIsProcessing(false);
      setUploadProgress({});
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6" />
          Import Project Media Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-2">Required Folder Structure (Organized by Unit Number):</p>
              <div className="space-y-2 font-mono text-xs bg-white bg-opacity-50 p-3 rounded border">
                <div>📁 [Your Project Folder]</div>
                <div>&nbsp;&nbsp;📁 A101 <span className="text-gray-600">(Unit Number - must match Excel)</span></div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;📁 Cover Image <span className="text-gray-600">(1 image file)</span></div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;📁 Gallery <span className="text-gray-600">(multiple images)</span></div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;📁 Brochure <span className="text-gray-600">(1 PDF/Word file)</span></div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;📁 Other Documents <span className="text-gray-600">(multiple files)</span></div>
                <div>&nbsp;&nbsp;📁 A102 <span className="text-gray-600">(Another Unit Number)</span></div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;📁 Cover Image</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;📁 Gallery</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;📁 ...</div>
              </div>
              {excelUnits.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                  <p className="font-medium text-blue-800">Expected Units from Excel:</p>
                  <p className="text-blue-700">{excelUnits.join(', ')}</p>
                  <p className="text-blue-600 mt-1">⚠️ Folder names must exactly match these unit codes</p>
                </div>
              )}
              <p className="mt-2 text-xs">
                <strong>Important:</strong> Unit folder names must exactly match unit codes from Excel sheet. All subfolders are optional per unit.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Image className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">Images</div>
              <div className="text-xs text-gray-600">JPG, PNG, WEBP</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <FileText className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">Documents</div>
              <div className="text-xs text-gray-600">PDF, DOC, DOCX</div>
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Uploading media files...</div>
            {Object.entries(uploadProgress).map(([key, progress]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="text-xs w-20">{key}:</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs w-12">{progress}%</div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <Input
            ref={folderInputRef}
            type="file"
            // @ts-ignore - webkitdirectory is a valid attribute
            webkitdirectory=""
            multiple
            onChange={handleFolderUpload}
            disabled={isProcessing}
            className="cursor-pointer"
          />
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 sm:flex-auto"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isProcessing ? 'Uploading...' : 'Select Media Folder'}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isProcessing}
              className="sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectMediaImport;