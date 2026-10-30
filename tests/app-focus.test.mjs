import test from "node:test";
import assert from "node:assert/strict";

// Small DOM harness for the app's focus and validation behavior, without npm dependencies.
// This is not a substitute for real browser or screen-reader testing.
function fakeElement(doc, additions = {}) {
  const attributes = new Map();
  const listeners = new Map();
  return {
    hidden: false, textContent: "", value: "", checked: false,
    ...additions,
    setAttribute(name, value) { attributes.set(name, String(value)); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); },
    focus() { doc.activeElement = this; },
    addEventListener(name, listener) { listeners.set(name, listener); },
    fire(name) {
      const listener = listeners.get(name);
      assert.ok(listener, "Expected listener: " + name);
      listener({ target: this });
    }
  };
}

function fakeDocument() {
  const doc = { activeElement: null };
  const radios = ["signup", "booking", "feedback"].map(value => fakeElement(doc, { value }));
  const headings = Array.from({ length: 4 }, () => fakeElement(doc));
  const panels = headings.map((heading, index) => fakeElement(doc, {
    dataset: { panel: String(index) },
    querySelector(selector) {
      assert.equal(selector, "h2");
      return heading;
    }
  }));
  const lookup = new Map([
    ["#progress", fakeElement(doc)],
    ["#error", fakeElement(doc)],
    ["#back", fakeElement(doc)],
    ["#next", fakeElement(doc)],
    ["#restart", fakeElement(doc)],
    ["#selected-template", fakeElement(doc)],
    ["#selected-label", fakeElement(doc)],
    ["#journey-label", fakeElement(doc)]
  ]);
  doc.querySelector = selector => {
    assert.ok(lookup.has(selector), "Unexpected selector " + selector);
    return lookup.get(selector);
  };
  doc.querySelectorAll = selector => {
    if (selector === "[data-panel]") return panels;
    if (selector === 'input[name="template"]') return radios;
    throw new Error("Unexpected selector " + selector);
  };
  return { doc, radios, headings, panels, ...Object.fromEntries([...lookup.entries()].map(([key,value]) => [key.slice(1).replaceAll("-", "_"),value])) };
}

test("MF-002: invalid fields receive focus and recover through the full journey", async () => {
  const original = globalThis.document;
  const ui = fakeDocument();
  globalThis.document = ui.doc;
  try {
    await import("../src/app.mjs?mf002-focus");

    ui.next.fire("click");
    assert.match(ui.error.textContent, /Select a template/);
    assert.equal(ui.doc.activeElement, ui.radios[0]);
    assert.ok(ui.radios.every(r => r.getAttribute("aria-invalid") === "true"));
    assert.ok(ui.radios.every(r => r.getAttribute("aria-describedby") === "error"));

    ui.radios[1].fire("change");
    assert.equal(ui.error.textContent, "");
    assert.ok(ui.radios.every(r => r.getAttribute("aria-invalid") === null));
    ui.next.fire("click");
    assert.equal(ui.doc.activeElement, ui.headings[1]);

    ui.next.fire("click");
    assert.match(ui.error.textContent, /between 3 and 50 characters/);
    assert.equal(ui.doc.activeElement, ui.journey_label);
    assert.equal(ui.journey_label.getAttribute("aria-invalid"), "true");
    assert.equal(ui.journey_label.getAttribute("aria-describedby"), "label-hint error");

    ui.journey_label.value = "Fictional booking";
    ui.journey_label.fire("input");
    assert.equal(ui.error.textContent, "");
    assert.equal(ui.journey_label.getAttribute("aria-invalid"), null);
    assert.equal(ui.journey_label.getAttribute("aria-describedby"), "label-hint");

    ui.next.fire("click");
    assert.equal(ui.doc.activeElement, ui.headings[2]);
    assert.equal(ui.selected_template.textContent, "Booking flow");
    assert.equal(ui.selected_label.textContent, "Fictional booking");

    ui.back.fire("click");
    assert.equal(ui.doc.activeElement, ui.headings[1]);
    assert.equal(ui.journey_label.value, "Fictional booking");
    ui.next.fire("click");
    ui.next.fire("click");
    assert.equal(ui.progress.textContent, "Journey complete");
    assert.equal(ui.doc.activeElement, ui.headings[3]);

    ui.restart.fire("click");
    assert.equal(ui.doc.activeElement, ui.headings[0]);
    assert.equal(ui.progress.textContent, "Step 1 of 3");
    assert.equal(ui.journey_label.value, "");
    assert.ok(ui.radios.every(r => !r.checked));
  } finally {
    globalThis.document = original;
  }
});


