const API_BASE = process.env.API_BASE || 'http://localhost:10000/api';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234';
const GROUP_ID = process.env.GROUP_ID;
const GROUP_LIMIT = Number(process.env.GROUP_LIMIT || 10);
const MONTH_SPAN = Number(process.env.MONTH_SPAN || 4);
const SEED_DEMO = ['1', 'true', 'yes', 'si'].includes(String(process.env.SEED_DEMO || '').toLowerCase());

const toMonthTarget = (offset) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
    return {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    };
};

const request = async (path, { method = 'GET', token, body } = {}) => {
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        });
    } catch (error) {
        throw new Error(
            `No pudimos conectar con ${API_BASE}. Levanta el backend primero ` +
            `o usa API_BASE=https://tu-backend.onrender.com/api. Detalle: ${error.message}`
        );
    }

    const text = await response.text();
    let payload = {};
    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        payload = { raw: text };
    }

    if (!response.ok) {
        const message = payload.message || payload.raw || response.statusText;
        throw new Error(`${method} ${path} -> ${response.status}: ${message}`);
    }

    return payload;
};

const assert = (condition, message, failures) => {
    if (!condition) {
        failures.push(message);
    }
};

const eventSummary = (days) => days.reduce(
    (summary, day) => ({
        daysWithEvents: summary.daysWithEvents + (day.events?.length ? 1 : 0),
        rawEvents: summary.rawEvents + (day.rawEventsCount || 0),
        visibleEvents: summary.visibleEvents + (day.events?.length || 0),
        unknownTimeEvents: summary.unknownTimeEvents + (day.unknownTimeEventsCount || 0)
    }),
    { daysWithEvents: 0, rawEvents: 0, visibleEvents: 0, unknownTimeEvents: 0 }
);

const validateSuggestionShape = ({ groupName, monthLabel, variantName, data, failures }) => {
    assert(Array.isArray(data.days), `${groupName} ${monthLabel} ${variantName}: days no es array`, failures);
    assert(typeof data.totalEvents === 'number', `${groupName} ${monthLabel} ${variantName}: falta totalEvents`, failures);
    assert(typeof data.rawEventsCount === 'number', `${groupName} ${monthLabel} ${variantName}: falta rawEventsCount`, failures);

    for (const day of data.days || []) {
        assert(typeof day.date === 'string', `${groupName} ${monthLabel} ${variantName}: day.date invalido`, failures);
        assert(Array.isArray(day.windows), `${groupName} ${monthLabel} ${variantName}: day.windows no es array`, failures);
        assert(Array.isArray(day.events), `${groupName} ${monthLabel} ${variantName}: day.events no es array`, failures);

        for (const event of day.events || []) {
            assert(event.name, `${groupName} ${monthLabel} ${variantName}: evento sin name`, failures);
            assert(event.source, `${groupName} ${monthLabel} ${variantName}: evento sin source`, failures);
            assert(
                Array.isArray(event.matchingWindows) && event.matchingWindows.length > 0,
                `${groupName} ${monthLabel} ${variantName}: evento ${event.name} sin matchingWindows`,
                failures
            );
            assert(
                ['matched', 'unknown-time', 'outside-window'].includes(event.timeMatchStatus),
                `${groupName} ${monthLabel} ${variantName}: timeMatchStatus invalido en ${event.name}`,
                failures
            );
        }
    }
};

const main = async () => {
    const failures = [];
    const warnings = [];
    const rows = [];
    const cleanupGroupIds = [];

    console.log(`API_BASE=${API_BASE}`);
    console.log(`ADMIN_USER=${ADMIN_USER}`);
    console.log(`SEED_DEMO=${SEED_DEMO ? 'on' : 'off'}`);

    const login = await request('/auth/login', {
        method: 'POST',
        body: {
            emailOrUsername: ADMIN_USER,
            password: ADMIN_PASSWORD
        }
    });

    const token = login.token;
    assert(Boolean(token), 'Login no devolvio token', failures);

    let groupsPayload = await request('/groups', { token });
    let groups = (groupsPayload.data || [])
        .filter(group => !GROUP_ID || group._id === GROUP_ID)
        .slice(0, GROUP_LIMIT);

    if (SEED_DEMO) {
        const demoName = `Smoke eventos ${new Date().toISOString().slice(11, 19)}`;
        const created = await request('/groups', {
            method: 'POST',
            token,
            body: {
                name: demoName,
                description: 'Grupo temporal creado por eventSuggestionsSmokeTest',
                isPrivate: false
            }
        });
        cleanupGroupIds.push(created.data._id);

        await request(`/groups/${created.data._id}/availability-settings`, {
            method: 'PATCH',
            token,
            body: {
                usefulStart: '12:00',
                usefulEnd: '23:59',
                minimumBlockMinutes: 120,
                alternativeThreshold: 80
            }
        });

        groups = [created.data];
    }

    assert(groups.length > 0, GROUP_ID
        ? `No se encontro GROUP_ID=${GROUP_ID} para admin`
        : 'Admin no tiene grupos para probar. Usa SEED_DEMO=1 para crear un grupo temporal.',
        failures);

    const monthTargets = Array.from({ length: MONTH_SPAN }, (_, index) => toMonthTarget(index));
    let testableMonths = 0;
    let monthsWithRawEvents = 0;
    let monthsWithVisibleEvents = 0;
    let unavailableResponses = 0;

    for (const group of groups) {
        for (const target of monthTargets) {
            const availabilityPayload = await request(
                `/availability/group/${group._id}?month=${target.month}&year=${target.year}`,
                { token }
            );
            const availability = availabilityPayload.data;
            const recommendations = availability?.recommendations || [];

            if (recommendations.length === 0) {
                rows.push({
                    group: group.name,
                    month: target.label,
                    recommendations: 0,
                    variant: 'skip',
                    rawEvents: 0,
                    visibleEvents: 0,
                    note: 'sin ventanas utiles'
                });
                continue;
            }

            testableMonths += 1;

            const variants = [
                {
                    name: 'default',
                    query: 'includeAlternatives=true&includeUnknownTime=false&limit=100'
                },
                {
                    name: 'unknown-time',
                    query: 'includeAlternatives=true&includeUnknownTime=true&limit=100'
                },
                {
                    name: 'perfect-only',
                    query: 'includeAlternatives=false&includeUnknownTime=false&limit=100'
                }
            ];

            for (const variant of variants) {
                const suggestionPayload = await request(
                    `/groups/${group._id}/event-suggestions?month=${target.label}&${variant.query}`,
                    { token }
                );
                const data = suggestionPayload.data;
                validateSuggestionShape({
                    groupName: group.name,
                    monthLabel: target.label,
                    variantName: variant.name,
                    data,
                    failures
                });

                if (data.available === false) {
                    unavailableResponses += 1;
                    failures.push(
                        `${group.name} ${target.label} ${variant.name}: servicio de eventos no disponible (${data.message || 'sin mensaje'})`
                    );
                }

                const summary = eventSummary(data.days || []);
                if (variant.name === 'default' && summary.rawEvents > 0) {
                    monthsWithRawEvents += 1;
                    assert(
                        summary.visibleEvents > 0,
                        `${group.name} ${target.label}: default tiene rawEvents=${summary.rawEvents} pero visibleEvents=0`,
                        failures
                    );
                }
                if (variant.name === 'default' && summary.visibleEvents > 0) {
                    monthsWithVisibleEvents += 1;
                }

                rows.push({
                    group: group.name,
                    month: target.label,
                    recommendations: recommendations.length,
                    variant: variant.name,
                    rawEvents: summary.rawEvents,
                    visibleEvents: summary.visibleEvents,
                    unknownTimeEvents: summary.unknownTimeEvents,
                    daysWithEvents: summary.daysWithEvents,
                    note: data.message || ''
                });
            }
        }
    }

    if (testableMonths === 0) {
        failures.push('No hubo ningun grupo/mes con ventanas utiles; el test no pudo validar eventos.');
    }

    if (monthsWithRawEvents === 0 && unavailableResponses === 0) {
        failures.push('No se encontraron eventos crudos en los meses probados. Revisa scraper/API o sube MONTH_SPAN.');
    }

    if (monthsWithRawEvents > 0 && monthsWithVisibleEvents === 0) {
        failures.push('Hubo eventos crudos, pero ningun escenario default mostro eventos visibles.');
    }

    console.table(rows);

    if (warnings.length > 0) {
        console.warn('\nWarnings:');
        warnings.forEach(warning => console.warn(`- ${warning}`));
    }

    for (const groupId of cleanupGroupIds) {
        try {
            await request(`/groups/${groupId}`, { method: 'DELETE', token });
            console.log(`Cleanup: deleted demo group ${groupId}`);
        } catch (error) {
            warnings.push(`No se pudo borrar grupo demo ${groupId}: ${error.message}`);
        }
    }

    if (failures.length > 0) {
        console.error('\nFailures:');
        failures.forEach(failure => console.error(`- ${failure}`));
        process.exit(1);
    }

    console.log('\nOK: event suggestions smoke test passed.');
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});
