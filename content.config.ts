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
        badge: z.string().optional(),
      }),
      founder: z.object({
        title: z.string().nonempty(),
        name: z.string().nonempty(),
        story: z.string().nonempty(),
        x: z.string().nonempty(),
        linkedin: z.string().nonempty(),
      }).optional(),
      aiShowcase: z.object({
        items: z.array(
          z.object({
            id: z.string().nonempty(),
            title: z.string().nonempty(),
            description: z.string().nonempty(),
            icon: z.string().editor({ input: 'icon' }),
            color: z.string().optional(),
          })
        ),
      }),
      problem: createBaseSchema().extend({
        items: z.array(
          z.object({
            hours: z.string().nonempty(),
            task: z.string().nonempty(),
            description: z.string().nonempty(),
            icon: z.string().optional().editor({ input: 'icon' }),
          })
        ),
      }),
      aiFeatures: createBaseSchema().extend({
        categories: z.array(
          z.object({
            title: z.string().nonempty(),
            description: z.string().nonempty(),
            icon: z.string().editor({ input: 'icon' }),
            color: z.string().optional(),
            features: z.array(z.string().nonempty()),
          })
        ),
      }),
      fullStackFeatures: createBaseSchema().extend({
        features: z.array(createFeatureSchema()),
      }),
      aiAgents: createBaseSchema().extend({
        codeSnippet: z.string().optional(),
        agents: z.array(
          z.object({
            name: z.string().nonempty(),
            icon: z.string().editor({ input: 'icon' }),
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
      steps: createBaseSchema().extend({
        items: z.array(
          z.object({
            step: z.string().nonempty(),
            title: z.string().nonempty(),
            description: z.string().nonempty(),
            code: z.string().optional(),
          })
        ),
      }),
      pricing: createBaseSchema().extend({
        plans: z.array(
          createBaseSchema().extend({
            planName: z.enum(planNames),
            price: z.string().nonempty(),
            discount: z.string().optional(),
            button: createLinkSchema(),
            features: z.array(z.string().nonempty()),
            highlight: z.boolean().optional(),
            billing_period: z.string().optional(),
            billing_cycle: z.string().nonempty(),
            badge: z.string().optional(),
            distributionLink: z.string().optional(),
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
  }),
  resources: defineCollection({
    source: 'resources/**/*.yml',
    type: 'page',
    schema: z.object({
      seo: z.object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
      }),
      title: z.string().nonempty(),
      description: z.string().nonempty(),
      stats: z.array(
        z.object({
          label: z.string().nonempty(),
          icon: z.string().editor({ input: 'icon' }),
        })
      ).optional(),
      categoryOptions: z.array(
        z.object({
          label: z.string().nonempty(),
          value: z.string(),
        })
      ).optional(),
      complexityOptions: z.array(
        z.object({
          label: z.string().nonempty(),
          value: z.string(),
        })
      ).optional(),
      seoSections: z.array(
        z.object({
          title: z.string().nonempty(),
          content: z.string().nonempty(),
        })
      ).optional(),
      faqs: z.array(
        z.object({
          label: z.string().nonempty(),
          content: z.string().nonempty(),
        })
      ).optional(),
      cta: z.object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
        button: z.object({
          label: z.string().nonempty(),
          to: z.string().nonempty(),
        }),
      }).optional(),
    }),
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
      updatedAt: z.date().optional(),
      badge: z.object({ label: z.string().nonempty() }),
      faqs: z.array(
        z.object({
          label: z.string().nonempty(),
          content: z.string().nonempty(),
        })
      ).optional(),
    }),
  }),
  about: defineCollection({
    source: 'about.yml',
    type: 'page',
    schema: z.object({
      seo: z.object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
      }),
      title: z.string().nonempty(),
      description: z.string().nonempty(),
      sections: z.array(
        z.object({
          title: z.string().nonempty(),
          paragraphs: z.array(z.string().nonempty()),
          items: z.array(z.string().nonempty()).optional(),
        })
      ),
      facts: z.object({
        title: z.string().nonempty(),
        rows: z.array(
          z.object({
            label: z.string().nonempty(),
            value: z.string().nonempty(),
          })
        ),
      }),
      cta: z.object({
        label: z.string().nonempty(),
        to: z.string().nonempty(),
      }),
    }),
  }),
};
