/**
 * Prepend Vite's configured base URL to a public asset path.
 * Necessary for GitHub Pages (or any sub-path) deployments where
 * the site is served from a subdirectory rather than the root.
 *
 * Vite rewrites imported assets automatically, but string literals
 * used as `src` / `backgroundImage` values are not touched.
 */
export function assetUrl(path) {
  if (!path) return path;
  const base = import.meta.env.BASE_URL ?? '/';
  return base.endsWith('/')
    ? base + path.replace(/^\//, '')
    : base + path;
}
