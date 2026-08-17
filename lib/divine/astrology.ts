export const ASTROLOGY_SIGNS = [
  {
    name: 'Aries',
    glyph: '♈',
    dates: 'Mar 21 — Apr 19',
    element: 'Fire',
    modality: 'Cardinal',
    axis: 'Initiation',
    gift: 'Courage that gives the moment a beginning.',
    tension: 'Speed can become a substitute for direction.',
    headline: 'Act on the part that is already clear.',
    overview:
      'Momentum returns when you stop asking the whole future to approve one honest move. Begin small, but begin without disguise.',
    do: 'Name the first move',
    avoid: 'Winning an old argument',
  },
  {
    name: 'Taurus',
    glyph: '♉',
    dates: 'Apr 20 — May 20',
    element: 'Earth',
    modality: 'Fixed',
    axis: 'Value',
    gift: 'Devotion that turns attention into substance.',
    tension: 'Security can harden into refusal.',
    headline: 'Keep what nourishes you. Release what only looks stable.',
    overview:
      'Your pace is not the problem. The question is whether the thing receiving your patience can still grow.',
    do: 'Return to the body',
    avoid: 'Confusing habit with loyalty',
  },
  {
    name: 'Gemini',
    glyph: '♊',
    dates: 'May 21 — Jun 20',
    element: 'Air',
    modality: 'Mutable',
    axis: 'Exchange',
    gift: 'Curiosity that reveals the missing connection.',
    tension: 'Possibility can scatter before it becomes insight.',
    headline: 'The useful answer is hiding inside a better question.',
    overview:
      'Follow the conversation that changes your language, not the one that merely confirms your position. A new word can open a new route.',
    do: 'Ask once more',
    avoid: 'Explaining past the truth',
  },
  {
    name: 'Cancer',
    glyph: '♋',
    dates: 'Jun 21 — Jul 22',
    element: 'Water',
    modality: 'Cardinal',
    axis: 'Belonging',
    gift: 'Sensitivity that knows what needs protection.',
    tension: 'Protection can close around what needs air.',
    headline: 'Care is strongest when it includes your own limits.',
    overview:
      'You do not need to withdraw your tenderness. Give it a boundary so it can remain generous instead of becoming a quiet debt.',
    do: 'Make one clean boundary',
    avoid: 'Rescuing without being asked',
  },
  {
    name: 'Leo',
    glyph: '♌',
    dates: 'Jul 23 — Aug 22',
    element: 'Fire',
    modality: 'Fixed',
    axis: 'Expression',
    gift: 'Warmth that gives others permission to be visible.',
    tension: 'Recognition can become proof of worth.',
    headline: 'Make the thing before you measure the applause.',
    overview:
      'Attention is unreliable fuel. Let delight, craft, and the desire to offer something true carry the work across the threshold.',
    do: 'Create without previewing',
    avoid: 'Performing certainty',
  },
  {
    name: 'Virgo',
    glyph: '♍',
    dates: 'Aug 23 — Sep 22',
    element: 'Earth',
    modality: 'Mutable',
    axis: 'Discernment',
    gift: 'Precision that makes care practical.',
    tension: 'Improvement can obscure what is already alive.',
    headline: 'Refine the system, not your right to belong in it.',
    overview:
      'One thoughtful correction will help more than a total reinvention. Keep the standard; remove the punishment attached to it.',
    do: 'Finish one useful detail',
    avoid: 'Editing yourself out',
  },
  {
    name: 'Libra',
    glyph: '♎',
    dates: 'Sep 23 — Oct 22',
    element: 'Air',
    modality: 'Cardinal',
    axis: 'Relation',
    gift: 'Perspective that creates room for more than one truth.',
    tension: 'Harmony can delay a necessary decision.',
    headline: 'Peace without honesty is only an intermission.',
    overview:
      'The balance you want will not come from making every side equal. Name what carries more weight and let the scale respond.',
    do: 'State your preference',
    avoid: 'Offering a false maybe',
  },
  {
    name: 'Scorpio',
    glyph: '♏',
    dates: 'Oct 23 — Nov 21',
    element: 'Water',
    modality: 'Fixed',
    axis: 'Depth',
    gift: 'Perception that stays when the surface story breaks.',
    tension: 'Intensity can mistake privacy for power.',
    headline: 'What you name loses its power to haunt the room.',
    overview:
      'A hidden motive is ready to become usable knowledge. Reveal it first to yourself; control is not the same thing as safety.',
    do: 'Tell the private truth',
    avoid: 'Testing someone in silence',
  },
  {
    name: 'Sagittarius',
    glyph: '♐',
    dates: 'Nov 22 — Dec 21',
    element: 'Fire',
    modality: 'Mutable',
    axis: 'Meaning',
    gift: 'Vision that restores scale and possibility.',
    tension: 'Distance can turn into escape.',
    headline: 'A larger horizon still requires a specific road.',
    overview:
      'The idea is worth following, but inspiration alone cannot carry it. Choose the commitment that gives freedom a direction.',
    do: 'Book the next step',
    avoid: 'Promising the entire journey',
  },
  {
    name: 'Capricorn',
    glyph: '♑',
    dates: 'Dec 22 — Jan 19',
    element: 'Earth',
    modality: 'Cardinal',
    axis: 'Structure',
    gift: 'Responsibility that gives ambition a durable form.',
    tension: 'Competence can become emotional camouflage.',
    headline: 'You are allowed to change the goal after mastering the climb.',
    overview:
      'A structure built for an earlier version of you is asking for review. Honor the labor without making it a life sentence.',
    do: 'Redefine success',
    avoid: 'Earning your own rest',
  },
  {
    name: 'Aquarius',
    glyph: '♒',
    dates: 'Jan 20 — Feb 18',
    element: 'Air',
    modality: 'Fixed',
    axis: 'Liberation',
    gift: 'Independence that imagines a different system.',
    tension: 'Distance can impersonate objectivity.',
    headline: 'Your difference is useful when it remains connected.',
    overview:
      'The outsider view reveals what the group cannot see, but insight must return to relationship to make change possible.',
    do: 'Share the unfinished idea',
    avoid: 'Turning feeling into theory',
  },
  {
    name: 'Pisces',
    glyph: '♓',
    dates: 'Feb 19 — Mar 20',
    element: 'Water',
    modality: 'Mutable',
    axis: 'Surrender',
    gift: 'Imagination that senses what has not taken form.',
    tension: 'Openness can dissolve the line between self and atmosphere.',
    headline: 'Not every feeling passing through you belongs to you.',
    overview:
      'Sensitivity becomes guidance after you separate signal from weather. Give the dream a container before asking it for direction.',
    do: 'Protect one quiet hour',
    avoid: 'Absorbing the room',
  },
] as const;

export type AstrologySign = (typeof ASTROLOGY_SIGNS)[number];

export const ASTROLOGY_CHARTS = [
  {
    title: 'The celestial field',
    date: '1715',
    detail: 'An engraved study of planetary orbits and astrological order.',
    src: '/astrology/astrological-charts-1715.webp',
    download: '/astrology/astrological-charts-1715.webp',
    alt: 'A 1715 engraving of astrological and astronomical charts',
  },
  {
    title: 'The twelve signs',
    date: '1750',
    detail: 'John Bevis’s complete atlas of the zodiac constellations.',
    src: '/astrology/zodiac-star-charts-1750.webp',
    download: '/astrology/zodiac-star-charts-1750.webp',
    alt: 'Twelve historical star charts representing the zodiac signs',
  },
  {
    title: 'The zodiac circle',
    date: 'c. 1000',
    detail: 'A medieval astronomy manuscript wheel mapping signs and planets.',
    src: '/astrology/zodiac-circle-medieval.webp',
    download: '/astrology/zodiac-circle-medieval.webp',
    alt: 'A medieval manuscript zodiac circle with planetary symbols',
  },
] as const;

const complementaryElements = new Set([
  'Air:Fire',
  'Fire:Air',
  'Earth:Water',
  'Water:Earth',
]);

export function alignmentFor(firstIndex: number, secondIndex: number) {
  const first = ASTROLOGY_SIGNS[firstIndex];
  const second = ASTROLOGY_SIGNS[secondIndex];
  const sameSign = firstIndex === secondIndex;
  const sameElement = first.element === second.element;
  const complementary = complementaryElements.has(
    `${first.element}:${second.element}`,
  );
  const sameModality = first.modality === second.modality;
  const distance = Math.min(
    Math.abs(firstIndex - secondIndex),
    12 - Math.abs(firstIndex - secondIndex),
  );
  const score = Math.min(
    96,
    51 +
      (sameSign ? 32 : sameElement ? 23 : complementary ? 16 : 5) +
      (sameModality ? 2 : 9) +
      ((distance * 7) % 8),
  );

  const dynamic = sameSign
    ? 'Mirror'
    : sameElement
      ? 'Fluency'
      : complementary
        ? 'Exchange'
        : 'Friction';
  const headline = sameSign
    ? 'You recognize the instinct before it is spoken.'
    : sameElement
      ? 'Your energies understand one another’s native language.'
      : complementary
        ? 'Difference becomes fuel when neither side tries to lead alone.'
        : 'The misread is also the invitation: translate before reacting.';
  const communication =
    first.element === 'Air' || second.element === 'Air'
      ? 'Meaning moves quickly. Slow the exchange enough for feeling to stay present.'
      : first.element === 'Water' || second.element === 'Water'
        ? 'Subtext speaks first. Make the implicit request explicit.'
        : 'Trust grows through observable choices more than explanation.';
  const rhythm = sameModality
    ? `Two ${first.modality.toLowerCase()} signs can agree on pace and compete for the same role.`
    : `${first.modality} meets ${second.modality}: one sets the tempo while the other changes its shape.`;

  return { score, dynamic, headline, communication, rhythm };
}
