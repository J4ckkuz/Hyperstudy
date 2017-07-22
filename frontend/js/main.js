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

    // Don't really need this
    var updateProperty = function(editor, property, that) {
        that[property] = editor.getContents();
    };

/*
A word on the database/storage method:
Store both the Delta (for editor/viewing usage) and the plaintext form (for revision usage).
Not sure yet where the Delta wil be processed. Write a function for it anyway, since it'll be used somewhere.


Card {
    cueEditor:
    cueDelta:
    cueText:
    notesEditor:
    notesDelta:
    notesText:
}
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

    var Card = function(sheet, cueDelta, notesDelta) {
        sheet.cards.push(this);
        var thisCard = this;

        // Create a card DOM object
        var node = createCardNode();
        root.appendChild(node.card);

        // create Quill editors for cue and notes
        var cueEditor = new Quill(node.cue);
        var notesEditor = new Quill(node.notes);

        // Add references to editors.
        this.cueEditor = cueEditor;
        this.notesEditor = notesEditor;

        // Are these necessary?
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

    var loadSheet = function(JSONresponse) {
        var sheet = JSON.parse(JSONresponse);
        // Create cards for every card in the sheet JSON
        for (var i = 0; i < sheet.cards.length; i++) {
            // later, the toDelta() will not be needed as the JSON will contain Deltas.
            new Card(testSheet, toDelta(sheet.cards[i].cue), toDelta(sheet.cards[i].notes));
        }

    };
    /*
        Tests
    */

    var testDelta = toDelta("Test");
    var testDelta2 = toDelta(["Makes 2 assumptions:", "Atoms have fixed sizes", "Atoms are hard and not deformable"]);

    document.getElementById("cardAdder").addEventListener("click", function () {
        new Card(testSheet, testDelta, testDelta2);
    });
    document.getElementById("accessTester").addEventListener("click", function () {
        console.log(testSheet);
    });
    document.getElementById("test1").addEventListener("click", function () {
        loadSheet(exampleJSON);
    });
    document.getElementById("test2").addEventListener("click", function () {

    });



    return {
        // function funcName() {

        // };
    };
})();

// Keyboard behaviour
// When in cue: TAB/ENTER moves to notes
// UP/DOWN change card
// in notes: DOUBLE ENTER or ENTER on blank line creates new card
