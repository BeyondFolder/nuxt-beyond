export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, 'id');

  const db = useDrizzle();
  const project = await validateProject(db, projectId!);

  const { refererDomain } = validateReferer(event);

  validateDomain(project, refererDomain);

  return project;
});
