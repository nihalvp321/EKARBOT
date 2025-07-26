import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectMediaUploadProps {
  formData: any;
  handleInputChange: (field: string, value: string | any[]) => void;
}

const ProjectMediaUpload = ({ formData, handleInputChange }: ProjectMediaUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const uploadFileToStorage = async (file: File, pathPrefix: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `project-media/${pathPrefix}/${fileName}`;

    const { error } = await supabase.storage
      .from('project-images') // Correct bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload failed:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('project-images') // Same bucket
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || null;
  };

  const handleFileUpload = async (field: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const url = await uploadFileToStorage(file, field);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length === 0) {
      setUploading(false);
      return;
    }

    if (field === 'gallery_images' || field === 'other_documents') {
      const existing = formData[field] || [];
      handleInputChange(field, [...existing, ...uploadedUrls]);
    } else {
      handleInputChange(field, uploadedUrls[0]);
    }

    setUploading(false);
  };

  const removeFile = (field: string, index?: number) => {
    if (field === 'gallery_images' || field === 'other_documents') {
      const currentFiles = formData[field] || [];
      const updatedFiles = currentFiles.filter((_: any, i: number) => i !== index);
      handleInputChange(field, updatedFiles);
    } else {
      handleInputChange(field, '');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Media Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Cover Image */}
        <div>
          <Label htmlFor="cover_image">Cover Image</Label>
          <Input
            type="file"
            accept="image/*"
            id="cover_image"
            onChange={(e) => handleFileUpload('cover_image', e.target.files)}
          />
          {formData.cover_image && (
            <div className="relative mt-2">
              <img src={formData.cover_image} alt="cover" className="h-32 rounded" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeFile('cover_image')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Gallery Images */}
        <div>
          <Label htmlFor="gallery_images">Gallery Images</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            id="gallery_images"
            onChange={(e) => handleFileUpload('gallery_images', e.target.files)}
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {formData.gallery_images?.map((img: string, i: number) => (
              <div key={i} className="relative">
                <img src={img} className="h-24 w-full object-cover rounded" />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => removeFile('gallery_images', i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Brochure PDF */}
        <div>
          <Label htmlFor="brochure_pdf">Brochure PDF</Label>
          <Input
            type="file"
            accept=".pdf"
            id="brochure_pdf"
            onChange={(e) => handleFileUpload('brochure_pdf', e.target.files)}
          />
          {formData.brochure_pdf && (
            <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded">
              <FileText className="h-5 w-5 text-gray-600" />
              <a href={formData.brochure_pdf} className="text-sm text-blue-600 truncate max-w-xs" target="_blank" rel="noreferrer">
                Brochure PDF
              </a>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeFile('brochure_pdf')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Video Tour URL */}
        <div>
          <Label htmlFor="video_tour_url">Video Tour URL</Label>
          <Input
            type="url"
            id="video_tour_url"
            placeholder="https://youtube.com/..."
            value={formData.video_tour_url || ''}
            onChange={(e) => handleInputChange('video_tour_url', e.target.value)}
          />
        </div>

        {/* Other Documents */}
        <div>
          <Label htmlFor="other_documents">Other Documents</Label>
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            id="other_documents"
            onChange={(e) => handleFileUpload('other_documents', e.target.files)}
          />
          {formData.other_documents?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {formData.other_documents.map((doc: string, i: number) => (
                <li key={i} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                  <span className="truncate text-sm">{doc}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeFile('other_documents', i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {uploading && <p className="text-sm text-blue-500">Uploading files...</p>}
      </CardContent>
    </Card>
  );
};

export default ProjectMediaUpload;
