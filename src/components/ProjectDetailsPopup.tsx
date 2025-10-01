import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, DollarSign, Calendar, Home, Ruler, Users, Image as ImageIcon, FileText, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectDetailsPopupProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export const ProjectDetailsPopup = ({ projectId, open, onClose }: ProjectDetailsPopupProps) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (open && projectId) {
      fetchProjectDetails();
    }
  }, [open, projectId]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const galleryImages = project?.gallery_images || [];
  const hasGallery = Array.isArray(galleryImages) && galleryImages.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Project Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : project ? (
          <div className="space-y-6">
            {/* Cover Image */}
            {project.cover_image_url && (
              <div className="w-full h-64 relative rounded-lg overflow-hidden">
                <img
                  src={project.cover_image_url}
                  alt={project.project_title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Project ID</p>
                  <p className="font-semibold">{project.project_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project Title</p>
                  <p className="font-semibold">{project.project_title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Developer</p>
                  <p className="font-semibold">{project.developer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project Type</p>
                  <p className="font-semibold">{project.project_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project Subtype</p>
                  <p className="font-semibold">{project.project_subtype || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Listing Type</p>
                  <p className="font-semibold">{project.listing_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold">{project.project_status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Handover Date</p>
                  <p className="font-semibold">{formatDate(project.handover_date)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-semibold">{project.description || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Emirate</p>
                  <p className="font-semibold">{project.emirate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-semibold">{project.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Region/Area</p>
                  <p className="font-semibold">{project.region_area || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Community</p>
                  <p className="font-semibold">{project.community || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sub Community</p>
                  <p className="font-semibold">{project.sub_community || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Street</p>
                  <p className="font-semibold">{project.street_name || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold">{project.address || 'N/A'}</p>
                </div>
                {project.location_description && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Location Description</p>
                    <p className="font-semibold">{project.location_description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Starting Price</p>
                  <p className="font-semibold">AED {project.starting_price_aed?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per Sq.Ft</p>
                  <p className="font-semibold">AED {project.price_per_sqft || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Charges</p>
                  <p className="font-semibold">AED {project.service_charges || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Plan</p>
                  <p className="font-semibold">{project.payment_plan || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Unit Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Unit Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms Range</p>
                  <p className="font-semibold">{project.bedrooms_range || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms Range</p>
                  <p className="font-semibold">{project.bathrooms_range || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unit Sizes</p>
                  <p className="font-semibold">{project.unit_sizes_range || 'N/A'} sq.ft</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="font-semibold">{project.total_units || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Furnishing</p>
                  <p className="font-semibold">{project.furnishing_status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ownership Type</p>
                  <p className="font-semibold">{project.ownership_type || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            {project.amenities && Array.isArray(project.amenities) && project.amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Amenities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.map((amenity: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {hasGallery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative w-full h-96 rounded-lg overflow-hidden">
                      <img
                        src={galleryImages[currentImageIndex]}
                        alt={`Gallery image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2 items-center justify-center">
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {currentImageIndex + 1} / {galleryImages.length}
                      </span>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sales Contact</p>
                  <p className="font-semibold">{project.sales_contact_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{project.sales_phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{project.sales_email || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Documents & Media */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents & Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.brochure_url && (
                  <a
                    href={project.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Download Brochure
                  </a>
                )}
                {project.video_tour_url && (
                  <a
                    href={project.video_tour_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Video className="h-4 w-4" />
                    Watch Video Tour
                  </a>
                )}
                {project.google_maps_link && (
                  <a
                    href={project.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <MapPin className="h-4 w-4" />
                    View on Google Maps
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No project details found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
