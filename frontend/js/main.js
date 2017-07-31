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

    var Card = function(args) {
        cardsList.push(this);
        var thisCard = this;
        console.log(this);

        // Something about this is broken
        console.log(args);
        if (args === undefined) {
            var args = {};
        }
        if (args.cue === undefined) {
            args.cue = "";
        }
        if (args.notes === undefined) {
            args.notes = "";
        }

        this.cue = new Delta(args.cue);
        this.notes = new Delta(args.notes)

        // Create a card DOM object
        var node = createCardNode();
        this.node = node.card;
        root.appendChild(node.card);

        // create Quill editors for cue and notes
        var cueEditor = new Quill(node.cue, baseOptions);
        var notesEditor = new Quill(node.notes, baseOptions);

        // Populate editors
        cueEditor.setContents(args.cue);
        notesEditor.setContents(args.notes);

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
    };

    var constructJSON = function(cardList) {
        var newCardsList = [];
        cardList.forEach(function(card, index, array) {
            var newCard = {};
            newCard.cueText = card.cueEditor.getText();
            newCard.cueContents = card.cueEditor.getContents();
            newCard.notesText = card.notesEditor.getText();
            newcard.notesContents = card.notesEditor.getContents();
            newCardsList.push(newCard);
        });
        console.log(newCardsList);
    };

    var deleteCard = function(card) {
        var index = cardsList.indexOf(card);
        if (index > -1) {
            cardsList.splice(index, 1);
        }
        root.removeChild(card.node);
    };
    // TODO: make this focus on the bottom line of the editor above it.
    var moveUp = function(range, context) {
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
    var moveDown = function(range, context) {
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
    // TODO When in cue: ENTER moves to notes
    // TODO Remove last line after double enter
    var switchEditors = function() {
        var editor = identifyEditor(this);
        var nodeIndex = getNodeIndex(this.quill.container.parentNode);

        if (editor === "cueEditor") {
            cardsList[nodeIndex].notesEditor.focus();
        }
        else if (editor === "notesEditor") {
            cardsList[nodeIndex].cueEditor.focus();
        }
    };

    var enterHandler = function() {
        if (this.quill.getText().length > 1) {
            var newCard = new Card();
            var editor = identifyEditor(this);
            newCard[editor].focus();
            return false;
        }
        return true;
    };

    // TODO: set focus on another card
    // TODO: check if other editor is empty
    // TODO: pretty easy to delete things. Maybe make it more deliberate?
    // TODO: don't delete if there is only one card.
    var backspaceHandler = function() {
        if (this.quill.getText().length === 1) {
            var card = getParentCard(this);
            deleteCard(card);
        }
        return true;
    };

    var bindings = {
        upArrow: {
            key: 38,
            handler: moveUp
        },
        downArrow: {
            key: 40,
            handler: moveDown
        },
        enter: {
            key: "enter",
            empty: true,
            handler: enterHandler
        },
        tab: {
            key: "tab",
            handler: switchEditors
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
                cue: new Delta([{"insert":"Mitochondria"}]),
                notes: new Delta([{"insert":"Mitochondria are rod-shaped organelles\nConvert O2, nutrients to ATP\nThis is called aerobic respiration\nATP powers metabolic activities\nEnable cells to produce 15x more ATP"}]),
            },{
                cue: new Delta([{"insert":"What is a cell membrane?"}]),
                notes: new Delta([{"insert":"Thin, semi-permeable membrane\nSurrounds cytoplasm of cell\nProtects interior of cell\nAllows certain substances in, keeps others out"}])
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

    var loadSheet = function(JSONresponse) {
        var parsedSheet = JSON.parse(JSONresponse);
        // Create cards for every card in the sheet JSON
        for (var i = 0; i < parsedSheet.cards.length; i++) {
            new Card({cue: parsedSheet.cards[i].cue, notes: parsedSheet.cards[i].notes});
        }
    };

    /*
        Tests
    */
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
        constructJSON(cardsList);
    });

    new Card({
        cue: new Delta([{insert: "test", attributes: {"bold": true}}]),
        notes: new Delta([{insert: "test1\ntest2\ntest3"}])
    });

    return {
        // function funcName() {

        // };
    };
})();

// Keyboard behaviour
// When in cue: TAB/ENTER moves to notes
// in notes: DOUBLE ENTER or ENTER on blank line creates new card
