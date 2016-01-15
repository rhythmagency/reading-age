/*  sample usage

    source = jQuery('#input').val();
    parsed = ReadingAge.deepParseText(source);
    html = ReadingAge.toHTML(parsed);
    jQuery("#output").html(html);

 */

/*global console */
var ReadingAge = {
    /**
     * Round a number to a given number of decimal places.
     */
    round: function (num, decimalPlaces) {
        "use strict";
        return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    },

    /**
     * Simple descending sort against the fleschKincaidGradeLevel on objects.
     *
     * @returns {number}
     * @param {object} a The first object to sort.
     * @param {object} b The second object to sort.
     */
    sortFleschKincaidGradeLevelDescending: function (a, b) {
        "use strict";
        return b.fleschKincaidGradeLevel - a.fleschKincaidGradeLevel;
    },

    /**
     * Simple descending sort against the SMOG index on objects.
     *
     * @returns {number}
     * @param {object} a The first object to sort.
     * @param {object} b The second object to sort.
     */
    sortSmogIndexDescending: function (a, b) {
        "use strict";
        return b.smogIndex - a.smogIndex;
    },

    /**
     * Each vowel (a, e, i, o, u, y) in a word counts as one syllable subject to the following sub-rules:
     * Words of three letters or less count as one syllable
     * Ignore final -ES, -ED, -E (except for -LE)
     * Consecutive vowels count as one syllable.
     *
     * @returns {number}
     * @param {string} word The word to scan. Must be exactly one word.
     */
    getNumSyllablesInWord: function (word) {
        "use strict";
        var matches;
        if (typeof word !== "string") {
            throw new TypeError("A string is required.");
        }
        if (word.length === 0) { // Catch empty strings.
            throw "Empty string.";
        }
        if (word.search(/\s/g) !== -1) { // If white space characters are found, throw an error
            throw "Contains whitespace.";
        }
        if (word.length <= 3) { // Three letter or less words are always one syllable
            return 1;
        }
        word = word.toLowerCase(); // Convert to lowercase for simplicity
        if (word.lastIndexOf('le') !== word.length - 2) { // Except for cases ending in "le"
            word = word.replace(/(es|ed|e)$/, ""); // Remove any final -es, -ed, e
        }
        word = word.replace(/[aeiouy]+/g, "a"); // Replace multiple vowels with a single vowel (a)
        matches = word.match(/[aeiouy]/g); // Get the number of remaining vowels
        if (matches === null) {
            return 0;
        }
        return matches.length;
    },

    /**
     * Trim anything other than A-Z a-z from the front and end of strings.
     *
     * @returns {string}
     * @param {string} str The string to trim.
     */
    trimNonLetters: function (str) {
        "use strict";
        str = str.replace("\n", " ");
        str = str.replace(/^[^A-Za-z]+/g, "");
        str = str.replace(/[^A-Za-z]+$/g, "");
        return str;
    },

    /**
     * Trim anything other than A-Z a-z from the front and end of string entries in an array.
     *
     * @returns {string}
     * @param {string} str The string to trim.
     */
    trimNonLettersFromArray: function (ary) {
        "use strict";
        ary.forEach(function (i) {
            if (typeof ary[i] === "string") {
                ary[i] = ReadingAge.trimNonLetters(ary[i]);
            }
        });
        return ary;
    },

    /**
     * For an array of words...
     * Find the first entry that does not have any alphabetic characters.
     * Return its index.
     * Or -1 if none could be found.
     *
     * @returns {number}
     * @param {array} ary An array of strings.
     */
    findFirstEmptyWord: function (ary) {
        "use strict";
        var i = 0;
        while (i < ary.length) {
            if (ary[i].search(/[A-Za-z]/) === -1) {
                return i;
            }
            i += 1;
        }
        return -1;
    },

    /**
     * For an array of words.
     * Remove any that don't have any A-Za-z characters.
     *
     * @returns {array}
     * @param {array} ary The array of strings to clean.
    */
    removeEmptyWords: function (ary) {
        "use strict";
        var position;
        do {
            position = ReadingAge.findFirstEmptyWord(ary); // Find the first empty word
            if (position !== -1) { // If there was one
                ary.splice(position, 1); // Remove it
            }
        } while (position !== -1); // Repeat until none are found
        return ary;
    },

    /**
     * Get an array of the words from a passage of text.
     *
     * @returns {array}
     * @param {string} text The passage of text to parse.
     */
    getWords: function (text) {
        "use strict";
        var words;
        if (typeof text !== "string") {
            throw new TypeError("A string is required.");
        }
        if (text.length === 0) {
            return [];
        }
        text = text.replace(/\n+/g, " "); // Convert new lines to spaces
        text.replace(/\s+/g, " "); // Replace all whitespace with traditional spaces, condensing multiples into one.
        words = text.split(" "); // Split the string at its spaces
        words = ReadingAge.trimNonLettersFromArray(words); // Remove any leading/trailing non A-z a-z characters
        words = ReadingAge.removeEmptyWords(words); // Remove any words that don't have any letters in them
        return words;
    },

    /**
     * Return each of the sentences from a passage of text as an array.
     *
     * @returns {array}
     * @param {string} text The passage of text to parse.
     * @see http://stackoverflow.com/questions/11761563/javascript-regexp-for-splitting-text-into-sentences-and-keeping-the-delimiter
     */
    getSentences: function (text) {
        "use strict";
        var matches,
            finalMatch;
        if (typeof text !== "string") {
            throw new TypeError("A string is required.");
        }
        if (text.length === 0) {
            return [];
        }
        text = text.replace(/\n+/g, " "); // Convert new lines to spaces
        matches = text.match(/\(?[^\.\?\!]+[\.!\?]\)?/g);
        finalMatch = text.match(/\(?[^\.\?\!]+$/g); // Catch cases where the string ends without a sentence terminator.
        if (matches === null) {
            matches = [];
        }
        if (finalMatch !== null) { // If there was a final sentence fragment, catch it.
            matches.push(finalMatch[0]);
        }
        return matches;
    },

    /**
     * For an array of words (strings),
     * return a matching array of their numbers of syllables.
     *
     * @returns {array}
     * @param {array} aryOfWords An array of strings, each containing a single word.
     */
    getNumSyllablesPerWord: function (aryOfWords) {
        "use strict";
        var result = [];
        aryOfWords.forEach(function (value) {
            try {
                result.push(ReadingAge.getNumSyllablesInWord(value));
            } catch (e) {
                console.log("Error in ReadingAge.getNumSyllablesPerWord");
                console.log(e);
                console.log({
                    value: value,
                    aryOfWords: aryOfWords
                });
            }
        });
        return result;
    },

    /**
     * For an array of numbers (number of syllables in a word),
     * return an array of indexes where the value is 3 or higher.
     *
     * @example [3, 1, 4, 1, 5, 9] will return [0, 2, 4, 5]
     *
     * @returns {array}
     * @param {array} aryOfNumSyllables An array of numbers - number of syllables in each word.
     */
    getComplexWordPositions: function (aryOfNumSyllables) {
        "use strict";
        var result = [];
        aryOfNumSyllables.forEach(function (value, i) {
            if (value >= 3) {
                result.push(i);
            }
        });
        return result;
    },

    /**
     * Given an array of words
     * and an array of indexes within it that have complex words,
     * return an array of those complex words.
     *
     * @returns {array}
     * @param {array} aryOfWords An array of strings, each containing a single word.
     * @param {array} aryOfComplexWordPositions An array of indexes of positions that have complex words.
     */
    getComplexWords: function (aryOfWords, aryOfComplexWordPositions) {
        "use strict";
        var result = [];
        aryOfComplexWordPositions.forEach(function (value) {
            result.push(aryOfWords[value]);
        });
        return result;
    },

    arrayAdd: function (ary) {
        "use strict";
        var result = 0;
        ary.forEach(function (num) {
            if (typeof num === "number") {
                result += num;
            }
        });
        return result;
    },

    /**
     * Parse a passage of text, generating a set of metrics.
     *
     * @see https://en.wikipedia.org/wiki/Readability
     * @see https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests
     * @see https://en.wikipedia.org/wiki/Gunning_fog_index
     * @see https://en.wikipedia.org/wiki/SMOG
     *
     * @returns {object}
     * @param {string} text The passage of text to parse.
     */
    parseText: function (text) {
        "use strict";
        var result = {};
        // Source
        result.source = text;
        // Sentences
        result.sentences = ReadingAge.getSentences(text);
        result.numSentences = result.sentences.length;
        // Words
        result.words = ReadingAge.getWords(text);
        result.numWords = result.words.length;
        // Syllables
        result.syllables = ReadingAge.getNumSyllablesPerWord(result.words);
        result.numSyllables = ReadingAge.arrayAdd(result.syllables);
        // Complex Words
        result.complexWordPositions = ReadingAge.getComplexWordPositions(result.syllables);
        result.numComplexWords = result.complexWordPositions.length;
        result.complexWords = ReadingAge.getComplexWords(result.words, result.complexWordPositions);
        // Averages
        result.averageWordsPerSentence = result.numWords / result.numSentences;
        result.averageSyllablesPerWord = result.numSyllables / result.numWords;
        result.complexWordRatio = result.numComplexWords / result.numWords;
        result.complexWordsPerSentence = result.numComplexWords / result.numSentences;
        // Reading Complexity Metrics
        result.fleschKincaidReadingEase = 206.835 - 1.015 * result.averageWordsPerSentence - 84.6 * result.averageSyllablesPerWord;
        result.fleschKincaidGradeLevel = 0.39 * result.averageWordsPerSentence + 11.8 * result.averageSyllablesPerWord - 15.59;
        result.gunningFogIndex = 0.4 * (result.averageWordsPerSentence + 100 * result.complexWordRatio);
        result.smogIndex = 1.0430 * Math.sqrt(30 * result.complexWordsPerSentence) + 3.1291;
        return result;
    },

    /**
     * Parse a passage of text, generating a set of metrics.
     * Additionally, parse each of the constituent sentences
     * and sort them based on their complexity with most complex first.
     * This way, complex sentences can be identified and simplified.
     *
     * @returns {object}
     * @param {string} text The passage of text to parse.
     */
    deepParseText: function (text) {
        "use strict";
        var result = {};
        result = ReadingAge.parseText(text);
        result.parsedSentences = [];
        result.sentences.forEach(function (value, i) {
            try {
                result.parsedSentences.push(ReadingAge.parseText(value));
            } catch (e) {
                console.log("Error in ReadingAge.deepParseText loop");
                console.log({
                    e: e,
                    value: value,
                    i: i
                });
                throw e;
            }
        });
        // Sort the parsed sentences by fleschKincaidGradeLevel in descending order
        result.parsedSentences.sort(ReadingAge.sortFleschKincaidGradeLevelDescending);
        return result;
    },

    toHTML: function (parsedResults, numComplexSentences) {
        "use strict";
        var result = [];
        // Default numComplexSentences to 5
        if (numComplexSentences === undefined) {
            numComplexSentences = 5;
        }
        // Basic Stats
        result.push('<section>');
        result.push('<h2>Basic Stats</h2>');
        result.push('<ul>');
        if (parsedResults.numSentences !== undefined) {
            result.push('<li>Number of Sentences: ' + parsedResults.numSentences + '</li>');
        }
        if (parsedResults.numWords !== undefined) {
            result.push('<li>Number of Words: ' + parsedResults.numWords + '</li>');
        }
        if (parsedResults.numComplexWords !== undefined) {
            result.push('<li>Number of Complex Words: ' + parsedResults.numComplexWords + '</li>');
        }
        if (parsedResults.numSyllables !== undefined) {
            result.push('<li>Number of Syllables: ' + parsedResults.numSyllables + '</li>');
        }
        result.push('</ul>');
        result.push('</section>');
        // Averages
        result.push('<section>');
        result.push('<h2>Averages</h2>');
        result.push('<ul>');
        if (parsedResults.averageWordsPerSentence !== undefined) {
            result.push('<li>Average Number of Words per Sentence: ' + ReadingAge.round(parsedResults.averageWordsPerSentence, 3) + '</li>');
        }
        if (parsedResults.complexWordsPerSentence !== undefined) {
            result.push('<li>Average Number of Complex Words per Sentence: ' + ReadingAge.round(parsedResults.complexWordsPerSentence, 3) + '</li>');
        }
        if (parsedResults.complexWordRatio !== undefined) {
            result.push('<li>Percentage of Complex Words: ' + ReadingAge.round(parsedResults.complexWordRatio * 100, 1) + '%</li>');
        }
        if (parsedResults.averageSyllablesPerWord !== undefined) {
            result.push('<li>Average Number of Syllables per Word: ' + ReadingAge.round(parsedResults.averageSyllablesPerWord, 3) + '</li>');
        }
        result.push('</ul>');
        result.push('</section>');
        // Reading Ease Scores
        result.push('<section>');
        result.push('<h2>Reading Ease Scores</h2>');
        result.push('<ul>');
        if (parsedResults.fleschKincaidReadingEase !== undefined) {
            result.push('<li>Flesch Kincaid Reading Ease: ' + ReadingAge.round(parsedResults.fleschKincaidReadingEase, 3) + ' (Higher is Better)</li>');
        }
        if (parsedResults.fleschKincaidGradeLevel !== undefined) {
            result.push('<li>');
            result.push('Flesch Kincaid Grade Level: ' + ReadingAge.round(parsedResults.fleschKincaidGradeLevel, 3) + ' (Lower is Better)');
            result.push('<ul><li>Typically Understandable by a ' + ReadingAge.round(parsedResults.fleschKincaidGradeLevel + 5, 0) + ' Year Old. (Lower is Better)</li></ul>');
            result.push('</li>');
        }
        if (parsedResults.gunningFogIndex !== undefined) {
            result.push('<li>');
            result.push('Gunning Fog Index: ' + ReadingAge.round(parsedResults.gunningFogIndex, 3) + ' (Lower is Better)');
            result.push('<ul><li>Typically Understandable by a ' + ReadingAge.round(parsedResults.gunningFogIndex + 5, 0) + ' Year Old. (Lower is Better)</ul>');
            result.push('</li>');
        }
        if (parsedResults.smogIndex !== undefined) {
            result.push('<li>');
            result.push('Simple Measure Of Gobbledygook (SMOG) Index: ' + ReadingAge.round(parsedResults.smogIndex, 3) + ' (Lower is Better)');
            result.push('<ul><li>Typically Understandable by a ' + ReadingAge.round(parsedResults.smogIndex + 5, 0) + ' Year Old. (Lower is Better)</li></ul>');
            result.push('</li>');
        }
        result.push('</ul>');
        result.push('</section>');
        // Most Complex Sentences
        if (parsedResults.parsedSentences !== undefined) {
            result.push('<section>');
            result.push('<h2>Most Complex Sentences</h2>');
            result.push('<ol>');
            parsedResults.parsedSentences.every(function (subResult, i) {
                result.push('<li>FKGL ' + ReadingAge.round(subResult.fleschKincaidGradeLevel, 3) + ": " + subResult.source + '</li>');
                return i < (numComplexSentences - 1);
            });
            result.push('</ol>');
            result.push('</section>');
        }
        return result.join("");
    }
};

//var mceReadingAge = {};

tinymce.PluginManager.add('mceReadingAge', function (editor, url) {

    //mceReadingAge.Editor = editor;

    var getReadingAgeData = function () {
        var content = editor.getContent();
        return ReadingAge.deepParseText(content);
    }

    // Add a button that opens a window
    editor.addButton('mceReadingAge', {
        title: 'Check reading age',
        image: '/umbraco/images/editor/reading-glasses.png',
        onclick: function () {
            var html = ReadingAge.toHTML(getReadingAgeData());
            //editor.windowManager.alert(html);
            mceReadingAge.Window = editor.windowManager.open({
                title: "Reading Age Report",
                url: 'javascript:""',
                width: 700,
                height: 700
            });
            $(mceReadingAge.Window.getEl()).find('iframe').contents().find('body').append(html);
        },
    });

    // set up continuous reading age analysis in the status bar

    var getShortReadingAge = function () {
        var data = getReadingAgeData();
        var ageResult = (data.fleschKincaidGradeLevel + data.gunningFogIndex + data.smogIndex) / 3;
        return "Reading age: " + ageResult.toFixed(1);
    }

    function update() {
        editor.theme.panel.find('.readingAge').text(getShortReadingAge());
    }

    editor.on('init', function () {
        var statusbar = editor.theme.panel && editor.theme.panel.find('#statusbar')[0];

        if (statusbar) {
            window.setTimeout(function () {
                statusbar.insert({
                    type: 'label',
                    name: 'readingAge',
                    text: [getShortReadingAge()],
                    classes: 'readingAge',
                    style: 'padding:8px;float:right;margin-right:15px;',
                    disabled: editor.settings.readonly
                }, 0);

                editor.on('setcontent beforeaddundo', update);

                //editor.on('keyup', function (e) {
                //    if (e.keyCode == 32) {
                //        update();
                //    }
                //});
            }, 0);
        }
    });

});