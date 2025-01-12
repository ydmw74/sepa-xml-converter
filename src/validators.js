export function validateIBAN(iban) {
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{12,30}$/.test(iban.replace(/\s/g, ''));
}

export function validateBIC(bic) {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic);
}

export function validateAmount(amount) {
  return !isNaN(amount) && amount > 0 && amount <= 999999999.99;
}

export function validateMandateId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 35;
}

export function validateMandateDate(date) {
  return !isNaN(Date.parse(date));
}
