// Pure interaction model. All scenarios and data are synthetic.
export class FlowError extends Error {
  constructor(message) {
    super(message);
    this.name = "FlowError";
  }
}

export const TEMPLATES = Object.freeze([
  Object.freeze({ id: "signup", label: "Sign-up flow" }),
  Object.freeze({ id: "booking", label: "Booking flow" }),
  Object.freeze({ id: "feedback", label: "Feedback flow" })
]);

export function initialState() {
  return { step: 0, template: "", label: "" };
}

export function transition(state, action) {
  if (!state || typeof state !== "object" || Array.isArray(state) ||
      !Number.isInteger(state.step) || state.step < 0 || state.step > 3 ||
      typeof state.template !== "string" || typeof state.label !== "string" ||
      state.label.length > 50 ||
      (state.template !== "" && !TEMPLATES.some(t => t.id === state.template)) ||
      (state.step > 0 && state.template === "") ||
      (state.step > 1 && state.label.trim().length < 3) ||
      Object.keys(state).some(k => !["step", "template", "label"].includes(k)))
    throw new FlowError("Invalid flow state.");
  if (!action || typeof action !== "object" || Array.isArray(action) || typeof action.type !== "string")
    throw new FlowError("An action type is required.");
  switch (action.type) {
    case "SELECT_TEMPLATE":
      if (state.step !== 0 || !TEMPLATES.some(t => t.id === action.value))
        throw new FlowError("Choose an available template.");
      return { ...state, template: action.value };
    case "EDIT_LABEL":
      if (state.step !== 1 || typeof action.value !== "string" || action.value.length > 50)
        throw new FlowError("Enter a text label of at most 50 characters on step two.");
      return { ...state, label: action.value };
    case "NEXT":
      if (state.step === 0 && !TEMPLATES.some(t => t.id === state.template))
        throw new FlowError("Select a template to continue.");
      if (state.step === 1 && (state.label.trim().length < 3 || state.label.trim().length > 50))
        throw new FlowError("Enter a label between 3 and 50 characters.");
      if (state.step === 3) throw new FlowError("This journey is already complete.");
      return { ...state, step: state.step + 1 };
    case "BACK":
      if (state.step === 3) throw new FlowError("Reset the completed journey to begin again.");
      return { ...state, step: Math.max(0, state.step - 1) };
    case "RESET":
      return initialState();
    default:
      throw new FlowError("Unknown action.");
  }
}


