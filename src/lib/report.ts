import { organization } from "@/config/organization";
import type { AnalysisResult } from "@/lib/analyzer/types";

const RISK_WORD = { high: "HIGH RISK", medium: "SUSPICIOUS", low: "NO COMMON WARNING SIGNS" } as const;

/**
 * A plain-text record of the check.
 *
 * Two people need this and neither wants a screenshot: the customer forwarding
 * evidence to the bank or the police, and the relative they ask for a second
 * opinion. Plain text survives both.
 */
export function buildReportText(result: AnalysisResult, message: string): string {
  const lines: string[] = [];
  const rule = "—".repeat(56);

  lines.push(`${organization.name} Message Check — report`);
  lines.push(new Date(result.meta.analyzedAt).toLocaleString());
  lines.push(rule, "");
  lines.push(`VERDICT: ${RISK_WORD[result.risk]}`);
  lines.push(result.headline);
  lines.push("", wrap(result.summary), "");

  if (!result.coverage.supported) lines.push("NOTE", wrap(result.coverage.note ?? ""), "");

  if (result.playbook) {
    lines.push(rule, `KNOWN SCAM PATTERN: ${result.playbook.name}`);
    if (result.playbook.alsoKnownAs) lines.push(`Also called: ${result.playbook.alsoKnownAs}`);
    lines.push("", wrap(result.playbook.description), "", "What usually happens next:");
    for (const move of result.playbook.nextMoves) lines.push(` - ${wrap(move, 3)}`);
    lines.push("");
  }

  lines.push(rule, `WARNING SIGNS (${result.signals.length} of ${result.totalChecks} checks)`, "");
  if (!result.signals.length) lines.push("None of our written checks matched this message.", "");
  for (const signal of result.signals) {
    lines.push(`[${signal.severity.toUpperCase()}] ${signal.title}`);
    lines.push(wrap(signal.explanation, 2));
    for (const span of signal.spans.slice(0, 3)) lines.push(`    > "${span.text.trim()}"`);
    lines.push("");
  }

  if (result.links.length) {
    lines.push(rule, "LINKS FOUND", "");
    for (const link of result.links) {
      lines.push(`  ${link.url}`);
      lines.push(`    opens a site owned by ${link.domain}${link.official ? ` (an official ${organization.name} domain)` : ""}`);
    }
    lines.push("");
  }

  if (result.phoneNumbers.length) {
    lines.push(rule, "NUMBERS FOUND", "");
    for (const phone of result.phoneNumbers) lines.push(`  ${phone.text}`);
    lines.push("");
  }

  lines.push(rule, "HOW TO CHECK SAFELY", "");
  result.steps.forEach((step, i) => {
    lines.push(`${i + 1}. ${step.title}`);
    lines.push(wrap(step.detail, 3), "");
  });

  lines.push(rule, "OFFICIAL CONTACTS", "");
  lines.push(`  Website   ${organization.website}  (type it yourself)`);
  lines.push(`  Phone     ${organization.supportPhone}  (also on the back of your card)`);
  lines.push(`  Report    ${organization.reportEmail}`);
  lines.push("");

  lines.push(rule, "THE MESSAGE THAT WAS CHECKED", "");
  lines.push(message.trim(), "");

  lines.push(rule);
  lines.push(`Checked by ${organization.name} Message Check, engine ${result.meta.engineVersion}.`);
  lines.push("This is guidance, not a guarantee. When in doubt, contact us directly.");

  return lines.join("\n");
}

/** Soft-wraps a paragraph at 72 columns with an optional indent. */
function wrap(text: string, indent = 0): string {
  const pad = " ".repeat(indent);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + word).length > 72) {
      lines.push(pad + line.trimEnd());
      line = "";
    }
    line += `${word} `;
  }
  if (line.trim()) lines.push(pad + line.trimEnd());
  return lines.join("\n");
}

/** The script read aloud. Steps matter more than scores when you're frightened. */
export function buildSpokenText(result: AnalysisResult): string {
  const parts = [result.headline, result.summary];
  if (!result.coverage.supported && result.coverage.note) parts.push(result.coverage.note);
  if (result.playbook) parts.push(`This matches a known pattern: ${result.playbook.name}. ${result.playbook.description}`);
  parts.push("Here is how to check safely.");
  result.steps.forEach((step, i) => parts.push(`Step ${i + 1}. ${step.title}. ${step.detail}`));
  return parts.join(" ");
}
