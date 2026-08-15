import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Method and privacy — DIVINE',
  description: 'How DIVINE approaches randomness, authored interpretation, privacy, and tradition.',
};

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="page-hero"><p className="eyebrow">Method / Privacy</p><h1>Attention changes the answer.</h1><p>DIVINE is an authored collection of eight repeatable rituals for reflection, pattern, and chance.</p></header>
      <div className="about-grid">
        <section><span>01</span><h2>Nothing leaves the room.</h2><p>Your questions, saved readings, favorites, and notes stay in this browser. There are no accounts, tracking profiles, public reading links, or remote interpretation services.</p></section>
        <section><span>02</span><h2>The draw is genuinely random.</h2><p>Cards and answers are selected using the browser’s cryptographic random-number generator. Cards never repeat inside a spread, and a saved result never changes later.</p></section>
        <section><span>03</span><h2>Every word is authored.</h2><p>Interpretations combine the symbol, its position, orientation, focus, and neighboring cards. No live AI participates in a reading.</p></section>
        <section><span>04</span><h2>Use your own authority.</h2><p>DIVINE is for personal reflection and entertainment. It is not a substitute for medical, legal, financial, mental-health, or safety advice.</p></section>
      </div>
      <aside className="tradition-note"><p className="eyebrow">A note on tradition</p><p>DIVINE’s Tarot follows the Rider–Waite–Smith structure and uses verified public-domain card images; Tarot de Marseille is a distinct historical variant with its own visual and interpretive language. This Lenormand follows the familiar 36-card Petit Lenormand system; the Grand Jeu de Mlle Lenormand is a separate, larger variant. The Oracle, Spellcraft, Egyptian Oracle, and Zodiac systems are contemporary DIVINE works shaped with respect for the symbols they draw upon. “Magic 8 Ball” is retained as the requested label; trademark review remains a gate before any public commercial release.</p></aside>
      <Link href="/#systems" className="primary-action">Choose a system</Link>
    </main>
  );
}
