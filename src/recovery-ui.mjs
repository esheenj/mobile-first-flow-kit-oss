import {initialRecovery,transitionRecovery,explainRecovery,MAX_NETWORK_ATTEMPTS} from "./recovery.mjs";
const field=id=>document.getElementById(id);
let state=initialRecovery();
const buttons={
 start:"START",fail:"FAIL",success:"SUCCEED",
 retry:"RETRY",fix:"FIX",reset:"RESET"
};
function render(){
 field("phase").textContent=state.phase==="ready"?"Ready":state.phase==="running"?"Operation pending":state.phase==="blocked"?"Recovery needed":"Recovered";
 field("attempts").textContent="Attempt "+state.attempts+" of "+MAX_NETWORK_ATTEMPTS+" (fictional)";
 field("status").textContent=explainRecovery(state);
 field("start").hidden=state.phase!=="ready";
 field("fail").hidden=state.phase!=="running";
 field("success").hidden=state.phase!=="running";
 field("retry").hidden=state.phase!=="blocked"||state.kind!=="network"||state.attempts>=MAX_NETWORK_ATTEMPTS;
 field("fix").hidden=state.phase!=="blocked"||state.kind==="network"||state.attempts>=MAX_NETWORK_ATTEMPTS;
}
field("scenario").addEventListener("change",()=>{
 state=initialRecovery(field("scenario").value);
 render();
 field("status").focus();
});
for(const [id,event] of Object.entries(buttons)){
 field(id).addEventListener("click",()=>{
  try{
   state=transitionRecovery(state,event);
   render();
  }catch(error){
   field("status").textContent="Action rejected: "+error.code+". Reset to restart this local scenario.";
  }
  field("status").focus();
 });
}
render();
