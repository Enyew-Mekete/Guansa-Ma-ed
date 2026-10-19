const EMAIL_ADDRESS_PATTERN =
  /^(?:[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

export function isValidEmailAddress(input: string): boolean {
  const email = input.trim();
  return email.length <= 254 && EMAIL_ADDRESS_PATTERN.test(email);
}
