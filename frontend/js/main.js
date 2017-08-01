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

/*
    Utility functions
*/

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
    var createCardNode = function() {
        var cardNode = document.createElement("section");
        cardNode.classList.add("card");
        var cueNode = document.createElement("div");
        cueNode.classList.add("cue");
        var notesNode = document.createElement("div");
        notesNode.classList.add("notes");
        cardNode.appendChild(cueNode);
        cardNode.appendChild(notesNode);
        return {card: cardNode, cue: cueNode, notes: notesNode};
    };
    // TODO: remove this after using for tests
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
    var bothEditorsEmpty = function(card) {
        if (card.cueEditor.getText().length === 1 &&
            card.notesEditor.getText().length === 1) {
            return true;
        }
        return false;
    };

    /*
        Keyboard handlers
    */
    var focusCard = function(which, that) {
        var nodeIndex = getNodeIndex(that.quill.container.parentNode);
        var editor = identifyEditor(that);
        if (which === "previous" && nodeIndex > 0) {
            cardsList[nodeIndex - 1][editor].focus();
        } else if (which === "next" && nodeIndex < cardsList.length - 1) {
            cardsList[nodeIndex + 1][editor].focus();
        }
    };
    var moveUp = function(range, context) {
        if (range.index === 0) {
            focusCard("previous", this);
            return false;
        }
        return true;
    };
    var moveDown = function(range, context) {
        var thisEditor = this.quill;
        // If on the last character
        if (thisEditor.getSelection().index === thisEditor.getText().length - 1) {
            focusCard("next", this);
            return false;
        }
        return true;
    };

    // TODO: Make sure the selection is of the last character.
    // To improve performance (maybe) this functionality could be moved into
    // configuration
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
    // TODO: make this insert after the current card
    // TODO: feels a little weird. Experiment with some control options, such as
    // time between presses, different amounts of newlines.
    // Could be used to restrict behaviour.
    // TODO When in cue: ENTER moves to notes (do in configurations for editors,
    // not the handler)
    var enterHandler = function() {
        if (this.quill.getText().length > 1) {
            var newCard = new Card();
            var editor = identifyEditor(this);
            newCard[editor].focus();
            return false;
        }
        return true;
    };
    var backspaceHandler = function() {
        var card = getParentCard(this);
        if (bothEditorsEmpty(card) && cardsList.length > 1) {
            focusCard("previous", this);
            deleteCard(card);

            return false;
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

    var setUndefinedArguments = function(argsIn, defaults) {
        // Copy the arguments -- changing an argument has worse performance.
        var args = Object.assign({}, argsIn);
        for (var property in defaults) {
            if (args[property] === undefined) {
                args[property] = defaults[property];
            }
        }
        return args;
    };

    /* Card constructor */

    var defaultOptions = {
        cue: "",
        notes: "",
        insertionPoint: root
    };
    var Card = function(argumentsObject) {
        cardsList.push(this);
        var thisCard = this;

        // TODO: Clean this up
        if (argumentsObject !== undefined) {
            var options = setUndefinedArguments(argumentsObject, defaultOptions);
        }

        this.cue = new Delta(options.cue);
        this.notes = new Delta(options.notes)

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

        // Are these necessary? calling constructJSON on a change might be better.
        cueEditor.on("text-change", function() {
            thisCard.cue = cueEditor.getContents();
        });
        notesEditor.on("text-change", function() {
            thisCard.notes = notesEditor.getContents();
        });
    };

    var deleteCard = function(card) {
        var index = cardsList.indexOf(card);
        if (index > -1) {
            cardsList.splice(index, 1);
        }
        root.removeChild(card.node);
    };

/*
A word on the database/storage method:
Store both the Delta (for editor/viewing usage) and the plaintext form (for revision usage).
*/

    // This gets kinda slow with more than 64 cards. Probably not a problem, but improving performance would be nice.
    var loadSheet = function(JSONresponse) {
        var parsedSheet = JSON.parse(JSONresponse);
        // Create cards for every card in the sheet JSON
        cardsList.forEach(function(card) {
            new Card(card);
        });
    };

    var constructJSON = function(cardList) {
        var newCardsList = [];
        cardList.forEach(function(card, index, array) {
            var newCard = {};
            newCard.cueText = card.cueEditor.getText();
            newCard.cueContents = card.cueEditor.getContents();
            newCard.notesText = card.notesEditor.getText();
            newCard.notesContents = card.notesEditor.getContents();
            newCardsList.push(newCard);
        });
        return(JSON.stringify(newCardsList));
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
        var testJSON = constructJSON(cardsList);
        loadSheet(testJSON);
    });
    document.getElementById("test2").addEventListener("click", function () {

    });

    new Card({
        cue: [{insert: "test", attributes: {"bold": true}}],
        notes: [{insert: "test1\ntest2\ntest3"}]
    });

    return {
        // function funcName() {

        // };
    };
})();
