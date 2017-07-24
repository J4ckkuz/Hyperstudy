/*  TODO
    Decrease amount of repeated anonymous functions/IIFEs
*/

var hyperstudy = (function () {
    "use strict";

    var Delta = Quill.import('delta');
    /*
        Basic variables
    */
    var root = document.getElementById("sheet");

    var testSheet = {
        cards: []
    };
    var cardsList = testSheet.cards;

    var getNodeIndex = function(node) {
        for (var i = 0; i < cardsList.length; i++) {
            if (cardsList[i].node === node) {
                return i;
            }
        }
    };
    var getParentCard = function(that) {
        var i = getNodeIndex(that.quill.container.parentNode);
        return cardsList[i];
    };
    var identifyEditor = function(that) {
        // Must be passed with "this" as an argument.
        if (that.quill.container.classList.contains("cue")) {
            return "cueEditor";
        }
        else if (that.quill.container.classList.contains("notes")) {
            return "notesEditor";
        }
    };
    var Card = function(sheet, cueDelta, notesDelta) {
        sheet.cards.push(this);
        var thisCard = this;

        // Create a card DOM object
        var node = createCardNode();
        this.node = node.card;
        root.appendChild(this.node);

        // create Quill editors for cue and notes
        var cueEditor = new Quill(node.cue, baseOptions);
        var notesEditor = new Quill(node.notes, baseOptions);

        // Add references to editors.
        this.cueEditor = cueEditor;
        this.notesEditor = notesEditor;

        // Are these necessary? Might be for auto-save
        cueEditor.on("text-change", function() {
            thisCard.cue = cueEditor.getContents();
        });
        notesEditor.on("text-change", function() {
            thisCard.notes = notesEditor.getContents();
        });

        // Set editor contents
        if (paramExists(cueDelta)) {
            cueEditor.setContents(cueDelta);
        }
        if (paramExists(notesDelta)) {
            notesEditor.setContents(notesDelta);
        }
    };
    var deleteCard = function(card) {
        var index = cardsList.indexOf(card);
        if (index > -1) {
            cardsList.splice(index, 1);
        }
        root.removeChild(card.node);
    };
    // TODO: make this focus on the bottom line of the editor above it.
    var upArrowHandler = function(range, context) {
        if (range.index === 0) {
            var nodeIndex = getNodeIndex(this.quill.container.parentNode);

            if (nodeIndex > 0) {
                var editor = identifyEditor(this);
                cardsList[nodeIndex - 1][editor].focus();
            }
        }
        return true;
    };
    // TODO: same as above
    var downArrowHandler = function(range, context) {
        var thisEditor = this.quill;
        if (thisEditor.getSelection().index === thisEditor.getText().length - 1) {
            var nodeIndex = getNodeIndex(this.quill.container.parentNode);

            if (nodeIndex < cardsList.length - 1) {
                var editor = identifyEditor(this);
                cardsList[nodeIndex + 1][editor].focus();
            }
        }
        return true;
    };
    // TODO: make this insert after the current card
    // TODO: feels a little weird. Experiment with some control options, such as
    // time between presses, different amounts of newlines.
    // Could be used to restrict behaviour.
    // TODO When in cue: TAB/ENTER moves to notes
    // TODO Remove last line after double enter
    var enterHandler = function() {
        if (this.quill.getText().length > 1) {
            var newCard = new Card(testSheet);
            var editor = identifyEditor(this);
            newCard[editor].focus();
            return false;
        }
        return true;
    };
    var tabHandler = function() {
        var editor = identifyEditor(this);
        var nodeIndex = getNodeIndex(this.quill.container.parentNode);

        if (editor === "cueEditor") {
            cardsList[nodeIndex].notesEditor.focus();
        }
        else if (editor === "notesEditor") {
            cardsList[nodeIndex].cueEditor.focus();
        }
    };

    // TODO: set focus on another card
    // TODO: check if other editor is empty
    // TODO: pretty easy to delete things. Maybe make it more deliberate?
    // TODO: don't delete if there is only one card.
    var backspaceHandler = function() {
        var card = getParentCard(this);
        deleteCard(card);
    };


    var bindings = {
        upArrow: {
            key: 38,
            handler: upArrowHandler
        },
        downArrow: {
            key: 40,
            handler: downArrowHandler
        },
        enter: {
            key: "enter",
            empty: true,
            handler: enterHandler
        },
        tab: {
            key: "tab",
            handler: tabHandler
        },
        backspace: {
            key: "backspace",
            empty: true,
            handler: backspaceHandler
        }
    };
    var baseOptions = {
        placeholder: "Write something...",
        theme: "bubble",
        modules: {
            keyboard: {
                bindings: bindings
            }
        }
    };

    // Simulated JSON from server. Should actually have deltas instead of strings
    var exampleSheet = {
        name: "Biology 101",
        date: Date.now(),
        cards: [
            {
                cue: "Mitochondria",
                notes: [
                    "Mitochondria are rod-shaped organelles",
                    "Convert O2, nutrients to ATP",
                    "This is called aerobic respiration",
                    "ATP powers metabolic activities",
                    "Enable cells to produce 15x more ATP"
                ],
                // A reference to the DOM object. This should be added by the client when cards are added, not included in the JSON or stored in the database.
            },{
                cue: "What is a cell membrane?",
                notes: [
                    "Thin, semi-permeable membrane",
                    "Surrounds cytoplasm of cell",
                    "Protects interior of cell",
                    "Allows certain substances in, keeps others out"
                ]
            }
        ]
    };
    var exampleJSON = JSON.stringify(exampleSheet);

    /*
        Utility functions
    */

    // I'm not sure if this is just a waste of space tbh. Saves a couple of lines. worth it imo
    var createAndClass = function(type) {
        var element = document.createElement("div");
        element.classList.add(type);
        return element;
    };
/*
A word on the database/storage method:
Store both the Delta (for editor/viewing usage) and the plaintext form (for revision usage).
Not sure yet where the Delta wil be processed. Write a function for it anyway, since it'll be used somewhere.
*/
    var paramExists = function(parameter) {
        if (parameter !== undefined) {
            return true;
        } else {
            return false;
        }
    };
    var createCardNode = function() {
        var cardNode = document.createElement("section");
        cardNode.classList.add("card");
        var cueNode = createAndClass("cue");
        var notesNode = createAndClass("notes");
        cardNode.appendChild(cueNode);
        cardNode.appendChild(notesNode);
        return {card: cardNode, cue: cueNode, notes: notesNode};
    };
    var toDelta = function(text) {
        var delta = new Delta();
        if (typeof text === 'string') {
            delta.insert(text);
        }
        if (text.constructor === Array) {
            var joinedArray = text.join("\n");
            delta.insert(joinedArray);
        }
        return delta;
    };

    // consider splitting into functions
    // sheet argument isn't necessary


    var loadSheet = function(JSONresponse) {
        var sheet = JSON.parse(JSONresponse);
        // Create cards for every card in the sheet JSON
        for (var i = 0; i < sheet.cards.length; i++) {
            // TODO later, the toDelta() will not be needed as the JSON will contain Deltas.
            new Card(testSheet, toDelta(sheet.cards[i].cue), toDelta(sheet.cards[i].notes));
        }
    };
    /*
        Tests
    */

    var testDelta = toDelta("Test");
    var testDelta2 = toDelta(["Makes 2 assumptions:", "Atoms have fixed sizes", "Atoms are hard and not deformable"]);

    document.getElementById("cardAdder").addEventListener("click", function () {
        new Card(testSheet);
    });
    document.getElementById("accessTester").addEventListener("click", function () {
        console.log(testSheet);
    });
    document.getElementById("test1").addEventListener("click", function () {
        loadSheet(exampleJSON);
    });
    document.getElementById("test2").addEventListener("click", function () {

    });
    new Card(testSheet);


    return {
        // function funcName() {

        // };
    };
})();

// Keyboard behaviour
// When in cue: TAB/ENTER moves to notes
// in notes: DOUBLE ENTER or ENTER on blank line creates new card
