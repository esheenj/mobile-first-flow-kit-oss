// Original, offline and deterministic failure-recovery journey.
export class RecoveryFault extends Error {
  constructor(code) { super(code); this.name = "RecoveryFault"; this.code = code; }
}
export const FAILURE_KINDS=Object.freeze(["network","validation","conflict","empty"]);
export const MAX_NETWORK_ATTEMPTS=3;
const PHASES=new Set(["ready","running","blocked","done"]);
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

export function initialRecovery(kind="network") {
  if(typeof kind!=="string"||!FAILURE_KINDS.includes(kind)) throw new RecoveryFault("INVALID_KIND");
  return Object.freeze({kind,phase:"ready",attempts:0});
}
function assertState(value) {
  if(!value||typeof value!=="object"||Array.isArray(value)||
     Object.getPrototypeOf(value)!==Object.prototype||
     Object.keys(value).length!==3||
     !["kind","phase","attempts"].every(key=>own(value,key))||
     !FAILURE_KINDS.includes(value.kind)||!PHASES.has(value.phase)||
     !Number.isInteger(value.attempts)||value.attempts<0||
     value.attempts>MAX_NETWORK_ATTEMPTS||
     (value.phase==="ready"&&value.attempts!==0)||
     (value.phase!=="ready"&&value.attempts===0)) {
    throw new RecoveryFault("INVALID_STATE");
  }
}
export function transitionRecovery(state,action) {
  assertState(state);
  if(typeof action!=="string"||!["START","FAIL","SUCCEED","RETRY","FIX","RESET"].includes(action))
    throw new RecoveryFault("INVALID_ACTION");
  if(action==="RESET") return initialRecovery(state.kind);
  const {kind,phase,attempts}=state;
  if(phase==="ready"&&action==="START")
    return Object.freeze({kind,phase:"running",attempts:1});
  if(phase==="running"&&action==="FAIL")
    return Object.freeze({kind,phase:"blocked",attempts});
  if(phase==="running"&&action==="SUCCEED")
    return Object.freeze({kind,phase:"done",attempts});
  if(phase==="blocked"&&action==="RETRY"&&kind==="network") {
    if(attempts>=MAX_NETWORK_ATTEMPTS) throw new RecoveryFault("RETRY_BUDGET_EXHAUSTED");
    return Object.freeze({kind,phase:"running",attempts:attempts+1});
  }
  if(phase==="blocked"&&action==="FIX"&&kind!=="network") {
    if(attempts>=MAX_NETWORK_ATTEMPTS) throw new RecoveryFault("ACTION_BUDGET_EXHAUSTED");
    return Object.freeze({kind,phase:"running",attempts:attempts+1});
  }
  throw new RecoveryFault("ACTION_NOT_ALLOWED");
}
export function explainRecovery(state) {
  assertState(state);
  const hints={
    network:"Simulated connection failure. Retry at most twice after the original attempt.",
    validation:"Check a fictional field; correct it rather than blindly retrying.",
    conflict:"Review an invented stale-edit conflict before re-submitting.",
    empty:"Clear synthetic filters to recover a zero-result screen."
  };
  if(state.phase==="ready")return "Choose Start to begin the fictional "+state.kind+" scenario.";
  if(state.phase==="running")return "An operation is simulated; choose Success or Failure to inspect its outcome.";
  if(state.phase==="done")return "Recovered successfully. No real network request, account or data change occurred.";
  if(state.attempts>=MAX_NETWORK_ATTEMPTS)return "Attempt budget reached; reset to start a new local scenario.";
  return hints[state.kind];
}
