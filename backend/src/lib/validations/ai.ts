import { z } from "zod";

export const generateDescriptionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1, "Category is required"),
  attributes: z.array(z.string().trim().min(1)).default([]),
});

export const generateSEOSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  category: z.string().trim().min(1, "Category is required"),
});

export const generateTagsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  category: z.string().trim().min(1, "Category is required"),
});

export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;
export type GenerateSEOInput = z.infer<typeof generateSEOSchema>;
export type GenerateTagsInput = z.infer<typeof generateTagsSchema>;
