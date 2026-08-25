import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.number().optional(),
    title: z.string(),
    slug: z.string().optional(),
    date: z.string(),
    category: z.string().default('Marriage Advice'),
    excerpt: z.string().default(''),
    featuredImage: z.string().default('/images/blog/Making-Matchmaking-Simple-Pure.png'),
    views: z.number().default(100),
    author: z.string().default('Doctor Marriage Bureau Editorial'),
  }),
});

export const collections = {
  blog,
};
