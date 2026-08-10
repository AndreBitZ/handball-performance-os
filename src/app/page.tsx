'use client';

import Link from 'next/link';

const cards = [
  { href: '/management', icon: '👥', title: 'Gestão', text: 'Equipas e jogadores' },
  { href: '/seasons', icon: '📅', title: 'Épocas & Competições', text: 'Épocas e competições' },
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      <header style={{ marginBottom: 32 }}>
        <p style={{ margin: 0, color: '#667085', fontSize: 14 }}>HANDBALL PERFORMANCE OS</p>
        <h1 style={{ margin: '8px 0', fontSize: 34 }}>Centro de Performance</h1>
        <p style={{ color: '#667085', margin: 0 }}>A tua plataforma local-first para gestão e análise de andebol.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <article style={{ border: '1px solid #ddd', borderRadius: 16, padding: 22, minHeight: 130 }}>
              <div style={{ fontSize: 30 }}>{card.icon}</div>
              <h2 style={{ margin: '12px 0 6px' }}>{card.title}</h2>
              <p style={{ margin: 0, color: '#667085' }}>{card.text}</p>
            </article>
          </Link>
        ))}
      </section>

      <section style={{ marginTop: 28, padding: 20, border: '1px solid #ddd', borderRadius: 16 }}>
        <h2 style={{ marginTop: 0 }}>Próximos módulos</h2>
        <p style={{ marginBottom: 0, color: '#667085' }}>🤾 Jogos · 🎥 Vídeo · 📊 Estatísticas</p>
      </section>
    </main>
  );
}
