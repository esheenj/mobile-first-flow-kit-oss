import test from "node:test";
import assert from "node:assert/strict";
import {newInbox,changeInbox,summarizeInbox,NoticeFault} from "../src/notifications.mjs";
const input=()=>[
 {id:"sample-info",message:"Invented checklist updated",level:"info"},
 {id:"sample-warning",message:"Fictional review needed",level:"important"},
 {id:"sample-alert",message:"Synthetic deadline notice",level:"urgent"}
];
test("tracks local-only dismiss, snooze and restore without delivery authority",()=>{
 const first=newInbox(input());
 assert.equal(summarizeInbox(first).visible,3);
 const snoozed=changeInbox(first,"sample-warning","SNOOZE");
 assert.equal(summarizeInbox(snoozed).snoozed,1);
 const removed=changeInbox(snoozed,"sample-alert","DISMISS");
 assert.equal(summarizeInbox(removed).dismissed,1);
 const restored=changeInbox(removed,"sample-alert","RESTORE");
 assert.equal(summarizeInbox(restored).visible,2);
 assert.equal(summarizeInbox(restored).scheduledDelivery,false);
 assert.equal(summarizeInbox(restored).pushPermissionRequested,false);
 assert.equal(first.items[1].status,"visible");
 assert(Object.isFrozen(restored.items));
});
test("rejects duplicate identifiers, markup or invalid dimensions in model input",()=>{
 for(const invalid of [
  [],Array(9).fill(input()[0]),
  [input()[0],input()[0]],
  [{...input()[0],id:"../secret"}],
  [{...input()[0],level:"production"}],
  [{...input()[0],message:""}],
  [{...input()[0],extra:"private"}],
  [Object.assign(Object.create(Date.prototype),input()[0])]
 ])assert.throws(()=>newInbox(invalid),NoticeFault);
});
test("does not trust a forged inbox or unexpected action",()=>{
 const inbox=newInbox(input());
 assert.throws(()=>changeInbox(inbox,"missing","DISMISS"),/UNKNOWN_NOTICE/);
 assert.throws(()=>changeInbox(inbox,"sample-info","DELETE"),/UNKNOWN_ACTION/);
 assert.throws(()=>changeInbox({...inbox,revision:Infinity},"sample-info","SNOOZE"),/INVALID_INBOX/);
 assert.throws(()=>changeInbox({...inbox,items:[...inbox.items,inbox.items[0]]},"sample-info","SNOOZE"),/DUPLICATE_ID/);
});
test("unsafe-looking messages remain inert string data",()=>{
 const x=input();x[0].message="<img src=x onerror=alert(1)>";
 const i=newInbox(x);
 assert.equal(i.items[0].message,x[0].message);
});
