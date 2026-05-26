import api from './api';

export type CalendarProvider = 'google' | 'microsoft';

export interface ConnectedCalendar {
  connected: boolean;
  email?: string;
  connectedAt?: string;
}

export interface CalendarStatus {
  google: ConnectedCalendar;
  microsoft: ConnectedCalendar;
}

export interface ExternalCalendarEvent {
  date: string;
  day: number;
  title: string;
  start: string;
  end: string;
  color: string;
}

export interface CalendarEventsResponse {
  events: ExternalCalendarEvent[];
  grouped: Array<{
    day: number;
    date: string;
    events: ExternalCalendarEvent[];
  }>;
}

interface CalendarSyncMessage {
  type: 'calendar-sync';
  provider: CalendarProvider;
  ok: boolean;
  message?: string;
}

const waitForPopupMessage = (
  popup: Window | null,
  provider: CalendarProvider
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('No se recibio respuesta del proveedor'));
    }, 120000);

    const verifyConnection = async () => {
      if (settled) return;

      try {
        const response = await api.get('/calendar/status');
        const status = response.data.data as CalendarStatus;
        if (status[provider]?.connected) {
          cleanup();
          resolve();
        }
      } catch {
        // Si la verificacion falla, seguimos esperando el mensaje del callback.
      }
    };

    const handleFocus = () => {
      window.setTimeout(verifyConnection, 700);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        window.setTimeout(verifyConnection, 700);
      }
    };

    const cleanup = () => {
      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    const handleMessage = (event: MessageEvent<CalendarSyncMessage>) => {
      if (
        event.data?.type !== 'calendar-sync' ||
        event.data.provider !== provider
      ) {
        return;
      }

      cleanup();
      if (event.data.ok) {
        resolve();
      } else {
        reject(new Error(event.data.message || 'No se pudo conectar el calendario'));
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (popup) {
      window.setTimeout(verifyConnection, 2000);
    }
  });
};

export const calendarSyncService = {
  async getConnectedCalendars(): Promise<CalendarStatus> {
    const response = await api.get('/calendar/status');
    return response.data.data;
  },

  async getAuthUrl(provider: CalendarProvider): Promise<string> {
    const response = await api.get(`/calendar/${provider}/auth-url`);
    return response.data.data.url;
  },

  async connect(provider: CalendarProvider): Promise<void> {
    const url = await this.getAuthUrl(provider);
    const popup = window.open(
      url,
      `calendar-${provider}`,
      'width=520,height=720,menubar=no,toolbar=no,status=no'
    );

    if (!popup) {
      throw new Error('El navegador bloqueo la ventana de conexion');
    }

    await waitForPopupMessage(popup, provider);
  },

  async importEvents(
    provider: CalendarProvider,
    year: number,
    month: number
  ): Promise<CalendarEventsResponse> {
    const response = await api.get(`/calendar/${provider}/events`, {
      params: { year, month },
    });
    return response.data.data;
  },

  async disconnect(provider: CalendarProvider): Promise<void> {
    await api.delete(`/calendar/${provider}/disconnect`);
  },
};
