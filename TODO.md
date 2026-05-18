# TODO

Future improvements and enhancements for the NuxtBeyond boilerplate.

- remove `nuxt-stripe` package and implement Stripe integration directly

- [ ] **Pagination for support questions** - Add pagination to prevent performance issues
  - `server/api/projects/[id]/questions/index.get.ts:34` - TODO comment in code

- [ ] **Email confirmation for project deletion** - Send confirmation email for extra security
  - `server/api/projects/[id].delete.ts:4` - TODO comment in code

- [ ] **System prompt validation in UI** - Validate custom prompts when saving configuration
  - `server/api/embed/chats/[id].post.ts:153` - TODO comment in code
  - Currently only validated at runtime

- [ ] **Annual billing plans** - Add yearly subscription option
  - `server/api/projects/[id]/billing/index.post.ts:52` - TODO comment in code
  - Requires creating annual Stripe products with lookup keys
