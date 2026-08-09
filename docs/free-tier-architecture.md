# Arquitetura V1 — 100% Free Tier

## Objetivo

A primeira versão deve poder funcionar sem subscrições pagas. O desenho evita colocar jogos completos na cloud e mantém o processamento pesado de vídeo no computador do analista.

## Serviços

| Serviço | Plano | Uso |
|---|---|---|
| GitHub | Free | Código, issues e controlo de versões |
| Vercel | Hobby | Deploy da aplicação Next.js |
| Supabase | Free | PostgreSQL, Auth e pequenas imagens/metadados |
| FFmpeg | Open source/local | Corte e processamento de vídeo no computador |
| Next.js/React/TypeScript | Open source | Aplicação web |

## Limites importantes

- Supabase Free: 500 MB de base de dados por projeto, 1 GB de Storage, 50 MB por ficheiro e 5 GB de egress não-cacheado + 5 GB cacheado.
- Vercel Hobby: $0; adequado para a aplicação pessoal/protótipo, respeitando os limites do plano.
- GitHub Free: repositórios públicos e privados ilimitados para contas pessoais, com limites próprios de Actions/Packages.

## Regra de vídeo

**Não guardar jogos completos no Supabase Storage.**

O vídeo original fica localmente no computador. A base de dados guarda apenas:

- nome do ficheiro;
- duração;
- referência local;
- timestamps;
- eventos;
- clips;
- notas;
- anotações;
- thumbnails pequenas, quando necessário.

Clips exportados podem continuar locais durante a V1. Upload para Storage será opcional e apenas para ficheiros pequenos.

## Consequência prática

A aplicação pode ser utilizada como:

`Computador do analista → vídeo local → Next.js → Supabase (dados)`

Isto mantém a V1 dentro dos planos gratuitos e evita que o limite de 1 GB de Storage seja consumido rapidamente por jogos.

## O que não vamos usar na V1

- serviços pagos de AI;
- APIs pagas de vídeo;
- servidores FFmpeg pagos;
- processamento cloud de jogos completos;
- bases de dados externas pagas;
- domínio personalizado pago;
- serviços de email pagos.

## Evolução futura

Quando o projeto crescer, poderemos separar armazenamento de vídeo e processamento. Essa decisão só será tomada quando houver necessidade real e orçamento.
