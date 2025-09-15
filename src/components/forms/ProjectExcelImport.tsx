import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface ProjectExcelImportProps {
  onImport: (data: any, appendUnits?: boolean) => void;
  onClose: () => void;
  existingUnits?: any[];
}

const MANDATORY_PROJECT_FIELDS = [
  'project_title',
  'developer_name',
  'emirate',
  'region_area',
  'project_type',
  'project_subtype',
  'description',
  'project_status',
  'listing_type'
];

// Dropdown fields that need validation against database
const DROPDOWN_VALIDATION_FIELDS = {
  'emirate': 'emirate',
  'project_subtype': 'project_subtype',
  'project_status': 'project_status',
  'listing_type': 'listing_type',
  'bedrooms_range': 'bedroom_range',
  'bathrooms_range': 'bathroom_range',
  'furnishing_status': 'furnishing_status',
  'ownership_type': 'ownership_type'
};

// Validate developer name against database
const validateDeveloperName = async (developerName: string) => {
  const errors: string[] = [];
  
  if (developerName) {
    const { data: developers, error } = await supabase
      .from('developers')
      .select('developer_name')
      .eq('developer_name', developerName.trim())
      .eq('is_active', true);
      
    if (error) {
      errors.push('❌ Failed to validate developer name. Please try again.');
      return errors;
    }
    
    if (!developers || developers.length === 0) {
      errors.push(`❌ DEVELOPER VALIDATION FAILED: "${developerName}" not found in developers list.
      
📋 TO FIX: Go to Developer Settings > Manage Developers
   1. Add developer: "${developerName}" 
   2. Then re-import your Excel file
   
✅ Only existing developers from the system are allowed.`);
    }
  }
  
  return errors;
};

// Validate dropdown values against database
const validateDropdownValues = async (projectData: any[]) => {
  const errors: string[] = [];
  
  // Get all dropdown settings from database
  const { data: dropdownSettings, error } = await supabase
    .from('dropdown_settings')
    .select('category, value')
    .eq('is_active', true);
    
  if (error) {
    errors.push('❌ Failed to fetch dropdown settings from database. Please try again.');
    return errors;
  }
  
  // Group dropdown values by category
  const dropdownValuesByCategory: Record<string, string[]> = {};
  const dropdownValuesOriginal: Record<string, string[]> = {};
  dropdownSettings?.forEach(item => {
    if (!dropdownValuesByCategory[item.category]) {
      dropdownValuesByCategory[item.category] = [];
      dropdownValuesOriginal[item.category] = [];
    }
    dropdownValuesByCategory[item.category].push(item.value.toLowerCase());
    dropdownValuesOriginal[item.category].push(item.value);
  });
  
  // Track missing values by category
  const missingValuesByCategory: Record<string, Set<string>> = {};
  
  // Validate project_type (fixed values)
  const projectType = projectData[0]?.project_type;
  if (projectType) {
    const normalized = projectType.toString().trim().toLowerCase();
    if (normalized !== 'residential' && normalized !== 'commercial') {
      errors.push(`❌ Invalid project_type: "${projectType}". Allowed values are: Residential or Commercial.`);
    }
  }
  
  // Validate dropdown fields for both project level and unit level fields
  Object.keys(DROPDOWN_VALIDATION_FIELDS).forEach(field => {
    const category = DROPDOWN_VALIDATION_FIELDS[field];
    
    // Check project level fields (only in first row)
    if (['emirate', 'project_subtype', 'project_status', 'listing_type'].includes(field)) {
      const value = projectData[0]?.[field]?.toString().trim();
      
      if (value) {
        if (!dropdownValuesByCategory[category]) {
          errors.push(`❌ No dropdown category "${category}" found in settings. Please set up this dropdown category first.`);
          return;
        }

        const isValid = dropdownValuesByCategory[category].some(dbValue => 
          dbValue.toLowerCase() === value.toLowerCase()
        );
        if (!isValid) {
          if (!missingValuesByCategory[category]) {
            missingValuesByCategory[category] = new Set();
          }
          missingValuesByCategory[category].add(value);
        }
      }
    }
    
    // Check unit level fields (in all rows that have unit_code)
    if (['bedrooms_range', 'bathrooms_range', 'furnishing_status', 'ownership_type'].includes(field)) {
      projectData.forEach((row, index) => {
        if (row.unit_code && row.unit_code.toString().trim() !== '') {
          const value = row[field]?.toString().trim();
          
          if (value) {
            if (!dropdownValuesByCategory[category]) {
              errors.push(`❌ No dropdown category "${category}" found in settings. Please set up this dropdown category first.`);
              return;
            }

            const isValid = dropdownValuesByCategory[category].some(dbValue => 
              dbValue.toLowerCase() === value.toLowerCase()
            );
            if (!isValid) {
              if (!missingValuesByCategory[category]) {
                missingValuesByCategory[category] = new Set();
              }
              missingValuesByCategory[category].add(value);
            }
          }
        }
      });
    }
  });
  
  // Generate comprehensive error messages for missing values
  Object.keys(missingValuesByCategory).forEach(category => {
    const missingValues = Array.from(missingValuesByCategory[category]);
    if (missingValues.length > 0) {
      const availableValues = dropdownValuesOriginal[category] || [];
      errors.push(`
❌ DROPDOWN VALIDATION FAILED for "${category}":
   Missing values: ${missingValues.join(', ')}
   
📋 TO FIX: Go to Developer Settings > Dropdown Settings
   1. Select category: "${category}"  
   2. Add these missing values: ${missingValues.join(', ')}
   3. Then re-import your Excel file
   
✅ Current valid values: ${availableValues.length > 0 ? availableValues.join(', ') : 'None configured'}
      `);
    }
  });
  
  return errors;
};

const ProjectExcelImport: React.FC<ProjectExcelImportProps> = ({ onImport, onClose, existingUnits = [] }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSampleExcel = () => {
    // Project and units data
    const projectAndUnitsData = [
      {
        // PROJECT FIELDS (Row 1 - fills all project data)
        project_title: 'Marina Heights Residences',
        developer_name: 'Emaar Properties',
        emirate: 'Dubai',
        region_area: 'Dubai Marina',
        project_type: 'Residential',
        project_subtype: 'Apartment',
        description: 'A luxury residential project offering waterfront living in the heart of Dubai Marina with stunning sea views',
        project_status: 'Under Construction',
        listing_type: 'Sales',
        handover_date: '14/02/2025',
        rera_approval_id: 'RERA123456789',
        video_tour_url: 'https://example.com/marina-heights-tour',
        // Location Details
        street_name: 'Sheikh Zayed Road',
        pincode: '00000',
        address: 'Dubai Marina, Sheikh Zayed Road, Dubai, UAE',
        location_description: 'Prime waterfront location with direct beach access and metro connectivity',
        google_maps_link: 'https://maps.google.com/marina-heights',
        latitude: 25.0657,
        longitude: 55.1395,
        // Contact Information
        contact_name_1: 'Ahmed Al Mansouri',
        contact_phone_1: '+971501234567',
        contact_email_1: 'ahmed.mansouri@emaar.com',
        contact_name_2: 'Sarah Johnson',
        contact_phone_2: '+971507654321',
        contact_email_2: 'sarah.johnson@emaar.com',
        
        // UNIT FIELDS (Row 1 - Unit 1)
        unit_code: 'A101',
        unit_size_range: '850-950 sq ft',
        bedrooms_range: '1 Bedroom',
        bathrooms_range: '1 Bathroom',
        furnishing_status: 'Unfurnished',
        ownership_type: 'Freehold',
        has_balcony: true,
        starting_price_aed: 850000,
        price_per_sqft: 1000,
        service_charges: 12,
        payment_plan: '70/30',
        unit_amenities: 'Balcony,Built-in Wardrobes,Kitchen Appliances'
      },
      {
        // Row 2 - Unit 2 (project fields can be empty as they're filled from row 1)
        project_title: '', // Optional - will use row 1 data
        developer_name: '', // Optional - will use row 1 data
        
        // UNIT FIELDS (Row 2 - Unit 2)
        unit_code: 'B201',
        unit_size_range: '1200-1400 sq ft',
        bedrooms_range: '2 Bedrooms',
        bathrooms_range: '2 Bathrooms',
        furnishing_status: 'Semi-Furnished',
        ownership_type: 'Freehold',
        has_balcony: true,
        starting_price_aed: 1200000,
        price_per_sqft: 1100,
        service_charges: 15,
        payment_plan: '60/40',
        unit_amenities: 'Balcony,Built-in Wardrobes,Kitchen Appliances,Maid Room'
      }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet from project and units data
    const dataWs = XLSX.utils.json_to_sheet(projectAndUnitsData);
    XLSX.utils.book_append_sheet(workbook, dataWs, 'Project & Units Data');

    // Instructions sheet with comprehensive guidance
    const instructions = [
      { Field: '📋 HOW TO IMPORT PROJECT & UNITS', Description: 'Step-by-step import guide', Example: '', Notes: '⚠️ READ BEFORE IMPORTING' },
      { Field: '', Description: '', Example: '', Notes: '' },
      { Field: '🚀 STEP 1: PREPARE DEVELOPERS', Description: 'Before importing Excel', Example: '', Notes: '⚠️ CRITICAL STEP' },
      { Field: '• Go to Developer Settings', Description: 'Add all developers you plan to use', Example: 'Add "Emaar Properties", "DAMAC", etc.', Notes: 'MUST exist before import' },
      { Field: '• Activate all developers', Description: 'Ensure is_active = true', Example: 'Check active status', Notes: 'Only active developers allowed' },
      { Field: '', Description: '', Example: '', Notes: '' },
      { Field: '🚀 STEP 2: PREPARE DROPDOWN VALUES', Description: 'Before importing Excel', Example: '', Notes: '⚠️ CRITICAL STEP' },
      { Field: '• Go to Dropdown Settings', Description: 'Add missing dropdown values', Example: 'emirate, project_subtype, etc.', Notes: 'Import will fail if missing' },
        { Field: '• Categories to check:', Description: 'emirate, project_subtype, project_status, listing_type, bedroom_range, bathroom_range, furnishing_status, ownership_type', Example: 'Dubai, Apartment, Ready, Sales, 1 Bedroom, 1 Bathroom', Notes: 'All must exist' },
        { Field: '• Unit amenities category:', Description: 'Add "unit_amenities" category', Example: 'Balcony, Kitchen Appliances, etc.', Notes: 'For unit-specific amenities' },
      { Field: '', Description: '', Example: '', Notes: '' },
      { Field: '🚀 STEP 3: EXCEL FILE STRUCTURE', Description: 'How to structure your data', Example: '', Notes: 'Follow exactly' },
      { Field: 'ROW 1 (Project Data)', Description: 'Fill ALL project fields in row 1', Example: 'project_title, developer_name, etc.', Notes: 'Project info for all units' },
      { Field: 'ROW 1 (First Unit)', Description: 'Also add first unit data in row 1', Example: 'unit_code: A101, starting_price_aed: 850000', Notes: 'First unit info' },
      { Field: 'ROW 2+ (Additional Units)', Description: 'Add more units (one per row)', Example: 'unit_code: B201, starting_price_aed: 1200000', Notes: 'Each row = one unit' },
      { Field: 'Project fields in ROW 2+', Description: 'Leave empty (will use ROW 1 data)', Example: 'project_title: (leave empty)', Notes: 'ROW 1 data applies to all' },
      { Field: '', Description: '', Example: '', Notes: '' },
      { Field: '📋 MANDATORY PROJECT FIELDS', Description: 'Fill these in ROW 1 only', Example: '', Notes: 'Required for import' },
      { Field: 'project_title', Description: 'Name of the project', Example: 'Marina Heights Residences', Notes: 'Project name (Row 1 only)' },
      { Field: 'developer_name', Description: '⚠️ CRITICAL: Must exist in developers list', Example: 'Emaar Properties', Notes: '⚠️ MUST be existing developer' },
      { Field: 'emirate', Description: 'Emirate location', Example: 'Dubai, Abu Dhabi, Sharjah', Notes: '⚠️ Must exist in dropdown settings' },
      { Field: 'region_area', Description: 'Specific area/region', Example: 'Dubai Marina, Downtown', Notes: 'Area within emirate' },
      { Field: 'project_type', Description: 'Project Type (fixed)', Example: 'Residential or Commercial', Notes: 'Only "Residential" or "Commercial"' },
      { Field: 'project_subtype', Description: 'Project Sub-Category', Example: 'Apartment, Villa, Townhouse', Notes: '⚠️ Must exist in dropdown settings' },
      { Field: 'description', Description: 'Detailed project description', Example: 'Luxury waterfront living...', Notes: 'Project description' },
      { Field: 'project_status', Description: 'Development status', Example: 'Under Construction, Ready', Notes: '⚠️ Must exist in dropdown settings' },
      { Field: 'listing_type', Description: 'Transaction type', Example: 'Sales, Rent, Lease', Notes: '⚠️ Must exist in dropdown settings' },
      { Field: '', Description: '', Example: '', Notes: '' },
      { Field: '📋 MANDATORY UNIT FIELDS', Description: 'Fill for EACH ROW (each unit)', Example: '', Notes: 'Required for each unit' },
      { Field: 'unit_code', Description: '⭐ UNIQUE Unit Code', Example: 'A101, B201, C301', Notes: '⚠️ REQUIRED - Must be unique' },
      { Field: 'starting_price_aed', Description: 'Unit price in AED', Example: '850000, 1200000', Notes: '⚠️ REQUIRED - Numbers only' },
      { Field: 'unit_size_range', Description: 'Unit size', Example: '850-950 sq ft', Notes: 'Size range or exact size' },
        { Field: 'bedrooms_range', Description: 'Number of bedrooms', Example: '1 Bedroom, 2 Bedrooms', Notes: '⚠️ Must exist in dropdown settings' },
        { Field: 'bathrooms_range', Description: 'Number of bathrooms', Example: '1 Bathroom, 2 Bathrooms', Notes: '⚠️ Must exist in dropdown settings' },
        { Field: 'furnishing_status', Description: 'Furnishing type', Example: 'Unfurnished, Semi-Furnished', Notes: '⚠️ Must exist in dropdown settings' },
        { Field: 'ownership_type', Description: 'Ownership type', Example: 'Freehold, Leasehold', Notes: '⚠️ Must exist in dropdown settings' },
        { Field: 'unit_amenities', Description: 'Unit-specific amenities', Example: 'Balcony,Kitchen Appliances', Notes: 'Comma-separated, must exist in unit_amenities dropdown' },
      { Field: '', Description: '', Example: '', Notes: '' },
      { Field: '⚠️ IMPORT VALIDATION CHECKS', Description: 'What system will validate', Example: '', Notes: 'Please read carefully' },
      { Field: '✅ Developer Name Check', Description: 'Must exist in Developers table', Example: 'Will fail if not found', Notes: 'Add in Developer Settings first' },
      { Field: '✅ Dropdown Values Check', Description: 'All dropdown values must exist', Example: 'Will fail if values missing', Notes: 'Add in Dropdown Settings first' },
      { Field: '✅ Unit Code Uniqueness', Description: 'Each unit_code must be unique', Example: 'No duplicate codes allowed', Notes: 'A101, B201, C301 (unique)' },
      { Field: '✅ Mandatory Fields Check', Description: 'All required fields must be filled', Example: 'project_title, unit_code, price', Notes: 'Cannot be empty' },
      { Field: '', Description: '', Example: '', Notes: '' },
      { Field: '🎯 QUICK CHECKLIST', Description: 'Before importing your Excel file', Example: '', Notes: 'Verify each step' },
      { Field: '☐ 1. Add developers', Description: 'Developer Settings > Add all developers', Example: 'Emaar Properties, DAMAC, etc.', Notes: 'Set as active' },
      { Field: '☐ 2. Add dropdown values', Description: 'Dropdown Settings > Add missing values', Example: 'Dubai, Apartment, Ready, etc.', Notes: 'All categories' },
      { Field: '☐ 3. Add unit amenities', Description: 'Dropdown Settings > unit_amenities category', Example: 'Balcony, Kitchen Appliances', Notes: 'For unit amenities' },
      { Field: '☐ 4. Structure Excel correctly', Description: 'ROW 1: Project + Unit 1, ROW 2+: More units', Example: 'Follow template exactly', Notes: 'One unit per row' },
      { Field: '☐ 5. Unique unit codes', Description: 'Each unit must have unique code', Example: 'A101, B201, C301', Notes: 'No duplicates' }
    ];
    
    // Instructions sheet 
    const instructionsWs = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsWs, 'Instructions & Help');

    // Download the file
    XLSX.writeFile(workbook, 'Project_Units_Import_Template.xlsx');
    toast.success('Project & Units Excel template downloaded! Add multiple units with unique codes.');
  };

  const validateExcelData = async (projectData: any[]) => {
    const errors: string[] = [];

    // Validate we have at least one project row
    if (!projectData || projectData.length === 0) {
      errors.push('Excel file must contain at least one project row with complete data');
      return errors;
    }

    // Validate project fields only (no units)
    const firstRow = projectData[0];
    MANDATORY_PROJECT_FIELDS.forEach(field => {
      if (!firstRow[field] || firstRow[field].toString().trim() === '') {
        errors.push(`Project field "${field}" is mandatory and cannot be empty`);
      }
    });

  // Validate dropdown values against database
  const dropdownErrors = await validateDropdownValues(projectData);
  errors.push(...dropdownErrors);

  // Validate developer name
  const developerErrors = await validateDeveloperName(firstRow.developer_name);
  errors.push(...developerErrors);

  return errors;
  };

  const parseExcelFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get the first sheet (should contain project data)
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            reject(new Error('Excel file appears to be empty or corrupted'));
            return;
          }

          // Parse all rows from the main sheet
          const sheet = workbook.Sheets[sheetName];
          const allData = XLSX.utils.sheet_to_json(sheet) as any[];

          // Validate the project data
          const validationErrors = await validateExcelData(allData);
          if (validationErrors.length > 0) {
            reject(new Error(`Validation failed:\n${validationErrors.join('\n')}`));
            return;
          }

          // Extract project data from the first row (where project fields are filled)
          const firstRow = allData[0];
          
          // Extract units data from all rows that have unit_code
          const unitsData = allData.filter(row => row.unit_code && row.unit_code.toString().trim() !== '');
          
          // Note: Unit code uniqueness will be validated in handleFileUpload against existing units
          
          // Transform data to match our form structure
          const transformedData = {
            // Basic project info (from first row)
            project_title: firstRow.project_title,
            developer_name: firstRow.developer_name,
            emirate: firstRow.emirate,
            region_area: firstRow.region_area,
            project_type: firstRow.project_type,
            project_subtype: firstRow.project_subtype || '',
            description: firstRow.description,
            project_status: firstRow.project_status,
            listing_type: firstRow.listing_type,
            handover_date: firstRow.handover_date ? (() => {
              const dateStr = firstRow.handover_date.toString();
              // Handle various date formats: DD/MM/YYYY, DD-MM-YYYY, etc.
              if (dateStr.includes('/') || dateStr.includes('-')) {
                const parts = dateStr.split(/[\/\-]/);
                if (parts.length === 3) {
                  // Assume DD/MM/YYYY or DD-MM-YYYY format
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0'); 
                  const year = parts[2];
                  return `${year}-${month}-${day}`;
                }
              }
              // Try direct parsing as fallback
              try {
                return new Date(dateStr).toISOString().split('T')[0];
              } catch {
                return '';
              }
            })() : '',
            rera_approval_id: firstRow.rera_approval_id || '',
            video_tour_url: firstRow.video_tour_url || '',
            
            // Location details (from first row)
            street_name: firstRow.street_name || '',
            pincode: firstRow.pincode || '',
            address: firstRow.address || '',
            location_description: firstRow.location_description || '',
            google_maps_link: firstRow.google_maps_link || '',
            latitude: firstRow.latitude || null,
            longitude: firstRow.longitude || null,
            
            // Contacts (from first row)
            contacts: [
              ...(firstRow.contact_name_1 ? [{
                name: firstRow.contact_name_1,
                phone: firstRow.contact_phone_1 || '',
                email: firstRow.contact_email_1 || ''
              }] : []),
              ...(firstRow.contact_name_2 ? [{
                name: firstRow.contact_name_2,
                phone: firstRow.contact_phone_2 || '',
                email: firstRow.contact_email_2 || ''
              }] : [])
            ],
            
            // Transform units data
            units: unitsData.map(unitRow => ({
              unit_code: unitRow.unit_code?.toString().trim(),
              unit_size_range: unitRow.unit_size_range || '',
              bedrooms_range: unitRow.bedrooms_range || '',
              bathrooms_range: unitRow.bathrooms_range || '',
              furnishing_status: unitRow.furnishing_status || '',
              ownership_type: unitRow.ownership_type || '',
              has_balcony: unitRow.has_balcony === true || unitRow.has_balcony === 'true' || unitRow.has_balcony === 'TRUE',
              starting_price_aed: parseInt(unitRow.starting_price_aed) || 0,
              price_per_sqft: parseFloat(unitRow.price_per_sqft) || 0,
              service_charges: parseFloat(unitRow.service_charges) || 0,
              payment_plan: unitRow.payment_plan || '',
              
              // Unit-specific amenities
              amenities: unitRow.unit_amenities ? unitRow.unit_amenities.split(',').map((a: string) => a.trim()) : [],
              
              // Copy project data to each unit
              project_title: firstRow.project_title,
              developer_name: firstRow.developer_name,
              description: firstRow.description,
              project_type: firstRow.project_type,
              project_subtype: firstRow.project_subtype || '',
              listing_type: firstRow.listing_type,
              project_status: firstRow.project_status,
              handover_date: firstRow.handover_date ? (() => {
                const dateStr = firstRow.handover_date.toString();
                if (dateStr.includes('/') || dateStr.includes('-')) {
                  const parts = dateStr.split(/[\/\-]/);
                  if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0'); 
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                  }
                }
                try {
                  return new Date(dateStr).toISOString().split('T')[0];
                } catch {
                  return '';
                }
              })() : '',
              rera_approval_id: firstRow.rera_approval_id || ''
            }))
          };

          resolve(transformedData);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read the file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const validateUnitCodesUniqueness = async (newUnits: any[]) => {
    const errors: string[] = [];
    
    // Check for duplicates within new units
    const newUnitCodes = newUnits.map(unit => unit.unit_code?.toString().trim());
    const duplicatesInNew = newUnitCodes.filter((code, index) => newUnitCodes.indexOf(code) !== index);
    
    if (duplicatesInNew.length > 0) {
      errors.push(`Duplicate unit codes found in Excel: ${[...new Set(duplicatesInNew)].join(', ')}`);
    }
    
    // Check for conflicts with existing units
    if (existingUnits.length > 0) {
      const existingCodes = existingUnits.map(unit => unit.unit_code?.toString().trim()).filter(Boolean);
      const conflicts = newUnitCodes.filter(code => existingCodes.includes(code));
      
      if (conflicts.length > 0) {
        errors.push(`Unit codes already exist: ${[...new Set(conflicts)].join(', ')}. Please use unique unit codes.`);
      }
    }
    
    return errors;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setIsProcessing(true);
    try {
      const parsedData = await parseExcelFile(file);
      
      // Check for unit code conflicts if we have existing units
      const unitErrors = await validateUnitCodesUniqueness((parsedData as any).units);
      if (unitErrors.length > 0) {
        toast.error(`Validation failed:\n${unitErrors.join('\n')}`);
        return;
      }
      
      const appendUnits = existingUnits.length > 0;
      toast.success(appendUnits ? 'Excel units appended successfully!' : 'Excel file imported successfully!');
      onImport(parsedData, appendUnits);
    } catch (error) {
      toast.error(error.message);
      console.error('Excel import error:', error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-6 w-6" />
            Import Project from Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-4 sm:p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Project & Units Import</h4>
                <p className="text-blue-700 text-sm mt-1">
                  Import complete project data with multiple units. Each row represents one unit with unique unit code.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Download Template</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Template Instructions:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Fill project info in first row (same for all units)</li>
                <li>• Each row = one unit with unique unit_code</li>
                <li>• Developer name must exist in system</li>
                <li>• Use dropdown values from Instructions sheet</li>
                <li>• Keep unit_code simple (e.g., A101, B205)</li>
                <li>• Required: unit_code, bedrooms_range, bathrooms_range</li>
              </ul>
            </div>
            <Button
              onClick={generateSampleExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Project & Units Template
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Upload Filled Template</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Validation Rules:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Developer name validation against database</li>
                <li>• Dropdown values validation (project type, status, etc.)</li>
                <li>• Unit codes must be unique within project</li>
                <li>• Required fields cannot be empty</li>
                <li>• File size limit: 10MB</li>
              </ul>
            </div>
            <div className="border-2 border-dashed border-gray-300 hover:border-primary/50 rounded-lg p-8 text-center transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <div className="space-y-4">
                <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    size="lg"
                    className="mb-3"
                  >
                    {isProcessing ? 'Processing...' : 'Choose Excel File'}
                  </Button>
                  <p className="text-sm text-gray-500">
                    Drag & drop or click to browse • Max 10MB • .xlsx, .xls
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectExcelImport;