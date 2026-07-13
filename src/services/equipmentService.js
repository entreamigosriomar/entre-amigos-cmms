import {sb} from '../config/supabase.js';
export const listEquipment=unitId=>sb.from('equipamentos').select('*').eq('unidade_id',unitId).eq('ativo',true).order('nome');
export const updateEquipment=(id,payload)=>sb.from('equipamentos').update(payload).eq('id',id);
export const deleteEquipment=id=>sb.from('equipamentos').delete().eq('id',id);
export const insertEquipment=payload=>sb.from('equipamentos').insert(payload);
export const generateTag=unitId=>sb.rpc('gerar_tag_equipamento',{p_unidade_id:unitId});
