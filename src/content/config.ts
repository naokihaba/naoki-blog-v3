import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().transform((str) => new Date(str)),
    tags: z.array(z.string()).default([]),
  }),
});

const talksCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().transform((str) => new Date(str)),
    event: z.string().optional(),
    slidesUrl: z.string().url().optional(),
    slidesEmbedUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    location: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  blog: blogCollection,
  talks: talksCollection,
};
