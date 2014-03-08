//general lexer attributes, such as
//the initial state or the eof Symbol
var lexerDefinition = {
	dbg: true,
	initialState: "YYINITIAL",
	eofSymbol: "<EOF>"
};

//macros
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

//new state rules
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


var input = "-314.15e-3 + -15 + 23 *42 - k -4.2 * +0.33e-6 =";
var lexer = thodd.LEXJS.createLexer(lexerDefinition, lexicalRules, input);

var next;
while ((next = lexer.yylex()) !== lexerDefinition.eofSymbol) {
	//do something with "next"
    //push next to a parser for syntactical analysis
}