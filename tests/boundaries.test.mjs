import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, TEMPLATES, FlowError } from '../src/flow.mjs';

test('reject forged states with missing, wrong or extra fields without leaking inputs', () => {
  for (const state of [{step:1}, {step:2,template:'',label:'abc'},
    {...initialState(),label:null}, {...initialState(),privateNote:'sensitive'},
    {...initialState(),label:'a'.repeat(51)}]) {
    assert.throws(() => transition(state,{type:'NEXT'}), FlowError);
  }
  assert.throws(() => transition(initialState(),{type:'sensitive'}), e => !e.message.includes('sensitive'));
});
test('bound edits, preserve input state, and make completion terminal', () => {
  const chosen=transition(initialState(),{type:'SELECT_TEMPLATE',value:'signup'});
  const edit=transition(chosen,{type:'NEXT'});
  assert.throws(() => transition(edit,{type:'EDIT_LABEL',value:'x'.repeat(51)}), FlowError);
  const labeled=transition(edit,{type:'EDIT_LABEL',value:'Synthetic journey'});
  const done=transition(transition(labeled,{type:'NEXT'}),{type:'NEXT'});
  assert.throws(() => transition(done,{type:'BACK'}), FlowError);
  assert.deepEqual(transition(done,{type:'RESET'}),initialState());
  assert.equal(edit.label,'');
  assert.ok(TEMPLATES.every(Object.isFrozen));
});

