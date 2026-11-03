🌐 **Acesse o aplicativo:** [Radio Finder](https://app-finder-five.vercel.app)

Aplicativo para descobrir e ouvir rádios online por município no Brasil.
# Radio Finder

Aplicativo para descobrir e ouvir rádios online por município no Brasil.

## Comportamento

- GPS identifica a cidade atual ao abrir o app.
- Cabeçalho e clima dependem exclusivamente das coordenadas GPS.
- A busca manual altera somente a lista de rádios; não altera GPS, cidade do cabeçalho ou clima.
- A lista é municipal e não usa raio de distância como filtro.
- Só são exibidas emissoras com URL pública de streaming identificada.
- O player tenta reproduzir o stream diretamente e confirma disponibilidade quando o navegador emite o evento `playing`.
- O player único fica no `AudioPlayerContext`, permitindo continuidade entre páginas.

## Fontes de descoberta

1. Catálogo local/Supabase (quando configurado).
2. Radio Browser (catálogo comunitário; seus metadados não possuem campo municipal padronizado, portanto a correspondência por cidade é conservadora).
3. DialTuner API pública (consulta por nome/cidade, via proxy serverless para evitar CORS).

A Anatel não é usada como catálogo de rádios online: uma outorga FM/AM não prova que exista streaming na internet. Diretórios como Radios.com.br e Multirádio não são raspados sem uma API/integração autorizada; podem ser adicionados futuramente por integração formal.

Nenhum diretório público garante cobertura integral de todas as emissoras do país. A cobertura depende dos cadastros e metadados das fontes.

## Instalação e execução

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Geolocalização em rede local

A Geolocation API dos navegadores exige um contexto seguro. `http://localhost:3000` é aceito como exceção, mas `http://192.168.x.x:3000` normalmente não é. Para testar em outro aparelho da rede, publique em HTTPS ou configure um certificado local confiável (por exemplo, com mkcert) no servidor de desenvolvimento. Em produção, use HTTPS.

Se o GPS falhar, a busca manual continua funcionando, mas o cabeçalho/clima não devem assumir a cidade pesquisada como localização do aparelho.

## Validação do áudio

A presença de uma URL no diretório é apenas descoberta preliminar (`DISCOVERED`). O estado `PLAYBACK_VERIFIED` só é gravado depois que o elemento de áudio do navegador começa a tocar (`playing`). Erros de rede/decodificação são exibidos e registrados como indisponibilidade. Alguns servidores podem bloquear hotlink, CORS, HTTPS/mixed-content ou conexões fora de sua região.

## Deploy

O endpoint `/api/dialtuner` é uma função serverless compatível com Vercel. Em desenvolvimento local, o Vite encaminha `/api/dialtuner` para a API pública DialTuner.

## Redesign visual — Apple Music (novembro/2026)

Esta versão contém um refinamento exclusivamente visual da interface:
- navegação lateral para desktop e navegação mobile preservada;
- tipografia de sistema com hierarquia mais próxima ao Apple Music;
- superfícies, botões, campos, cards e estados visuais refinados;
- player persistente com acabamento visual atualizado;
- cor de destaque rosé/vermelho aplicada de forma consistente.

As rotas, integrações, hooks, contextos, consultas, geolocalização, favoritos e reprodução de áudio foram mantidos. Nenhuma funcionalidade nova foi adicionada.

**Validação:** a instalação das dependências não foi concluída neste ambiente por timeout de rede. Portanto, `npm run lint` e `npm run build` precisam ser executados localmente antes do deploy.
