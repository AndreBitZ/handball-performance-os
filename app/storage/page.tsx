'use client'

import { useEffect, useState } from 'react'
import { openProjectFolder, readProjectFile, writeProjectFile, listProjectFiles, PROJECT_FOLDERS } from '@/lib/storage/local-project'
import { loadProjectFolderHandle, requestProjectFolderPermission, saveProjectFolderHandle } from '@/lib/storage/project-session'
import { compareDatabaseRestore, previewDatabaseRestore, restoreDatabaseMerge, rollbackDatabaseRestore, saveDatabaseSnapshot, verifyDatabaseSnapshot, type DatabaseRestoreDiff } from '@/lib/storage/project-snapshot'

type RestorePreview = { filename: string; exportedAt: string; totalRows: number; tableCounts: Record<string, number> }

export default function StoragePage() {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [status, setStatus] = useState('Nenhuma pasta ligada')
  const [testing, setTesting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [verifyingBackup, setVerifyingBackup] = useState(false)
  const [previewingRestore, setPreviewingRestore] = useState(false)
  const [comparingRestore, setComparingRestore] = useState(false)
  const [restoringDatabase, setRestoringDatabase] = useState(false)
  const [rollingBack, setRollingBack] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null)
  const [restoreDiff, setRestoreDiff] = useState<DatabaseRestoreDiff | null>(null)
  const [safetyBackups, setSafetyBackups] = useState<string[]>([])
  const [selectedSafetyBackup, setSelectedSafetyBackup] = useState<string>('')
  const [restoring, setRestoring] = useState(true)

  async function refreshSafetyBackups(handle: FileSystemDirectoryHandle) {
    try {
      const files = await listProjectFiles(handle, 'database')
      const backups = files.filter((name) => name.startsWith('pre-restore-') && name.endsWith('.json')).sort().reverse()
      setSafetyBackups(backups)
      setSelectedSafetyBackup((current) => current && backups.includes(current) ? current : backups[0] ?? '')
    } catch {
      setSafetyBackups([])
      setSelectedSafetyBackup('')
    }
  }

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
          await refreshSafetyBackups(savedHandle)
        } else setStatus('Pasta guardada, mas a permissão de acesso precisa de ser renovada.')
      } catch (error) {
        if (active) setStatus(error instanceof Error ? error.message : 'Não foi possível recuperar a pasta guardada.')
      } finally { if (active) setRestoring(false) }
    }
    void restoreFolder()
    return () => { active = false }
  }, [])

  async function chooseFolder() {
    try {
      setStatus('A pedir acesso à pasta…')
      const project = await openProjectFolder()
      await saveProjectFolderHandle(project.handle)
      setFolder(project.handle)
      setRestorePreview(null); setRestoreDiff(null)
      await refreshSafetyBackups(project.handle)
      setStatus(`Pasta ligada e guardada: ${project.handle.name}`)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível ligar a pasta.') }
  }

  async function reconnectFolder() {
    if (!folder) return
    try {
      setStatus('A validar permissões…')
      const granted = await requestProjectFolderPermission(folder)
      if (granted) await refreshSafetyBackups(folder)
      setStatus(granted ? `Acesso confirmado: ${folder.name}` : 'Acesso à pasta não autorizado.')
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível validar a permissão.') }
  }

  async function testStorage() {
    if (!folder) return
    setTesting(true)
    try {
      const filename = '.storage-test.txt'; const value = `Handball Performance OS storage test — ${new Date().toISOString()}`
      await writeProjectFile(folder, 'database', filename, value)
      const readBack = await readProjectFile(folder, 'database', filename)
      setStatus(readBack === value ? 'Teste concluído: leitura e escrita funcionam' : 'Teste falhou: conteúdo diferente')
    } catch (error) { setStatus(error instanceof Error ? error.message : 'O teste falhou.') }
    finally { setTesting(false) }
  }

  async function createDatabaseBackup() {
    if (!folder) return
    setBackingUp(true)
    try {
      setStatus('A criar backup da base de dados…'); const filename = await saveDatabaseSnapshot(folder)
      setLastBackup(new Date().toLocaleString('pt-PT')); setRestorePreview(null); setRestoreDiff(null)
      await refreshSafetyBackups(folder); setStatus(`Backup criado com sucesso: database/${filename}`)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível criar o backup da base de dados.') }
    finally { setBackingUp(false) }
  }

  async function verifyDatabaseBackup() {
    if (!folder) return
    setVerifyingBackup(true)
    try {
      setStatus('A verificar o backup local…'); const result = await verifyDatabaseSnapshot(folder)
      const totalRows = Object.values(result.tableCounts).reduce((sum, count) => sum + count, 0)
      setLastBackup(new Date(result.exportedAt).toLocaleString('pt-PT')); setStatus(`Backup válido: ${result.filename} — ${totalRows} registos verificados`)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível verificar o backup.') }
    finally { setVerifyingBackup(false) }
  }

  async function previewRestore() {
    if (!folder) return
    setPreviewingRestore(true)
    try { setStatus('A preparar pré-visualização do restauro…'); const preview = await previewDatabaseRestore(folder); setRestorePreview(preview); setRestoreDiff(null); setStatus(`Pré-visualização pronta: ${preview.totalRows} registos no backup`) }
    catch (error) { setRestorePreview(null); setRestoreDiff(null); setStatus(error instanceof Error ? error.message : 'Não foi possível preparar o restauro.') }
    finally { setPreviewingRestore(false) }
  }

  async function compareRestore() {
    if (!folder) return
    setComparingRestore(true)
    try { setStatus('A comparar o backup com a base de dados atual…'); const diff = await compareDatabaseRestore(folder); setRestoreDiff(diff); setStatus(`Comparação concluída: ${diff.added} novos, ${diff.removed} removidos, ${diff.changed} alterados`) }
    catch (error) { setRestoreDiff(null); setStatus(error instanceof Error ? error.message : 'Não foi possível comparar o backup.') }
    finally { setComparingRestore(false) }
  }

  async function restoreDatabase() {
    if (!folder || !restoreDiff) return
    if (!window.confirm('Restaurar o backup em modo seguro? Os dados atuais exclusivos serão preservados e será criado um backup de segurança antes da operação.')) return
    setRestoringDatabase(true)
    try { setStatus('A criar backup de segurança e a restaurar…'); const result = await restoreDatabaseMerge(folder); await refreshSafetyBackups(folder); setSelectedSafetyBackup(result.safetyBackup); setStatus(`Restauro concluído: ${result.restoredRows} registos aplicados. ${result.preservedRows} preservados. Backup de segurança: database/${result.safetyBackup}`); setRestoreDiff(await compareDatabaseRestore(folder)) }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível restaurar a base de dados.') }
    finally { setRestoringDatabase(false) }
  }

  async function rollbackDatabase() {
    if (!folder || !selectedSafetyBackup) return
    if (!window.confirm(`Repor o estado anterior usando ${selectedSafetyBackup}? Esta operação substitui os dados atuais pelo backup de segurança.`)) return
    setRollingBack(true)
    try { setStatus(`A repor ${selectedSafetyBackup}…`); const result = await rollbackDatabaseRestore(folder, selectedSafetyBackup); setRestoreDiff(null); setRestorePreview(null); await refreshSafetyBackups(folder); setStatus(`Rollback concluído: ${result.restoredRows} registos restaurados a partir de ${result.safetyBackup}.`) }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Não foi possível executar o rollback.') }
    finally { setRollingBack(false) }
  }

  return (
    <main className="pageShell">
      <header className="pageHeader"><div><p className="eyebrow">SISTEMA</p><h1>Armazenamento</h1><p className="pageLead">Liga a aplicação a uma pasta local para guardar os dados e ficheiros do projeto.</p></div></header>
      <section className="panel">
        <div className="panelHeader"><div><h2>Pasta do projeto</h2><p>{restoring ? 'A verificar pasta guardada…' : status}</p></div><span className="status">{folder ? 'LIGADA' : 'LOCAL'}</span></div>
        <div className="dataCards"><article className="dataCard"><strong>{folder ? folder.name : 'Nenhuma pasta selecionada'}</strong><small>Os ficheiros serão organizados dentro da pasta escolhida.</small></article><article className="dataCard"><strong>{lastBackup ?? 'Ainda não criado'}</strong><small>Último backup local da base de dados.</small></article></div>
        <div className="buttonRow">
          <button className="primaryButton" onClick={chooseFolder} disabled={restoring}>Escolher pasta</button>
          <button className="secondaryButton" onClick={reconnectFolder} disabled={!folder || restoring}>Confirmar acesso</button>
          <button className="secondaryButton" onClick={testStorage} disabled={!folder || testing || restoring}>{testing ? 'A testar…' : 'Testar leitura/escrita'}</button>
          <button className="secondaryButton" onClick={createDatabaseBackup} disabled={!folder || backingUp || restoring}>{backingUp ? 'A criar backup…' : 'Criar backup da base de dados'}</button>
          <button className="secondaryButton" onClick={verifyDatabaseBackup} disabled={!folder || verifyingBackup || restoring}>{verifyingBackup ? 'A verificar…' : 'Verificar backup'}</button>
          <button className="secondaryButton" onClick={previewRestore} disabled={!folder || previewingRestore || restoring}>{previewingRestore ? 'A preparar…' : 'Pré-visualizar restauro'}</button>
          <button className="secondaryButton" onClick={compareRestore} disabled={!folder || comparingRestore || restoring}>{comparingRestore ? 'A comparar…' : 'Comparar com dados atuais'}</button>
          <button className="primaryButton" onClick={restoreDatabase} disabled={!folder || !restoreDiff || restoringDatabase || restoring}>{restoringDatabase ? 'A restaurar…' : 'Restaurar em modo seguro'}</button>
        </div>
        {restorePreview && <div className="dataCards"><article className="dataCard"><strong>Pré-visualização do restauro</strong><small>{restorePreview.filename} · exportado em {new Date(restorePreview.exportedAt).toLocaleString('pt-PT')}</small><small>{restorePreview.totalRows} registos no backup. A base atual não foi alterada.</small></article></div>}
        {restoreDiff && <div className="dataCards"><article className="dataCard"><strong>Comparação segura — nenhuma alteração efetuada</strong><small>Atual: {restoreDiff.totalCurrent} · Backup: {restoreDiff.totalBackup}</small><small>Novos no backup: {restoreDiff.added} · Ausentes no backup: {restoreDiff.removed} · Alterados: {restoreDiff.changed}</small></article>{Object.entries(restoreDiff.tables).map(([table, diff]) => <article className="dataCard" key={table}><strong>{table}</strong><small>Atual {diff.current} · Backup {diff.backup} · +{diff.added} · -{diff.removed} · ~{diff.changed}</small></article>)}</div>}
      </section>
      <section className="panel">
        <div className="panelHeader"><div><h2>Backups de segurança</h2><p>São criados automaticamente antes de cada restauro. O rollback substitui os dados atuais pelo estado selecionado.</p></div></div>
        {safetyBackups.length === 0 ? <p>Nenhum backup de segurança disponível.</p> : <div className="buttonRow"><select value={selectedSafetyBackup} onChange={(event) => setSelectedSafetyBackup(event.target.value)} disabled={rollingBack || restoring} aria-label="Backup de segurança"><option value="">Selecionar backup</option>{safetyBackups.map((name) => <option key={name} value={name}>{name}</option>)}</select><button className="secondaryButton" onClick={rollbackDatabase} disabled={!selectedSafetyBackup || rollingBack || restoring}>{rollingBack ? 'A repor…' : 'Repor estado anterior'}</button></div>}
      </section>
      <section className="panel"><div className="panelHeader"><div><h2>Estrutura criada</h2><p>Esta estrutura será usada para fotos, vídeos, clips, relatórios e backups.</p></div></div><div className="positionRow">{PROJECT_FOLDERS.map((name) => <span className="chip" key={name}>{name}</span>)}</div></section>
    </main>
  )
}
