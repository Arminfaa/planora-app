export function replaceProjectSlugInPath(
  pathname: string,
  previousSlug: string,
  nextSlug: string,
): string {
  const from = `/dashboard/projects/${previousSlug}`;
  const to = `/dashboard/projects/${nextSlug}`;

  if (!pathname.startsWith(from)) {
    return `/dashboard/projects/${nextSlug}`;
  }

  return `${to}${pathname.slice(from.length)}`;
}
