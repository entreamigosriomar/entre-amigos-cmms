# Manutenção Entre Amigos — V18.1

Sistema de manutenção (CMMS) das lojas Entre Amigos: preventivas mensais com checklist padronizado, chamados abertos pelos líderes e ordens de serviço. HTML + JavaScript (módulos ES, sem build), Supabase (Postgres, Auth e Storage) e GitHub Pages.

## Perfis

| Perfil | O que faz |
| --- | --- |
| MASTER / ADMIN | Tudo, inclusive usuários |
| DIRETOR | Todas as unidades: painel, controle mensal, biblioteca de rotinas, planos, cadastros, importação |
| GERENTE | Acompanha a própria unidade; valida execuções de terceirizadas |
| TÉCNICO | “Meu dia”: preventivas (checklist um item por vez) e OS da unidade |
| LÍDER (OPERADOR) | Abre chamados (Área › Setor › Categoria › Item) e confirma a solução |

## Telas

- **Painel** — cumprimento das preventivas, atrasadas, OS abertas, custo do mês, cumprimento por unidade, “precisa de providência”, por família.
- **Controle mensal** — previsto × executado, linha do mês, filtros, executar, validar terceirizada, reprogramar ou cancelar com justificativa, imprimir/PDF.
- **Ordens de serviço** — fila por prioridade e prazo; iniciar, atualizar situação, concluir (foto, solução, tempo, custos), cancelar, reclassificar.
- **Equipamentos** — por Área › Setor; ficha com visão geral, planos, faixas aceitáveis e histórico.
- **Biblioteca de rotinas** — 51 rotinas e 364 itens do Manual de Manutenções Preventivas v1.0; a diretoria inclui, edita e desativa.
- **Áreas e categorias**, **Importar planilha**, **Usuários**.
- **Meu dia** (técnico), **Checklist**, **Meus chamados** e **Abrir chamado** (celular).

## Banco — ordem de aplicação (SQL Editor do Supabase)

| Ordem | Arquivo | Quando |
| --- | --- | --- |
| 1 | `sql/01_fechar_views.sql` | **Já aplicado em 23/10/2026** |
| 2 | `sql/02_preventivas_mensais.sql` | Antes de publicar a V18.1 |
| 3 | `sql/04_carga_biblioteca.sql` | Logo após o 02 |
| 4 | `sql/05_chamados_e_locais.sql` | Logo após o 04 |
| 5 | Publicar a V18.1 no GitHub Pages | — |
| 6 | `sql/03_fotos_privadas.sql` | **Só depois** que a V18.1 estiver no ar (a V16.1 usa links públicos) |

Todos só acrescentam tabelas, colunas e funções; nenhum dado é apagado. Cada arquivo termina com uma consulta de conferência.

## Cadastro inicial

1. Diretoria preenche `Cadastro_Equipamentos_RioMar_Recife.xlsx` (gerada por `ferramentas/gerar_planilha_cadastro.py`).
2. Tela **Importar planilha**: cria áreas, setores e categorias que faltarem, os equipamentos (com TAG), os planos de preventiva pelo Tipo e as faixas.
3. Preventivas trimestrais, semestrais e anuais: as colunas **Última trimestral / semestral / anual** recebem a data da última vez feita; a planilha mostra a **próxima estimada** e o sistema começa o ciclo nesse mês. Em branco (ou já vencida), a preventiva entra no mês atual.
4. Preventivas do mês são geradas sozinhas ao abrir o sistema (e há o botão “Gerar preventivas do mês”).
5. Cada plano guarda a **última vez feita** (atualizada sozinha ao concluir a preventiva) e mostra a **próxima** na ficha do equipamento; a diretoria pode corrigir a data em Planos › Editar.

## Usuários

Crie o login no Supabase (**Authentication › Users › Add user**). O SQL 05 cria um perfil **inativo** automaticamente; um MASTER/ADMIN define perfil, unidade e ativa na tela **Usuários**. Cada pessoa tem seu próprio login.

## Testes

- `npm test` — verificações estáticas (arquivos, sintaxe, regras críticas).
- `testes/e2e/` — teste ponta a ponta com navegador real contra uma réplica do banco (Postgres + PostgREST + simulador de Auth/Storage). Veja `testes/e2e/README.md`.

## Configuração

`src/config/supabase.js` tem a URL do projeto e a chave **publicável** (anon). A segurança fica nas regras RLS do banco; nunca coloque a chave `service_role` no código.
