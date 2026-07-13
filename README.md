# V17 — Modularização, Estabilização e Auditoria de Produção

Esta branch reorganiza a aplicação CMMS para manter compatibilidade com GitHub Pages e estabilizar o fluxo de abertura de Ordem de Serviço com fotos em Android, iPhone e desktop.

## Como testar localmente

1. Abra `index.html` por um servidor estático simples ou pelo GitHub Pages da branch.
2. Execute o smoke test estático:

```bash
npm test
```

## Principais mudanças

- HTML principal reduzido e carregando CSS/JS externos.
- Código separado em `src/` por configuração, estado, serviços, domínio, UI e páginas.
- Fluxo de abertura de OS preservado e reforçado com unidade, área, setor, categoria, equipamento, prioridade, problema, descrição e fotos.
- Câmera e galeria separadas, múltiplas fotos, miniaturas, remoção de fotos, validação de tipo, limite de 8 fotos e 10 MB por imagem.
- Campos e fotos são preservados em erro de upload/gravação, com proteção contra duplo envio.
- Multiunidade com seletor para MASTER, ADMIN e DIRETOR; técnicos ficam restritos à unidade do perfil.
- Realtime recriado ao trocar unidade e sem polling que recria formulários em preenchimento.
- Status de OS padronizados nos filtros, com CANCELADA fora de abertas.
- Indicador “Custo do Mês” filtrado pelo mês corrente.

## Teste de homologação

A branch pode ser publicada temporariamente em dois formatos de URL:

- GitHub Pages em subdiretório: `/entre-amigos-cmms/`
- Hospedagem temporária na raiz: `/`

Os caminhos do HTML usam referências relativas (`./src/styles.css` e `./src/app.js`), portanto funcionam nos dois formatos acima.

### Comando local

```bash
python3 -m http.server 4173
```

Depois acesse:

```text
http://127.0.0.1:4173/index.html
```

### Checklist manual obrigatório

1. Login com usuário real do Supabase.
2. Troca de unidade com MASTER/ADMIN/DIRETOR.
3. Restrição de unidade para técnico/operador.
4. Abertura de OS sem foto deve bloquear com mensagem na tela.
5. Abertura de OS com câmera no Android.
6. Abertura de OS com galeria no Android.
7. Abertura de OS com câmera no iPhone.
8. Abertura de OS com galeria no iPhone.
9. Abertura de OS com múltiplas fotos no desktop.
10. Realtime em duas abas sem apagar formulário aberto.

## Banco de dados

Não há alteração destrutiva ou migração SQL nova nesta versão.
