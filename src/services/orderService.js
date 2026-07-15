import {sb} from '../config/supabase.js';
export const listOrders=unitId=>sb.from('ordens_servico').select('*').eq('unidade_id',unitId).order('data_abertura',{ascending:false});
export const createOrder=payload=>sb.from('ordens_servico').insert(payload).select().single();
export const updateOrder=(id,payload)=>sb.from('ordens_servico').update(payload).eq('id',id);
export const listOpeningPhotos=ids=>sb.from('os_anexos').select('os_id,arquivo_url').in('os_id',ids).eq('origem','abertura').order('criado_em',{ascending:true});
export const listAttachments=id=>sb.from('os_anexos').select('*').eq('os_id',id).order('criado_em',{ascending:false});
export const insertAttachment=payload=>sb.from('os_anexos').insert(payload);
export const countOpenEquipmentOrders=(equipmentId,excludeId)=>sb.from('ordens_servico').select('id',{count:'exact',head:true}).eq('equipamento_id',equipmentId).not('status','in','(CONCLUIDA,CANCELADA)').neq('id',excludeId);
export const insertCost=payload=>sb.from('os_custos').insert(payload);
