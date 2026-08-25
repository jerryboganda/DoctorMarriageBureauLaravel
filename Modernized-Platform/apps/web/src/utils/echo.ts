import Pusher from 'pusher-js';
import { ASSET_BASE_URL } from './apiOrigin';

let echoInstance: any = null;

if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
    
    const pusherKey = 
        (typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_PUSHER_APP_KEY || import.meta.env?.VITE_PUSHER_APP_KEY)) || '';
    const pusherHost = 
        (typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_PUSHER_HOST || import.meta.env?.VITE_PUSHER_HOST)) || undefined;
    const pusherPort = 
        (typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_PUSHER_PORT || import.meta.env?.VITE_PUSHER_PORT)) || undefined;
    const pusherScheme = 
        (typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_PUSHER_SCHEME || import.meta.env?.VITE_PUSHER_SCHEME)) || 'https';
    const cluster = 
        (typeof import.meta !== 'undefined' && (import.meta.env?.PUBLIC_PUSHER_APP_CLUSTER || import.meta.env?.VITE_PUSHER_APP_CLUSTER)) || 'mt1';

    if (pusherKey) {
        try {
            echoInstance = {
                pusher: new Pusher(pusherKey, {
                    wsHost: pusherHost,
                    wsPort: pusherPort ? parseInt(pusherPort, 10) : 6001,
                    wssPort: pusherPort ? parseInt(pusherPort, 10) : 443,
                    forceTLS: pusherScheme === 'https',
                    enabledTransports: ['ws', 'wss'],
                    cluster: cluster,
                    authEndpoint: `${ASSET_BASE_URL}/broadcasting/auth`,
                    auth: {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
                        },
                    },
                }),
                private(channelName: string) {
                    return this.pusher.subscribe(`private-${channelName}`);
                },
                channel(channelName: string) {
                    return this.pusher.subscribe(channelName);
                },
                leave(channelName: string) {
                    this.pusher.unsubscribe(channelName);
                },
            };
        } catch (err) {
            console.warn('[Echo] Pusher init error:', err);
        }
    }
}

export const echo = echoInstance;
export default echo;
