import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Building, DollarSign, Calendar, Users, Home, Phone, Mail, FileText } from 'lucide-react';

interface ProjectDetailModalProps {
  project: any;
  open: boolean;
  onClose: () => void;
}

const ProjectDetailModal = ({ project, open, onClose }: ProjectDetailModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

// Reset slideshow index on open or when project changes
useEffect(() => {
  if (open) setCurrentIndex(0);
}, [open, project]);

  if (!project) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {project.project_title || 'Untitled Project'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Developer</label>
                    <p className="text-sm">{project.developer_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Project Type</label>
                    <p className="text-sm">{project.project_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge variant={project.project_status === 'Ready' ? 'default' : 'secondary'}>
                      {project.project_status || 'Draft'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Listing Type</label>
                    <p className="text-sm">{project.listing_type || 'Not specified'}</p>
                  </div>
                  {project.total_units && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Units</label>
                      <p className="text-sm">{project.total_units}</p>
                    </div>
                  )}
                </div>
                
                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-sm mt-1">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Emirate</label>
                    <p className="text-sm">{project.emirate || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">City</label>
                    <p className="text-sm">{project.city || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Community</label>
                    <p className="text-sm">{project.community || 'Not specified'}</p>
                  </div>
                  {project.sub_community && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Sub Community</label>
                      <p className="text-sm">{project.sub_community}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Region/Area</label>
                    <p className="text-sm">{project.region_area || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Street Name</label>
                    <p className="text-sm">{project.street_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pincode</label>
                    <p className="text-sm">{project.pincode || 'Not specified'}</p>
                  </div>
                </div>
                
                {project.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Address</label>
                    <p className="text-sm mt-1">{project.address}</p>
                  </div>
                )}

                {project.nearby_landmarks && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nearby Landmarks</label>
                    <p className="text-sm mt-1">{project.nearby_landmarks}</p>
                  </div>
                )}

                {project.location_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location Description</label>
                    <p className="text-sm mt-1">{project.location_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unit Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Unit Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.bedrooms_range && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bedrooms</label>
                      <p className="text-sm">{project.bedrooms_range}</p>
                    </div>
                  )}
                  {project.bathrooms_range && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Bathrooms</label>
                      <p className="text-sm">{project.bathrooms_range}</p>
                    </div>
                  )}
                  {project.unit_sizes_range && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Unit Sizes</label>
                      <p className="text-sm">{project.unit_sizes_range} sq ft</p>
                    </div>
                  )}
                  {project.ownership_type && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ownership Type</label>
                      <p className="text-sm">{project.ownership_type}</p>
                    </div>
                  )}
                  {project.furnishing_status && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Furnishing</label>
                      <p className="text-sm">{project.furnishing_status}</p>
                    </div>
                  )}
                  {project.has_balcony !== null && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Balcony</label>
                      <p className="text-sm">{project.has_balcony ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Pricing Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {project.starting_price_aed && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Starting Price</label>
                      <p className="text-sm">AED {project.starting_price_aed.toLocaleString()}</p>
                    </div>
                  )}
                  {project.price_per_sqft && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Price per Sq Ft</label>
                      <p className="text-sm">AED {project.price_per_sqft}</p>
                    </div>
                  )}
                  {project.service_charges && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Service Charges</label>
                      <p className="text-sm">AED {project.service_charges}/sq ft</p>
                    </div>
                  )}
                  {project.payment_plan && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Plan</label>
                      <p className="text-sm">{project.payment_plan}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            {/* Timeline */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg flex items-center">
      <Calendar className="h-5 w-5 mr-2" />
      Timeline
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <label className="text-sm font-medium text-gray-600">Handover Date</label>
      <p className="text-sm">
        {project.handover_date ? formatDate(project.handover_date) : 'Not specified'}
      </p>
    </div>
  </CardContent>
</Card>

            {/* Contact Information */}
            {(project.contacts || project.sales_contact_name || project.sales_phone || project.sales_email) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {(() => {
                     let contacts = project.contacts;
                     if (typeof contacts === 'string') {
                       try {
                         contacts = JSON.parse(contacts);
                       } catch (e) {
                         contacts = null;
                       }
                     }
                     return contacts && Array.isArray(contacts) && contacts.length > 0;
                   })() ? (
                     <div className="space-y-4">
                       {(() => {
                         let contacts = project.contacts;
                         if (typeof contacts === 'string') {
                           try {
                             contacts = JSON.parse(contacts);
                           } catch (e) {
                             contacts = [];
                           }
                         }
                         return contacts || [];
                       })().map((contact: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-3">Contact {index + 1}</h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <label className="text-sm font-medium text-gray-600">Name</label>
                                <p className="text-sm">{contact.name || 'Not specified'}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <label className="text-sm font-medium text-gray-600">Phone</label>
                                <p className="text-sm">{contact.phone || 'Not specified'}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <label className="text-sm font-medium text-gray-600">Email</label>
                                <p className="text-sm">{contact.email || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {project.sales_contact_name && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contact Name</label>
                            <p className="text-sm">{project.sales_contact_name}</p>
                          </div>
                        </div>
                      )}
                      {project.sales_phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Phone</label>
                            <p className="text-sm">{project.sales_phone}</p>
                          </div>
                        </div>
                      )}
                      {project.sales_email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Email</label>
                            <p className="text-sm">{project.sales_email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {project.amenities && Array.isArray(project.amenities) && project.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media */}
            {(project.cover_image_url || project.brochure_url || project.video_tour_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Media & Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.cover_image_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cover Image</label>
                      <img 
                        src={project.cover_image_url} 
                        alt="Project Cover" 
                        className="w-full h-48 object-cover rounded-lg mt-2"
                      />
                    </div>
                  )}

                  {project.gallery_images && project.gallery_images.length > 0 && (
  <div>
    <label className="text-sm font-medium text-gray-600">Gallery</label>

    <div className="relative w-full h-48 mt-2 overflow-hidden rounded-lg">
      <img
        src={project.gallery_images[currentIndex]}
        alt={`Gallery Image ${currentIndex + 1}`}
        className="w-full h-48 object-cover rounded-lg transition-all duration-300"
      />

      <button
        onClick={() =>
          setCurrentIndex((prev) =>
            prev === 0 ? project.gallery_images.length - 1 : prev - 1
          )
        }
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white px-2 py-1 rounded"
      >
        ‹
      </button>

      <button
        onClick={() =>
          setCurrentIndex((prev) =>
            prev === project.gallery_images.length - 1 ? 0 : prev + 1
          )
        }
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white px-2 py-1 rounded"
      >
        ›
      </button>
    </div>

    <div className="flex justify-center mt-2 gap-2">
      {project.gallery_images.map((_, idx) => (
        <div
          key={idx}
          className={`w-2 h-2 rounded-full ${
            currentIndex === idx ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  </div>
)}


                  {project.brochure_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Brochure</label>
                      <a 
                        href={project.brochure_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm block mt-1"
                      >
                        View Brochure
                      </a>
                    </div>
                  )}
                   {project.video_tour_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Video Tour</label>
                      <a 
                        href={project.video_tour_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm block mt-1"
                      >
                        Watch Video Tour
                      </a>
                    </div>
                  )}
                   {project.other_documents && Array.isArray(project.other_documents) && project.other_documents.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Other Documents</label>
                      <div className="space-y-2 mt-1">
                        {project.other_documents.map((doc: any, index: number) => (
                          <a 
                            key={index}
                            href={doc.url || doc} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm block"
                          >
                            {doc.name || `Document ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailModal;  