import { config } from '../config/env.js';

const chunk = (items, size) => {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};

const getResponseDetail = async (response) => {
    const text = await response.text();
    if (!text) return response.statusText;

    try {
        const payload = JSON.parse(text);
        return payload.detail || payload.message || payload.error || text.slice(0, 240);
    } catch {
        return text.slice(0, 240);
    }
};

const normalizeDates = (dates = []) =>
    Array.from(new Set(dates.filter(Boolean))).sort();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const shouldRetryScraperResponse = (result) =>
    !result.available && (
        result.timeout ||
        [502, 503, 504].includes(result.statusCode)
    );

const fetchEventSuggestionsBatchOnce = async ({ dates, categories, city, limit }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.eventScraperTimeoutMs);

    try {
        const response = await fetch(`${config.eventScraperApiUrl.replace(/\/$/, '')}/events/suggestions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.eventScraperApiKey
            },
            body: JSON.stringify({ dates, categories, ...(city ? { city } : {}), limit }),
            signal: controller.signal
        });

        if (!response.ok) {
            const detail = await getResponseDetail(response);
            const message = `Servicio de eventos respondio ${response.status}${detail ? `: ${detail}` : ''}`;
            console.warn(message);
            return {
                available: false,
                days: [],
                totalEvents: 0,
                statusCode: response.status,
                message
            };
        }

        const data = await response.json();
        return {
            available: true,
            days: data.days || [],
            totalEvents: data.totalEvents || 0
        };
    } catch (error) {
        const isTimeout = error.name === 'AbortError';
        const message = isTimeout
            ? `El servicio de eventos demoro mas de ${config.eventScraperTimeoutMs}ms en responder`
            : `El servicio de eventos no esta disponible: ${error.message}`;
        console.warn('Event suggestions service unavailable:', message);
        return {
            available: false,
            days: [],
            totalEvents: 0,
            timeout: isTimeout,
            message
        };
    } finally {
        clearTimeout(timeout);
    }
};

const fetchEventSuggestionsBatch = async (params) => {
    const maxAttempts = 2;
    let lastResult;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        lastResult = await fetchEventSuggestionsBatchOnce(params);

        if (!shouldRetryScraperResponse(lastResult) || attempt === maxAttempts) {
            return lastResult;
        }

        console.warn(
            `Retrying event scraper batch after ${lastResult.statusCode || 'timeout'} ` +
            `(attempt ${attempt + 1}/${maxAttempts})`
        );
        await sleep(2500);
    }

    return lastResult;
};

export const fetchEventSuggestions = async ({ dates, categories, city, limit = 20 }) => {
    if (!config.eventScraperApiUrl || !config.eventScraperApiKey) {
        return {
            available: false,
            days: [],
            totalEvents: 0,
            message: 'Servicio de eventos no configurado'
        };
    }

    const uniqueDates = normalizeDates(dates);

    if (uniqueDates.length === 0) {
        return {
            available: true,
            days: [],
            totalEvents: 0
        };
    }

    const batchSize = Math.max(1, config.eventScraperBatchSize);
    const batches = chunk(uniqueDates, batchSize);
    const dayEvents = new Map(uniqueDates.map(date => [date, []]));
    const failures = [];
    let successCount = 0;

    for (const batchDates of batches) {
        const result = await fetchEventSuggestionsBatch({
            dates: batchDates,
            categories,
            city,
            limit
        });

        if (!result.available) {
            failures.push(result.message || 'Servicio de eventos no disponible');
            continue;
        }

        successCount += 1;
        for (const day of result.days || []) {
            const existingEvents = dayEvents.get(day.date) || [];
            const seen = new Set(existingEvents.map(event =>
                `${event.source || ''}:${event.externalId || event.ticketUrl || event.name || ''}`
            ));
            for (const event of day.events || []) {
                const key = `${event.source || ''}:${event.externalId || event.ticketUrl || event.name || ''}`;
                if (!seen.has(key)) {
                    existingEvents.push(event);
                    seen.add(key);
                }
            }
            dayEvents.set(day.date, existingEvents);
        }
    }

    if (successCount === 0) {
        return {
            available: false,
            days: [],
            totalEvents: 0,
            message: failures[0] || 'El servicio de eventos se esta levantando o no esta disponible'
        };
    }

    const days = uniqueDates.map(date => ({
        date,
        events: dayEvents.get(date) || []
    }));
    const totalEvents = days.reduce((total, day) => total + day.events.length, 0);

    return {
        available: true,
        days,
        totalEvents,
        message: failures.length > 0
            ? `Algunos lotes de eventos fallaron: ${failures[0]}`
            : undefined
    };
};
