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
    // I decided to put object references in here for ease of use.
    // It can be converted back to the logical model before sending to database.

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
                // A reference to the DOM object.
                // This should be added by the client when cards are added, but not
                // included in the JSON or stored in the database.
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

    // Saves a couple of lines. worth it imo
    var createAndClass = function(CSSClass) {
        var element = document.createElement("div");
        element.classList.add(CSSClass);
        return element;
    };

    // Some of this should probably be split into functions, although they aren't used more than once.
    var Card = function(sheet) {
        sheet.cards.push(this);
        // Create a card DOM object.
        var card = createAndClass("card");
        var cue = createAndClass("cue");
        var notes = createAndClass("notes");
        // Add the card to the DOM
        card.appendChild(cue);
        card.appendChild(notes);
        root.appendChild(card);
        // create Quill editors for cue and notes
        var cueEditor = new Quill(cue);
        var notesEditor = new Quill(notes);

        this.cue = {
            content: null,
            editor: cueEditor, // Don't think I need this
            element: cue // Don't think I need this either
        };
        this.notes = {
            content: null,
            editor: notesEditor,
            element: notes
        };
        // Add event handlers -- these update the model
        // At this stage, formatting is NOT saved or supported.
        // I don't know a good way to do this yet, but eventually it'll be there.
        var thisCard = this;
        // Add references for easy access to editors.
        // this.cue.cueEditor = cueEditor;

        cueEditor.on("text-change", function() {
            // This will take text from mutiple lines, which is ok as there is no need to separate them or use only one line.
            thisCard.cue.content = cueEditor.getText();
        });
        notesEditor.on("text-change", function() {
            // notes.content takes an array, as ecah line should be treated separately.
            thisCard.notes.content = (notesEditor.getText()).split(/\r?\n/);
            thisCard.notes.content.splice(-1, 1);
        });


    };
    // When an editor is changed, update the Card.cue or Card.notes properties.
    // str.split("\n");
    // Separate getText() by newline

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
    document.getElementById("test1").addEventListener("click", function () {
        console.log(testSheet.cards[0].cue);
    });
    document.getElementById("test2").addEventListener("click", function () {
        console.log(testSheet.cards[0].cueEditor.getContents());
        console.log(testSheet.cards[0].cueEditor.getText());
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
