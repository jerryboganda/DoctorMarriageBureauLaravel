import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

// Safe Google Auth configuration
const GOOGLE_CONFIG = {
    androidClientId: '596823386559-8fh0f6alt2g7p38cpl3q3el9fdfitoc0.apps.googleusercontent.com',
    webClientId: '596823386559-q0j2mip4oqono49jihi57b8tqp03a4j3.apps.googleusercontent.com',
};

export function useGoogleAuth() {
    const [response, setResponse] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [authSession, setAuthSession] = useState<any>(null);

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Dynamic imports to prevent crashes
                const AuthSession = await import('expo-auth-session');
                const WebBrowser = await import('expo-web-browser');

                // Complete any pending auth sessions
                WebBrowser.maybeCompleteAuthSession();

                if (mounted) {
                    setAuthSession(AuthSession);
                    setIsReady(true);
                }
            } catch (e) {
                console.warn('Google Auth initialization error:', e);
            }
        };

        initAuth();

        return () => {
            mounted = false;
        };
    }, []);

    const promptAsync = useCallback(async () => {
        if (!authSession || !isReady) {
            console.warn('Google Auth not ready');
            return null;
        }

        try {
            const discovery = {
                authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenEndpoint: 'https://oauth2.googleapis.com/token',
                revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
            };

            const redirectUri = authSession.makeRedirectUri({
                scheme: 'doctorsmarriagebureau',
                path: 'redirect',
            });

            const clientId =
                Platform.OS === 'android'
                    ? GOOGLE_CONFIG.androidClientId
                    : GOOGLE_CONFIG.webClientId;

            const authRequest = new authSession.AuthRequest({
                clientId,
                scopes: ['openid', 'profile', 'email'],
                redirectUri,
                responseType: authSession.ResponseType.Token,
            });

            const result = await authRequest.promptAsync(discovery);

            if (result.type === 'success') {
                setResponse(result);
            }

            return result;
        } catch (e) {
            console.warn('Google Auth prompt error:', e);
            return null;
        }
    }, [authSession, isReady]);

    return {
        request: isReady,
        response,
        promptAsync,
        isReady,
    };
}
