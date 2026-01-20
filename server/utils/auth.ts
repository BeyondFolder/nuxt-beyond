import type { H3Event } from 'h3';

export async function loginUser(
  event: H3Event,
  user: User,
  provider: 'credentials' | 'google',
  project?: Project,
  projectRole?: 'admin' | 'member',
  providerId?: string
) {
  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      provider,
      providerId,
    },
    projectId: project?.id,
    projectRole,
    loggedInAt: Date.now(),
  });
}
