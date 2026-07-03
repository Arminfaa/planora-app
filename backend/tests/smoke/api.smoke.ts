/**
 * API smoke tests — run against a live backend (default http://localhost:5000/api/v1).
 * Usage: npm run test:smoke -w backend
 */

const API_URL = process.env.API_URL ?? 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@example.com';
const MEMBER_EMAIL = process.env.SMOKE_MEMBER_EMAIL ?? 'member@example.com';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'password123';

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiError {
  success: false;
  message: string;
  errors: string[];
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

let passed = 0;
let failed = 0;

function logPass(name: string) {
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function logFail(name: string, detail: string) {
  failed += 1;
  console.error(`  ✗ ${name}`);
  console.error(`    ${detail}`);
}

function assert(condition: boolean, name: string, detail: string) {
  if (condition) logPass(name);
  else logFail(name, detail);
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<{ status: number; body: ApiResponse<T> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const body = (await response.json()) as ApiResponse<T>;
  return { status: response.status, body };
}

async function login(email: string): Promise<string> {
  const { status, body } = await request<{
    user: { id: string };
    token: string;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: PASSWORD }),
  });

  if (status !== 200 || !body.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }

  return body.data.token;
}

async function run() {
  console.log(`\nAPI smoke tests → ${API_URL}\n`);

  // ── Health ──────────────────────────────────────────────
  console.log('Health');
  const health = await request<{
    status: string;
    database: string;
  }>('/health');

  assert(
    health.status === 200,
    'GET /health returns 200',
    `status ${health.status}`,
  );
  assert(
    health.body.success && health.body.data.status === 'ok',
    'Health status is ok',
    JSON.stringify(health.body),
  );
  assert(
    health.body.success && health.body.data.database === 'connected',
    'Database is connected',
    JSON.stringify(health.body),
  );

  // ── Auth ────────────────────────────────────────────────
  console.log('\nAuth');
  const adminToken = await login(ADMIN_EMAIL);
  logPass('Admin login');

  const memberToken = await login(MEMBER_EMAIL);
  logPass('Member login');

  const me = await request<{ email: string }>('/auth/me', {
    token: adminToken,
  });
  assert(
    me.status === 200 && me.body.success && me.body.data.email === ADMIN_EMAIL,
    'GET /auth/me returns admin profile',
    JSON.stringify(me.body),
  );

  const unauthorized = await request('/projects');
  assert(
    unauthorized.status === 401,
    'Protected route returns 401 without token',
    `status ${unauthorized.status}`,
  );

  const badLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: 'wrong-password' }),
  });
  assert(
    badLogin.status === 401,
    'Invalid login returns 401',
    `status ${badLogin.status}`,
  );

  // ── Projects ──────────────────────────────────────────
  console.log('\nProjects');
  const projects = await request<{
    items: Array<{ id: string; name: string }>;
  }>('/projects?page=1&limit=10', { token: adminToken });

  assert(
    projects.status === 200 &&
      projects.body.success &&
      projects.body.data.items.length > 0,
    'GET /projects returns seeded projects',
    JSON.stringify(projects.body),
  );

  const projectId = projects.body.success
    ? (projects.body.data.items.find((p) => p.name === 'Demo Project')?.id ??
      projects.body.data.items[0]?.id ??
      '')
    : '';

  assert(
    projectId !== '',
    'Demo project exists in list',
    JSON.stringify(projects.body),
  );

  const createdProject = await request<{ id: string; name: string }>(
    '/projects',
    {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        name: 'Smoke Test Project',
        description: 'Created by smoke tests',
      }),
    },
  );

  assert(
    createdProject.status === 201 && createdProject.body.success,
    'POST /projects creates project',
    JSON.stringify(createdProject.body),
  );

  const smokeProjectId = createdProject.body.success
    ? createdProject.body.data.id
    : '';

  const updatedProject = await request<{ name: string }>(
    `/projects/${smokeProjectId}`,
    {
      method: 'PATCH',
      token: adminToken,
      body: JSON.stringify({ name: 'Smoke Test Project Updated' }),
    },
  );

  assert(
    updatedProject.status === 200 &&
      updatedProject.body.success &&
      updatedProject.body.data.name === 'Smoke Test Project Updated',
    'PATCH /projects/:id updates project',
    JSON.stringify(updatedProject.body),
  );

  // ── Boards ────────────────────────────────────────────
  console.log('\nBoards');
  const boards = await request<Array<{ id: string; name: string }>>(
    `/projects/${projectId}/boards`,
    { token: adminToken },
  );

  assert(
    boards.status === 200 &&
      boards.body.success &&
      Array.isArray(boards.body.data) &&
      boards.body.data.length > 0,
    'GET /projects/:id/boards returns boards',
    JSON.stringify(boards.body),
  );

  const boardId = boards.body.success ? (boards.body.data[0]?.id ?? '') : '';

  assert(
    boardId !== '',
    'Demo project has at least one board',
    JSON.stringify(boards.body),
  );

  const board = await request<{
    id: string;
    columns: Array<{ id: string; tasks?: Array<{ id: string }> }>;
  }>(`/boards/${boardId}`, { token: adminToken });

  assert(
    board.status === 200 &&
      board.body.success &&
      (board.body.data.columns?.length ?? 0) >= 3,
    'GET /boards/:id returns board with columns',
    JSON.stringify(board.body),
  );

  const columns = board.body.success ? (board.body.data.columns ?? []) : [];
  assert(columns.length > 0, 'Board has columns', JSON.stringify(board.body));

  const sourceColumn = columns[0];
  const targetColumn = columns[1] ?? columns[0];
  const existingTaskId = sourceColumn.tasks?.[0]?.id ?? '';

  assert(sourceColumn?.id, 'Source column exists', JSON.stringify(columns));
  assert(
    existingTaskId !== '',
    'Board has at least one task',
    JSON.stringify(columns),
  );

  // ── Tasks ─────────────────────────────────────────────
  console.log('\nTasks');
  const newTask = await request<{
    id: string;
    title: string;
    columnId: string;
  }>(`/columns/${sourceColumn.id}/tasks`, {
    method: 'POST',
    token: adminToken,
    body: JSON.stringify({
      title: 'Smoke test task',
      description: 'Temporary task for smoke tests',
      priority: 'LOW',
    }),
  });

  assert(
    newTask.status === 201 && newTask.body.success,
    'POST /columns/:id/tasks creates task',
    JSON.stringify(newTask.body),
  );

  const taskId = newTask.body.success ? newTask.body.data.id : '';

  const movedTask = await request<{ columnId: string; position: number }>(
    `/tasks/${taskId}`,
    {
      method: 'PATCH',
      token: adminToken,
      body: JSON.stringify({
        columnId: targetColumn.id,
        position: 0,
      }),
    },
  );

  assert(
    movedTask.status === 200 &&
      movedTask.body.success &&
      movedTask.body.data.columnId === targetColumn.id,
    'PATCH /tasks/:id moves task between columns',
    JSON.stringify(movedTask.body),
  );

  const updatedTask = await request<{ title: string }>(
    `/tasks/${existingTaskId}`,
    {
      method: 'PATCH',
      token: adminToken,
      body: JSON.stringify({ title: 'Set up project repository' }),
    },
  );

  assert(
    updatedTask.status === 200 && updatedTask.body.success,
    'PATCH /tasks/:id updates task fields',
    JSON.stringify(updatedTask.body),
  );

  const deletedTask = await request<null>(`/tasks/${taskId}`, {
    method: 'DELETE',
    token: adminToken,
  });

  assert(
    deletedTask.status === 200 && deletedTask.body.success,
    'DELETE /tasks/:id removes task',
    JSON.stringify(deletedTask.body),
  );

  // ── Search & Filters ──────────────────────────────────
  console.log('\nSearch & Filters');
  const textSearch = await request<{
    tasks: { pagination: { total: number } };
    projects: { pagination: { total: number } };
  }>('/search?q=auth&page=1&limit=5', { token: adminToken });

  assert(
    textSearch.status === 200 &&
      textSearch.body.success &&
      textSearch.body.data.tasks.pagination.total > 0,
    'GET /search?q= finds tasks by text',
    JSON.stringify(textSearch.body),
  );

  const priorityFilter = await request<{
    tasks: { items: Array<{ priority: string }> };
  }>('/search?priority=HIGH&page=1&limit=10', { token: adminToken });

  assert(
    priorityFilter.status === 200 &&
      priorityFilter.body.success &&
      priorityFilter.body.data.tasks.items.every((t) => t.priority === 'HIGH'),
    'GET /search?priority= filters by priority',
    JSON.stringify(priorityFilter.body),
  );

  const boardSearch = await request<{
    tasks: { pagination: { total: number } };
  }>(`/search?q=kanban&boardId=${boardId}&page=1&limit=5`, {
    token: adminToken,
  });

  assert(
    boardSearch.status === 200 && boardSearch.body.success,
    'GET /search scoped to boardId',
    JSON.stringify(boardSearch.body),
  );

  const memberProjects = await request<{ items: unknown[] }>(
    '/projects?page=1&limit=10',
    { token: memberToken },
  );

  assert(
    memberProjects.status === 200 &&
      memberProjects.body.success &&
      memberProjects.body.data.items.length > 0,
    'Member can access shared projects',
    JSON.stringify(memberProjects.body),
  );

  // ── Cleanup ───────────────────────────────────────────
  console.log('\nCleanup');
  const deletedProject = await request<null>(`/projects/${smokeProjectId}`, {
    method: 'DELETE',
    token: adminToken,
  });

  assert(
    deletedProject.status === 200 && deletedProject.body.success,
    'DELETE /projects/:id removes smoke test project',
    JSON.stringify(deletedProject.body),
  );

  // ── Summary ───────────────────────────────────────────
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  console.log(`${'─'.repeat(40)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('\nSmoke tests aborted:', error);
  process.exit(1);
});
