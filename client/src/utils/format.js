// Shared formatters used across every page — extracted once so each file
// imports instead of redeclaring its own local `currency`/`formatDate`.
export const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '—');
