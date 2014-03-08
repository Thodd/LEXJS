LEXJS
=====

### A Simple lexical analyzer. 

This is still a work in progress!

Please look at demo.js for more indepth code sample.

Oh and fork it, I'm not sure if I will keep updating this. I was started as an exercise for a compiler construction course at university. I believe JavaScript is absolutely under representated in compiler theory or other similar courses. Well... at least in Germany...

Maybe you can use it as an example for students.

### General Setup
```JavaScript
//general lexer attributes, such as
//the initial state or the eof Symbol
var lexerDefinition = {
	dbg: true,
	initialState: "YYINITIAL", //define the initial state, YYINITIAL if none is given
	eofSymbol: "<EOF>" //define a special EOF symbol
};
```

### Defining Rules
The rules and states can be defined in a style similar to (f)lex.
As in (f)lex the order of the rules is important. 
If two rules are tied for the longest match, the one with the higher priority. 

To define rules you have to create an Array in the fashion seen below.
The content of the Array are Objects with a `states` and a `rules` attribute.
The `states` attribute is an array of string constants, which name the states to which the rule set applies.
The `rules` attribute is again an array, but this time consisting of objects with two attributes:

1. `r`: the actual rule in JS RegEx format.
2. `a`: a simple JS function inside which you have access to the lexer `lex`.

The definition of macros, as reusable RegEx patterns, is of course optional.

```JavaScript
var macros = {
	number:	/^([\-+]?([0-9]*\.)?[0-9]+([eE][\-+]?[0-9]+)?)/,
	addop:	/^(\+)/,
	subop:	/^(\-)/,
	mulop:	/^(\*)/,
	divop:	/^(\/)/,
	resop:	/^(\=)/,
	blank:	/^([ \t\n])/,
	fallback: /^(.)/
};

var lexicalRules = [
	{
		states: ["NUMBER"],
		rules: [
			{r: macros.addop, a: function (lex) { console.log("op: +"); lex.yybegin("ADDOP"); }},
			{r: macros.subop, a: function (lex) { console.log("op: -"); lex.yybegin("SUBOP"); }},
			{r: macros.mulop, a: function (lex) { console.log("op: *"); lex.yybegin("MULOP"); }},
			{r: macros.divop, a: function (lex) { console.log("op: /"); lex.yybegin("DIVOP"); }},
			{r: macros.resop, a: function (lex) { console.log("op: ="); lex.yybegin("YYINITIAL"); /* successful end */ }}
		]
	},
	{
		states: ["YYINITIAL", "ADDOP", "MULOP", "SUBOP", "RESULTOP"],
		rules: [
			{r: macros.number, a: function (lex) { console.log("number: %s", lex.yytext()); lex.yybegin("NUMBER"); }}
		]
	},
	//LEXJS_NO_STATE rules are outside of all other lexical state and are always matched in ALL lexical states
	//Rules in a LEXJS_NO_STATE Block are typically used as fallback rules for illegal characters and such
	{
		states: ["LEXJS_NO_STATE"],
		rules: [
			{r: macros.blank,		a: function (lex) { console.log("blank"); /* eat blank */ }},
			{r: macros.fallback,	a: function (lex) { console.log("illegal character: %s !", lex.yytext()); }}
		]
	}
];
```

### Creating the lexer

The following example creates a new lexer for the above rule-set/states.
The function `LEXJS.createLexer(...)` accepts 3 arguments:

1. a lexer setup object, see above.
2. an Array of lexical rules, as mentioned before
3. and the input string which is to be analyzed

```JavaScript
var input = "-314.15e-3 + -15 + 23 *42 - k -4.2 * +0.33e-6 =",
    lexer = LEXJS.createLexer(lexerDefinition, lexicalRules, input),
    next;
    
while ((next = lexer.yylex()) !== lexerDefinition.eofSymbol) {
	//do something with "next"
    //push next to a parser for syntactical analysis
}
```

### The lex interface
Each action `a` defined in the rule sets is injected with a reference on the lexer `lex`.

The functions provided by `lex` aim to replicate the basic interface of other (f)lex implementations.

#### lex.yybegin(state)
Changes the current state to the one given as a String argument

#### lex.yytext()
Returns the last matched string. If you call this function inside an action `a`, the return value will be the string matched by the rule `r` associated with the action.

#### lex.yylex()
Advances the lexer by one Token and returns it. The token can then be passed to a parser for syntactical analysis
