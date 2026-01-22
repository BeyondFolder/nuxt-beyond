-- Demo admin user
INSERT INTO users (id, email, password, provider, providerId, resetToken, resetTokenExpiry, verificationToken, verificationTokenExpiry, createdAt)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo-admin@nuxtbeyond.com',
  '$scrypt$n=16384,r=8,p=1$b42xP6sAugA1ta3iFt9Iqw==$kwJQYyDq8j8xJE5SzrfvwAweaaAj1zngUdMYmLhV3pGYsQrB5g7fkEvqf5Olg81K/5d3FO4FbpaZwoQkK7l/kQ==',
  'credentials',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  unixepoch()
);
--> statement-breakpoint
-- Demo member user
INSERT INTO users (id, email, password, provider, providerId, resetToken, resetTokenExpiry, verificationToken, verificationTokenExpiry, createdAt)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'demo-member@nuxtbeyond.com',
  '$scrypt$n=16384,r=8,p=1$b42xP6sAugA1ta3iFt9Iqw==$kwJQYyDq8j8xJE5SzrfvwAweaaAj1zngUdMYmLhV3pGYsQrB5g7fkEvqf5Olg81K/5d3FO4FbpaZwoQkK7l/kQ==',
  'credentials',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  unixepoch()
);
--> statement-breakpoint
-- Demo project
INSERT INTO projects (id, name, description, configuration, planName, subscriptionStatus, stripeCustomerId, stripeSubscriptionId, stripeCurrentPeriodEnd, createdAt, updatedAt)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Demo Project',
  'This is a demo project showcasing NuxtBeyond capabilities',
  '{"appearance":{"primaryColor":"#0d9488","logo":null,"position":"bottom-right"},"chat":{"welcomeMessage":"Welcome to NuxtBeyond Demo! How can I help you today?","placeholder":"Ask me anything about NuxtBeyond...","customPrompt":"You are a helpful AI assistant for NuxtBeyond, a Nuxt 4 boilerplate for building AI-powered SaaS applications."},"security":{"allowedDomains":["localhost","nuxtbeyond.com"]}}',
  'boilerplate',
  'active',
  NULL,
  NULL,
  NULL,
  unixepoch(),
  unixepoch()
);
--> statement-breakpoint
-- Link demo admin to project
INSERT INTO projectMembers (id, projectId, userId, role, joinedAt)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  unixepoch()
);
--> statement-breakpoint
-- Link demo member to project
INSERT INTO projectMembers (id, projectId, userId, role, joinedAt)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  'member',
  unixepoch()
);
