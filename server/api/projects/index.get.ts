import { getUserProjects } from '~~/server/db/queries';

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const db = useDrizzle();

  const projects = await getUserProjects(db, session.user.email);

  return projects.map(({ project, role }) => ({
    ...project,
    role,
  }));
});
