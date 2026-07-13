import {store,isPrivileged} from '../state/store.js';
export const canManageCatalog=()=>isPrivileged();
export const canDeleteCatalog=()=>canManageCatalog();
export const isTechnician=()=>store.currentProfile?.role==='TECNICO';
export const canSwitchUnits=()=>isPrivileged();
