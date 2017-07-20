/*
I feel like I might be going about this the wrong way. This code combines the DOM
elements and JS objects. What might be better is having a model to represent the
information, then doing something to render it onto the page.
*/
var hyperstudy = (function () {
    "use strict";

    /*
        Basic variables
    */
    var root = document.getElementById("sheet");

    var testSheet = {
        cards: []
    };

    // cue = cardList[i].firstChild
    // notes = cardList[i].firstChild.nextSibling


    // This is a purely logical representation of a simple note sheet.
    // Similar to what will be sent to the database. It only contains data,
    // no references to objects. The DOM should follow this, not the other way round.
    // However, we still need a way to access DOM objects for Quill purposes and such.

    // Simulated JSON from server
    var exampleSheet = {
        name: "Biology 101",
        date: Date.now(),
        cards: [
            {
                cue: "Mitochondria",
                lines: [
                    "Mitochondria are rod-shaped organelles",
                    "Convert O2, nutrients to ATP",
                    "This is called aerobic respiration",
                    "ATP powers metabolic activities",
                    "Enable cells to produce 15x more ATP"
                ],
                // A reference to the DOM object. This should be added by the client when cards are added, not included in the JSON or stored in the database.
                element: document.getElementsByClassName("card")[0]
            },{
                cue: "What is a cell membrane?",
                lines: [
                    "Thin, semi-permeable membrane",
                    "Surrounds cytoplasm of cell",
                    "Protects interior of cell",
                    "Allows certain substances in, keeps others out"
                ]
            }
        ]
    };
    var exampleJSON = JSON.stringify(exampleSheet);
    var parsedJSON = JSON.parse(exampleJSON);

    /*
        Utility functions
    */

    // I'm not sure if this is just a waste of space tbh. Saves a couple of lines. worth it imo
    var createAndClass = function(type) {
        var element = document.createElement("div");
        element.classList.add(type);
        return element;
    };
    // Might make this into a constructor or delete it.

    var Card = function(sheet) {
        // Create a card DOM object
        var card = createAndClass("card");
        var cue = createAndClass("cue");
        var notes = createAndClass("notes");
        // create Quill editors for cue and notes
        var cueEditor = new Quill(cue);
        var notesEditor = new Quill(notes);
        // Add references to the Card object for access to editors.
        this.cue = cueEditor;
        this.notes = notesEditor;
        sheet.cards.push(this);

        card.appendChild(cue);
        card.appendChild(notes);
        root.appendChild(card);
    };
    Card.prototype.update = function() {
        // Call this when the text in the editor is changed.

    };

    // TODO Test. Will be called when JSON model of Sheet arrives from server
    var loadSheet = function(JSONString) {
        // First create the data/logical object
        var sheet = JSON.parse(JSONString);
        // Create cards for every card in the sheet JSON
        for (var i = 0; i < sheet.cards.length; i++) {
            // Placeholder functions
            new Card();
            addEditor();
            populateEditor();
        }

    };


    /*
        Tests
    */
    document.getElementById("cardAdder").addEventListener("click", function () {
        new Card(testSheet, "Hard sphere model", ["Makes 2 assumptions:", "Atoms have fixed sizes", "Atoms are hard and not deformable"]);
    });
    document.getElementById("accessTester").addEventListener("click", function () {
        console.log(testSheet);
    });
    document.getElementById("JSONTest").addEventListener("click", function () {


    });




    return {
        // function funcName() {
        "addCard": addCard
        // };
    };

})();

// Keyboard behaviour
// When in cue: TAB/ENTER moves to notes
// UP/DOWN change card
// in notes: DOUBLE ENTER or ENTER on blank line creates new card
