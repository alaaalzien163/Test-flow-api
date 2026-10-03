import { PrismaClient, Role, TaskPriority, TaskStatus } from '@prisma/client';
import { hashPassword } from '../src/common/utils/password.util';

const prisma = new PrismaClient();

const DEMO_PROJECT_NAME = 'TaskFlow Demo Project';

async function upsertUser(
  name: string,
  email: string,
  password: string,
  role: Role,
) {
  const passwordHash = await hashPassword(password);

  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { name, email, role, passwordHash },
  });
}

async function main(): Promise<void> {
  console.log('Seeding database...');

  await upsertUser(
    'Admin User',
    'admin@taskflow.dev',
    'Admin123!',
    Role.ADMIN,
  );

  const manager = await upsertUser(
    'Manager User',
    'manager@taskflow.dev',
    'Manager123!',
    Role.MANAGER,
  );

  const member = await upsertUser(
    'Member User',
    'member@taskflow.dev',
    'Member123!',
    Role.MEMBER,
  );

  // Delete the previous demo project (cascades to tasks and comments) so the
  // seed can be run repeatedly without creating duplicates.
  await prisma.project.deleteMany({ where: { name: DEMO_PROJECT_NAME } });

  const project = await prisma.project.create({
    data: {
      name: DEMO_PROJECT_NAME,
      description: 'Sample project created by the seed script',
      ownerId: manager.id,
    },
  });

  const taskDone = await prisma.task.create({
    data: {
      title: 'Set up the project repository',
      description: 'Initialise Git, install dependencies and configure tooling.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: project.id,
      assigneeId: member.id,
    },
  });

  const taskInProgress = await prisma.task.create({
    data: {
      title: 'Design the database schema',
      description: 'Model users, projects, tasks and comments with Prisma.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      projectId: project.id,
      assigneeId: member.id,
    },
  });

  const taskTodo = await prisma.task.create({
    data: {
      title: 'Write the API documentation',
      description: 'Document endpoints in Swagger and in the README.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      projectId: project.id,
      assigneeId: manager.id,
    },
  });

  await prisma.comment.createMany({
    data: [
      {
        content: 'Repository is ready, moving on to the schema.',
        taskId: taskDone.id,
        authorId: manager.id,
      },
      {
        content: 'Started modelling the Prisma schema.',
        taskId: taskInProgress.id,
        authorId: member.id,
      },
      {
        content: 'Please include request/response examples.',
        taskId: taskTodo.id,
        authorId: manager.id,
      },
    ],
  });

  console.log('Seed completed.');
  console.log('Development credentials:');
  console.log('  ADMIN   admin@taskflow.dev   / Admin123!');
  console.log('  MANAGER manager@taskflow.dev / Manager123!');
  console.log('  MEMBER  member@taskflow.dev  / Member123!');
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
