// Extends app.json. EXPO_BASE_URL lets the website build serve the app from a
// sub-folder (https://zotzilah.github.io/Claude/app); local builds stay at the root.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
