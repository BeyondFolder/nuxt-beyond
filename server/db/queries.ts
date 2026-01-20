import type { SQL } from 'drizzle-orm';
import { eq, and, gte, count } from 'drizzle-orm';
import type { db } from 'hub:db';
import * as tables from './schema';
import type { ProjectConfiguration } from '#shared/types';

type Database = typeof db;
type Project = typeof tables.projects.$inferSelect;

export async function getProject(db: Database, projectId: string) {
  const result = await db
    .select({ project: tables.projects })
    .from(tables.projects)
    .where(eq(tables.projects.id, projectId))
    .limit(1);

  return result?.[0]?.project;
}

export async function getUserWithProject(db: Database, email: string, projectId?: string) {
  const filters: SQL[] = [eq(tables.users.email, email)];

  if (projectId) {
    filters.push(eq(tables.projects.id, projectId));
  }

  return db
    .select({
      user: tables.users,
      project: tables.projects,
      role: tables.projectMembers.role,
    })
    .from(tables.users)
    .leftJoin(tables.projectMembers, eq(tables.users.id, tables.projectMembers.userId))
    .leftJoin(tables.projects, eq(tables.projectMembers.projectId, tables.projects.id))
    .where(and(...filters))
    .limit(1);
}

export async function getUserProjects(db: Database, userEmail: string) {
  return db
    .select({
      project: tables.projects,
      role: tables.projectMembers.role,
    })
    .from(tables.users)
    .innerJoin(tables.projectMembers, eq(tables.users.id, tables.projectMembers.userId))
    .innerJoin(tables.projects, eq(tables.projectMembers.projectId, tables.projects.id))
    .where(eq(tables.users.email, userEmail));
}

export async function getUserProjectRole(db: Database, userId: string, projectId: string) {
  const result = await db
    .select({
      role: tables.projectMembers.role,
    })
    .from(tables.projectMembers)
    .where(and(eq(tables.projectMembers.userId, userId), eq(tables.projectMembers.projectId, projectId)))
    .limit(1);

  return result?.[0]?.role;
}

export async function getUserProjectWithRole(db: Database, userId: string, projectId: string) {
  const result = await db
    .select({
      project: tables.projects,
      role: tables.projectMembers.role,
    })
    .from(tables.projects)
    .innerJoin(tables.projectMembers, eq(tables.projects.id, tables.projectMembers.projectId))
    .where(and(eq(tables.projectMembers.userId, userId), eq(tables.projects.id, projectId)))
    .limit(1);

  return result?.[0];
}

export async function updateProjectFileCount(db: Database, project: Project, fileCount?: number) {
  const currentConfig = (project?.configuration as ProjectConfiguration) || {};
  const updatedConfig: ProjectConfiguration = {
    ...currentConfig,
    ...(fileCount !== undefined ? { fileCount } : {}),
    filesUpdatedAt: new Date(),
  };

  await db
    .update(tables.projects)
    .set({
      configuration: updatedConfig,
      updatedAt: new Date(),
    })
    .where(eq(tables.projects.id, project.id));
}

export async function getRepliesThisMonth(db: Database, projectId: string) {
  const firstDayOfCurrentMonth = new Date();
  firstDayOfCurrentMonth.setDate(1);
  firstDayOfCurrentMonth.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: count() })
    .from(tables.messages)
    .innerJoin(tables.chats, eq(tables.messages.chatId, tables.chats.id))
    .where(
      and(
        eq(tables.chats.projectId, projectId),
        eq(tables.messages.role, 'assistant'),
        gte(tables.messages.createdAt, firstDayOfCurrentMonth)
      )
    );

  return result[0]?.count || 0;
}
