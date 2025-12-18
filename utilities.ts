/**
 * Returns "en" or "dis" depending on `bool`
 * 
 * @param bool Boolean value to check
 * @returns "en" if `bool` is true, "dis" if not
 */
export const enOrDis = (bool: boolean): string => bool ? "en" : "dis";

/**
 * Prefixes `what` with a dash if not null
 * 
 * @param what The string / null value to prefix / ignore
 * @returns A dash prefixed to the provided string or an empty string
 */
export const a = (what: string | null): string => what ? "-" + what : '';

export const pick = (fromWhat: any[]): any => fromWhat[Math.floor(Math.random() * fromWhat.length)];