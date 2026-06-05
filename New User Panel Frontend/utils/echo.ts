import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

window.Pusher = Pusher;

const pusherHost = import.meta.env.VITE_PUSHER_HOST;
const pusherPort = import.meta.env.VITE_PUSHER_PORT;
const pusherScheme = import.meta.env.VITE_PUSHER_SCHEME || 'https';
const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : '');
const broadcastBase = apiBase.replace(/\/api\/?$/, '');

/**
 * Create Echo instance with DYNAMIC auth headers.
 * The authorizer function reads localStorage.auth_token at subscription time
 * (not at module-load time), so login/logout are always reflected.
 */
export const echo = import.meta.env.VITE_PUSHER_APP_KEY
    ? new Echo({
          broadcaster: 'pusher',
          key: import.meta.env.VITE_PUSHER_APP_KEY,
          wsHost: pusherHost,
          wsPort: pusherPort ? parseInt(pusherPort, 10) : 6001,
          wssPort: pusherPort ? parseInt(pusherPort, 10) : 443,
          forceTLS: pusherScheme === 'https',
          enabledTransports: ['ws', 'wss'],
          disableStats: true,
          cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
          // Custom authorizer: reads token fresh on every channel subscribe
          authorizer: (channel: any, _options: any) => ({
              authorize: (socketId: string, callback: (error: any, data: any) => void) => {
                  const token = localStorage.getItem('auth_token') || '';
                  fetch(`${broadcastBase}/broadcasting/auth`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          Accept: 'application/json',
                          'X-Requested-With': 'XMLHttpRequest',
                          Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                          socket_id: socketId,
                          channel_name: channel.name,
                      }),
                  })
                      .then((response) => {
                          if (!response.ok) throw new Error(`Auth failed: ${response.status}`);
                          return response.json();
                      })
                      .then((data) => callback(null, data))
                      .catch((error) => {
                          console.error('[Echo] Channel auth error:', channel.name, error);
                          callback(error, null);
                      });
              },
          }),
      })
    : null;

if (!import.meta.env.VITE_PUSHER_APP_KEY) {
    console.warn('Pusher/Echo configuration missing. Real-time updates disabled.');
}

export default echo;
