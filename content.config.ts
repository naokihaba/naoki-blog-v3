import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: "page",
      source: "blog/**",
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
      }),
    }),
    talks: defineCollection({
      type: "page",
      source: "talks/**",
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        event: z.string().optional(),
        slidesUrl: z.string().url().optional(),
        slidesEmbedUrl: z.string().url().optional(),
        videoUrl: z.string().url().optional(),
        location: z.string().optional(),
      }),
    }),
  },
});
