import { initialState, transition, TEMPLATES, FlowError } from "../src/flow.mjs";

let state = initialState();
const panels = Array.from(document.querySelectorAll("[data-panel]"));
const progress = document.querySelector("#progress");
const error = document.querySelector("#error");
const prev = document.querySelector("#back");
const next = document.querySelector("#next");
const restart = document.querySelector("#restart");
const templateInputs = Array.from(document.querySelectorAll('input[name="template"]'));
const labelInput = document.querySelector("#journey-label");

function render() {
  panels.forEach(panel => { panel.hidden = Number(panel.dataset.panel) !== state.step; });
  progress.textContent = state.step === 3 ? "Journey complete" : `Step ${state.step + 1} of 3`;
  prev.hidden = state.step === 0 || state.step === 3;
  next.hidden = state.step === 3;
  next.textContent = state.step === 2 ? "Finish" : "Continue";
  restart.hidden = state.step !== 3;
  document.querySelector("#selected-template").textContent =
    TEMPLATES.find(t => t.id === state.template)?.label ?? "None";
  document.querySelector("#selected-label").textContent = state.label.trim() || "None";
  if (labelInput.value !== state.label) labelInput.value = state.label;
  templateInputs.forEach(el => { el.checked = el.value === state.template; });
}
function clearValidation() {
  error.textContent = "";
  for (const radio of templateInputs) {
    radio.removeAttribute("aria-invalid");
    radio.removeAttribute("aria-describedby");
  }
  labelInput.removeAttribute("aria-invalid");
  labelInput.setAttribute("aria-describedby", "label-hint");
}

function showValidation(message) {
  error.textContent = message;
  if (state.step === 0) {
    for (const radio of templateInputs) {
      radio.setAttribute("aria-invalid", "true");
      radio.setAttribute("aria-describedby", "error");
    }
    templateInputs[0]?.focus();
  } else if (state.step === 1) {
    labelInput.setAttribute("aria-invalid", "true");
    labelInput.setAttribute("aria-describedby", "label-hint error");
    labelInput.focus();
  } else {
    error.focus();
  }
}

function dispatch(action) {
  try {
    state = transition(state, action);
    clearValidation();
    render();
    if (["NEXT", "BACK", "RESET"].includes(action.type)) {
      panels[state.step].querySelector("h2")?.focus();
    }
  } catch (exception) {
    if (!(exception instanceof FlowError)) throw exception;
    showValidation(exception.message);
  }
}
templateInputs.forEach(el => {
  el.addEventListener("change", () => dispatch({ type: "SELECT_TEMPLATE", value: el.value }));
});
labelInput.addEventListener("input", e => {
  dispatch({ type: "EDIT_LABEL", value: e.target.value });
});
prev.addEventListener("click", () => dispatch({ type: "BACK" }));
next.addEventListener("click", () => dispatch({ type: "NEXT" }));
restart.addEventListener("click", () => dispatch({ type: "RESET" }));
render();


