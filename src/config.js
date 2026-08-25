const LOCAL_API_URL = 'http://localhost:5000';
const PRODUCTION_API_URL = 'https://hointernal-v2-uemw.vercel.app';
const shouldUseLocalApi = process.env.REACT_APP_USE_LOCAL_API === 'true';

export const API_URL =
    process.env.REACT_APP_API_URL ||
    (shouldUseLocalApi ? LOCAL_API_URL : PRODUCTION_API_URL);

export const SOCKET_URL =
    process.env.REACT_APP_SOCKET_URL ||
    API_URL;

const isLocalSocketHost = (() => {
    try {
        const socketHostName = new URL(SOCKET_URL).hostname;
        return socketHostName === 'localhost' || socketHostName === '127.0.0.1';
    } catch (error) {
        return false;
    }
})();

export const SOCKET_NOTIFICATIONS_ENABLED =
    process.env.REACT_APP_ENABLE_SOCKET_NOTIFICATIONS === 'true' ||
    (shouldUseLocalApi && isLocalSocketHost);
