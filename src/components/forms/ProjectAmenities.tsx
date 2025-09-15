"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDropdownOptions } from "@/components/hooks/useDropdownOptions";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectAmenitiesProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  handleArrayChange: (field: string, values: string[]) => void;
  showProjectAmenities?: boolean;
}

const ProjectAmenities = ({
  formData,
  handleInputChange,
  handleArrayChange,
  showProjectAmenities = true,
}: ProjectAmenitiesProps) => {
  const { options: amenityOptions, loading } = useDropdownOptions("amenities");
  const selectedAmenities = formData.amenities || [];

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const updatedAmenities = checked
      ? [...selectedAmenities, amenity]
      : selectedAmenities.filter((a: string) => a !== amenity);
    handleArrayChange("amenities", updatedAmenities);
  };

  return (
    <Card className="shadow-md border border-gray-200 rounded-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          {showProjectAmenities ? "Amenities & Features" : "Unit Amenities"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium mb-3 block">
            {showProjectAmenities
              ? "Select Project Amenities"
              : "Select Unit Amenities"}
          </Label>

          {loading ? (
            <div className="text-sm text-gray-500 animate-pulse">
              Loading amenities...
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <AnimatePresence>
                {amenityOptions.map((amenity, idx) => {
                  const isSelected = selectedAmenities.includes(amenity.value);

                  return (
                    <motion.div
                      key={amenity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer select-none transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 shadow-sm"
                          : "bg-white border-gray-200 hover:border-blue-400 hover:shadow"
                      }`}
                      onClick={() =>
                        handleAmenityChange(amenity.value, !isSelected)
                      }
                    >
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleAmenityChange(amenity.value, checked as boolean)
                        }
                        className="mr-2"
                      />
                      <Label
                        htmlFor={`amenity-${amenity.id}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        {amenity.value}
                      </Label>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {showProjectAmenities && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-blue-400 transition"
              >
                <Checkbox
                  id="has_security"
                  checked={formData.has_security || false}
                  onCheckedChange={(checked) =>
                    handleInputChange("has_security", checked.toString())
                  }
                />
                <Label htmlFor="has_security" className="text-sm font-medium">
                  24x7 Security
                </Label>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-blue-400 transition"
              >
                <Checkbox
                  id="has_elevators"
                  checked={formData.has_elevators || false}
                  onCheckedChange={(checked) =>
                    handleInputChange("has_elevators", checked.toString())
                  }
                />
                <Label htmlFor="has_elevators" className="text-sm font-medium">
                  Elevators
                </Label>
              </motion.div>
            </div>

            <div>
              <Label
                htmlFor="security_details"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Security Details
              </Label>
              <Textarea
                id="security_details"
                value={formData.security_details || ""}
                onChange={(e) =>
                  handleInputChange("security_details", e.target.value)
                }
                placeholder="24x7 Security, CCTV monitoring, Access control system"
                rows={2}
                className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectAmenities;
