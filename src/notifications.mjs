// Original local-only notification experience model. No push, timers or external delivery.
export class NoticeFault extends Error {
 constructor(code){super(code);this.name="NoticeFault";this.code=code;}
}
const ID=/^[a-z][a-z0-9-]{2,36}$/;
const LEVEL=new Set(["info","important","urgent"]);
const STATUSES=new Set(["visible","dismissed","snoozed"]);
function plain(o){return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype;}
const validateRow=(row)=>{
 if(!plain(row)||Object.keys(row).length!==4||!["id","message","level","status"].every(k=>Object.hasOwn(row,k)))
  throw new NoticeFault("INVALID_NOTICE_SHAPE");
 if(typeof row.id!=="string"||!ID.test(row.id))throw new NoticeFault("INVALID_NOTICE_ID");
 if(typeof row.message!=="string"||row.message.trim().length<2||row.message.length>140)
  throw new NoticeFault("INVALID_MESSAGE");
 if(!LEVEL.has(row.level)||!STATUSES.has(row.status))throw new NoticeFault("INVALID_LEVEL_OR_STATE");
};
export function newInbox(input){
 if(!Array.isArray(input)||input.length===0||input.length>8)throw new NoticeFault("INVALID_INBOX_SIZE");
 const ids=new Set();
 const items=input.map(item=>{
  if(!plain(item)||Object.keys(item).length!==3||!["id","message","level"].every(k=>Object.hasOwn(item,k)))
   throw new NoticeFault("INVALID_INPUT");
  const row={...item,status:"visible"};
  validateRow(row);
  if(ids.has(row.id))throw new NoticeFault("DUPLICATE_ID");
  ids.add(row.id);return Object.freeze(row);
 });
 return Object.freeze({items:Object.freeze(items),revision:0});
}
export function changeInbox(inbox,id,action){
 if(!plain(inbox)||Object.keys(inbox).length!==2||!Array.isArray(inbox.items)||
  inbox.items.length<1||inbox.items.length>8||
  !Number.isInteger(inbox.revision)||inbox.revision<0||inbox.revision>100)
  throw new NoticeFault("INVALID_INBOX");
 const seen=new Set();
 for(const row of inbox.items){validateRow(row);if(seen.has(row.id))throw new NoticeFault("DUPLICATE_ID");seen.add(row.id)}
 if(typeof id!=="string"||!seen.has(id))throw new NoticeFault("UNKNOWN_NOTICE");
 if(!["DISMISS","SNOOZE","RESTORE"].includes(action))throw new NoticeFault("UNKNOWN_ACTION");
 if(inbox.revision===100)throw new NoticeFault("REVISION_LIMIT");
 const target=action==="DISMISS"?"dismissed":action==="SNOOZE"?"snoozed":"visible";
 const items=inbox.items.map(item=>Object.freeze(item.id===id?{...item,status:target}:{...item}));
 return Object.freeze({items:Object.freeze(items),revision:inbox.revision+1});
}
export function summarizeInbox(inbox){
 if(!plain(inbox)||!Array.isArray(inbox.items))throw new NoticeFault("INVALID_INBOX");
 const counts={visible:0,dismissed:0,snoozed:0};
 for(const row of inbox.items){validateRow(row);counts[row.status]++;}
 return Object.freeze({
  ...counts,
  schema:"fictional-notification-inbox-v1",
  deliveryAuthority:false,pushPermissionRequested:false,scheduledDelivery:false,
  disclaimer:"Fictional in-app state only; snooze does not set a reminder, timer or push notification."
 });
}
