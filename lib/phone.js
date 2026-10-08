export function normalizePhilippineMobileInput(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (
    String(value).trim().startsWith('+63') ||
    (digits.length > 10 && digits.startsWith('63'))
  )
    digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function formatPhilippineMobile(value) {
  const digits = normalizePhilippineMobileInput(value);
  if (!/^9\d{9}$/.test(digits))
    throw new Error(
      'Enter a valid 10-digit mobile number starting with 9 after +63.',
    );
  return `+63${digits}`;
}
