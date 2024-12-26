let extensionSettings = {};

const romanize = (num) => {
  const roman = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  let str = "";

  for (let i of Object.keys(roman)) {
    const q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }

  return str;
};

const BUTTON_CONTAINER_CLASS = "macp-copy-button-container";
const BUTTON_CLASS = "macp-copy-button";

const buttonHTML = `
    <div class="${BUTTON_CONTAINER_CLASS}">
        <button class="${BUTTON_CLASS}">
            Copy
        </button>
    </div>
`;

const addButtonsToSections = () => {
  if (extensionSettings?.disableGlobally) {
    return;
  }

  if (
    window.location.href.includes("/tests/") &&
    !extensionSettings?.enableQuizzes
  ) {
    return;
  }

  const SECTIONS = [
    ".exampleQuestion",
    ".exampleExplanation",
    ".questionText",
    ".tutorial",
    ".questionExplanation",
    ".questionWidget-text",
    ".questionWidget-explanation",
    '.step[steptype="tutorial"]',
  ];

  const sections = document.querySelectorAll(
    SECTIONS.map((qs) => `${qs}`).join(",")
  );

  for (const section of sections) {
    if (!section.querySelector(`.${BUTTON_CONTAINER_CLASS}`)) {
      const studentAnswerHeader = section.querySelector(".studentAnswerHeader");
      if (studentAnswerHeader) {
        studentAnswerHeader.insertAdjacentHTML("beforebegin", buttonHTML);
      } else {
        section.insertAdjacentHTML("beforeend", buttonHTML);
      }

      const button = section.querySelector(
        `.${BUTTON_CONTAINER_CLASS} > button`
      );
      button.addEventListener("click", (e) => {
        e.stopPropagation();

        // Clone the section to edit what elements to copy
        const sectionClone = section.cloneNode(true);

        const ELEMENTS_TO_REMOVE = [
          ".stepHeader",
          ".studentAnswerHeader",
          ".studentAnswer",
          `.${BUTTON_CONTAINER_CLASS}`,
          "style",
          ".graphic", // Hmm, replace with `[graphic]` instead?
        ];
        for (const element of sectionClone.querySelectorAll(
          ELEMENTS_TO_REMOVE.map((qs) => `${qs}`).join(",")
        )) {
          element.remove();
        }

        // Find MathJax sections and convert to tex
        const mathJaxElements = sectionClone.querySelectorAll(".MathJax");
        for (const mje of mathJaxElements) {
          const mathML = mje.querySelector("math")?.innerHTML;
          if (mathML) {
            const alteredDiv = document.createElement("div");
            alteredDiv.classList.add("altered-MathJax");
            alteredDiv.textContent = MathMLToLaTeX.MathMLToLaTeX.convert(
              `<math>${mathML}</math>`
            );
            mje.replaceWith(alteredDiv);
          }
        }

        // Trim MathJax parent container newlines
        const pages = sectionClone.querySelectorAll(".mjpage");
        for (const page of pages) {
          page.textContent = page.textContent.trim();
        }

        // If there are ordered lists, add the roman numerals
        const orderedLists = sectionClone.querySelectorAll("ol");
        for (const orderedList of orderedLists) {
          const listItems = orderedList.querySelectorAll("li");
          for (let i = 0; i < listItems.length; i++) {
            const marker = extensionSettings.useNumbers
              ? i + 1
              : romanize(i + 1);
            console.log(extensionSettings.useNumbers);
            listItems[i].textContent = `${marker}. ${listItems[
              i
            ].textContent?.trim()}`;
          }
          orderedList.textContent = orderedList.textContent.trim();
        }

        // If there are unordered lists, add hyphen
        const unorderedLists = sectionClone.querySelectorAll("ul");
        for (const unorderedList of unorderedLists) {
          const listItems = unorderedList.querySelectorAll("li");
          for (let i = 0; i < listItems.length; i++) {
            const marker = extensionSettings.useHyphens ? "-" : "*";
            listItems[i].textContent = `${marker} ${listItems[
              i
            ].textContent?.trim()}`;
          }
          unorderedList.textContent = unorderedList.textContent.trim();
        }

        const tables = sectionClone.querySelectorAll("table");
        for (const table of tables) {
          const markdownTable = htmlTableToMarkdown(table);
          const replacementDiv = document.createElement("div");
          replacementDiv.textContent = markdownTable;
          table.replaceWith(replacementDiv);
        }

        const textToCopy = sectionClone.textContent.trim();

        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            button.textContent = "Copied!";
            setTimeout(() => {
              button.textContent = "Copy";
            }, 2000);
          })
          .catch((err) => {
            console.error("Failed to copy:", err);
            button.textContent = "Failed to copy";
            setTimeout(() => {
              button.textContent = "Copy";
            }, 2000);
          });
      });
    }
  }
  console.log(`Processed ${sections.length} sections`);
};

// Initialize extension
const init = async () => {
  try {
    extensionSettings = await chrome.storage.sync.get();
  } catch (error) {
    console.error("Error loading settings:", error);
  }

  const targetToAddedNodes = new WeakMap();

  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      const numAddedNodes = mutation.addedNodes.length;
      if (
        mutation.type === "childList" &&
        numAddedNodes &&
        targetToAddedNodes.get(mutation.target) !== numAddedNodes
      ) {
        targetToAddedNodes.set(mutation.target, numAddedNodes);
        addButtonsToSections();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  addButtonsToSections();
};

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    for (const key in changes) {
      extensionSettings[key] = changes[key].newValue;
    }
    console.log(extensionSettings);
  }
});

// Start the extension
init();
