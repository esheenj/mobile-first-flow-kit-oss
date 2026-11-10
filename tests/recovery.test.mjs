import assert from "node:assert/strict";
import test from "node:test";
import {initialRecovery,transitionRecovery,explainRecovery,RecoveryFault,MAX_NETWORK_ATTEMPTS,FAILURE_KINDS} from "../src/recovery.mjs";

test("a fictional network failure permits two bounded retries, no infinite loop",()=>{
 let state=initialRecovery();
 assert.equal(state.phase,"ready");
 state=transitionRecovery(state,"START");
 state=transitionRecovery(state,"FAIL");
 assert.match(explainRecovery(state),/Retry/);
 for(let n=2;n<=MAX_NETWORK_ATTEMPTS;n++){
  state=transitionRecovery(state,"RETRY");
  assert.equal(state.attempts,n);
  state=transitionRecovery(state,"FAIL");
 }
 assert.throws(()=>transitionRecovery(state,"RETRY"),e=>e instanceof RecoveryFault&&e.code==="RETRY_BUDGET_EXHAUSTED");
 assert.equal(state.phase,"blocked");
 assert.equal(transitionRecovery(state,"RESET").attempts,0);
});
test("validation, conflict and empty results require a corrective action",()=>{
 for(const kind of FAILURE_KINDS.filter(k=>k!=="network")){
  let state=transitionRecovery(initialRecovery(kind),"START");
  state=transitionRecovery(state,"FAIL");
  assert.throws(()=>transitionRecovery(state,"RETRY"),/ACTION_NOT_ALLOWED/);
  state=transitionRecovery(state,"FIX");
  assert.equal(state.phase,"running");
  state=transitionRecovery(state,"SUCCEED");
  assert.equal(state.phase,"done");
  assert.match(explainRecovery(state),/No real network/);
 }
});
test("invalid transitions and malformed forged states leave original untouched",()=>{
 const original=initialRecovery("network");
 for(const event of ["FAIL","SUCCEED","RETRY","FIX","BROKEN",null]) {
  assert.throws(()=>transitionRecovery(original,event),RecoveryFault);
 }
 for(const state of [
  {kind:"network",phase:"running",attempts:0},
  {kind:"network",phase:"ready",attempts:2},
  {kind:"network",phase:"blocked",attempts:-1},
  {kind:"network",phase:"running",attempts:Infinity},
  {...original,execution_authority:true},
  Object.assign(Object.create(null),original),
 ])assert.throws(()=>transitionRecovery(state,"START"),/INVALID_STATE/);
 assert.deepEqual(original,{kind:"network",phase:"ready",attempts:0});
 assert(Object.isFrozen(original));
 assert.throws(()=>initialRecovery("unknown"),/INVALID_KIND/);
});
test("repeated reset has stable, safely independent snapshots",()=>{
 const first=initialRecovery("empty");
 const second=transitionRecovery(first,"RESET");
 assert.deepEqual(first,second);
 assert.notStrictEqual(first,second);
 assert.equal(second.attempts,0);
});
