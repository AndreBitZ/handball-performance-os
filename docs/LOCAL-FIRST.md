# Local-first architecture

## Regra do projeto

A aplicação é web na interface, mas os dados do utilizador e o processamento devem permanecer no dispositivo sempre que tecnicamente possível.

### Local

- IndexedDB via Dexie: dados estruturados, eventos, jogadores, jogos, clips e playlists.
- Browser storage/OPFS: ficheiros de vídeo e outros ficheiros locais quando suportado pelo navegador.
- HTML5 Video: reprodução local.
- FFmpeg local (fase seguinte): cortes, thumbnails, concatenação e exportação.
- Web Workers: processamento sem bloquear a interface.
- WebAssembly/WebGPU (futuro): visão computacional e modelos locais.
- Export/import: ficheiro de projeto local para backup e transferência.

### Sem dependência de cloud para os dados do utilizador

Não usar Supabase, Firebase, Cloudinary, S3 ou APIs pagas para guardar dados pessoais/desportivos ou vídeos na V1.

GitHub/Vercel podem alojar o código e os ficheiros estáticos da aplicação, mas não são a fonte de dados do utilizador.

## Consequência de produto

A aplicação deve funcionar offline depois de carregada/instalada como PWA, com sincronização cloud considerada apenas como funcionalidade futura e opcional.

## Limitação importante

O armazenamento persistente do browser varia por navegador e dispositivo. A aplicação deve incluir:

1. indicador de armazenamento utilizado;
2. exportação de backup;
3. importação de backup;
4. aviso antes de operações destrutivas;
5. opção de escolher uma pasta local quando a File System Access API estiver disponível.
