const HEALTH_PHRASES = [
  "injury",
  "injured",
  "chronic pain",
  "sharp pain",
  "back pain",
  "shoulder pain",
  "knee pain",
  "wrist pain",
  "ankle pain",
  "inflammation",
  "strain",
  "sprain",
  "tendinitis",
  "tendonitis",
  "bursitis",
  "sciatica",
  "herniated",
  "torn",
  "fracture",
  "numbness",
  "tingling",
  "medical",
  "doctor",
  "physician",
  "healthcare",
  "consult a",
  "physical therapist",
  "diagnosed",
  "prescription",
  "medication",
  "surgery",
  "surgical",
];

const INJURY_INPUT_KEYWORDS = [
  "injury",
  "injured",
  "hurt",
  "hurts",
  "hurting",
  "pain",
  "torn",
  "sprain",
  "strain",
  "surgery",
  "recovering",
  "rehab",
];

const SUBSTITUTION_KEYWORDS = [
  "instead",
  "swap",
  "replace",
  "alternative",
  "avoid",
  "skip",
  "modify",
  "substitute",
];

function matchesAny(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some((phrase) => {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(lower);
  });
}

/**
 * Returns true if the AI response text contains health/injury/medical
 * language that warrants a disclaimer.
 */
export function requiresHealthDisclaimer(responseText: string): boolean {
  return matchesAny(responseText, HEALTH_PHRASES);
}

/**
 * Returns true when the user asked about an injury AND the AI response
 * contains substitution/routing language — warranting an additional caveat.
 */
export function requiresInjuryRoutingCaveat(
  userInput: string,
  responseText: string
): boolean {
  return (
    matchesAny(userInput, INJURY_INPUT_KEYWORDS) &&
    matchesAny(responseText, SUBSTITUTION_KEYWORDS)
  );
}
