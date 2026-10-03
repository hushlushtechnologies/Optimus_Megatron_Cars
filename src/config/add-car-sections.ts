export interface AddCarSection {
  id: string;
  label: string;
  isBuilt: boolean;
}

export const ADD_CAR_SECTIONS: AddCarSection[] = [
  { id: "basic-information", label: "Basic Information", isBuilt: true },
  { id: "specifications", label: "Vehicle Specifications", isBuilt: true },
  { id: "exterior-interior", label: "Exterior & Interior", isBuilt: true },
  { id: "pricing-promotion", label: "Pricing & Promotion", isBuilt: true },
  { id: "warranty-inspection", label: "Warranty & Inspection", isBuilt: true },
  { id: "media", label: "Media", isBuilt: true },
  { id: "publishing", label: "Website & Publishing", isBuilt: true },
];
