import { z } from 'zod';
import { hashPasswordWorker, verifyPasswordWorker } from '~~/server/utils/password';

const bodySchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    });
  }

  const db = useDrizzle();
  const { currentPassword, newPassword } = await readValidatedBody(event, bodySchema.parse);

  // Get user from db
  const user = await db.select().from(tables.users).where(eq(tables.users.email, session.user.email)).get();

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found',
    });
  }

  if (user.provider !== 'credentials' || !user.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password change is not available for social login accounts',
    });
  }

  const isValidPassword = await verifyPasswordWorker(user.password, currentPassword);

  if (!isValidPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Current password is incorrect',
    });
  }

  const hashedNewPassword = await hashPasswordWorker(newPassword);

  // Update password in db
  await db
    .update(tables.users)
    .set({
      password: hashedNewPassword,
    })
    .where(eq(tables.users.id, user.id));

  return setResponseStatus(event, 204); // No Content status code
});
