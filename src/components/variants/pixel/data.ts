export const WAITLIST_HREF = "/waitlist";

/* Photo sets: each rotates through shots that tell the same story */
const p = (name: string, alt: string, position = "50% 25%") => ({ src: `/images/people/${name}.jpg`, alt, position });

export const PHOTOS = {
  buyer: [
    p("buyer-on-sofa", "A buyer browsing listings on her phone at home", "55% 35%"),
    p("buyer-on-sofa-2", "A buyer scrolling property listings on the sofa", "50% 40%"),
    p("buyer-on-phone-3", "A buyer calling about a listing from home", "50% 35%"),
  ],
  brokerages: [
    p("agent-at-home", "A smiling real estate agent outside a home"),
    p("agent-estate", "An agent walking through a new estate", "50% 30%"),
    p("agent-blazer", "A confident agent in an orange blazer", "50% 20%"),
  ],
  developers: [
    p("developer", "A property developer in a suit outside a building"),
    p("developer-2", "A developer in front of residential towers", "50% 25%"),
    p("developer-3", "A developer in a dark suit", "50% 20%"),
  ],
  agencies: [
    p("marketer", "A marketer smiling at her laptop"),
    p("marketer-2", "A marketer reviewing a campaign on her laptop", "50% 35%"),
    p("marketer-3", "A marketer working in a bright office", "50% 35%"),
  ],
  buyers: [
    p("couple", "A happy couple outside their new home", "50% 30%"),
    p("couple-porch", "A couple sitting on the porch of their home", "45% 80%"),
    p("family-sofa", "A family relaxing on the sofa at home", "50% 40%"),
  ],
};

/** Swap in translated alt text (same order as the shots). */
export function withAlts<T extends { alt: string }>(shots: T[], alts: string[]): T[] {
  return shots.map((s, i) => ({ ...s, alt: alts[i] ?? s.alt }));
}
