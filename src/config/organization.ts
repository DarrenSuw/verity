/**
 * Organization settings for the deployment.
 *
 * Verity is built to be white-labelled: a bank, fintech or SaaS company runs it
 * for its own customers. Everything the customer is told about "official"
 * channels comes from here, so replace these values with your real ones.
 */
export const organization = {
  /** Name customers know you by. Used in copy and in look-alike detection. */
  name: "Verity",
  /** Words that impostors put in fake domains (e.g. "verity-secure-login.top"). */
  brandKeywords: ["verity"],
  /** Registrable domains you actually own. Links to these are not flagged. */
  officialDomains: ["verity.bank"],
  /** Public website customers should type in themselves. */
  website: "verity.bank",
  /** Official support line printed on cards and statements. */
  supportPhone: "+1 (800) 555-0199",
  /** Where customers should go instead of following a link. */
  appName: "the Verity app",
  /** Where customers can forward suspicious messages. */
  reportEmail: "report@verity.bank",
} as const;

export type Organization = typeof organization;
