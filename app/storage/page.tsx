'use client'

import { useEffect, useState } from 'react'
import { openProjectFolder, readProjectFile, writeProjectFile, PROJECT_FOLDERS } from '@/lib/storage/local-project'
import {
  loadProjectFolderHandle,
  requestProjectFolderPermission,
  saveProjectFolderHandle,
} from '@/lib/storage/project-session'

export default function StoragePage() {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [status, setStatus] = useState('Nenhuma pasta ligada')
  const [testing, setTesting] = useState(false)
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreFolder() {
      try {
        const savedHandle = await loadProjectFolderHandle()
        if (!savedHandle || !active) return

        const granted = await requestProjectFolderPermission(savedHandle)
        if (!active) return

        if (granted) {
          setFolder(savedHandle)
          setStatus(`Pasta recuperada: ${savedHandle.name}`)
        } else {
          setStatus('Pasta guardada, mas a permissão de acesso precisa de ser renovada.')
        }
      } catch (error) {
        if (active) {
          setStatus(error instanceof Error ? error.message : 'Não foi possível recuperar a pasta guardada.')
        }
      } finally {
        if (active) setRestoring(false)
      }
    }

    void restoreFolder()
    return () => {
      active = false
    }
  }, [])

  async function chooseFolder() {
    try {
      setStatus('A pedir acesso à pasta…')
      const project = await openProjectFolder()
      await saveProjectFolderHandle(project.handle)
      setFolder(project.handle)
      setStatus(`Pasta ligada e guardada: ${project.handle.name}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível ligar a pasta.')
    }
  }

  async function reconnectFolder() {
    if (!folder) return

    try {
      setStatus('A validar permissões…')
      const granted = await requestProjectFolderPermission(folder)
      setStatus(granted ? `Acesso confirmado: ${folder.name}` : 'Acesso à pasta não autorizado.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Não foi possível validar a permissão.')
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
            <p>{restoring ? 'A verificar pasta guardada…' : status}</p>
          </div>
          <span className="status">{folder ? 'LIGADA' : 'LOCAL'}</span>
        </div>

        <div className="dataCards">
          <article className="dataCard">
            <strong>{folder ? folder.name : 'Nenhuma pasta selecionada'}</strong>
            <small>Os ficheiros serão organizados dentro da pasta escolhida.</small>
          </article>
        </div>

        <div className="buttonRow">
          <button className="primaryButton" onClick={chooseFolder} disabled={restoring}>Escolher pasta</button>
          <button className="secondaryButton" onClick={reconnectFolder} disabled={!folder || restoring}>
            Confirmar acesso
          </button>
          <button className="secondaryButton" onClick={testStorage} disabled={!folder || testing || restoring}>
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
