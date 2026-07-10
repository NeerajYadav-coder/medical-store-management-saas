/**
 * Get the full absolute URL for an image path
 * @param {string} path 
 * @returns {string|null}
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
  // Remove /api/v1 from baseUrl
  const rootUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
  return `${rootUrl}${path}`;
};
