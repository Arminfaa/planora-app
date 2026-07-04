import { ProjectRole, TaskPriority } from '@prisma/client';

export type SeedUser = {
  email: string;
  name: string;
  password: string;
};

export type SeedChecklistItem = {
  title: string;
  isDone: boolean;
};

export type SeedComment = {
  authorEmail: string;
  content: string;
};

export type SeedTask = {
  title: string;
  slug: string;
  description?: string;
  columnKey: string;
  priority: TaskPriority;
  assigneeEmails?: string[];
  isCompleted?: boolean;
  dueDateOffsetDays?: number;
  labelNames?: string[];
  checklist?: SeedChecklistItem[];
  comments?: SeedComment[];
};

export type SeedColumn = {
  key: string;
  name: string;
  color: string;
};

export type SeedBoard = {
  name: string;
  slug: string;
  position: number;
  columns: SeedColumn[];
  tasks: SeedTask[];
};

export type SeedChatMessage =
  | {
      type: 'USER';
      authorEmail: string;
      content: string;
      daysAgo: number;
    }
  | {
      type: 'ACTIVITY';
      authorEmail: string;
      activityType: string;
      activityData: Record<string, unknown>;
      daysAgo: number;
    };

export type SeedProject = {
  name: string;
  slug: string;
  description: string;
  members: { email: string; role: ProjectRole }[];
  labels: { name: string; color: string }[];
  boards: SeedBoard[];
  chat: SeedChatMessage[];
};

export const SEED_USERS: SeedUser[] = [
  { email: 'arminfaa@gmail.com', name: 'Armin Fa', password: 'password0041' },
  {
    email: 'sara.rahimi@gmail.com',
    name: 'Sara Rahimi',
    password: 'Sara2024!',
  },
  {
    email: 'reza.karimi@gmail.com',
    name: 'Reza Karimi',
    password: 'Reza2024!',
  },
  {
    email: 'maryam.hosseini@gmail.com',
    name: 'Maryam Hosseini',
    password: 'Maryam2024!',
  },
  { email: 'ali.moradi@gmail.com', name: 'Ali Moradi', password: 'Ali2024!' },
  {
    email: 'neda.azizi@gmail.com',
    name: 'Neda Azizi',
    password: 'Neda2024!',
  },
  {
    email: 'parsa.nouri@gmail.com',
    name: 'Parsa Nouri',
    password: 'Parsa2024!',
  },
];

const KANBAN_COLUMNS: SeedColumn[] = [
  { key: 'todo', name: 'To Do', color: '#6B7280' },
  { key: 'inprogress', name: 'In Progress', color: '#3B82F6' },
  { key: 'review', name: 'Review', color: '#F59E0B' },
  { key: 'done', name: 'Done', color: '#10B981' },
];

const SPRINT_COLUMNS: SeedColumn[] = [
  { key: 'backlog', name: 'Backlog', color: '#9CA3AF' },
  { key: 'todo', name: 'To Do', color: '#6B7280' },
  { key: 'inprogress', name: 'In Progress', color: '#3B82F6' },
  { key: 'review', name: 'Review', color: '#F59E0B' },
  { key: 'done', name: 'Done', color: '#10B981' },
];

export const SEED_PROJECTS: SeedProject[] = [
  {
    name: 'ShopWave Mobile App',
    slug: 'shopwave-mobile',
    description:
      'Cross-platform e-commerce app with product catalog, cart, and secure checkout for ShopWave retail brand.',
    members: [
      { email: 'arminfaa@gmail.com', role: ProjectRole.OWNER },
      { email: 'neda.azizi@gmail.com', role: ProjectRole.ADMIN },
      { email: 'maryam.hosseini@gmail.com', role: ProjectRole.MEMBER },
      { email: 'reza.karimi@gmail.com', role: ProjectRole.MEMBER },
      { email: 'sara.rahimi@gmail.com', role: ProjectRole.MEMBER },
      { email: 'ali.moradi@gmail.com', role: ProjectRole.MEMBER },
    ],
    labels: [
      { name: 'Bug', color: '#EF4444' },
      { name: 'Feature', color: '#8B5CF6' },
      { name: 'UI/UX', color: '#EC4899' },
      { name: 'Backend', color: '#06B6D4' },
      { name: 'Release', color: '#10B981' },
    ],
    boards: [
      {
        name: 'Sprint 12',
        slug: 'sprint-12',
        position: 0,
        columns: SPRINT_COLUMNS,
        tasks: [
          {
            title: 'Implement product search with filters',
            slug: 'implement-product-search-with-filters',
            description:
              'Add category, price range, and brand filters to the search screen.',
            columnKey: 'inprogress',
            priority: TaskPriority.HIGH,
            assigneeEmails: [
              'maryam.hosseini@gmail.com',
              'reza.karimi@gmail.com',
            ],
            labelNames: ['Feature', 'Backend'],
            dueDateOffsetDays: 3,
            checklist: [
              { title: 'Design filter UI mockups', isDone: true },
              { title: 'Build API query params', isDone: true },
              { title: 'Wire up mobile filter sheet', isDone: false },
              { title: 'Add empty-state handling', isDone: false },
            ],
            comments: [
              {
                authorEmail: 'neda.azizi@gmail.com',
                content:
                  'Please include sort by popularity as a stretch goal if time allows.',
              },
              {
                authorEmail: 'reza.karimi@gmail.com',
                content:
                  'API endpoint is ready on staging — use /products/search.',
              },
            ],
          },
          {
            title: 'Fix cart total rounding on iOS',
            slug: 'fix-cart-total-rounding-on-ios',
            description:
              'Cart shows 99.999 instead of 100.00 for some currencies.',
            columnKey: 'review',
            priority: TaskPriority.URGENT,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            labelNames: ['Bug'],
            isCompleted: false,
            dueDateOffsetDays: 1,
            checklist: [
              { title: 'Reproduce on iPhone 15', isDone: true },
              { title: 'Fix decimal formatting', isDone: true },
              { title: 'QA sign-off on Android', isDone: false },
            ],
          },
          {
            title: 'Push notification for order status',
            slug: 'push-notification-for-order-status',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['reza.karimi@gmail.com'],
            labelNames: ['Feature', 'Backend'],
            dueDateOffsetDays: 10,
          },
          {
            title: 'Redesign checkout progress indicator',
            slug: 'redesign-checkout-progress-indicator',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['sara.rahimi@gmail.com'],
            labelNames: ['UI/UX'],
            dueDateOffsetDays: 7,
            checklist: [
              { title: 'Audit current 3-step flow', isDone: false },
              { title: 'Create Figma variants', isDone: false },
            ],
          },
          {
            title: 'Set up Firebase Analytics events',
            slug: 'set-up-firebase-analytics-events',
            columnKey: 'done',
            priority: TaskPriority.LOW,
            assigneeEmails: ['ali.moradi@gmail.com'],
            isCompleted: true,
            labelNames: ['Release'],
            checklist: [
              { title: 'Define event naming convention', isDone: true },
              { title: 'Track add_to_cart and purchase', isDone: true },
              { title: 'Verify in Firebase console', isDone: true },
            ],
          },
          {
            title: 'Optimize product image loading',
            slug: 'optimize-product-image-loading',
            columnKey: 'done',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            isCompleted: true,
            labelNames: ['Feature'],
          },
          {
            title: 'Write E2E tests for guest checkout',
            slug: 'write-e2e-tests-for-guest-checkout',
            columnKey: 'inprogress',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['ali.moradi@gmail.com'],
            labelNames: ['Release'],
            dueDateOffsetDays: 5,
            comments: [
              {
                authorEmail: 'ali.moradi@gmail.com',
                content:
                  'Detox suite is flaky on CI — investigating simulator timeouts.',
              },
            ],
          },
          {
            title: 'Add Apple Pay integration',
            slug: 'add-apple-pay-integration',
            columnKey: 'backlog',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['reza.karimi@gmail.com'],
            labelNames: ['Feature', 'Backend'],
            dueDateOffsetDays: 21,
          },
        ],
      },
      {
        name: 'Bug Triage',
        slug: 'bug-triage',
        position: 1,
        columns: KANBAN_COLUMNS,
        tasks: [
          {
            title: 'Crash on opening wishlist offline',
            slug: 'crash-on-opening-wishlist-offline',
            columnKey: 'inprogress',
            priority: TaskPriority.URGENT,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            labelNames: ['Bug'],
            dueDateOffsetDays: 2,
          },
          {
            title: 'Wrong currency symbol in profile',
            slug: 'wrong-currency-symbol-in-profile',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['reza.karimi@gmail.com'],
            labelNames: ['Bug'],
          },
          {
            title: 'Keyboard covers coupon input field',
            slug: 'keyboard-covers-coupon-input-field',
            columnKey: 'done',
            priority: TaskPriority.LOW,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            isCompleted: true,
            labelNames: ['Bug', 'UI/UX'],
          },
        ],
      },
    ],
    chat: [
      {
        type: 'USER',
        authorEmail: 'neda.azizi@gmail.com',
        content:
          'Team — Sprint 12 goal is search + checkout polish. Daily standup stays at 10:00.',
        daysAgo: 14,
      },
      {
        type: 'ACTIVITY',
        authorEmail: 'arminfaa@gmail.com',
        activityType: 'member.joined',
        activityData: {
          memberName: 'Ali Moradi',
          memberId: 'placeholder',
        },
        daysAgo: 13,
      },
      {
        type: 'USER',
        authorEmail: 'reza.karimi@gmail.com',
        content:
          'Search API is deployed to staging. Swagger link is in the wiki.',
        daysAgo: 5,
      },
      {
        type: 'ACTIVITY',
        authorEmail: 'maryam.hosseini@gmail.com',
        activityType: 'task.moved',
        activityData: {
          taskTitle: 'Fix cart total rounding on iOS',
          fromColumn: 'In Progress',
          toColumn: 'Review',
        },
        daysAgo: 2,
      },
      {
        type: 'USER',
        authorEmail: 'sara.rahimi@gmail.com',
        content: 'Checkout redesign drafts are in Figma — folder "Sprint 12".',
        daysAgo: 1,
      },
      {
        type: 'USER',
        authorEmail: 'arminfaa@gmail.com',
        content:
          'Great progress this week. Let us ship search by Friday if possible.',
        daysAgo: 0,
      },
    ],
  },
  {
    name: 'Brand Refresh 2026',
    slug: 'brand-refresh-2026',
    description:
      'Complete redesign of corporate website, marketing pages, and design system for the 2026 rebrand.',
    members: [
      { email: 'arminfaa@gmail.com', role: ProjectRole.OWNER },
      { email: 'sara.rahimi@gmail.com', role: ProjectRole.ADMIN },
      { email: 'maryam.hosseini@gmail.com', role: ProjectRole.MEMBER },
      { email: 'parsa.nouri@gmail.com', role: ProjectRole.MEMBER },
    ],
    labels: [
      { name: 'Design', color: '#EC4899' },
      { name: 'Content', color: '#F59E0B' },
      { name: 'Dev', color: '#3B82F6' },
      { name: 'SEO', color: '#10B981' },
    ],
    boards: [
      {
        name: 'Design',
        slug: 'design',
        position: 0,
        columns: KANBAN_COLUMNS,
        tasks: [
          {
            title: 'Define color palette and typography scale',
            slug: 'define-color-palette-and-typography-scale',
            columnKey: 'done',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['sara.rahimi@gmail.com'],
            isCompleted: true,
            labelNames: ['Design'],
            checklist: [
              { title: 'Primary and secondary colors', isDone: true },
              { title: 'Heading and body type scale', isDone: true },
              { title: 'Accessibility contrast check', isDone: true },
            ],
          },
          {
            title: 'Homepage hero section concepts',
            slug: 'homepage-hero-section-concepts',
            columnKey: 'review',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['sara.rahimi@gmail.com'],
            labelNames: ['Design'],
            dueDateOffsetDays: 4,
            comments: [
              {
                authorEmail: 'arminfaa@gmail.com',
                content:
                  'Concept B feels more aligned with the new brand direction.',
              },
            ],
          },
          {
            title: 'Icon set for product categories',
            slug: 'icon-set-for-product-categories',
            columnKey: 'inprogress',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['sara.rahimi@gmail.com'],
            labelNames: ['Design'],
          },
          {
            title: 'Mobile navigation patterns',
            slug: 'mobile-navigation-patterns',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['sara.rahimi@gmail.com'],
            labelNames: ['Design'],
            dueDateOffsetDays: 8,
          },
        ],
      },
      {
        name: 'Development',
        slug: 'development',
        position: 1,
        columns: KANBAN_COLUMNS,
        tasks: [
          {
            title: 'Set up Next.js 15 marketing site repo',
            slug: 'set-up-nextjs-15-marketing-site-repo',
            columnKey: 'done',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            isCompleted: true,
            labelNames: ['Dev'],
          },
          {
            title: 'Build reusable hero and CTA components',
            slug: 'build-reusable-hero-and-cta-components',
            columnKey: 'inprogress',
            priority: TaskPriority.HIGH,
            assigneeEmails: [
              'maryam.hosseini@gmail.com',
              'parsa.nouri@gmail.com',
            ],
            labelNames: ['Dev'],
            dueDateOffsetDays: 6,
            checklist: [
              { title: 'Hero with image and video variants', isDone: true },
              { title: 'Primary and secondary CTA buttons', isDone: false },
              { title: 'Storybook documentation', isDone: false },
            ],
          },
          {
            title: 'Integrate CMS for blog posts',
            slug: 'integrate-cms-for-blog-posts',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['Dev', 'Content'],
            dueDateOffsetDays: 14,
          },
          {
            title: 'Implement page metadata and Open Graph tags',
            slug: 'implement-page-metadata-and-open-graph-tags',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['Dev', 'SEO'],
            dueDateOffsetDays: 12,
          },
          {
            title: 'Lighthouse performance audit',
            slug: 'lighthouse-performance-audit',
            columnKey: 'todo',
            priority: TaskPriority.LOW,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            labelNames: ['SEO'],
            dueDateOffsetDays: 20,
          },
        ],
      },
      {
        name: 'Content',
        slug: 'content',
        position: 2,
        columns: KANBAN_COLUMNS,
        tasks: [
          {
            title: 'Rewrite About Us page copy',
            slug: 'rewrite-about-us-page-copy',
            columnKey: 'review',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['Content'],
            comments: [
              {
                authorEmail: 'sara.rahimi@gmail.com',
                content:
                  'Tone is good — shorten the second paragraph slightly.',
              },
            ],
          },
          {
            title: 'Case studies for top 3 clients',
            slug: 'case-studies-for-top-3-clients',
            columnKey: 'inprogress',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['Content'],
            dueDateOffsetDays: 9,
            checklist: [
              { title: 'Interview client A', isDone: true },
              { title: 'Draft case study B', isDone: false },
              { title: 'Legal review for client C', isDone: false },
            ],
          },
          {
            title: 'FAQ page for pricing plans',
            slug: 'faq-page-for-pricing-plans',
            columnKey: 'todo',
            priority: TaskPriority.LOW,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['Content'],
          },
        ],
      },
    ],
    chat: [
      {
        type: 'USER',
        authorEmail: 'sara.rahimi@gmail.com',
        content:
          'Design system v1 is ready for dev handoff — check the Figma library.',
        daysAgo: 10,
      },
      {
        type: 'ACTIVITY',
        authorEmail: 'maryam.hosseini@gmail.com',
        activityType: 'board.created',
        activityData: { boardName: 'Content' },
        daysAgo: 8,
      },
      {
        type: 'USER',
        authorEmail: 'parsa.nouri@gmail.com',
        content: 'I need final hero copy before building the animated variant.',
        daysAgo: 3,
      },
      {
        type: 'USER',
        authorEmail: 'arminfaa@gmail.com',
        content:
          'Launch target is still March 15 — keep me posted on blockers.',
        daysAgo: 1,
      },
    ],
  },
  {
    name: 'PeopleHub HR Platform',
    slug: 'peoplehub-hr',
    description:
      'Internal HR portal for leave requests, org chart, onboarding checklists, and employee directory.',
    members: [
      { email: 'arminfaa@gmail.com', role: ProjectRole.OWNER },
      { email: 'reza.karimi@gmail.com', role: ProjectRole.ADMIN },
      { email: 'neda.azizi@gmail.com', role: ProjectRole.MEMBER },
      { email: 'ali.moradi@gmail.com', role: ProjectRole.MEMBER },
    ],
    labels: [
      { name: 'HR', color: '#8B5CF6' },
      { name: 'Compliance', color: '#EF4444' },
      { name: 'Infra', color: '#6B7280' },
    ],
    boards: [
      {
        name: 'Q2 Roadmap',
        slug: 'q2-roadmap',
        position: 0,
        columns: KANBAN_COLUMNS,
        tasks: [
          {
            title: 'Leave request approval workflow',
            slug: 'leave-request-approval-workflow',
            columnKey: 'inprogress',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['reza.karimi@gmail.com'],
            labelNames: ['HR'],
            dueDateOffsetDays: 7,
            checklist: [
              { title: 'Manager approval step', isDone: true },
              { title: 'HR override for edge cases', isDone: false },
              { title: 'Email notifications', isDone: false },
            ],
          },
          {
            title: 'Org chart visualization',
            slug: 'org-chart-visualization',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['neda.azizi@gmail.com'],
            labelNames: ['HR'],
            dueDateOffsetDays: 18,
          },
          {
            title: 'Export payroll summary CSV',
            slug: 'export-payroll-summary-csv',
            columnKey: 'todo',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['reza.karimi@gmail.com'],
            labelNames: ['Compliance'],
            dueDateOffsetDays: 11,
          },
          {
            title: 'SSO with company Google Workspace',
            slug: 'sso-with-company-google-workspace',
            columnKey: 'done',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['reza.karimi@gmail.com'],
            isCompleted: true,
            labelNames: ['Infra'],
          },
          {
            title: 'Role-based access for HR admins',
            slug: 'role-based-access-for-hr-admins',
            columnKey: 'review',
            priority: TaskPriority.URGENT,
            assigneeEmails: ['reza.karimi@gmail.com', 'ali.moradi@gmail.com'],
            labelNames: ['Compliance'],
            dueDateOffsetDays: 2,
            comments: [
              {
                authorEmail: 'ali.moradi@gmail.com',
                content:
                  'Tested 12 permission scenarios — two edge cases logged as bugs.',
              },
            ],
          },
        ],
      },
      {
        name: 'Employee Onboarding',
        slug: 'employee-onboarding',
        position: 1,
        columns: KANBAN_COLUMNS,
        tasks: [
          {
            title: 'Welcome email template',
            slug: 'welcome-email-template',
            columnKey: 'done',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['neda.azizi@gmail.com'],
            isCompleted: true,
            labelNames: ['HR'],
          },
          {
            title: 'IT equipment checklist for new hires',
            slug: 'it-equipment-checklist-for-new-hires',
            columnKey: 'inprogress',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['neda.azizi@gmail.com'],
            labelNames: ['HR'],
            checklist: [
              { title: 'Laptop request form', isDone: true },
              { title: 'Monitor and accessories list', isDone: true },
              { title: 'Slack and email provisioning', isDone: false },
            ],
          },
          {
            title: 'First-week buddy assignment flow',
            slug: 'first-week-buddy-assignment-flow',
            columnKey: 'todo',
            priority: TaskPriority.LOW,
            assigneeEmails: ['neda.azizi@gmail.com'],
            labelNames: ['HR'],
          },
        ],
      },
    ],
    chat: [
      {
        type: 'USER',
        authorEmail: 'neda.azizi@gmail.com',
        content:
          'HR team wants leave balances visible on the dashboard — added to Q2.',
        daysAgo: 12,
      },
      {
        type: 'ACTIVITY',
        authorEmail: 'reza.karimi@gmail.com',
        activityType: 'task.created',
        activityData: { taskTitle: 'Role-based access for HR admins' },
        daysAgo: 6,
      },
      {
        type: 'USER',
        authorEmail: 'reza.karimi@gmail.com',
        content:
          'SSO is live on staging. Please test with your @company accounts.',
        daysAgo: 4,
      },
      {
        type: 'USER',
        authorEmail: 'arminfaa@gmail.com',
        content:
          'Compliance review meeting is Tuesday — prepare the access matrix.',
        daysAgo: 0,
      },
    ],
  },
  {
    name: 'SupportDesk Pro',
    slug: 'supportdesk-pro',
    description:
      'Customer support ticketing system with SLA tracking, knowledge base, and team inbox.',
    members: [
      { email: 'arminfaa@gmail.com', role: ProjectRole.OWNER },
      { email: 'ali.moradi@gmail.com', role: ProjectRole.ADMIN },
      { email: 'parsa.nouri@gmail.com', role: ProjectRole.MEMBER },
      { email: 'maryam.hosseini@gmail.com', role: ProjectRole.MEMBER },
    ],
    labels: [
      { name: 'Ticket', color: '#3B82F6' },
      { name: 'KB Article', color: '#10B981' },
      { name: 'SLA', color: '#EF4444' },
      { name: 'Integration', color: '#8B5CF6' },
    ],
    boards: [
      {
        name: 'Tickets Pipeline',
        slug: 'tickets-pipeline',
        position: 0,
        columns: [
          { key: 'new', name: 'New', color: '#6B7280' },
          { key: 'open', name: 'Open', color: '#3B82F6' },
          { key: 'waiting', name: 'Waiting on Customer', color: '#F59E0B' },
          { key: 'resolved', name: 'Resolved', color: '#10B981' },
        ],
        tasks: [
          {
            title: 'Ticket #1842 — Login loop after password reset',
            slug: 'ticket-1842-login-loop-after-password-reset',
            columnKey: 'open',
            priority: TaskPriority.URGENT,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            labelNames: ['Ticket', 'SLA'],
            dueDateOffsetDays: 1,
            comments: [
              {
                authorEmail: 'parsa.nouri@gmail.com',
                content:
                  'Customer confirmed issue on Chrome and Safari mobile.',
              },
            ],
          },
          {
            title: 'Ticket #1839 — Invoice PDF not downloading',
            slug: 'ticket-1839-invoice-pdf-not-downloading',
            columnKey: 'waiting',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['Ticket'],
            dueDateOffsetDays: 3,
          },
          {
            title: 'Ticket #1831 — Feature request: bulk export',
            slug: 'ticket-1831-feature-request-bulk-export',
            columnKey: 'new',
            priority: TaskPriority.LOW,
            assigneeEmails: ['ali.moradi@gmail.com'],
            labelNames: ['Ticket'],
          },
          {
            title: 'Ticket #1825 — SLA breach report for March',
            slug: 'ticket-1825-sla-breach-report-for-march',
            columnKey: 'resolved',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['ali.moradi@gmail.com'],
            isCompleted: true,
            labelNames: ['SLA'],
          },
          {
            title: 'Automate ticket routing by product line',
            slug: 'automate-ticket-routing-by-product-line',
            columnKey: 'open',
            priority: TaskPriority.HIGH,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            labelNames: ['Integration'],
            dueDateOffsetDays: 8,
            checklist: [
              { title: 'Map product tags to teams', isDone: true },
              { title: 'Build routing rules engine', isDone: false },
              { title: 'Fallback to general queue', isDone: false },
            ],
          },
        ],
      },
      {
        name: 'Knowledge Base',
        slug: 'knowledge-base',
        position: 1,
        columns: KANBAN_COLUMNS,
        tasks: [
          {
            title: 'Article: How to reset your password',
            slug: 'article-how-to-reset-your-password',
            columnKey: 'done',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            isCompleted: true,
            labelNames: ['KB Article'],
          },
          {
            title: 'Article: Understanding SLA tiers',
            slug: 'article-understanding-sla-tiers',
            columnKey: 'review',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['KB Article', 'SLA'],
          },
          {
            title: 'Article: Integrating webhooks',
            slug: 'article-integrating-webhooks',
            columnKey: 'inprogress',
            priority: TaskPriority.LOW,
            assigneeEmails: ['parsa.nouri@gmail.com'],
            labelNames: ['KB Article', 'Integration'],
            checklist: [
              { title: 'Outline sections', isDone: true },
              { title: 'Code samples for Node and Python', isDone: false },
              { title: 'Technical review', isDone: false },
            ],
          },
          {
            title: 'Search improvements for help center',
            slug: 'search-improvements-for-help-center',
            columnKey: 'todo',
            priority: TaskPriority.MEDIUM,
            assigneeEmails: ['maryam.hosseini@gmail.com'],
            labelNames: ['Integration'],
            dueDateOffsetDays: 15,
          },
        ],
      },
    ],
    chat: [
      {
        type: 'USER',
        authorEmail: 'ali.moradi@gmail.com',
        content: 'SLA breaches dropped 18% last month — nice work everyone.',
        daysAgo: 7,
      },
      {
        type: 'USER',
        authorEmail: 'maryam.hosseini@gmail.com',
        content: 'Working on ticket #1842 — might need backend logs from Reza.',
        daysAgo: 2,
      },
      {
        type: 'ACTIVITY',
        authorEmail: 'parsa.nouri@gmail.com',
        activityType: 'task.updated',
        activityData: {
          taskTitle: 'Article: How to reset your password',
          changes: [
            { field: 'status', label: 'Status', from: 'Review', to: 'Done' },
          ],
        },
        daysAgo: 1,
      },
      {
        type: 'USER',
        authorEmail: 'arminfaa@gmail.com',
        content:
          'Let us prioritize #1842 today — enterprise customer affected.',
        daysAgo: 0,
      },
    ],
  },
];
