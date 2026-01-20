import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const { name, description } = await readValidatedBody(event, bodySchema.parse);

  const existingProjects = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(tables.projectMembers)
    .where(eq(tables.projectMembers.userId, session.user.id))
    .get();

  if (existingProjects && existingProjects.count >= 5) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project limit reached. You can create a maximum of 5 projects.',
    });
  }

  const project = await db
    .insert(tables.projects)
    .values({
      name,
      description: description ? sanitizeCustomPrompt(description) : description,
      planName: 'free',
      subscriptionStatus: 'active',
    })
    .returning()
    .get();

  await db.insert(tables.projectMembers).values({
    projectId: project.id,
    userId: session.user.id,
    role: 'admin',
  });

  await replaceUserSession(event, {
    ...session,
    projectId: project.id,
    projectRole: 'admin',
  });

  return {
    ...project,
    role: 'admin',
  };
});
