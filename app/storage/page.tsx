'use client'

import { useState } from 'react'
import { openProjectFolder, readProjectFile, writeProjectFile, PROJECT_FOLDERS } from '@/lib/storage/local-project'

export default function StoragePage() {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [status, setStatus] = useState('Nenhuma pasta ligada')
  const [testing, setTesting] = useState(false)

  async function chooseFolder() {
    try {
      setStatus('A pedir acesso à pasta…')
      const project = await openProjectFolder()
      setFolder(project.handle)
      setStatus('Pasta ligada e estrutura criada')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível ligar a pasta.')
    }
  }

  async function testStorage() {
    if (!folder) return
    setTesting(true)
    try {
      const filename = '.storage-test.txt'
      const value = `Handball Performance OS storage test — ${new Date().toISOString()}`
      await writeProjectFile(folder, 'database', filename, value)
      const readBack = await readProjectFile(folder, 'database', filename)
      setStatus(readBack === value ? 'Teste concluído: leitura e escrita funcionam' : 'Teste falhou: conteúdo diferente')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'O teste falhou.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <main className="pageShell">
      <header className="pageHeader">
        <div>
          <p className="eyebrow">SISTEMA</p>
          <h1>Armazenamento</h1>
          <p className="pageLead">Liga a aplicação a uma pasta local para guardar os dados e ficheiros do projeto.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Pasta do projeto</h2>
            <p>{status}</p>
          </div>
          <span className="status">{folder ? 'LIGADA' : 'LOCAL'}</span>
        </div>

        <div className="dataCards">
          <article className="dataCard">
            <strong>{folder ? 'Handball Performance OS' : 'Nenhuma pasta selecionada'}</strong>
            <small>Os ficheiros serão organizados dentro da pasta escolhida.</small>
          </article>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" onClick={chooseFolder}>Escolher pasta</button>
          <button className="secondaryButton" onClick={testStorage} disabled={!folder || testing}>
            {testing ? 'A testar…' : 'Testar leitura/escrita'}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h2>Estrutura criada</h2>
            <p>Esta estrutura será usada para fotos, vídeos, clips, relatórios e backups.</p>
          </div>
        </div>
        <div className="positionRow">
          {PROJECT_FOLDERS.map((name) => <span className="chip" key={name}>{name}</span>)}
        </div>
      </section>
    </main>
  )
}
