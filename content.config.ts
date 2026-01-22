import { defineCollection, z } from '@nuxt/content';
import { planNames } from './shared/constants';

const variantEnum = z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link']);
const colorEnum = z.enum(['primary', 'secondary', 'neutral', 'error', 'warning', 'success', 'info']);
const sizeEnum = z.enum(['xs', 'sm', 'md', 'lg', 'xl']);
const targetEnum = z.enum(['_blank', '_self']);

const createBaseSchema = () =>
  z.object({
    title: z.string().nonempty(),
    description: z.string().nonempty(),
  });

const createLinkSchema = () =>
  z.object({
    label: z.string().nonempty(),
    to: z.string().nonempty(),
    icon: z.string().optional().editor({ input: 'icon' }),
    size: sizeEnum,
    trailing: z.boolean().optional(),
    target: targetEnum,
    color: colorEnum,
    variant: variantEnum,
  });

const createFeatureSchema = () =>
  createBaseSchema().extend({
    icon: z.string().editor({ input: 'icon' }),
    ui: z
      .object({
        leading: z.string().optional(),
      })
      .editor({ hidden: true }),
  });

export const collections = {
  index: defineCollection({
    source: 'index.yml',
    type: 'page',
    schema: z.object({
      hero: z.object({
        links: z.array(createLinkSchema()),
        headline: z.string().optional(),
      }),
      problem: createBaseSchema().extend({
        items: z.array(
          z.object({
            hours: z.string().nonempty(),
            task: z.string().nonempty(),
            description: z.string().nonempty(),
          })
        ),
      }),
      aiAgents: createBaseSchema().extend({
        agents: z.array(
          z.object({
            name: z.string().nonempty(),
            icon: z.string().editor({ input: 'icon' }),
          })
        ),
      }),
      section: createBaseSchema().extend({
        headline: z.string().optional(),
        images: z.object({
          mobile: z.string().optional(),
          desktop: z.string().optional(),
        }),
        features: z.array(
          createBaseSchema().extend({
            icon: z.string().editor({ input: 'icon' }),
          })
        ),
      }),
      features: createBaseSchema().extend({
        features: z.array(createFeatureSchema()),
      }),
      steps: createBaseSchema().extend({
        items: z.array(
          createFeatureSchema().extend({
            image: z.string().editor({ input: 'media' }).optional(),
          })
        ),
      }),
      techStack: createBaseSchema().extend({
        technologies: z.array(
          z.object({
            name: z.string().nonempty(),
            icon: z.string().editor({ input: 'icon' }),
            color: z.string().nonempty(),
          })
        ),
      }),
      pricing: createBaseSchema().extend({
        plans: z.array(
          createBaseSchema().extend({
            planName: z.string().nonempty(),
            price: z.string().nonempty(),
            discount: z.string().optional(),
            button: createLinkSchema(),
            features: z.array(z.string().nonempty()),
            highlight: z.boolean().optional(),
            billing_period: z.string().optional(),
            billing_cycle: z.string().nonempty(),
            badge: z.string().optional(),
            comingSoon: z.boolean().optional(),
          })
        ),
      }),
      testimonials: createBaseSchema().extend({
        items: z.array(
          z.object({
            quote: z.string().nonempty(),
            user: z.object({
              name: z.string().nonempty(),
              description: z.string().nonempty(),
              to: z.string().nonempty(),
              avatar: z.object({
                src: z.string().editor({ input: 'media' }),
                alt: z.string().optional(),
              }).optional(),
              target: targetEnum.optional(),
            }),
          })
        ),
      }),
      faqs: createBaseSchema().extend({
        items: z.array(
          z.object({
            label: z.string().nonempty(),
            content: z.string().nonempty(),
            icon: z.string().optional(),
          })
        ),
      }),
      cta: createBaseSchema().extend({
        links: z.array(createLinkSchema()),
      }),
    }),
  }),
  pages: defineCollection({
    source: 'pages/**/*.yml',
    type: 'page',
    schema: z.object({}),
  }),
  blog: defineCollection({
    source: 'blog.yml',
    type: 'page',
  }),
  posts: defineCollection({
    source: 'blog/**/*',
    type: 'page',
    schema: z.object({
      image: z.object({ src: z.string().nonempty().editor({ input: 'media' }) }),
      authors: z.array(
        z.object({
          name: z.string().nonempty(),
          to: z.string().nonempty(),
          avatar: z.object({ src: z.string().nonempty().editor({ input: 'media' }) }),
        })
      ),
      date: z.date(),
      badge: z.object({ label: z.string().nonempty() }),
    }),
  }),
};
