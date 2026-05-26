export const MINUTES_IN_DAY = 24 * 60;

export const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
    const normalized = Math.max(0, Math.min(minutes, MINUTES_IN_DAY));
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const slotDurationMinutes = (slot) => {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);

    if (start === end) return MINUTES_IN_DAY;
    if (end < start) return MINUTES_IN_DAY - start + end;
    return end - start;
};

export const slotBusyBlocksForDay = (slot, relation = 'same') => {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);

    if (start === end) {
        return relation === 'previous'
            ? [{ start: 0, end }]
            : [{ start, end: MINUTES_IN_DAY }];
    }

    if (end < start) {
        return relation === 'previous'
            ? [{ start: 0, end }]
            : [{ start, end: MINUTES_IN_DAY }];
    }

    return relation === 'previous' ? [] : [{ start, end }];
};

export const slotCarriesIntoNextDay = (slot) => {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    return end <= start;
};
