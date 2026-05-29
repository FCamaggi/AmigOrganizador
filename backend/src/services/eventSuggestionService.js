import { config } from '../config/env.js';

export const fetchEventSuggestions = async ({ dates, categories, city = 'Santiago', limit = 20 }) => {
    if (!config.eventScraperApiUrl || !config.eventScraperApiKey) {
        return {
            available: false,
            days: [],
            totalEvents: 0,
            message: 'Servicio de eventos no configurado'
        };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const response = await fetch(`${config.eventScraperApiUrl.replace(/\/$/, '')}/events/suggestions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.eventScraperApiKey
            },
            body: JSON.stringify({ dates, categories, city, limit }),
            signal: controller.signal
        });

        if (!response.ok) {
            return {
                available: false,
                days: [],
                totalEvents: 0,
                message: 'No pudimos cargar eventos sugeridos por ahora'
            };
        }

        const data = await response.json();
        return {
            available: true,
            days: data.days || [],
            totalEvents: data.totalEvents || 0
        };
    } catch (error) {
        console.warn('Event suggestions service unavailable:', error.message);
        return {
            available: false,
            days: [],
            totalEvents: 0,
            message: 'El servicio de eventos se esta levantando o no esta disponible'
        };
    } finally {
        clearTimeout(timeout);
    }
};
