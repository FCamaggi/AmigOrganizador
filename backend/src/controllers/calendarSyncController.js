import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { encrypt, decrypt } from '../utils/tokenEncryption.js';

const PROVIDERS = new Set(['google', 'microsoft']);
const COLORS = {
    google: '#4285f4',
    microsoft: '#0078d4'
};

const requireProvider = (provider) => {
    if (!PROVIDERS.has(provider)) {
        const error = new Error('Proveedor de calendario invalido');
        error.statusCode = 400;
        throw error;
    }
};

const getBackendBaseUrl = (req) => {
    const forwardedProto = req.get('x-forwarded-proto');
    const protocol = forwardedProto || req.protocol;
    return `${protocol}://${req.get('host')}`;
};

const getRedirectUri = (req, provider) => {
    return `${getBackendBaseUrl(req)}/api/calendar/${provider}/callback`;
};

const createState = (userId, provider) => {
    return jwt.sign(
        { userId, provider },
        config.jwtSecret,
        { expiresIn: '10m' }
    );
};

const verifyState = (state, provider) => {
    const decoded = jwt.verify(state, config.jwtSecret);
    if (decoded.provider !== provider) {
        const error = new Error('State de OAuth invalido');
        error.statusCode = 400;
        throw error;
    }
    return decoded;
};

const jsonFetch = async (url, options = {}) => {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.error_description || data.error?.message || data.message || 'Error de proveedor externo');
        error.statusCode = response.status;
        error.providerResponse = data;
        throw error;
    }

    return data;
};

const ensureConfigured = (provider) => {
    const missing = provider === 'google'
        ? !config.googleClientId || !config.googleClientSecret
        : !config.microsoftClientId || !config.microsoftClientSecret;

    const invalidEncryptionKey = !config.tokenEncryptionKey ||
        Buffer.from(config.tokenEncryptionKey, 'hex').length !== 32;

    if (missing || invalidEncryptionKey) {
        const error = new Error(`${provider} no esta configurado`);
        error.statusCode = 503;
        throw error;
    }
};

const toDateRange = (year, month) => {
    const parsedYear = Number(year);
    const parsedMonth = Number(month);

    if (!parsedYear || !parsedMonth || parsedMonth < 1 || parsedMonth > 12) {
        const error = new Error('year y month son requeridos');
        error.statusCode = 400;
        throw error;
    }

    const start = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(parsedYear, parsedMonth, 1, 0, 0, 0));
    return { start, end };
};

const formatTime = (date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const normalizeEvent = ({ title, startDateTime, endDateTime, color }) => {
    if (!startDateTime || !endDateTime) return null;

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    const crossesMidnight = start.toDateString() !== end.toDateString();
    return {
        date: start.toISOString().slice(0, 10),
        day: start.getDate(),
        title: title || 'Evento importado',
        start: formatTime(start),
        end: crossesMidnight ? '23:59' : formatTime(end),
        color
    };
};

const groupEventsByDay = (events) => {
    const grouped = events.reduce((acc, event) => {
        if (!acc[event.day]) acc[event.day] = [];
        acc[event.day].push(event);
        return acc;
    }, {});

    return Object.entries(grouped).map(([day, dayEvents]) => ({
        day: Number(day),
        date: dayEvents[0].date,
        events: dayEvents
    }));
};

const getUserCalendar = async (userId, provider) => {
    const user = await User.findById(userId);
    const calendar = user?.connectedCalendars?.[provider];
    if (!calendar?.encryptedRefreshToken) {
        const error = new Error(`No hay calendario ${provider} conectado`);
        error.statusCode = 404;
        throw error;
    }
    return calendar;
};

const getGoogleAccessToken = async (refreshToken) => {
    const data = await jsonFetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: config.googleClientId,
            client_secret: config.googleClientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        })
    });

    return data.access_token;
};

const getMicrosoftAccessToken = async (refreshToken) => {
    const data = await jsonFetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: config.microsoftClientId,
            client_secret: config.microsoftClientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            scope: 'offline_access Calendars.Read User.Read'
        })
    });

    return data.access_token;
};

const fetchGoogleEmail = async (accessToken) => {
    const data = await jsonFetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return data.email;
};

const fetchMicrosoftEmail = async (accessToken) => {
    const data = await jsonFetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return data.mail || data.userPrincipalName;
};

const getGoogleEvents = async (userId, year, month) => {
    ensureConfigured('google');
    const { start, end } = toDateRange(year, month);
    const calendar = await getUserCalendar(userId, 'google');
    const accessToken = await getGoogleAccessToken(decrypt(calendar.encryptedRefreshToken));

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', start.toISOString());
    url.searchParams.set('timeMax', end.toISOString());
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    const data = await jsonFetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    return (data.items || [])
        .filter((event) => event.start?.dateTime && event.end?.dateTime)
        .map((event) => normalizeEvent({
            title: event.summary,
            startDateTime: event.start.dateTime,
            endDateTime: event.end.dateTime,
            color: COLORS.google
        }))
        .filter(Boolean);
};

const getMicrosoftEvents = async (userId, year, month) => {
    ensureConfigured('microsoft');
    const { start, end } = toDateRange(year, month);
    const calendar = await getUserCalendar(userId, 'microsoft');
    const accessToken = await getMicrosoftAccessToken(decrypt(calendar.encryptedRefreshToken));

    const url = new URL('https://graph.microsoft.com/v1.0/me/calendarView');
    url.searchParams.set('startDateTime', start.toISOString());
    url.searchParams.set('endDateTime', end.toISOString());
    url.searchParams.set('$orderby', 'start/dateTime');

    const data = await jsonFetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'outlook.timezone="UTC"'
        }
    });

    return (data.value || [])
        .filter((event) => !event.isAllDay && event.start?.dateTime && event.end?.dateTime)
        .map((event) => normalizeEvent({
            title: event.subject,
            startDateTime: `${event.start.dateTime}Z`,
            endDateTime: `${event.end.dateTime}Z`,
            color: COLORS.microsoft
        }))
        .filter(Boolean);
};

const renderCallbackPage = (res, provider, ok, message = '') => {
    res.type('html').send(`<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Calendario ${ok ? 'conectado' : 'no conectado'}</title></head>
<body>
<script>
  const payload = ${JSON.stringify({ type: 'calendar-sync', provider, ok, message })};
  if (window.opener) {
    window.opener.postMessage(payload, ${JSON.stringify(config.frontendUrl)});
  }
  window.close();
</script>
</body>
</html>`);
};

export const getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('connectedCalendars');
        const calendars = user?.connectedCalendars || {};

        res.json({
            success: true,
            data: {
                google: calendars.google?.encryptedRefreshToken ? {
                    connected: true,
                    email: calendars.google.email,
                    connectedAt: calendars.google.connectedAt
                } : { connected: false },
                microsoft: calendars.microsoft?.encryptedRefreshToken ? {
                    connected: true,
                    email: calendars.microsoft.email,
                    connectedAt: calendars.microsoft.connectedAt
                } : { connected: false }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAuthUrl = async (req, res, next) => {
    try {
        const { provider } = req.params;
        requireProvider(provider);
        ensureConfigured(provider);

        const state = createState(req.userId, provider);
        const redirectUri = getRedirectUri(req, provider);
        const url = provider === 'google'
            ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
            : new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');

        if (provider === 'google') {
            url.search = new URLSearchParams({
                client_id: config.googleClientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
                access_type: 'offline',
                prompt: 'consent',
                state
            }).toString();
        } else {
            url.search = new URLSearchParams({
                client_id: config.microsoftClientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                response_mode: 'query',
                scope: 'offline_access Calendars.Read User.Read',
                state
            }).toString();
        }

        res.json({ success: true, data: { url: url.toString() } });
    } catch (error) {
        next(error);
    }
};

export const handleCallback = async (req, res) => {
    const { provider } = req.params;

    try {
        requireProvider(provider);
        ensureConfigured(provider);

        const { code, state } = req.query;
        if (!code || !state) {
            throw new Error('Callback OAuth incompleto');
        }

        const decoded = verifyState(state, provider);
        const redirectUri = getRedirectUri(req, provider);
        const tokenUrl = provider === 'google'
            ? 'https://oauth2.googleapis.com/token'
            : 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const body = provider === 'google'
            ? {
                client_id: config.googleClientId,
                client_secret: config.googleClientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            }
            : {
                client_id: config.microsoftClientId,
                client_secret: config.microsoftClientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                scope: 'offline_access Calendars.Read User.Read'
            };

        const tokens = await jsonFetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(body)
        });

        if (!tokens.refresh_token) {
            throw new Error('El proveedor no envio refresh_token. Intenta reconectar la cuenta.');
        }

        const email = provider === 'google'
            ? await fetchGoogleEmail(tokens.access_token)
            : await fetchMicrosoftEmail(tokens.access_token);

        await User.findByIdAndUpdate(decoded.userId, {
            $set: {
                [`connectedCalendars.${provider}`]: {
                    encryptedRefreshToken: encrypt(tokens.refresh_token),
                    email,
                    connectedAt: new Date()
                }
            }
        });

        renderCallbackPage(res, provider, true);
    } catch (error) {
        console.error('Error OAuth calendar callback:', error);
        renderCallbackPage(res, provider, false, error.message);
    }
};

export const importEvents = async (req, res, next) => {
    try {
        const { provider } = req.params;
        requireProvider(provider);

        const events = provider === 'google'
            ? await getGoogleEvents(req.userId, req.query.year, req.query.month)
            : await getMicrosoftEvents(req.userId, req.query.year, req.query.month);

        res.json({
            success: true,
            data: {
                events,
                grouped: groupEventsByDay(events)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const disconnect = async (req, res, next) => {
    try {
        const { provider } = req.params;
        requireProvider(provider);

        await User.findByIdAndUpdate(req.userId, {
            $unset: { [`connectedCalendars.${provider}`]: '' }
        });

        res.json({
            success: true,
            message: 'Calendario desconectado'
        });
    } catch (error) {
        next(error);
    }
};
