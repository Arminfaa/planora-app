const ZOD_MESSAGE_TRANSLATIONS: Record<string, string> = {
  Required: 'الزامی است',
  'Title is required': 'عنوان الزامی است',
  'Name is required': 'نام الزامی است',
  'Comment is required': 'متن نظر الزامی است',
  'Message content is required': 'متن پیام الزامی است',
  'Password is required': 'رمز عبور الزامی است',
  'Current password is required': 'رمز عبور فعلی الزامی است',
  'Please confirm your password': 'لطفاً رمز عبور را تأیید کنید',
  'Invalid email address': 'آدرس ایمیل نامعتبر است',
  'Name must be at least 2 characters': 'نام باید حداقل ۲ کاراکتر باشد',
  'Role name must be at least 2 characters':
    'نام نقش باید حداقل ۲ کاراکتر باشد',
  'Password must be at least 8 characters':
    'رمز عبور باید حداقل ۸ کاراکتر باشد',
  'At least one permission is required': 'حداقل یک مجوز الزامی است',
  'At least one column is required': 'حداقل یک ستون الزامی است',
  'At least one custom role is required': 'حداقل یک نقش سفارشی الزامی است',
  'Passwords do not match': 'رمزهای عبور مطابقت ندارند',
  'Start date must be before or equal to due date':
    'تاریخ شروع باید قبل از یا برابر با تاریخ سررسید باشد',
  'Provide a search query (min 2 chars) or at least one filter':
    'یک عبارت جستجو (حداقل ۲ کاراکتر) یا حداقل یک فیلتر وارد کنید',
  'Expected string, received undefined': 'مقدار متنی الزامی است',
  'Expected string, received null': 'مقدار متنی الزامی است',
  'Expected number, received undefined': 'مقدار عددی الزامی است',
  'Expected number, received null': 'مقدار عددی الزامی است',
  'Invalid input': 'ورودی نامعتبر است',
  'Invalid enum value': 'مقدار انتخاب‌شده نامعتبر است',
  'Invalid date': 'تاریخ نامعتبر است',
  'Invalid uuid': 'شناسه نامعتبر است',
  'Invalid url': 'آدرس URL نامعتبر است',
  'Too small': 'مقدار کوچک‌تر از حد مجاز است',
  'Too big': 'مقدار بزرگ‌تر از حد مجاز است',
};

function translateZodMessage(message: string): string {
  if (ZOD_MESSAGE_TRANSLATIONS[message]) {
    return ZOD_MESSAGE_TRANSLATIONS[message];
  }

  const stringMinMatch = message.match(
    /^String must contain at least (\d+) character\(s\)$/,
  );
  if (stringMinMatch) {
    return `باید حداقل ${stringMinMatch[1]} کاراکتر باشد`;
  }

  const arrayMinMatch = message.match(
    /^Array must contain at least (\d+) element\(s\)$/,
  );
  if (arrayMinMatch) {
    return `باید حداقل ${arrayMinMatch[1]} مورد داشته باشد`;
  }

  const numberMinMatch = message.match(
    /^Number must be greater than or equal to (\d+)$/,
  );
  if (numberMinMatch) {
    return `باید بزرگ‌تر یا مساوی ${numberMinMatch[1]} باشد`;
  }

  const numberMaxMatch = message.match(
    /^Number must be less than or equal to (\d+)$/,
  );
  if (numberMaxMatch) {
    return `باید کوچک‌تر یا مساوی ${numberMaxMatch[1]} باشد`;
  }

  const expectedTypeMatch = message.match(/^Expected (\w+), received (\w+)$/);
  if (expectedTypeMatch) {
    return `انتظار ${expectedTypeMatch[1]} می‌رفت، ${expectedTypeMatch[2]} دریافت شد`;
  }

  return message;
}

export const faMessages: Record<string, string> = {
  // General
  Success: 'موفقیت',
  'Route not found': 'مسیر یافت نشد',
  'Validation failed': 'اعتبارسنجی ناموفق بود',
  'Internal server error': 'خطای داخلی سرور',

  // Task dependencies
  'Dependencies retrieved': 'وابستگی‌ها دریافت شد',
  'Task dependencies retrieved': 'وابستگی‌های کار دریافت شد',
  'Dependency created': 'وابستگی ایجاد شد',
  'Dependency deleted': 'وابستگی حذف شد',
  'Task not found': 'کار یافت نشد',
  'Tasks must belong to the same project': 'کارها باید متعلق به یک پروژه باشند',
  'Both tasks must belong to this project':
    'هر دو کار باید متعلق به این پروژه باشند',
  'This dependency already exists': 'این وابستگی از قبل وجود دارد',
  'This dependency would create a circular chain':
    'این وابستگی یک زنجیرهٔ دایره‌ای ایجاد می‌کند',
  'Dependency not found': 'وابستگی یافت نشد',

  // Notifications
  'Notifications retrieved': 'اعلان‌ها دریافت شد',
  'Unread count retrieved': 'تعداد خوانده‌نشده دریافت شد',
  'Notification marked as read': 'اعلان به‌عنوان خوانده‌شده علامت‌گذاری شد',
  'All notifications marked as read':
    'همهٔ اعلان‌ها به‌عنوان خوانده‌شده علامت‌گذاری شدند',
  'Project notifications marked as read':
    'اعلان‌های پروژه به‌عنوان خوانده‌شده علامت‌گذاری شدند',
  'VAPID public key retrieved': 'کلید عمومی VAPID دریافت شد',
  'Push subscription saved': 'اشتراک push ذخیره شد',
  'Push subscription removed': 'اشتراک push حذف شد',
  'Push status retrieved': 'وضعیت push دریافت شد',
  'Notification preferences retrieved': 'تنظیمات اعلان دریافت شد',
  'Notification preferences updated': 'تنظیمات اعلان به‌روزرسانی شد',
  'Notification not found': 'اعلان یافت نشد',
  'Push notifications are disabled in preferences':
    'اعلان‌های push در تنظیمات غیرفعال هستند',
  'Push subscription not found': 'اشتراک push یافت نشد',

  // Tasks
  'Tasks retrieved': 'کارها دریافت شد',
  'Task created': 'کار ایجاد شد',
  'Task retrieved': 'کار دریافت شد',
  'Task updated': 'کار به‌روزرسانی شد',
  'Tasks updated': 'کارها به‌روزرسانی شدند',
  'Tasks moved': 'کارها جابه‌جا شدند',
  'Task deleted': 'کار حذف شد',

  // Search
  'Search results retrieved': 'نتایج جستجو دریافت شد',
  'Search assignees retrieved': 'مسئولان جستجو دریافت شدند',
  'Search query or filters required': 'عبارت جستجو یا فیلترها الزامی است',

  // Roles
  'Role created': 'نقش ایجاد شد',
  'Role updated': 'نقش به‌روزرسانی شد',
  'Role deleted': 'نقش حذف شد',
  'Permission catalog retrieved': 'فهرست مجوزها دریافت شد',
  'A role with this name already exists': 'نقشی با این نام از قبل وجود دارد',
  'One or more permissions are invalid': 'یک یا چند مجوز نامعتبر است',
  'This project uses default roles':
    'این پروژه از نقش‌های پیش‌فرض استفاده می‌کند',
  'Role not found': 'نقش یافت نشد',

  // Projects
  'Projects retrieved': 'پروژه‌ها دریافت شد',
  'Project retrieved': 'پروژه دریافت شد',
  'Project progress retrieved': 'پیشرفت پروژه دریافت شد',
  'Project gantt retrieved': 'نمودار گانت پروژه دریافت شد',
  'Project created': 'پروژه ایجاد شد',
  'Project updated': 'پروژه به‌روزرسانی شد',
  'Project deleted': 'پروژه حذف شد',
  'Project not found': 'پروژه یافت نشد',
  'You do not have access to this project': 'شما به این پروژه دسترسی ندارید',

  // Project members & invites
  'Project members retrieved': 'اعضای پروژه دریافت شد',
  'Member updated': 'عضو به‌روزرسانی شد',
  'Member removed': 'عضو حذف شد',
  'Pending invites retrieved': 'دعوت‌نامه‌های در انتظار دریافت شد',
  'Invite revoked': 'دعوت‌نامه لغو شد',
  'Invite preview retrieved': 'پیش‌نمایش دعوت‌نامه دریافت شد',
  'Invite accepted': 'دعوت‌نامه پذیرفته شد',
  'A pending invite already exists for this email':
    'یک دعوت‌نامهٔ در انتظار برای این ایمیل از قبل وجود دارد',
  'Invite has already been used': 'این دعوت‌نامه قبلاً استفاده شده است',
  'Invite has expired': 'دعوت‌نامه منقضی شده است',
  'Invite not found': 'دعوت‌نامه یافت نشد',
  'Project owner is already a member': 'مالک پروژه از قبل عضو است',
  'role is required for default role projects':
    'برای پروژه‌های با نقش پیش‌فرض، نقش الزامی است',
  'User is already a member of this project': 'کاربر از قبل عضو این پروژه است',
  'Cannot change the project owner role':
    'نمی‌توان نقش مالک پروژه را تغییر داد',
  'Cannot remove the project owner': 'نمی‌توان مالک پروژه را حذف کرد',
  'Member not found': 'عضو یافت نشد',
  'User not found. Send an invite instead.':
    'کاربر یافت نشد. به‌جای آن دعوت‌نامه ارسال کنید.',
  'You cannot remove yourself from the project':
    'نمی‌توانید خود را از پروژه حذف کنید',

  // Group messages
  'Group messages retrieved': 'پیام‌های گروه دریافت شد',
  'Message sent': 'پیام ارسال شد',
  'File uploaded': 'فایل بارگذاری شد',
  'Message updated': 'پیام به‌روزرسانی شد',
  'Message deleted': 'پیام حذف شد',
  'Activity messages cannot be deleted': 'پیام‌های فعالیت قابل حذف نیستند',
  'Activity messages cannot be edited': 'پیام‌های فعالیت قابل ویرایش نیستند',
  'Edit window has expired': 'مهلت ویرایش به پایان رسیده است',
  'Failed to create message': 'ایجاد پیام ناموفق بود',
  'Message content is required': 'متن پیام الزامی است',
  'Message not found': 'پیام یافت نشد',
  'You cannot delete this message': 'نمی‌توانید این پیام را حذف کنید',
  'You can only edit your own messages':
    'فقط می‌توانید پیام‌های خود را ویرایش کنید',

  // Labels
  'Labels retrieved': 'برچسب‌ها دریافت شد',
  'Label created': 'برچسب ایجاد شد',
  'Label updated': 'برچسب به‌روزرسانی شد',
  'Label deleted': 'برچسب حذف شد',
  'Label assigned': 'برچسب اختصاص داده شد',
  'Label removed': 'برچسب برداشته شد',
  'A label with this name already exists': 'برچسبی با این نام از قبل وجود دارد',
  'Label is already assigned to this task':
    'این برچسب از قبل به این کار اختصاص داده شده است',
  'Label not found': 'برچسب یافت نشد',

  // Attachments
  'Attachment deleted': 'پیوست حذف شد',
  'Attachments retrieved': 'پیوست‌ها دریافت شد',
  'Attachment uploaded': 'پیوست بارگذاری شد',
  'Attachment not found': 'پیوست یافت نشد',

  // Auth
  'Authentication required': 'احراز هویت الزامی است',
  'Avatar removed': 'آواتار حذف شد',
  'Avatar updated': 'آواتار به‌روزرسانی شد',
  'Logged out': 'خروج انجام شد',
  'Login successful': 'ورود موفقیت‌آمیز بود',
  'Password updated': 'رمز عبور به‌روزرسانی شد',
  'Password has been reset': 'رمز عبور بازنشانی شد',
  'If an account exists for that email, a reset link has been sent':
    'اگر حسابی با این ایمیل وجود داشته باشد، لینک بازنشانی ارسال شده است',
  'Profile retrieved': 'پروفایل دریافت شد',
  'Profile updated': 'پروفایل به‌روزرسانی شد',
  'Refresh token required': 'توکن تازه‌سازی الزامی است',
  'Socket token retrieved': 'توکن سوکت دریافت شد',
  'Token refreshed': 'توکن تازه‌سازی شد',
  'Registration successful': 'ثبت‌نام موفقیت‌آمیز بود',
  'Email already registered': 'این ایمیل قبلاً ثبت شده است',
  'Invite is invalid or expired': 'دعوت‌نامه نامعتبر یا منقضی شده است',
  'Email must match the invite': 'ایمیل باید با دعوت‌نامه مطابقت داشته باشد',
  'Invalid email or password': 'ایمیل یا رمز عبور نامعتبر است',
  'Invalid or expired refresh token': 'توکن تازه‌سازی نامعتبر یا منقضی شده است',
  'Invalid or expired reset token': 'لینک بازنشانی نامعتبر یا منقضی شده است',
  'Reset token is required': 'توکن بازنشانی الزامی است',
  'Email service is not configured': 'سرویس ایمیل پیکربندی نشده است',
  'Failed to send password reset email': 'ارسال ایمیل بازنشانی رمز ناموفق بود',
  'Email domain is not verified yet. Verify the domain in Resend, then try again.':
    'دامنه ایمیل هنوز در Resend تأیید نشده است. بعد از Verify دوباره تلاش کنید.',
  'User not found': 'کاربر یافت نشد',
  'Current password is incorrect': 'رمز عبور فعلی نادرست است',

  // Files
  'Image file is required': 'فایل تصویر الزامی است',
  'Only image files are allowed': 'فقط فایل‌های تصویری مجاز هستند',
  'File is required': 'فایل الزامی است',
  'File exceeds maximum allowed size': 'حجم فایل از حداکثر مجاز بیشتر است',
  'File type is not allowed': 'نوع فایل مجاز نیست',

  // Boards
  'Board background removed': 'پس‌زمینهٔ برد حذف شد',
  'Board background uploaded': 'پس‌زمینهٔ برد بارگذاری شد',
  'Board created': 'برد ایجاد شد',
  'Board deleted': 'برد حذف شد',
  'Board retrieved': 'برد دریافت شد',
  'Boards retrieved': 'بردها دریافت شد',
  'Board updated': 'برد به‌روزرسانی شد',
  'Board not found': 'برد یافت نشد',

  // Checklists
  'Checklist item created': 'مورد چک‌لیست ایجاد شد',
  'Checklist item deleted': 'مورد چک‌لیست حذف شد',
  'Checklist item updated': 'مورد چک‌لیست به‌روزرسانی شد',
  'Checklist retrieved': 'چک‌لیست دریافت شد',
  'Checklist item not found': 'مورد چک‌لیست یافت نشد',

  // Columns
  'Column created': 'ستون ایجاد شد',
  'Column deleted': 'ستون حذف شد',
  'Columns reordered': 'ترتیب ستون‌ها تغییر کرد',
  'Column updated': 'ستون به‌روزرسانی شد',
  'Column not found': 'ستون یافت نشد',
  'Assignee must be a project member': 'مسئول باید عضو پروژه باشد',
  'Invalid column for this board': 'ستون برای این برد نامعتبر است',
  'Invalid column order': 'ترتیب ستون نامعتبر است',

  // Comments
  'Comment created': 'نظر ایجاد شد',
  'Comment deleted': 'نظر حذف شد',
  'Comments retrieved': 'نظرات دریافت شد',
  'Comment updated': 'نظر به‌روزرسانی شد',
  'Comment not found': 'نظر یافت نشد',
  'You cannot delete this comment': 'نمی‌توانید این نظر را حذف کنید',
  'You cannot edit this comment': 'نمی‌توانید این نظر را ویرایش کنید',

  // Notification templates — task
  'notification.task.created.title': 'کار جدید در {boardName}',
  'notification.task.created.body': '{actorName} کار {taskTitle} را ایجاد کرد',
  'notification.task.updated.title': 'به‌روزرسانی کار در {boardName}',
  'notification.task.updated.body':
    '{actorName} کار {taskTitle} را به‌روزرسانی کرد',
  'notification.task.moved.title': 'جابه‌جایی کار در {boardName}',
  'notification.task.moved.body': '{actorName} کار {taskTitle} را جابه‌جا کرد',
  'notification.task.moved.fromTo.body':
    '{actorName} کار {taskTitle} را از «{fromColumnName}» به «{toColumnName}» منتقل کرد',
  'notification.task.moved.to.body':
    '{actorName} کار {taskTitle} را به «{toColumnName}» منتقل کرد',
  'notification.task.deleted.title': 'حذف کار در {boardName}',
  'notification.task.deleted.body': '{actorName} کار {taskTitle} را حذف کرد',
  'notification.task.default.title': 'به‌روزرسانی کار در {boardName}',
  'notification.task.default.body': '{actorName} کار {taskTitle} را تغییر داد',

  // Notification templates — group
  'notification.group.created.title': 'پیام گروهی جدید · {projectName}',
  'notification.group.created.body': '{authorName}: {preview}',
  'notification.group.updated.title': 'به‌روزرسانی پیام گروهی · {projectName}',
  'notification.group.updated.body': '{authorName} یک پیام گروهی را ویرایش کرد',
  'notification.group.deleted.title': 'حذف پیام گروهی · {projectName}',
  'notification.group.deleted.body': '{authorName} یک پیام گروهی را حذف کرد',

  // Notification fallbacks
  'notification.fallback.someone': 'کسی',
  'notification.fallback.task': 'یک کار',
  'notification.fallback.message': 'پیامی ارسال کرد',
  'notification.fallback.column': 'ستون',
};

export const faPatterns: Array<{
  pattern: RegExp;
  replace: (match: RegExpMatchArray) => string;
}> = [
  {
    pattern: /^Invalid route parameter: (.+)$/,
    replace: (match) => `پارامتر مسیر نامعتبر: ${match[1]}`,
  },
  {
    pattern: /^([^:]+): (.+)$/,
    replace: (match) => `${match[1]}: ${translateZodMessage(match[2])}`,
  },
];
