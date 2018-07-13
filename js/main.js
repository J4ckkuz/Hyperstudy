/*
    App behaviour:
    ✔ When page loads, generate a single card.
    ✔ When card is changed, update the model.
    ✔ On Ctrl+Enter, Add a card below the current one (and update the model)
    ✔ On Ctrl+Up (Shift+Up?), Move to the previous card
    ✔ On Ctrl+Down, move to the next card
    ✔ On Tab, switch between the cue editor and the notes editor
    ✔ On Shift+Backspace, delete the current card
    Split an editor? (Ctrl+Shift+Enter)

    Things to not worry about yet:
    Hashes, URLs, hashchange
    Loading existing cards

    Make this all work first, then use a framework (if necessary)
    Could change these function declarations to function expressions, but isn't really necessary.
    You can get the editor from a DOM node by quill.container.__quill
     - This could be used to improve the indexOfEditor function?

     Vocabulary:
     - CREATE DOM nodes
     - INSERT nodes into document
     - ADD cards.


    TODO:
    ✔ Make changes to the quill editor update the model
    ✔ Add keybindings: tab, ctrl+ enter, up, down, backspace
    ✔ Make CSS nicer
    ? Clean up & refactor
    Save model
    Add loading from model functionality
    Fix not scrolling down to cursor - may be edge case behaviour

*/

// (function() {
    'use strict';

    var root = document.querySelector('#card-container');
    var Delta = Quill.import('delta');

    // Data/information in the app. Does nothing else. Sent to server periodically.
    function Model() {
/*
        Operations on model:
            ✔ add a card
            ✔ delete a card
            ✔ reorder (swap?) a card
            ✔ edit the contents of a card

            These must make sure the model is ALWAYS valid.
*/
        this.cards = [];
        // Card will be added later

        this.addBlankCard = function(index) {
            /*
            Creates an empty card at the specified index. If none given, inserts
            card at the end. Returns the inserted card.
            */
            var newCard = {
                // new Delta() creates a blank delta, the Quill data storage format.
                cue: new Delta(),
                notes: new Delta()
            }
            if (index === undefined) {
                this.cards.push(newCard);
            } else {
                // Adds the newCard object to a point in the array.
                this.cards.splice(index, 0, newCard);
            }
            return newCard;
        }

        this.deleteCard = function(index) {
            /*
            Deletes a card at the specified index. Accepts negative values.
            */
            // Deletes 1 element at the index.
            this.cards.splice(index, 1);
        }

        this.moveCard = function(from, to) {
            /*
            Moves a card from one position to another. Negative arguments are supported.
            Acts weirdly if a string is passed in, but this happens it's your fault.
            */

            if (from >= this.cards.length) {
                throw new Error('Cannot move an element from an index outside the array');
            } else if (to >= this.cards.length) {
                throw new Error('Cannot move an element to an index outside the array');
            } else {
                // Makes it work with negative arguments
                // e.g. -1 will become the index for the last item in the list
                while (from < 0) {
                    from += this.cards.length;
                }
                while (to < 0) {
                    to += this.cards.length;
                }

                // First remove the element from the old point
                // This returns an array, so get the first (and only) element from it
                // Insert the new array at the *to* point.
                this.cards.splice(to, 0, this.cards.splice(from, 1)[0]);
            }
        }

        this.editCard = function(index, field, delta) {
            this.cards[index][field] = delta;
        }

        this.get = function() {
            return(JSON.stringify(this.cards));
        }

        // Sets the cards. ONLY USE FOR LOADING.
            // this.cards = JSON.parse(jsonCardsArray);
    }


// Provides data from the model to the view. Handles user actions. Depends on model and view. Controller and view may be the same object.
    function Controller(model) {
        var self = this;
        // Declares a property on this object, then makes a variable equal to that.
        var model = this.model = model;
        var quillOptions = {
            theme: 'bubble',
            // placeholder: 'Type something...',
            modules: {
                keyboard: {
                    bindings: {
                        enter: {
                            key: 13,
                            shiftKey: true,
                            handler: function enterHandler() {
                                console.log('keyboard called by: ', this.quill);
                                insertBlankCardAfter(this.quill);
                            }
                        },
                        tab: {
                            key: 9,
                            handler: function tabHandler() {
                                this.quill.sister.focus();
                            }
                        },
                        up: {
                            key: 38,
                            handler: function upHandler(range, context) {
                                console.log(range, context);
                                var editor = this.quill;
                                if (range.index == 0 && indexOfEditor(editor) > 0) {
                                    focusPreviousCard(editor);
                                    return false;
                                }
                                return true;
                            }
                        },
                        shortUp: {
                            key: 38,
                            shortKey: true,
                            handler: function shortUpHandler(range) {
                                var editor = this.quill;
                                // If this is the first card, do nothing.
                                // If this is the first position in the card, move to the previous card.
                                // Add another handler that doesn't use shortKey, but only moves when on the first position in the editor
                                if (indexOfEditor(editor) > 0) {
                                    focusPreviousCard(editor);
                                }
                            }
                        },
                        down: {
                            key: 40,
                            handler: function downHandler(range) {
                                var editor = this.quill;
                                var cardCount = root.getElementsByClassName('card').length;
                                var editorLength = editor.getText().length;

                                // Make the conditions into boolean variables for better readability
                                var notLastCard = indexOfEditor(editor) + 1 < cardCount;
                                var lastPositionSelected = range.index + 1 === editorLength;

                                if (notLastCard && lastPositionSelected) {
                                    focusNextCard(editor);
                                    return false;
                                }
                                return true;
                            }
                        },
                        shortDown: {
                            key: 40,
                            shortKey: true,
                            handler: function shortDownHandler() {
                                var editor = this.quill;
                                var editorIndex = indexOfEditor(editor);
                                var cardCount = root.getElementsByClassName('card').length;
                                if (editorIndex + 1 < cardCount) {
                                    focusNextCard(editor);
                                }
                            }
                        },
                        backspace: {
                            key: 8,
                            // Inconsistent with the rest of the handlers, but Ctrl+Backspace is too useful to overwrite
                            shiftKey: true,
                            handler: function backspaceHandler() {
                                var editor = this.quill;
                                var index = indexOfEditor(editor);

                                // If there is more than one card
                                if (root.getElementsByClassName('card').length > 1) {

                                    // focus the previous card, or the next if first card is deleted. Subject to change after user testing
                                    if (index == 0) {
                                        focusNextCard(editor);
                                    } else {
                                        focusPreviousCard(editor);
                                    }

                                    model.deleteCard(index);
                                    editor.container.parentNode.remove();
                                }
                            }
                        }
                    }
                }
            }
        }

        // Need to take a look at operations.
        // Should be able to add a card with text.

        function focusPreviousCard(editor) {
            var column = indexOfColumn(editor);
            // Gets the div.notes, then the div.card, then the div.card before
            // it, then the div.notes of that, then the editor of that, then
            // focuses on it
            editor.container.parentNode.previousSibling.childNodes[column].__quill.focus();
        }

        function focusNextCard(editor) {
            var column = indexOfColumn(editor);
            editor.container.parentNode.nextSibling.childNodes[column].__quill.focus();
        }

        // Seems unnecessary. Refactor to avoid using this.
        function indexOfColumn(editor) {
            if (editor.name === 'cue') {
                return 0;
            } else if (editor.name === 'notes') {
                return 1;
            }
        }

        function insertAfter(newNode, afterNode) {
            afterNode.parentNode.insertBefore(newNode, afterNode.nextSibling);
        }

        // TODO: Refactor insertBlankCardAfter, createDomCard, and createEditors into one function that
        // inserts a card at a position (or after an editor) with the specified text.

        // function insertCard(after, cue, notes)
        // or
        // function insertCard(options)
        // options = {cue: string, notes: string, after: reference to editor}

        function insertBlankCardAfter(editor) {
            // What do we want to do with this?
            // This needs to get the index of the currently selected editor or node.
            // It will then use that index to add a card to the model, after that index.
            // It will then get the parent node of the currently selected editor (same as line 2)
            // It will then insert a card into the DOM after that parent node.
            var newCard = createDomCard();

            if (editor === undefined) {
                model.addBlankCard();
                root.appendChild(newCard.card);
                console.log('no editor given, adding card to end');
            } else {
                var index = indexOfEditor(editor);
                model.addBlankCard(index + 1); // Insert at the position AFTER the selected editor
                var parentCard = editor.container.parentNode;
                insertAfter(newCard.card, parentCard);
            }
            createEditors(newCard, quillOptions);
        }

        function createDomCard() {

            // The parent card that holds the editors
            var card = document.createElement('div');
            card.classList.add('card');

            //  Create the cue container
            var cue = document.createElement('div');
            cue.classList.add('cue');
            card.appendChild(cue);

            //  Create the notes container
            var notes = document.createElement('div');
            notes.classList.add('notes');
            card.appendChild(notes);

            //  Don't add card to DOM.
            return { card, cue, notes };
        }

        function createEditors(node, options) {
            // Create both editors
           var cue = new Quill(node.cue, options);
           var notes = new Quill(node.notes, options);

           cue.name = 'cue';
           cue.sister = notes;
           notes.name = 'notes';
           notes.sister = cue;

           cue.on('text-change', function() {
               updateCard(cue, 'cue')
           });
           notes.on('text-change', function() {
               updateCard(notes, 'notes');
           });

           notes.focus();
           console.log('createEditors completed successfully');
           return { cue, notes };
        }

       function updateCard(editor, cueOrNotes) {
           var index = indexOfEditor(editor);
           var delta = editor.getContents();
           model.editCard(index, cueOrNotes, delta);
        //    console.log(model);
       }

       // Rewrite this to use parentNode/parentElement
       function indexOfEditor(editor) {
           // get the nodes
           var cards = root.getElementsByClassName('card');
           // loop through cards
           for (var parentIndex = 0; parentIndex < cards.length; parentIndex++) {
               var children = cards[parentIndex].childNodes;
               // loop through cue and notes containers
               for ( var i = 0; i < children.length; i++ ) {
                   if (children[i] === editor.container) {
                       return parentIndex;
                   }
               }
           }
           return -1;
       }

       function switchFocus(editor) {
           editor.sister.focus();
       }

       function load() {
           // Set the model

           // Update the view to match the model. (maybe this should be a separate function?)
       }

       function updateView(model) {

       }

        // Create some empty cards to start off with. (for testing - only one on prod)
        insertBlankCardAfter();
    }

    var model = new Model();
    var controller = new Controller(model);

// })();
