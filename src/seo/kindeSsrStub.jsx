// Stand-in for @kinde-oss/kinde-auth-react used ONLY by the build-time
// pre-render (aliased in vite.config.js for SSR builds). Public pages are
// rendered as a logged-out visitor. Never shipped to browsers.

const noop = () => {};
const noopAsync = async () => null;

const loggedOut = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: noop,
  register: noop,
  logout: noop,
  getToken: noopAsync,
  getAccessToken: noopAsync,
  getIdToken: noopAsync,
  getClaim: noopAsync,
  getPermissions: noopAsync,
  getUserProfile: noopAsync,
};

export const useKindeAuth = () => loggedOut;
export const KindeProvider = ({ children }) => children;
