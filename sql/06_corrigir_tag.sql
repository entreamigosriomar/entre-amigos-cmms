-- =====================================================================
-- 06 — Corrige a geração de TAG dos equipamentos
-- Projeto: manutencao-entre-amigos (Supabase)  •  Versão: V18.1  •  24/10/2026
--
-- Problema: gerar_tag_equipamento usava um contador global (hoje em 578.908)
-- e cortava o número em 3 dígitos (lpad corta textos maiores). Toda TAG nova
-- saía igual (EA-RMR-578) e o banco recusava por "TAG repetida".
--
-- Correção: a TAG passa a ser sequencial POR UNIDADE (EA-RMR-001, 002…),
-- pegando o maior número já usado naquela unidade + 1, sem cortar dígitos.
-- Também renumera a TAG errada EA-xxx-578 criada no teste e dá TAG a
-- equipamentos que estiverem sem.
-- Só altera a função e TAGs; nenhum equipamento é apagado.
-- =====================================================================

begin;

-- Próxima TAG da unidade (uso interno, sem checagem de perfil)
create or replace function public.proxima_tag_unidade(p_unidade_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_prefixo text;
  v_num int;
begin
  select nome into v_nome from unidades where id = p_unidade_id;
  if v_nome is null then
    raise exception 'Unidade não encontrada.';
  end if;
  v_prefixo := unidade_tag_prefixo(v_nome);
  -- evita duas TAGs iguais quando duas pessoas cadastram ao mesmo tempo
  perform pg_advisory_xact_lock(hashtext('tag:' || v_prefixo));
  select coalesce(max((substring(tag from '^EA-' || v_prefixo || '-([0-9]+)$'))::int), 0) + 1
    into v_num
    from equipamentos
   where tag ~ ('^EA-' || v_prefixo || '-[0-9]+$');
  return 'EA-' || v_prefixo || '-' || case when v_num < 1000 then lpad(v_num::text, 3, '0') else v_num::text end;
end;
$$;
revoke execute on function public.proxima_tag_unidade(uuid) from anon, public, authenticated;

-- Função chamada pelo sistema (mesma assinatura e mesma regra de permissão de antes)
create or replace function public.gerar_tag_equipamento(p_unidade_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_my_role() not in ('MASTER','ADMIN','DIRETOR') then
    raise exception 'Sem permissão para gerar TAG.';
  end if;
  return proxima_tag_unidade(p_unidade_id);
end;
$$;

-- Renumera a TAG errada do teste (EA-xxx-578) e dá TAG a quem estiver sem
do $$
declare r record;
begin
  update equipamentos set tag = null where tag ~ '^EA-[A-Z]+-578$';
  for r in select id, unidade_id from equipamentos where tag is null order by criado_em loop
    update equipamentos set tag = proxima_tag_unidade(r.unidade_id) where id = r.id;
  end loop;
end $$;

commit;

-- Conferência: TAGs mais recentes por unidade (devem ser EA-RMR-001, 002…)
select u.nome as unidade, e.tag, e.nome
from equipamentos e join unidades u on u.id = e.unidade_id
order by e.criado_em desc
limit 10;
