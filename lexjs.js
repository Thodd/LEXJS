var thodd = {};
thodd.LEXJS = {
    createLexer: function (lexerDefinition, lexicalRulesDefinition, input) {
        var that = {};

        /***********
         * Private *
         ***********/
        var lastMatchedRule = {
            rule: /dummy/,
            match: ""
        };
        var currentState = lexerDefinition.initialState || "YYINITIAL";
        var eofSymbol = lexerDefinition.eofSymbol || "<EOF>";

        /**
         *	Consolidates the lexical rules definitions and states into one convenient data structure
         */
        var consolidatedStates = (function () {
            var consolidatedStates = {};
            var currentRulePrio = 0; //0 === top priority
            var i, j;
            var ruleSet;

            for (i = 0; i < lexicalRulesDefinition.length; i++) {
                ruleSet = lexicalRulesDefinition[i];

                //create the states given in the RuleSet in the consolidated data structure
                //states can be associated with multiple ruleset in order to reuse rules and actions
                for (var iStates = 0; iStates < ruleSet.states.length; iStates++) {
                    var state = ruleSet.states[iStates]; //this is a string!

                    if (consolidatedStates[state] === undefined) {
                        consolidatedStates[state] = ruleSet.rules;
                    } else {
                        //concatenate all rules to the already existing state
                        console.log("found duplicate state definition:", state);
                        Array.prototype.push.apply(consolidatedStates[state], ruleSet.rules);
                    }
                }

            }
            
            //make sure there is a default "LEXJS_NO_STATE"
            consolidatedStates["LEXJS_NO_STATE"] = consolidatedStates["LEXJS_NO_STATE"] || [];

            for (var s in consolidatedStates) {
                if (consolidatedStates.hasOwnProperty(s)) {
                    currentRulePrio = 0;
                    for (var xx = 0; xx < consolidatedStates[s].length; xx++) {
                        consolidatedStates[s][xx].prio = currentRulePrio;
                        currentRulePrio++;
                    }
                }
            }

            //empty initial state in case no YYINITIAL rules are defined
            consolidatedStates["YYINITIAL"] = consolidatedStates["YYINITIAL"] || [];

            if (lexerDefinition.dbg) {
                console.log("consolidated states:\n", consolidatedStates);
                console.log("---------------------------------------\n");
            }

            return consolidatedStates;
        }());

        /**********
         * public *
         **********/
        that.rest = input;

        /**
         * setting the state
         */
        that.yybegin = function (name) {
            if (consolidatedStates.hasOwnProperty(name)) {
                currentState = name;
            } else {
                throw ("Couldn't change state. Reason: State '" + name + "' doesn't exist");
            }
        };

        /**
         * Returns the last matched text
         */
        that.yytext = function () {
            return lastMatchedRule.match;
        };

        /**
         * This function is the actual lexer implementation
         */
        var yylexHelper = function (ruleSet) {
            var ruleEntry;
            var longestMatchedRule;
            var longestMatchedLength = -1;
            var matchResult;
            var matchText;
            var i;

            //Cycle through all rules in a state
            for (i = 0; i < ruleSet.length; i++) {
                ruleEntry = ruleSet[i];

                //r is a RegEx which can be executed over a given string, in this case that.rest
                matchResult = ruleEntry.r.exec(that.rest);

                if (matchResult !== null) {
                    //compare length of current match to the longest matched rule
                    if (matchResult[0].length > longestMatchedLength) {
                        matchText = matchResult[0];
                        longestMatchedRule = ruleEntry;
                        longestMatchedLength = matchResult[0].length;
                    } else if (matchResult[0].length === longestMatchedLength) {
                        //if two rules are tied for the longest match, the priority is compared
                        if (ruleEntry.prio < longestMatchedRule.prio) {
                            matchText = matchResult[0];
                            longestMatchedRule = ruleEntry;
                            longestMatchedLength = matchResult[0].length;
                        }
                    }
                }
            }

            //if no rule was found in the current states rule set --> check the LEXJS_NO_STATE rules
            if (!longestMatchedRule && ruleSet !== consolidatedStates["LEXJS_NO_STATE"]) {
                return yylexHelper(consolidatedStates["LEXJS_NO_STATE"]);
            }

            return {
                rule: longestMatchedRule,
                match: matchText
            };
        };
        /**
         * the main lexing function interface, calls yylexHelper
         */
        that.yylex = function () {
            //check if there is still something left on the input string
            if (that.rest.length === 0) {
                return eofSymbol;
            }

            //find best matching rule
            var stateRules = consolidatedStates[currentState] || [];
            //var ruleSet = stateRules.concat(consolidatedStates.LEXJS_NO_STATE || []); //may be a performance problem with big rulesets... TODO: look into it
            lastMatchedRule = yylexHelper(stateRules); //yylexHelper(ruleSet);

            //perform actions
            if (lastMatchedRule && lastMatchedRule.rule) {
                lastMatchedRule.rule.a(that);
            } else {
                //do something if no rule matched
                throw Error("No rule matches the input string!")
            }

            //slice of the matched part from the input
            that.rest = that.rest.slice(that.yytext().length);
        };

        return that;
    }
};

// some fallbacks for browsers without a console object
var console = console || {
    log: function () {},
    error: function() {},
    warn: function () {}
}