export const store={currentUser:null,currentProfile:null,unitId:null,currentRoute:'dashboard',lastRefresh:0,availableUnits:[],equipment:[],sectors:[],areas:[],categories:[],orders:[],preventives:[],profiles:[],realtimeChannel:null,isFormDirty:false,isSubmitting:false};
export function setBase({equipment=[],sectors=[],areas=[],categories=[],orders=[],preventives=[],profiles=[]}){Object.assign(store,{equipment,sectors,areas,categories,orders,preventives,profiles,lastRefresh:Date.now()});}
export function currentUnitName(){return store.availableUnits.find(u=>u.id===store.unitId)?.nome||'Unidade';}
export function isPrivileged(){return ['MASTER','ADMIN','DIRETOR'].includes(store.currentProfile?.role);}
