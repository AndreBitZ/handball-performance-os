const teams = [
  { name: 'Ainda sem equipa', category: 'Criar primeira equipa', gender: '—', status: 'Configuração' },
]

export default function EquipaPage() {
  return (
    <main className="pageShell">
      <header className="pageHeader">
        <div><p className="eyebrow">GESTÃO</p><h1>Equipa</h1><p className="pageLead">Clubes, equipas e estrutura competitiva.</p></div>
        <button className="primaryButton">+ Nova equipa</button>
      </header>
      <section className="panel">
        <div className="panelHeader"><div><h2>Equipas</h2><p>As equipas serão ligadas a épocas e plantéis.</p></div><span className="status">V1</span></div>
        <div className="emptyState"><div className="emptyIcon">🤾</div><h3>A tua primeira equipa começa aqui</h3><p>Na próxima fase vamos ligar este ecrã ao Supabase para criares clubes, equipas, categorias e épocas sem mexer em código.</p><button className="secondaryButton">Preparar equipa</button></div>
      </section>
      <section className="panel"><h2>Modelo de dados</h2><div className="dataCards">{teams.map((team) => <article className="dataCard" key={team.name}><span>{team.gender}</span><strong>{team.name}</strong><small>{team.category} · {team.status}</small></article>)}</div></section>
    </main>
  )
}
