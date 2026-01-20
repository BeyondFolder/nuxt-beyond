import { eq, and, gte, count } from 'drizzle-orm';
import { getRepliesThisMonth } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const projectId = session?.projectId;

  if (!projectId) {
    return {
      totalQuestionsThisMonth: 0,
      pendingQuestions: 0,
      chatsThisMonth: 0,
      repliesThisMonth: 0,
    };
  }

  const firstDayOfCurrentMonth = new Date();
  firstDayOfCurrentMonth.setDate(1);
  firstDayOfCurrentMonth.setHours(0, 0, 0, 0);

  const [totalQuestionsThisMonthResult, pendingQuestionsResult, chatsThisMonthResult, repliesThisMonth] = await Promise.all([
    db
      .select({ count: count() })
      .from(tables.questions)
      .where(and(eq(tables.questions.projectId, projectId), gte(tables.questions.createdAt, firstDayOfCurrentMonth))),
    db
      .select({ count: count() })
      .from(tables.questions)
      .where(
        and(
          eq(tables.questions.projectId, projectId),
          eq(tables.questions.status, 'pending'),
          gte(tables.questions.createdAt, firstDayOfCurrentMonth)
        )
      ),
    db
      .select({ count: count() })
      .from(tables.chats)
      .where(and(eq(tables.chats.projectId, projectId), gte(tables.chats.createdAt, firstDayOfCurrentMonth))),
    getRepliesThisMonth(db, projectId),
  ]);

  return {
    totalQuestionsThisMonth: totalQuestionsThisMonthResult[0]?.count || 0,
    pendingQuestions: pendingQuestionsResult[0]?.count || 0,
    chatsThisMonth: chatsThisMonthResult[0]?.count || 0,
    repliesThisMonth,
  };
});
