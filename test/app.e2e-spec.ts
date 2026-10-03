import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { hashPassword } from './../src/common/utils/password.util';
import { PrismaService } from './../src/prisma/prisma.service';

const PASSWORD = 'Password123!';
const suffix = Date.now();

const adminEmail = `admin.${suffix}@e2e.taskflow.dev`;
const managerEmail = `manager.${suffix}@e2e.taskflow.dev`;
const memberEmail = `member.${suffix}@e2e.taskflow.dev`;

describe('TaskFlow API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  let adminToken: string;
  let managerToken: string;
  let memberToken: string;
  let managerId: string;
  let memberId: string;
  let projectId: string;

  const http = () => request(server);

  const login = async (email: string): Promise<string> => {
    const response = await http()
      .post('/api/v1/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);

    return response.body.accessToken as string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    const passwordHash = await hashPassword(PASSWORD);
    await prisma.user.createMany({
      data: [
        {
          name: 'E2E Admin',
          email: adminEmail,
          passwordHash,
          role: Role.ADMIN,
        },
        {
          name: 'E2E Manager',
          email: managerEmail,
          passwordHash,
          role: Role.MANAGER,
        },
        {
          name: 'E2E Member',
          email: memberEmail,
          passwordHash,
          role: Role.MEMBER,
        },
      ],
    });

    const manager = await prisma.user.findUniqueOrThrow({
      where: { email: managerEmail },
    });
    const member = await prisma.user.findUniqueOrThrow({
      where: { email: memberEmail },
    });

    managerId = manager.id;
    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, managerEmail, memberEmail] } },
    });
    await app.close();
  });

  it('GET /health reports the API and database are up', async () => {
    const response = await http().get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.info.database.status).toBe('up');
  });

  it('registers a new user and never returns the password hash', async () => {
    const email = `register.${suffix}@e2e.taskflow.dev`;

    const response = await http()
      .post('/api/v1/auth/register')
      .send({ name: 'New User', email, password: PASSWORD })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.passwordHash).toBeUndefined();

    await prisma.user.deleteMany({ where: { email } });
  });

  it('logs in valid users and rejects invalid credentials', async () => {
    adminToken = await login(adminEmail);
    managerToken = await login(managerEmail);
    memberToken = await login(memberEmail);

    expect(adminToken).toBeDefined();

    await http()
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects requests without an access token', async () => {
    await http().get('/api/v1/projects').expect(401);
  });

  it('lets a manager create a project', async () => {
    const response = await http()
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'E2E Project', description: 'created by e2e test' })
      .expect(201);

    projectId = response.body.id;
    expect(response.body.ownerId).toBe(managerId);

    await http()
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200);
  });

  it('forbids a member from creating a project', async () => {
    await http()
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Forbidden Project' })
      .expect(403);
  });

  it('lets a manager create a task in their project', async () => {
    const response = await http()
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'E2E Task',
        priority: 'HIGH',
        projectId,
        assigneeId: memberId,
      })
      .expect(201);

    expect(response.body.status).toBe('TODO');
    expect(response.body.priority).toBe('HIGH');
    expect(response.body.assignee.id).toBe(memberId);
  });

  it('rejects unknown fields in the request body', async () => {
    await http()
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Bad Request', unexpectedField: true })
      .expect(400);
  });
});
