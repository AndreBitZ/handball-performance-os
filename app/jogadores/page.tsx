const positions = ['GR', 'PE', 'LE', 'LD', 'C', 'P']

export default function JogadoresPage() {
  return (
    <main className="pageShell">
      <header className="pageHeader"><div><p className="eyebrow">PLANTEL</p><h1>Jogadores</h1><p className="pageLead">Um histórico único por atleta, independentemente da equipa ou época.</p></div><button className="primaryButton">+ Novo jogador</button></header>
      <section className="panel"><div className="panelHeader"><div><h2>Plantel</h2><p>Os atletas serão associados a equipas através da época.</p></div><input className="input" placeholder="Pesquisar jogador..." /></div><div className="positionRow">{positions.map((position) => <span className="chip" key={position}>{position}</span>)}</div><div className="emptyState"><div className="emptyIcon">👤</div><h3>Ainda não existem jogadores</h3><p>O modelo já está preparado para preservar o histórico do atleta quando muda de equipa ou categoria.</p></div></section>
    </main>
  )
}
