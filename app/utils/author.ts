export const SITE_AUTHOR = {
  name: 'Rares Serban',
  url: '/about',
  image: '/images/rares-serban.jpg',
  sameAs: ['https://x.com/raress96', 'https://www.linkedin.com/in/raress96'],
} as const;

export const defineSiteAuthor = (extra?: { jobTitle?: string }) => definePerson({
  name: SITE_AUTHOR.name,
  url: SITE_AUTHOR.url,
  image: defineImage({ url: SITE_AUTHOR.image }),
  sameAs: [...SITE_AUTHOR.sameAs],
  ...extra,
});

export const definePostAuthor = (author: { name: string, to?: string }) => author.name === SITE_AUTHOR.name
  ? defineSiteAuthor()
  : definePerson({ name: author.name, url: author.to });
