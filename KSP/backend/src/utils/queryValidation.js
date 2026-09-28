const readQueryString = (value, maxLength = 100) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : null;
};

const readQueryEnum = (value, allowedValues, maxLength = 100) => {
  const text = readQueryString(value, maxLength);
  if (text === undefined || text === null || text === '') return text;
  return allowedValues.includes(text) ? text : null;
};

const readPositiveInteger = (value, defaultValue, maxValue) => {
  if (value === undefined) return defaultValue;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  return Math.min(number, maxValue);
};

const readNonNegativeNumber = (value) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value)) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const readQueryDate = (value) => {
  const text = readQueryString(value, 64);
  if (text === undefined || text === null || text === '') return text;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  readQueryString,
  readQueryEnum,
  readPositiveInteger,
  readNonNegativeNumber,
  readQueryDate,
  escapeRegex,
};