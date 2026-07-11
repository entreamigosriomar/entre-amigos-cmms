# V15.3 — Supabase sincronizado

Esta versão resolve:

- equipamento cadastrado no Android aparece no iPhone;
- OS criada em um aparelho aparece nos demais;
- preventivas compartilhadas entre aparelhos;
- fotos reais enviadas ao Supabase Storage;
- dois botões separados: **Tirar foto** e **Escolher da galeria**;
- fotos múltiplas obrigatórias para concluir OS e preventiva;
- atualização automática a cada 12 segundos e tentativa de Realtime.

## Antes de publicar

1. No Supabase, abra **SQL Editor**.
2. Execute o arquivo `MIGRACAO_V15_3.sql`.
3. No GitHub, substitua:
   - `index.html`
   - `README.md`
4. Aguarde o GitHub Pages concluir.
5. Nos dois celulares, feche a aba antiga e abra novamente o link.
6. Faça login nos dois aparelhos com o mesmo usuário do Supabase.

## Teste recomendado

1. Cadastre um equipamento no Xiaomi.
2. Aguarde até 12 segundos no iPhone ou toque em **Atualizar agora**.
3. Abra uma OS no iPhone.
4. Confirme que apareceu no Xiaomi.
5. Conclua usando **Tirar foto** ou **Escolher da galeria**.
