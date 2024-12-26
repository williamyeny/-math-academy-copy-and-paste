// Credit: https://github.com/jmalarcon/markdowntables/blob/master/scripts/code.js
// I took the code and modified it a bit, it's largely the same though.

function htmlTableToMarkdown(tableElement) {
  // Initialize variables
  let markdownString = "";
  let tableHeader = "|";
  let tableHeaderFooter = "|";
  let tableRows = "";
  let tableHeaderFound = false;
  let tableHeaderCellCount = 0;
  let prevRowCellCount = 0;

  // Process thead if exists
  const theadCells = tableElement
    .querySelector("thead")
    ?.querySelectorAll("tr > td");
  if (theadCells) {
    theadCells.forEach((cell) => {
      tableHeaderCellCount++;
      tableHeader += fixText(cell.textContent) + "|";
      tableHeaderFooter += "--- |";
      tableHeaderFound = true;
    });
  }

  // Process all rows
  const rows = tableElement.querySelectorAll("tr");
  for (const row of rows) {
    // Get header if not found in thead
    if (!tableHeaderFound) {
      const headerCells = row.querySelectorAll("th");
      headerCells.forEach((cell) => {
        tableHeaderCellCount++;
        tableHeader += fixText(cell.textContent) + "|";
        tableHeaderFooter += "--- |";
        tableHeaderFound = true;
      });
    }

    // Process regular cells
    let tableRow = "";
    let currRowCellCount = 0;
    const cells = row.querySelectorAll("td:not(thead > tr > td)");
    cells.forEach((cell) => {
      currRowCellCount++;
      tableRow += fixText(cell.textContent) + "|";
    });

    // Check row cell count consistency
    if (prevRowCellCount !== 0 && currRowCellCount !== prevRowCellCount) {
      return "ERROR: Your HTML table rows don't have the same number of cells. Colspan not supported.";
    }

    // Add row if it has data
    if (currRowCellCount) {
      tableRows += "|" + tableRow + "\n";
      prevRowCellCount = currRowCellCount;
    }
  }

  // Process final output
  // NOTE for MACP: I removed the part that adds an empty header if there is no HTML header
  if (tableHeaderFound) {
    if (tableHeaderCellCount !== prevRowCellCount) {
      return "ERROR: The number of cells in your header doesn't match the number of cells in your rows.";
    }
    markdownString += tableHeader + "\n";
    markdownString += tableHeaderFooter + "\n";
  }
  markdownString += tableRows;

  return markdownString.trim();
}

function fixText(text) {
  // Assume fixText function exists or implement if needed
  return text.trim();
}
