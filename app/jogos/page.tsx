const filters = ['Todos', 'Próximos', 'Realizados', 'Casa', 'Fora']

export default function JogosPage() {
  return (
    <main className="pageShell">
      <header className="pageHeader"><div><p className="eyebrow">COMPETIÇÃO</p><h1>Jogos</h1><p className="pageLead">Calendário, resultados e entrada para o centro de análise de cada jogo.</p></div><button className="primaryButton">+ Novo jogo</button></header>
      <section className="panel"><div className="panelHeader"><div><h2>Calendário</h2><p>Na V1, cada jogo terá vídeo, eventos, clips, estatística e scouting.</p></div></div><div className="positionRow">{filters.map((filter) => <button className="chip" key={filter}>{filter}</button>)}</div><div className="emptyState"><div className="emptyIcon">📅</div><h3>Ainda não existem jogos</h3><p>Quando criares o primeiro jogo, ele será o ponto de entrada para o Video Coder.</p><button className="secondaryButton">Criar primeiro jogo</button></div></section>
    </main>
  )
}
