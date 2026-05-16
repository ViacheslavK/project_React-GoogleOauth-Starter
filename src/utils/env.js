export function getEnv(key) {
  // For Jest/Node environments
  if (typeof process !== 'undefined' && process.env) {
    // Vite prefixes client variables with VITE_, so we check for that
    return process.env[key] || process.env[`REACT_APP_${key}`];
  }
  return undefined;
}
