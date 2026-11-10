import {newInbox,changeInbox,summarizeInbox} from "./notifications.mjs";
const $=id=>document.getElementById(id);
const sample=[
 {id:"sample-info",message:"Invented checklist updated",level:"info"},
 {id:"sample-warning",message:"Fictional review needed",level:"important"},
 {id:"sample-alert",message:"Synthetic deadline notice",level:"urgent"}
];
let inbox=newInbox(sample);
function render(){
 $("notices").replaceChildren();
 const counts=summarizeInbox(inbox);
 $("status").textContent=counts.visible+" visible · "+counts.snoozed+" snoozed · "+counts.dismissed+
   " dismissed (local simulation; no future delivery).";
 for(const item of inbox.items){
  const li=document.createElement("li");
  const heading=document.createElement("strong");heading.textContent=item.message;
  const meta=document.createElement("p");
  meta.textContent=item.level.toUpperCase()+" · "+item.status;
  const actions=document.createElement("div");actions.className="actions";
  for(const [type,label] of [["DISMISS","Dismiss"],["SNOOZE","Snooze visually"],["RESTORE","Restore"]]){
   const button=document.createElement("button");
   button.type="button";button.textContent=label+" · "+item.id;
   button.disabled=(type==="DISMISS"&&item.status==="dismissed")||
     (type==="SNOOZE"&&item.status==="snoozed")||
     (type==="RESTORE"&&item.status==="visible");
   button.addEventListener("click",()=>{
    inbox=changeInbox(inbox,item.id,type);
    render();
    $("status").focus();
   });
   actions.append(button);
  }
  li.append(heading,meta,actions);$("notices").append(li);
 }
}
$("reset").addEventListener("click",()=>{
 inbox=newInbox(sample);render();$("reset").focus();
});
render();
