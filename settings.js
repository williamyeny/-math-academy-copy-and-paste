const SETTINGS = [
  { id: "disableGlobally", label: "Temporarily disable copy button" },
  { id: "enableQuizzes", label: "Enable for quizzes" },
  { id: "useHyphens", label: 'Use "-" instead of "*" for lists' },
  {
    id: "useNumbers",
    label: "Use numbers instead of Roman numerals for lists",
  },
];

// Create settings checkboxes
const form = document.getElementById("settingsForm");
SETTINGS.forEach((setting) => {
  const div = document.createElement("div");
  div.className = "setting-item";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = setting.id;
  input.name = setting.id;

  const label = document.createElement("label");
  label.htmlFor = setting.id;
  label.textContent = setting.label;

  div.appendChild(input);
  div.appendChild(label);
  form.appendChild(div);
});

// Save settings when changed
form.addEventListener("change", () => {
  const settings = Object.fromEntries(
    SETTINGS.map((setting) => [
      setting.id,
      document.getElementById(setting.id).checked,
    ])
  );
  chrome.storage.sync.set(settings);
});

// Load saved settings
chrome.storage.sync.get(
  SETTINGS.map((setting) => setting.id),
  (result) => {
    SETTINGS.forEach((setting) => {
      document.getElementById(setting.id).checked = result[setting.id] || false;
    });
  }
);
