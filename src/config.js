// Backend address. Set REACT_APP_API_URL in .env.development.local to test against a local backend.
export const API_BASE = (process.env.REACT_APP_API_URL || 'https://apistudents.sainikschoolcadet.com').replace(/\/$/, '');
