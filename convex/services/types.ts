// Types for seed data
import { v } from "convex/values";

export interface Resume {
  repId: string;
  name: string;
  gender: "M" | "F";
  education: string;
  experience: string;
  intelligence: number;
  myers_briggs: string;
  other_info: string;
  interview: string;
  reference_check: string;
}

export interface County {
  id: number;
  name: string;
  state_id: string;
  population: string;
  path: string;
}
