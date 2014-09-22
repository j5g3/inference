/**
 * Test file for cxl-docs
 * @author Giancarlo Bellido
 * @license GPLv2
 */

/** @class */
var Person = makeClass(
    /** @lends Person# */
    {
        /** Set up initial values. @constructs Person */
        initialize: function(name) {
            /** The name of the person. */
            this.name = name;
        },

        property: 10,

        /**
			Speak a message.
			@param {string} message The Message
        */
        say: function(message) {
            return this.name + " says: " + message;
        },

        /** @private */
        private: function(msg) {},

        /// @protected
        protected: function(msg) { }
    }
);

/** @const */
var Const = 100,
	/** @constant */
	Constant = "200",
	/** @enum */
	enumerate = {
		OK: true,
		/** @property */
		CANCEL: false
	}
;

for (var i in enumerate)
	enumerate[i+i] = i;

for (i in enumerate)
	enumerate[i] = enumerate[i];

/**
 * @name highlightSearchTerm
 * @function
 * @global
 * @param {string} term - The search term to highlight.
 */
test("window.highlightSearchTerm = function(term) {};");

/** @class */
var Hurl = function () {};

/**
 * Throw a snowball.
 *
 * @fires Hurl#snowball
 */
Hurl.prototype.snowball = function () {
    /**
     * @event Hurl#snowball
     */
    this.emit('snowball', {});
};

/**
 * Throw a football match.
 *
 * @emits Hurl#footballMatch
 */
Hurl.prototype.footballMatch = function () {
    /**
     * @event Hurl#footballMatch
     */
    this.emit('footballMatch', {});
};

/// @author Author Name <email@gmail.com>
/// @copyright Copyright Message
function Doctor() { }

/** @deprecated */
/** @extends Person */
function deprecated() {}

/** @alias deprecated @deprecated since v2.0  */
function deprecated2() {}

Doctor.prototype = new Person();

/**
 * The built in string object.
 * @external String
 * @see {@link https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String String}
 */

/**
 * @callback requestResponseCallback
 * @param {number} responseCode
 * @param {string} responseText
 */

/**
*  @param {String | Number| Array<String>}  targetName    The name (or names) of what to find.
*/
function param0(targetName) {}

/**
*  @callback callback
*/
var param1 = function(callback) {};

/**
*  @param {function}
*  @param {object}
*/
function param2(callback, scope) {}

/**
*  @param id The id of the element.
*/
function param3(id) {}

/**
*  @param ... Two or more elements.
*/
function param4() {}

/**
*  @param delimiter - What to split on.
*/
function param5(delimiter) {}

/**
*  @param - If true make the commit atomic.
*/
function param6(atomic) {}

/** Says nothing */
Doctor.prototype.say= function(msg)
{
	return "Nothing";
};

global = 100;

var scope = this;

var unary = {
	type: typeof("hello"),
	fn: typeof(function() { }),
	obj: typeof({}),
	str: typeof('string'),
	num: typeof(10),
	neg: -10,
	plus: +10,
	und: void(10),
	del: delete(this.test)
};

/** @readonly */
Doctor.staticVar = 300;

/** @augments {Person} */
var Teacher = makeClass({

});

var globalObj = {

	/** @abstract */
	abstract: null,

	/** @virtual */
	virtual: undefined

};

/// @private
function private() {}

/** @protected */
function protected() {}

/** @public */
function public() {}

declare({
    globals: /** @lends */ {

        /** document me. @extends Person */
        'test': function() { },

        /** @namespace */
        'test1': {

            /** document me */
            'test2': function() {  }
        }
    }
});

/**
*  @returns { String | Array<String>}  The names of the found item(s).
*/
function returns1(targetName) {}

/** All this text @ignore should be ignored */
function ignore() {}

/** This text should not be @Ignored */
function ignored() {}

/**
*  @returns The binding id.
*/
function returns2(callback) {}

// This test exists because there used to be a bug in jsdoc which
// would cause it to fail parsing.
/**
*  @returns An object to be passed to {returns1}.
*/
function returns3(name) {}

/// @constructor @namespace
function constructor() {}

/// @final
function final() {}

var lends = new View.extend({ /** @lends lends */
	prop1: true
});

function prototype() {}

/**
    @since 1.2.3
    @version 1.2.3
*/
function since() {}

/** @summary I do not like green eggs and ham! */
function summary() {}

/**
 * @this {Type} description for symbol.
 * @throws {ErrorType}
 * @throws Throws an error message.
 * @todo Make it work.
 * @todo Second
 * @todo Third
 */
function throws1() {}

/**
 * @type {string|Array<string>}
 */
var type1;

/**
 * @type integer
 */
var type2 = +(new Date()).getTime();

/**
 * @type {!Array.<number>}
 */
var type3 = [1, 2, 3];

/** @mixin */
var mixin = { };

/** @requires cxl */
function requires() { }
