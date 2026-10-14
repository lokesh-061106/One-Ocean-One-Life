import SitemapScreen from './app/_sitemap';

export const REAL_SLUG_SITEMAP_SHIM = 'real-slug-sitemap';

export default SitemapScreen;
export const Sitemap = SitemapScreen;

export function getNavOptions() {
  return {
    title: 'Sitemap',
    presentation: 'modal',
  };
}
