export function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getCurrentDateTimestamp() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function getActiveEvent(nowTs, events = []) {
  return events.find((event) => {
    const startTs = parseDate(event.start);
    const endTs = parseDate(event.end) + 24 * 60 * 60 * 1000 - 1;
    return nowTs >= startTs && nowTs <= endTs;
  });
}
