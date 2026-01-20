import { eq, and } from 'drizzle-orm';
import { blob } from 'hub:blob';

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { id } = getRouterParams(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Image chat ID is required' });
  }

  const db = useDrizzle();

  const chat = await db.query.imageChats.findFirst({
    where: (chat, { eq, and }) => and(eq(chat.id, id), eq(chat.userId, user.id)),
  });

  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Image chat not found' });
  }

  const blobPrefix = `images/${user.id}/${id}/`;
  const blobs = await blob.list({ prefix: blobPrefix });

  for (const b of blobs.blobs) {
    await blob.del(b.pathname);
  }

  await db.delete(tables.imageChats).where(and(eq(tables.imageChats.id, id), eq(tables.imageChats.userId, user.id)));

  return { success: true };
});
