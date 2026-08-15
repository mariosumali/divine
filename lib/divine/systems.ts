import type { CardDefinition, SpreadDefinition, SystemDefinition, SystemSlug } from './types';

const spread = (
  id: string,
  name: string,
  description: string,
  positions: string[],
  layout: SpreadDefinition['layout'],
): SpreadDefinition => ({ id, name, description, positions, layout });

const majorArcana: Array<[string, string, string, string, string]> = [
  ['The Fool', '0', 'beginning', 'A beginning arrives before certainty. Step toward it with an open hand.', 'Freedom becomes drift when instinct refuses every boundary.'],
  ['The Magician', 'I', 'will', 'The needed instruments are already near. Direct them with precision.', 'Power is scattering through performance, hesitation, or divided intent.'],
  ['The High Priestess', 'II', 'knowing', 'The quiet answer is the true one. Let what is hidden finish speaking.', 'Silence has become avoidance; name the knowledge you keep postponing.'],
  ['The Empress', 'III', 'abundance', 'What you tend now will multiply. Receive as generously as you create.', 'Care has tipped into depletion or control; restore your own ground.'],
  ['The Emperor', 'IV', 'structure', 'Order gives the vision a body. Set the boundary and hold it.', 'A rigid structure is protecting an old fear rather than the future.'],
  ['The Hierophant', 'V', 'tradition', 'A trusted lineage, teacher, or practice reveals the next step.', 'Inherited rules must be examined before they are obeyed.'],
  ['The Lovers', 'VI', 'choice', 'Alignment asks for a wholehearted choice, not a perfect guarantee.', 'Desire and values are parting ways; decide which voice leads.'],
  ['The Chariot', 'VII', 'direction', 'Opposing forces can move together once you choose the destination.', 'Force without inner agreement creates motion but not progress.'],
  ['Strength', 'VIII', 'courage', 'Gentle mastery will achieve what pressure cannot.', 'Self-doubt is louder than the danger; meet it without cruelty.'],
  ['The Hermit', 'IX', 'solitude', 'Withdraw long enough to hear the guidance beneath other voices.', 'Isolation has outlived its wisdom; carry the lantern back.'],
  ['Wheel of Fortune', 'X', 'change', 'The pattern is turning. Move with the opening while it is present.', 'Resistance repeats the cycle; change your position within it.'],
  ['Justice', 'XI', 'truth', 'A clear consequence follows a clear choice. Tell the whole truth.', 'An imbalance persists because part of the evidence is being denied.'],
  ['The Hanged Man', 'XII', 'surrender', 'Progress comes through a changed perspective, not harder effort.', 'Suspension has become delay; release the sacrifice that proves nothing.'],
  ['Death', 'XIII', 'ending', 'An ending clears the threshold. Let the former shape close completely.', 'Clinging prolongs the ending without preserving what was loved.'],
  ['Temperance', 'XIV', 'alchemy', 'Opposites are learning a new proportion. Adjust slowly and deliberately.', 'Excess and impatience have disturbed the mixture. Simplify.'],
  ['The Devil', 'XV', 'attachment', 'The chain is visible now, which means it can be loosened.', 'Denial disguises the attachment; freedom begins with naming it.'],
  ['The Tower', 'XVI', 'revelation', 'What cannot remain is falling quickly. Save truth, not appearances.', 'A necessary disruption is being delayed, making the structure more fragile.'],
  ['The Star', 'XVII', 'renewal', 'Hope becomes practical when you offer your true self to the future.', 'Discouragement has obscured a real source of renewal. Look again.'],
  ['The Moon', 'XVIII', 'mystery', 'Move carefully through partial light. Dreams carry useful evidence.', 'Confusion breaks when fear is separated from intuition.'],
  ['The Sun', 'XIX', 'vitality', 'Clarity, warmth, and recognition arrive without disguise.', 'Joy is present but difficult to receive; release the need to diminish it.'],
  ['Judgement', 'XX', 'awakening', 'The call is unmistakable. Answer from who you have become.', 'An old verdict is preventing renewal; revise it with compassion.'],
  ['The World', 'XXI', 'completion', 'The cycle closes with integration. Stand inside what you completed.', 'The final step remains undone because completion changes your identity.'],
];

const tarotMajors: CardDefinition[] = majorArcana.map(([name, glyph, keyword, meaning, reversedMeaning], index) => ({
  id: `major-${index}`,
  name,
  glyph,
  image: `/tarot/major-${index}.webp`,
  keywords: [keyword, 'major arcana'],
  meaning,
  reversedMeaning,
  domain: 'major',
  provenance: 'Rider–Waite–Smith tradition; original DIVINE interpretation.',
}));

const suits = [
  { id: 'wands', name: 'Wands', glyph: '✦', domain: 'will and creation', element: 'fire', gift: 'Desire becomes movement when it is given a worthy direction.', shadow: 'Energy burns without purpose; choose the work that deserves the flame.' },
  { id: 'cups', name: 'Cups', glyph: '▽', domain: 'feeling and relationship', element: 'water', gift: 'Feeling carries information that logic alone cannot hold.', shadow: 'Emotion is flooding the signal; make room without surrendering direction.' },
  { id: 'swords', name: 'Swords', glyph: '†', domain: 'thought and truth', element: 'air', gift: 'A precise thought cuts through the confusion and names what matters.', shadow: 'The mind is turning its sharpness inward; question the story, not your worth.' },
  { id: 'pentacles', name: 'Pentacles', glyph: '○', domain: 'body and material life', element: 'earth', gift: 'Patient attention makes the intangible real and sustainable.', shadow: 'Security has become stagnation; value must circulate to remain alive.' },
];

const ranks = [
  { id: 'ace', name: 'Ace', theme: 'pure potential', light: 'A concentrated beginning asks to be accepted before it is understood.', dark: 'The seed is present but cannot open under pressure.' },
  { id: 'two', name: 'Two', theme: 'choice and balance', light: 'Two forces can become a dialogue instead of a contest.', dark: 'Indecision is spending the energy that choice requires.' },
  { id: 'three', name: 'Three', theme: 'growth and expression', light: 'The first visible result confirms that collaboration is working.', dark: 'Growth is being measured too early or shared too thinly.' },
  { id: 'four', name: 'Four', theme: 'stability and rest', light: 'A stable form creates the pause needed for integration.', dark: 'Protection has hardened into resistance.' },
  { id: 'five', name: 'Five', theme: 'friction and change', light: 'Conflict reveals the adjustment the system has resisted.', dark: 'Struggle is being repeated after its lesson has arrived.' },
  { id: 'six', name: 'Six', theme: 'harmony and passage', light: 'Movement toward balance is already underway.', dark: 'A past agreement is distorting the present exchange.' },
  { id: 'seven', name: 'Seven', theme: 'assessment and resolve', light: 'Pause, assess the field, and protect the truest intention.', dark: 'Suspicion or fatigue is making every option look hostile.' },
  { id: 'eight', name: 'Eight', theme: 'momentum and mastery', light: 'Repetition becomes skill; focused action accelerates the outcome.', dark: 'Speed is replacing discernment.' },
  { id: 'nine', name: 'Nine', theme: 'attainment and threshold', light: 'The work is nearly whole. Hold steady at the threshold.', dark: 'Exhaustion is disguising how close completion is.' },
  { id: 'ten', name: 'Ten', theme: 'completion and consequence', light: 'The full consequence of the cycle can now be carried forward.', dark: 'Completion has become burden because nothing is being released.' },
  { id: 'page', name: 'Page', theme: 'message and discovery', light: 'Curiosity brings news from an unfamiliar direction.', dark: 'A message is immature, delayed, or heard only selectively.' },
  { id: 'knight', name: 'Knight', theme: 'pursuit and motion', light: 'Commitment gathers speed around a single aim.', dark: 'Momentum has outrun wisdom.' },
  { id: 'queen', name: 'Queen', theme: 'embodied wisdom', light: 'Inner authority shapes the room without demanding attention.', dark: 'Care or control is being used to avoid vulnerability.' },
  { id: 'king', name: 'King', theme: 'stewardship and command', light: 'Experience can now direct the whole field responsibly.', dark: 'Authority is defending itself instead of serving the outcome.' },
];

const tarotMinors: CardDefinition[] = suits.flatMap((suit) =>
  ranks.map((rank) => ({
    id: `${suit.id}-${rank.id}`,
    name: `${rank.name} of ${suit.name}`,
    glyph: suit.glyph,
    image: `/tarot/${suit.id}-${rank.id}.webp`,
    keywords: [rank.theme, suit.domain, suit.element],
    meaning: `${rank.light} In ${suit.domain}, ${suit.gift.toLowerCase()}`,
    reversedMeaning: `${rank.dark} In ${suit.domain}, ${suit.shadow.toLowerCase()}`,
    domain: suit.id,
    provenance: 'Rider–Waite–Smith structure; original DIVINE interpretation.',
  })),
);

const makeNamedDeck = (
  system: string,
  entries: Array<[string, string]>,
  glyphs: string[],
  promise: string,
  caution: string,
): CardDefinition[] => entries.map(([name, keyword], index) => ({
  id: `${system}-${index + 1}`,
  name,
  glyph: glyphs[index % glyphs.length],
  keywords: [keyword, entries[(index + 7) % entries.length][1]],
  meaning: `${name} announces ${keyword}. ${promise}`,
  reversedMeaning: `${name} is obscured: ${caution}`,
  domain: system,
  provenance: 'Original DIVINE card and interpretation.',
}));

const oracleEntries: Array<[string, string]> = [
  ['The Open Door', 'permission'], ['Black Water', 'depth'], ['The Witness', 'clarity'], ['Silver Thread', 'connection'],
  ['The Vessel', 'receptivity'], ['Afterlight', 'memory'], ['The Unnamed', 'mystery'], ['First Breath', 'renewal'],
  ['The Crossing', 'transition'], ['Deep Listening', 'attention'], ['The Offering', 'exchange'], ['The Hollow', 'space'],
  ['North Star', 'direction'], ['The Veil', 'discernment'], ['Soft Armor', 'boundaries'], ['The Echo', 'pattern'],
  ['Wild Mercy', 'release'], ['The Archive', 'ancestry'], ['The Current', 'movement'], ['Quiet Fire', 'devotion'],
  ['The Mirror', 'recognition'], ['The Threshold', 'initiation'], ['Night Bloom', 'timing'], ['The Bell', 'awakening'],
  ['White Feather', 'trust'], ['The Orchard', 'abundance'], ['The Key', 'access'], ['The Empty Chair', 'absence'],
  ['The Bridge', 'reconciliation'], ['The Stone', 'endurance'], ['The Tide', 'rhythm'], ['The Lantern', 'guidance'],
  ['The Compass', 'choice'], ['The Storm Eye', 'stillness'], ['The Return', 'integration'], ['The Seed', 'potential'],
  ['The Unbinding', 'freedom'], ['The Hearth', 'belonging'], ['The Signal', 'recognition'], ['The Well', 'resource'],
  ['The Wing', 'perspective'], ['The Hour', 'readiness'], ['The Name', 'identity'], ['The Crown', 'sovereignty'],
];

const lenormandEntries: Array<[string, string]> = [
  ['Rider', 'news'], ['Clover', 'opportunity'], ['Ship', 'distance'], ['House', 'home'], ['Tree', 'health'], ['Clouds', 'uncertainty'],
  ['Snake', 'complexity'], ['Coffin', 'ending'], ['Bouquet', 'gift'], ['Scythe', 'sudden cut'], ['Whip', 'repetition'], ['Birds', 'conversation'],
  ['Child', 'beginning'], ['Fox', 'strategy'], ['Bear', 'power'], ['Stars', 'guidance'], ['Stork', 'change'], ['Dog', 'loyalty'],
  ['Tower', 'institution'], ['Garden', 'public life'], ['Mountain', 'obstacle'], ['Crossroads', 'choice'], ['Mice', 'erosion'], ['Heart', 'love'],
  ['Ring', 'commitment'], ['Book', 'secrets'], ['Letter', 'message'], ['Man', 'significator'], ['Woman', 'significator'], ['Lilies', 'peace'],
  ['Sun', 'success'], ['Moon', 'recognition'], ['Key', 'certainty'], ['Fish', 'resources'], ['Anchor', 'stability'], ['Cross', 'burden'],
];

const spellEntries: Array<[string, string]> = [
  ['Candle', 'focus'], ['Salt', 'protection'], ['Thread', 'connection'], ['Bell', 'clearing'], ['Bowl', 'receiving'], ['Ash', 'release'],
  ['Wax', 'impression'], ['Flame', 'will'], ['Water', 'adaptation'], ['Stone', 'grounding'], ['Feather', 'message'], ['Key', 'opening'],
  ['Mirror', 'truth'], ['Veil', 'privacy'], ['Herb', 'restoration'], ['Smoke', 'transition'], ['Knot', 'commitment'], ['Circle', 'boundary'],
  ['Moon Milk', 'nourishment'], ['Iron', 'resolve'], ['Honey', 'attraction'], ['Ink', 'declaration'], ['Needle', 'precision'], ['Ribbon', 'grace'],
  ['Door', 'invitation'], ['Window', 'perspective'], ['Broom', 'clearing'], ['Mortar', 'transformation'], ['Chalice', 'communion'], ['Coin', 'value'],
  ['Clock', 'timing'], ['Match', 'initiation'], ['Shell', 'listening'], ['Root', 'ancestry'], ['Star', 'wish'], ['Seal', 'completion'],
];

const egyptEntries: Array<[string, string]> = [
  ['Ankh', 'life'], ['Djed Pillar', 'stability'], ['Was Scepter', 'authority'], ['Scarab', 'renewal'], ['Eye of Horus', 'restoration'], ['Feather of Ma’at', 'truth'],
  ['Lotus', 'emergence'], ['Solar Disk', 'illumination'], ['Papyrus', 'record'], ['Sistrum', 'celebration'], ['Shen Ring', 'protection'], ['Ka', 'vital essence'],
  ['Ba', 'individual spirit'], ['Akh', 'transformation'], ['Isis', 'restoration'], ['Osiris', 'regeneration'], ['Horus', 'vision'], ['Hathor', 'joy'],
  ['Thoth', 'knowledge'], ['Sekhmet', 'power'], ['Anubis', 'passage'], ['Bastet', 'guardianship'], ['Nut', 'cosmos'], ['Geb', 'earth'],
  ['Ra', 'radiance'], ['Nephthys', 'thresholds'], ['Ptah', 'craft'], ['Khnum', 'formation'], ['Sobek', 'instinct'], ['Ma’at', 'balance'],
  ['The Nile', 'continuity'], ['The Horizon', 'becoming'], ['The Barque', 'journey'], ['The Temple Gate', 'initiation'], ['The Offering Table', 'reciprocity'], ['The Field of Reeds', 'peace'],
];

const signs: Array<[string, string]> = [
  ['Aries', 'initiation'], ['Taurus', 'embodiment'], ['Gemini', 'exchange'], ['Cancer', 'belonging'], ['Leo', 'radiance'], ['Virgo', 'refinement'],
  ['Libra', 'relationship'], ['Scorpio', 'transformation'], ['Sagittarius', 'expansion'], ['Capricorn', 'mastery'], ['Aquarius', 'innovation'], ['Pisces', 'surrender'],
];
const planets: Array<[string, string]> = [
  ['Sun', 'identity'], ['Moon', 'instinct'], ['Mercury', 'language'], ['Venus', 'attraction'], ['Mars', 'action'],
  ['Jupiter', 'growth'], ['Saturn', 'structure'], ['Uranus', 'disruption'], ['Neptune', 'imagination'], ['Pluto', 'rebirth'],
];
const houses: Array<[string, string]> = Array.from({ length: 12 }, (_, i) => [`House ${i + 1}`, [
  'self', 'resources', 'communication', 'home', 'creativity', 'practice', 'partnership', 'intimacy', 'belief', 'vocation', 'community', 'spirit',
][i]] as [string, string]);

const tarotSpreads = [
  spread('insight', 'One-card insight', 'A single clear signal for the present moment.', ['The message'], 'single'),
  spread('three', 'Past / Present / Future', 'See the movement around your question.', ['Past', 'Present', 'Future'], 'line'),
  spread('celtic-cross', 'Celtic Cross', 'A ten-card map of influence, tension, and outcome.', ['Present', 'Challenge', 'Foundation', 'Recent past', 'Possibility', 'Near future', 'Your position', 'Environment', 'Hopes and fears', 'Outcome'], 'cross'),
];

const oracleSpreads = [
  spread('message', 'Single message', 'Receive the clearest note.', ['Message'], 'single'),
  spread('shadow-action', 'Message / Shadow / Action', 'Hold the invitation and its demand together.', ['Message', 'Shadow', 'Action'], 'line'),
  spread('inner-compass', 'Inner Compass', 'Five directions around your inner axis.', ['North · Guidance', 'East · Beginning', 'Center · Truth', 'South · Release', 'West · Integration'], 'cross'),
];

const simpleSpreads = (singleName: string, threeName: string, fiveName: string, positions3: string[], positions5: string[]) => [
  spread('single', singleName, 'One symbol, without dilution.', ['The symbol'], 'single'),
  spread('three', threeName, 'A three-part movement through the question.', positions3, 'line'),
  spread('five', fiveName, 'A deeper five-part pattern.', positions5, 'cross'),
];

const tarot = [...tarotMajors, ...tarotMinors];
const oracle = makeNamedDeck('oracle', oracleEntries, ['◌', '◇', '☾', '∴'], 'Let its image change how you approach the next true choice.', 'the invitation is present, but your attention is split.');
const lenormand = makeNamedDeck('lenormand', lenormandEntries, ['♢', '✣', '○', '⌁'], 'Read it plainly, then notice which neighboring symbol changes its tone.', 'the signal is indirect; context and proximity decide its force.');
const spellcraft = makeNamedDeck('spellcraft', spellEntries, ['✦', '△', '○', '╳'], 'Give the intention one material action before the day closes.', 'the ritual has form but not yet honest intention.');
const egypt = makeNamedDeck('egypt', egyptEntries, ['☉', '☥', '◇', 'Ⅱ'], 'Its enduring image names the force now moving through the threshold.', 'the symbol asks for respect, context, and a slower reading.');
const zodiac = makeNamedDeck('zodiac', [...signs, ...planets, ...houses], ['☉', '☾', '○', '✦'], 'This archetype shows where celestial pressure becomes personal choice.', 'the archetype is being performed rather than embodied.').map((card, index) => ({
  ...card,
  domain: index < 12 ? 'sign' : index < 22 ? 'planet' : 'house',
}));

export const SYSTEMS: SystemDefinition[] = [
  {
    slug: 'tarot', index: '01', name: 'Tarot', shortName: 'Tarot', kind: 'cards', countLabel: '78 cards', eyebrow: 'Arcana / Pattern',
    introduction: 'A complete map of archetype and consequence. Tarot shows the pattern beneath the event—and the choice still inside it.',
    instruction: 'Hold the question lightly. Cut the deck when the movement feels complete.', cards: tarot, spreads: tarotSpreads, cover: '/art/tarot.webp',
  },
  {
    slug: 'oracle', index: '02', name: 'Oracle', shortName: 'Oracle', kind: 'cards', countLabel: '44 cards', eyebrow: 'Image / Reflection',
    introduction: 'Forty-four original images speak through association rather than doctrine. The first recognition is often the truest.',
    instruction: 'Let the image choose the pace. There is nothing to solve.', cards: oracle, spreads: oracleSpreads, cover: '/art/oracle.webp',
  },
  {
    slug: 'lenormand', index: '03', name: 'Lenormand', shortName: 'Lenormand', kind: 'cards', countLabel: '36 cards', eyebrow: 'Symbol / Proximity',
    introduction: 'Lenormand is direct, practical, and relational. Each symbol speaks plainly; its neighbors complete the sentence.',
    instruction: 'Ask for the shape of events, then read from near to far.', cards: lenormand,
    spreads: [
      spread('single', 'Single card', 'One concrete signal.', ['Signal'], 'single'),
      spread('line-three', 'Line of Three', 'Subject, modifier, and direction.', ['Subject', 'Influence', 'Direction'], 'line'),
      spread('portrait-nine', 'Nine-card Portrait', 'A compact field of past, present, and emerging events.', Array.from({ length: 9 }, (_, i) => `Field ${i + 1}`), 'grid'),
      spread('grand-tableau', 'Grand Tableau', 'All thirty-six cards mapped across the houses.', lenormandEntries.map(([name]) => `House of ${name}`), 'tableau'),
    ], cover: '/art/lenormand.webp',
  },
  {
    slug: 'spellcraft', index: '04', name: 'Spellcraft', shortName: 'Spellcraft', kind: 'cards', countLabel: '36 cards', eyebrow: 'Ritual / Intention',
    introduction: 'A contemporary ritual deck for turning intention into a material act. Every symbol asks for participation.',
    instruction: 'Name what you are willing to change—not only what you want to receive.', cards: spellcraft,
    spreads: simpleSpreads('Daily intention', 'Intention / Block / Action', 'Ritual Path', ['Intention', 'Block', 'Action'], ['Desire', 'Material', 'Boundary', 'Action', 'Seal']), cover: '/art/spellcraft.webp',
  },
  {
    slug: 'ancient-egypt', index: '05', name: 'Ancient Egypt', shortName: 'Egyptian Oracle', kind: 'cards', countLabel: '36 cards', eyebrow: 'Image / Continuity',
    introduction: 'A contemporary oracle shaped by enduring Egyptian images of balance, passage, renewal, and sacred order.',
    instruction: 'Approach each name as living history, not decoration. Receive the symbol before interpreting it.', cards: egypt,
    spreads: simpleSpreads('Single symbol', 'Threshold / Trial / Gift', 'Temple Path', ['Threshold', 'Trial', 'Gift'], ['Gate', 'Offering', 'Measure', 'Passage', 'Horizon']), cover: '/art/ancient-egypt.webp',
  },
  {
    slug: 'zodiac', index: '06', name: 'Zodiac', shortName: 'Zodiac', kind: 'cards', countLabel: '34 cards', eyebrow: 'Sky / Timing',
    introduction: 'Signs describe the quality, planets the impulse, and houses the field. Together they locate the pressure and its possible expression.',
    instruction: 'Choose the part of life that feels most active, then let the sky reorganize the question.', cards: zodiac,
    spreads: [
      spread('archetype', 'Single archetype', 'One celestial influence.', ['Archetype'], 'single'),
      spread('celestial-triad', 'Sign / Planet / House', 'Quality, impulse, and arena.', ['Sign', 'Planet', 'House'], 'line'),
      spread('celestial-pattern', 'Celestial Pattern', 'A five-point reading of pressure and possibility.', ['Quality', 'Impulse', 'Arena', 'Tension', 'Invitation'], 'cross'),
    ], cover: '/art/zodiac.webp',
  },
  {
    slug: 'magic-8-ball', index: '07', name: 'Magic 8 Ball', shortName: 'Magic 8 Ball', kind: 'ball', countLabel: '24 answers', eyebrow: 'Chance / Decision',
    introduction: 'A familiar instrument of decisive chance, recast in DIVINE monochrome. Ask only what can be answered yes or no.',
    instruction: 'Hold the question in mind. Shake until certainty loosens its grip.', cards: [], spreads: [], cover: '/art/magic-8-ball.webp',
  },
  {
    slug: 'fortune-cookie', index: '08', name: 'Fortune Cookie', shortName: 'Fortune Cookie', kind: 'cookie', countLabel: '144 fortunes', eyebrow: 'Chance / Message',
    introduction: 'A small fracture, a narrow paper, a sentence arriving at exactly the wrong—or right—time.',
    instruction: 'Choose without studying the options. The hand already knows which shell to break.', cards: [], spreads: [], cover: '/art/fortune-cookie.webp',
  },
];

export const SYSTEM_MAP = Object.fromEntries(SYSTEMS.map((system) => [system.slug, system])) as Record<SystemSlug, SystemDefinition>;

export const BALL_ANSWERS = [
  'The answer is already moving toward yes.', 'Yes—before doubt edits the invitation.', 'The current favors it.', 'Proceed; the opening is real.',
  'Yes, but keep the promise small.', 'The signs align in your favor.', 'What you ask is within reach.', 'Trust the first yes.',
  'The answer is veiled for now.', 'Ask again after one honest action.', 'Not until the missing fact appears.', 'The outcome is still choosing its form.',
  'Silence is the answer today.', 'Wait for the second signal.', 'The question contains another question.', 'Uncertain—change your vantage point.',
  'No; the closed path is protection.', 'Do not force this door.', 'The answer turns away.', 'Not in the form you imagine.',
  'Release it before it decides for you.', 'The cost outweighs the promise.', 'No—the timing has passed.', 'Choose another direction.',
];

const fortuneOpenings = [
  'A delayed answer', 'The next invitation', 'A quiet alliance', 'An overlooked detail', 'The courage you save', 'A necessary ending',
  'The smallest honest action', 'A familiar road', 'An unexpected witness', 'The boundary you name', 'A message after dusk', 'The work done in private',
];
const fortuneClosings = [
  'will change the scale of the decision.', 'arrives before the month turns.', 'reveals what patience was protecting.', 'becomes the key once you stop searching.',
  'returns as confidence at the threshold.', 'makes space for a more exact desire.', 'travels farther than the grand gesture.', 'shows you how much you have changed.',
  'confirms the risk was worth naming.', 'restores the energy lost to uncertainty.', 'asks for an answer by morning.', 'becomes visible when the room grows quiet.',
];

export const FORTUNES = fortuneOpenings.flatMap((opening) => fortuneClosings.map((closing) => `${opening} ${closing}`));

export function isSystemSlug(value: string): value is SystemSlug {
  return value in SYSTEM_MAP;
}
