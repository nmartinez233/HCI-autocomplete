/**
 * Reference: https://codepen.io/shotastage/pen/KaKwya
 * 
 * 
 * Listen to user inputs and determine when to create selection menu [DONE]
 * Get location of user cursor [DONE]
 * Selection menu generator [DONE]
 * Move current highlighted option with arrow keys [DONE]
 * Select option with arrow keys or on click [DONE]
 * Move selection menu as user types [DONE]
 * Dynamic selection menu changes as user writes more? [DONE]
 * 
 * Replace text with suggestion after a trigger action [DONE]
 *    Enter [DONE]
 *    Click [DONE]
 * Remove menu  [DONE]
 * 
 */

// Class Ids
var textAreaID = "Input";
var baseOptionId = "option";
var optionClassName = "Option"
var selectionMenuClassName = "Selection";
var selectionMenuID = "selectionMenu";

// HTML document objects
var textarea = document.getElementById(textAreaID);

// State of the site
var selectionMenuPresent = false; 
// current highlighted Option, this will change based on arrow key presses
var currentOptionIdNum = 1; 
var clickMode = true; // Options are selected by click if true
var timestart = 0;
var timeDiff = 0;

// Experiment Variables
var keyWords = ["length_of_the_rectangle", "width_of_the_rectangle", "width", "length", 
                "the_total_area_inside_of_the_rectangle",
                "personal_name", "new_personal_name", "pet_age", "pet_species","owner_name",
                "new_owner_name",
                "new_age"];
var numMatching = 2;
var endLines = ["this.pet_age = new_age", "return the_total_area_inside_of_the_rectangle"]

/**
 * Function is called every time user types in textarea
 */
function detectOption() {
  autocompleteDetection(textarea);
}

/**
 * Detects when selection Menu should be generated and where
 */
function autocompleteDetection(textarea) {
  // Set the timer
  if (timestart == 0) {
    timestart = Date.now();
  }

  if (selectionMenuPresent) {
    deleteSelectionMenu();
  }
  var content = textarea.value.split("\n");
  var currentLineWords = content[content.length - 1].split(/[\s,.]+/);
  var currentWord = currentLineWords[currentLineWords.length -1];

  // Textarea value without the current word
  var contentWithoutCurrentWord = 
      textarea.value.substring(0, textarea.value.length - currentWord.length)
  var optionWords = []

  // if the currentword has at least numMatching letters, select as option.
  for (var i = 0; i < keyWords.length; i++) {
    if (contentWithoutCurrentWord.includes(keyWords[i])) { // If the keyword has been seen before

      var count = 0;
      var j = 0;
      while (j < currentWord.length && j < keyWords[i].length) {
        if (currentWord.charAt(j) == keyWords[i].charAt(j)) {
          j++;
          count++;
        } else {
          break;
        }
      }
      if (count >= numMatching && count >= currentWord.length) {
        optionWords.push(keyWords[i]);
      }
    }
  }

  // If there is at least one potential option word, generate menu
  if (optionWords.length > 0) {
    var cursorPoint = getCursorXY(textarea, 
                                  content.length, 
                                  content[content.length - 1].length);
    createSelectionMenu(optionWords, cursorPoint.x, cursorPoint.y);
  }

  // End program at end of line
  for (var i = 0; i< endLines.length; i++) {
    if (textarea.value.includes(endLines[i])) {
      timeDiff = Date.now() - timestart;
      alert("Your time was: " + timeDiff + "ms");
    }
  }
}

/**
 * Find the absolute position of the cursor relatie to the textarea
 * @param {*} lineNumber 
 * @param {*} lineLength 
 */
const getCursorXY = (textarea, lineNumber, lineLength) => {
  const paddingLeft = 30;
  const paddingTop = 20;
  const lineHeight = 20;
  const letterWidth = 10;

  const rect = textarea.getBoundingClientRect();
  return {
    x: letterWidth * lineLength + rect.x + paddingLeft,
    y: (lineHeight * lineNumber) + rect.y + paddingTop,
  }
}

/**
 * Create selection menu
 * @param {*} words array or words in selection menu
 * @param {*} left absolute position of menu (x)
 * @param {*} top absolute position of menu (y)
 */
function createSelectionMenu(words, left, top){
  var newDiv = document.createElement("div");
  newDiv.className = selectionMenuClassName;
  var ul = document.createElement("ul");
  ul.id = selectionMenuID;

  for (var i = 0; i<words.length; i++) {
    var option = document.createElement("li");
    option.className = optionClassName;
    option.id = baseOptionId + (i+1);
    option.innerHTML = words[i];
    if (clickMode) { // If click mode, select option upon clicking
      option.onclick = function() {cursorClick(this);};
    }
    ul.appendChild(option)
  }
  newDiv.appendChild(ul);
  document.body.appendChild(newDiv);
  newDiv.style.position = "absolute";
  newDiv.style.left = left + "px";
  newDiv.style.top = top + "px";
  selectionMenuPresent = true;

  if (!clickMode) {
    highlightOption(baseOptionId + 1);
  }
  
}

/** 
 * Deletes the selection menu
 * Removes div object with selection class name
 */
function deleteSelectionMenu() {
  selectionMenuPresent = false;
  document.getElementById(selectionMenuID).remove();
  currentOptionIdNum = 1;
  return
}

/**
 * Replaces the last word of the textarea with newWord
 * 
 * @param {*} newWord text to replace with
 */
function replaceTextLastWord(textarea, newWord) {
  const content = textarea.value;
  const lines = content.split("\n");
  const currentLineWords = lines[lines.length - 1].split(/[\s,.]+/);
  const currentWord = currentLineWords[currentLineWords.length - 1];
  
  if (content === currentWord) {
    textarea.value = newWord;
  } else {
    textarea.value = content.substring(0, content.length - currentWord.length) + newWord;
  }
  deleteSelectionMenu();
  textarea.focus();
}

/** 
 * cursorClick is called when an option is selected with a cursor 
 * Replaces word with suggestion 
 */
function cursorClick(option) {
  replaceTextLastWord(textarea, option.innerHTML);
}

/** 
 * enterPress is called when user presses enter on a current highlighted option
 * or, if user chose not user the selection menu
 * 
 * Replaces word with suggestion 
 */
function enterPress() {
  if (selectionMenuPresent) {
    const option = document.getElementById(baseOptionId + currentOptionIdNum).innerHTML;
    replaceTextLastWord(textarea, option);
  }
}

/**
 * Moves Highlighted option based on arrow key
 * Updates the currentOptionIdNum up if up is true, down otherwise. 
 * 0 < currentOptionIdNum <= number of options 
 * 
 * @param {*} up boolean true if arrowPress was up
 */
function arrowPress(up) {
  // call this after listenting for a certain key press
  if (up) {
    // Move up
    if (currentOptionIdNum > 1) {
      dehighlightOption(baseOptionId + currentOptionIdNum);
      currentOptionIdNum =  currentOptionIdNum - 1;
      highlightOption(baseOptionId + currentOptionIdNum);
    }
    
  } else {
    // Move Down
    var numOptions = document.getElementById(selectionMenuID).childElementCount;
    if (currentOptionIdNum < numOptions) {
      dehighlightOption(baseOptionId + currentOptionIdNum);
      currentOptionIdNum =  currentOptionIdNum + 1;
      highlightOption(baseOptionId + currentOptionIdNum);
    }
  }
}


/** 
 * Highlight the option in the selection menu 
 */
function highlightOption(optionId) {
  var option = document.getElementById(optionId);
  option.style.backgroundColor =  "#7b5294";
}

/**  
 * Removes highlight the option in the selection menu 
 */
function dehighlightOption(optionId) {
  var option = document.getElementById(optionId);
  option.style.backgroundColor =  "#353A55";
}

/**
 * Toggle the mode as key or mouse (click or enter) autocomplete
 * selection feature
 */
function toggleMode() {
  clickMode = !clickMode;
}

function addTab(textarea) {
  textarea.value = textarea.value + "    ";
}

// Keypress event listenter
document.body.onkeypress = function(e){
  if (selectionMenuPresent && !clickMode) {
    if(e.code == "Enter"){
      e.preventDefault();
      enterPress();
    } 
  } 
}

// On keydown
document.body.onkeydown = function(e){
  // Prevent arrow keys from scrolling the page
  /*if([37, 38, 39, 40].indexOf(e.keyCode) > -1) { 
    e.preventDefault();
  }*/

  if (e.code == "Tab") {
    e.preventDefault();
    addTab(textarea);
  }
  if (selectionMenuPresent && !clickMode) {
    
    if(e.code == "ArrowDown"){
      arrowPress(false);
    } else if (e.code == "ArrowUp") {
      arrowPress(true);
    } 
  }
}
