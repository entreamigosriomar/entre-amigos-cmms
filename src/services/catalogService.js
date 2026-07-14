import {sb} from '../config/supabase.js';
export const listSectors=unitId=>sb.from('setores').select('*').eq('unidade_id',unitId).eq('ativo',true).order('nome');
export const listAreas=unitId=>sb.from('areas').select('*').eq('unidade_id',unitId).eq('ativo',true).order('nome');
export const listCategories=unitId=>sb.from('categorias_manutencao').select('*').eq('unidade_id',unitId).eq('ativo',true).order('nome');
export const catalogTable=type=>type==='setor'?'setores':type==='area'?'areas':'categorias_manutencao';
export const insertCatalog=(table,payload)=>sb.from(table).insert(payload);
export const updateCatalog=(table,id,payload)=>sb.from(table).update(payload).eq('id',id);
export const deleteCatalog=(table,id)=>sb.from(table).delete().eq('id',id);
