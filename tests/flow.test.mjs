import test from "node:test";
import assert from "node:assert/strict";
import { initialState, transition, FlowError } from "../src/flow.mjs";

test("complete synthetic journey through each step", () => {
  let state = initialState();
  state = transition(state, { type: "SELECT_TEMPLATE", value: "signup" });
  state = transition(state, { type: "NEXT" });
  state = transition(state, { type: "EDIT_LABEL", value: "Fictional signup" });
  state = transition(state, { type: "NEXT" });
  state = transition(state, { type: "NEXT" });
  assert.equal(state.step, 3);
  assert.equal(state.label, "Fictional signup");
});
test("negative case: no selection", () => {
  assert.throws(() => transition(initialState(), { type: "NEXT" }), /Select a template/);
});
test("negative case: short labels and invalid templates", () => {
  assert.throws(() => transition(initialState(), { type: "SELECT_TEMPLATE", value: "unknown" }), FlowError);
  let state = transition(initialState(), { type: "SELECT_TEMPLATE", value: "booking" });
  state = transition(state, { type: "NEXT" });
  const invalid = transition(state, { type: "EDIT_LABEL", value: "a" });
  assert.throws(() => transition(invalid, { type: "NEXT" }), /between 3 and 50/);
  assert.equal(invalid.step, 1);
});
test("back preserves choices and reset clears them", () => {
  const start = initialState();
  const chosen = transition(start, { type: "SELECT_TEMPLATE", value: "feedback" });
  const next = transition(chosen, { type: "NEXT" });
  assert.equal(transition(next, { type: "BACK" }).template, "feedback");
  assert.deepEqual(transition(next, { type: "RESET" }), start);
  assert.deepEqual(start, initialState());
});
test("rejects malformed state and action", () => {
  assert.throws(() => transition({ step: 99 }, { type: "NEXT" }), FlowError);
  assert.throws(() => transition(initialState(), { type: "SEND" }), /Unknown action/);
});


