
(function(exports) {
"use strict";

	/**
	 * Handler used when no handler is passed to the
	 * JSDocParser constructor.
	 */
	var DefaultHandler = {

		handle: function(current)
		{
			current.meta = current.meta || {};

			current.meta[current.tag] = {
				type: current.type,
				ident: current.ident,
				text: current.text
			};
		}

	};

	/**
	 * JSDOC Parser
	 *
	 * @param {object} handler Optional handler object.
	 *
	 * The handler is an object like this:
	 *
	 * <pre><code>
	 * var handler = {
	 *
	 *     alias: function(tag)
	 *     {
	 *     // do something when it finds tag alias
	 *     },
	 *     // Handle all other tags
	 *     handle: function(tag)
	 *     {
	 *     }
	 * }
	 * </code></pre>
	 *
	 * The <code>tag</code> parameter will contain the following fields:
	 *
	 * <pre><code>
	 * tag = {
	 *     tag: null,
	 *     type: null,
	 *     ident: null,
	 *     text: null,
	 *     start: 0,
	 *     end: 0,
	 *     meta: null
	 * }
	 * </code></pre>
	 */
	function JSDocParser(handler)
	{
		this.handler = handler || DefaultHandler;
		// We will reuse this object to pass the match to the handler.
		this.current = {
			tag: null,
			type: null,
			ident: null,
			text: null,
			start: 0,
			end: 0
		};

		this.map = this._buildMap();
	}

	JSDocParser.prototype = {

		REGEX: /@(\w+)([ \t]*)(.*)$/gm,
		CLEAN: /^\s*[\/\*]+\s?|[ \t]+$/gm,

		TYPE: /^\{\(?([\w\d_ <>\|\.\#]+)\)?\}\s*|([\w\d_\.#]+)\s*/,
		TYPENAMETEXT: /^\{\(?([ <>\w\d_\|\.\#]+)\)?\}\s*([\.\w\d_]*)\s*(.*)/,
		TYPETEXT: /^(\{\(?([ <>\w\d_\|\.\#]+)\)?\})?\s*(.*)/,
		NAMETEXT: /([\.\w\d_]+)\s*(.*)/,

		alias: {
			virtual: 'abstract',
			augments: 'extends',
			extend: 'extends',
			'const': 'constant',
			'constructor': 'constructor',
			'emits': 'fires',
			'return': 'returns'
		},

		parsers: {
			// @tag {type}
			parseType: 'alias|borrows|callback|constant|constructs|const|enum|emits|event|type|exports|extends|external|fires|lends|memberof|method|mixes|mixin|name',
			// @tag [{type} name text]
			parseTypeNameText: 'param|property|typedef',
			// @tag [{type} text]
			parseTypeText: 'returns|this',
			// @tag [text]
			parseText: 'author|deprecated|copyright|classdesc|desc|license|requires|since|summary|throws|todo|variation|version|see'

			/*
			Other tags that don't require parsing:
			case 'abstract': case 'global': case 'protected': case 'public':
			case 'private': case 'readonly': case 'virtual': case 'inner':
			case 'instance': case 'license': case 'static':
			*/
		},

		/** @private
		 * Builds the parser map.
		 */
		_buildMap: function()
		{
			var map = {}, parser, tags, tag;

			for (parser in this.parsers)
			{
				tags = this.parsers[parser].split('|');
				while ((tag = tags.pop()))
					map[tag] = this[parser];
			}

			map.constructor = false;

			return map;
		},

		/** @private */
		parseNameText: function(current, text)
		{
			var m = this.NAMETEXT.exec(text);
			if (m)
			{
				current.ident = m[1];
				current.text = m[2];
			}

			return text.length;
		},

		/** @private */
		parseTypeNameText: function(current, text)
		{
			var m = this.TYPENAMETEXT.exec(text);

			if (m)
			{
				current.type = m[1];
				current.ident = m[2];
				current.text = m[3];

				return text.length;
			}

			return this.parseNameText(current, text);

		},

		/** @private */
		parseTypeText: function(current, text)
		{
			var m = this.TYPETEXT.exec(text);
			current.type = m[2];
			current.text = m[3];
			return text.length;
		},

		/** @private */
		parseType: function(current, text)
		{
			var m = this.TYPE.exec(text);

			if ((current.text = m && (m[1] || m[2])))
				current.type = current.text
				;

			return m && m[0].length;
		},

		/** @private */
		parseText: function(current, text)
		{
			current.text = text;
			return text.length;
		},

		/** @private */
		parseMatch: function(match)
		{
		var
			current = this.current,
			tag = current.tag = this.alias[match[1]] || match[1],
			l = 0,
			parser = this.map[tag]
		;
			current.start = match.index;
			current.type = current.ident = current.text = null;

			l = (parser && parser.call(this, current, match[3])) || l;

			current.end = current.start +
				match[1].length + 1 + match[2].length + l;

			return current;
		},

		/** @private */
		parseRegex: function(comment, regex)
		{
			var match, current, tag;

			while ((match = regex.exec(comment)))
			{
				current = this.parseMatch(match);
				tag = current.tag;
				// Call handler function
				(this.handler[tag] || this.handler.handle).call(this.handler, current);

				comment = comment.slice(0, current.start) +
					comment.slice(current.end);
				regex.lastIndex = current.start;
			}

			return comment;
		},

		/**
		 * @param {string} comment The comment to parse
		 * @param meta An optional object to pass to the handler.
		 */
		parse: function(comment, meta)
		{
			if ((comment[0] !== '*' && comment[0] !== '/') ||
				/@ignore(?=\s|$)/.test(comment))
				return;

			this.current.meta = meta;

			comment = this.parseRegex(
				comment.replace(this.CLEAN, ''), this.REGEX
			).trim();

			if (comment)
			{
				this.current.tag = 'desc';
				this.current.text = comment;
				(this.handler.desc || this.handler.handle)(this.current);
			}

			return this.current.meta;
		}

	};

	exports.JSDocParser= JSDocParser;

})(typeof(exports)==='undefined' ? (this.j5g3 || (this.j5g3={})) : exports);

(function (root, factory) {
	'use strict';
	var ns, esprima, jsdoc;

	if (typeof exports !== 'undefined')
	{
		/* global exports */
		/* global require */
		ns = exports;
		esprima = require('esprima');
		jsdoc = require('j5g3.jsdoc-parser').JSDocParser;
	} else {
		ns = /** @type {object} */ root.j5g3;
		esprima = root.esprima;
		jsdoc = ns.JSDocParser;
    }

    factory(ns, esprima, jsdoc);

}(this, function (exports, esprima, JSDocParser) {
	'use strict';

	var hop = Object.prototype.hasOwnProperty;

	/**
	 * Extends A with B
	 */
	function extend(A, B)
	{
		for (var i in B)
			if (B.hasOwnProperty(i))
				A[i] = B[i];

		return A;
	}

	function Tags() {}

	Tags.prototype = {

		constructor: false,

		toArray: function()
		{
			return Object.keys(this);
		},

		set: function(name, value)
		{
			var v = this[name];

			if (v instanceof Array)
				v.push(value);
			else if (v && v !== true)
				this[name] = [ v, value ];
			else
				this[name] = value;

			if (this.private || this.protected)
				delete this.public;
		}

	};

	/**
	 * A symbol, or property name.
	 */
	function Symbol(name, type)
	{
		var symbol = this;

		symbol.name = name;
		symbol.tags = new Tags();
		symbol.type = new Type();
		symbol.tags.public = true;

		if (type !== undefined)
			symbol.set(type);
	}

	Symbol.prototype = {

		set: function(value)
		{
			if (value !== Unknown)
			{
				if (value instanceof Symbol)
					this.copy(value);
				else
				{
					this.type.set(value);
					this.value = value;
				}
			}

			return value;
		},

		/** Copies symbol value and tags. */
		copy: function(symbol)
		{
			this.set(symbol.value);
			extend(this.tags, symbol.tags);

			if (this.tags.private || this.tags.protected)
				delete this.tags.public;
		},

		toString: function()
		{
			return this.value && this.value.toString();
		},

		toJSON: function()
		{
			var result = extend({}, this);

			result.value = result.value && result.value.toString();
			result.type = result.type && result.type.toString();
			return result;
		}

	};

	/** When we dont have a return value */
	function Unknown() {}

	function SymbolTable(scope)
	{
		this.scope = scope;
		this.symbols = {};

		this.build(this.scope.root, this.scope.module);
	}

	SymbolTable.prototype = {

		build: function(type, parent)
		{
			var i, prop, value;

			type.parent = parent.id;

			for (i in type.properties)
			{
				prop = type.properties[i];
				value = prop.value;

				this.process(prop, parent);

				if (value && value.properties && !value.parent)
					this.build(value, prop);
			}
		},

		process: function(symbol, parent)
		{
			this.processTags(symbol, parent);
			this.processId(symbol, parent);
			this.symbols[symbol.id] = symbol;
		},

		tagAlias: function(symbol)
		{
			if (symbol.value && symbol.value.parent)
				symbol.tags.alias = symbol.value.parent;
		},

		tagExtends: function(symbol)
		{
			var fn = symbol.value, ctor;

			if (fn instanceof FunctionType)
			{
				ctor = fn.properties.prototype.value.properties.constructor;

				if (ctor instanceof Symbol)
					symbol.tags.extends = ctor.value.parent;
			}
		},

		tagMethod: function(symbol, parent)
		{
			var isFn = symbol.value instanceof FunctionType;

			if (parent.tags.proto)
				symbol.tags[
					isFn ? 'method' : 'property'
				] = true;
		},

		tagStatic: function(symbol, parent)
		{
			if (!parent.tags.proto && parent.value instanceof ObjectType &&
				!symbol.tags.namespace && !symbol.tags.class && !symbol.tags.mixin && !symbol.tags.method
			)
				symbol.tags.static = true;
		},

		tagClass: function(symbol)
		{
			if (!symbol.tags.method && symbol.type.function)
			{
				var obj = symbol.value.properties.prototype.value;
				if (obj && obj.modified)
					symbol.tags.class = true;
			}
		},

		processTags: function(symbol, parent)
		{
			this.tagAlias(symbol);
			this.tagExtends(symbol);
			this.tagMethod(symbol, parent);
			this.tagClass(symbol);
			this.tagStatic(symbol, parent);
		},

		processId: function(symbol, parent)
		{
			symbol.id = (parent && parent.id && !parent.tags.root) ?
				(parent.id +
					(symbol.tags.proto ? '#' :
						(parent.tags.proto ? symbol.name : '.' + symbol.name))) :
				symbol.name
			;
		}

	};

	function ObjectType()
	{
		this.properties = {};

		this.add('hasOwnProperty',
			new Symbol('hasOwnProperty', hop));
		this.properties.hasOwnProperty.tags.system = true;
		this.modified = false;
	}

	ObjectType.prototype = {

		add: function(property, symbol)
		{
			this.modified = true;
			this.properties[property] = symbol;
			return symbol;
		},

		delete: function(property)
		{
			delete(this.properties[property]);
		},

		get: function(property)
		{
			var result = hop.call(this.properties, property) && this.properties[property];

			if (result===undefined && this.properties.constructor instanceof ObjectType)
				result = this.properties.constructor.get(property);

			return result;
		},

		/**
		 * Iterates through all its properties
		 */
		each: function(callback, scope)
		{
			scope = scope || this;

			for (var i in this.properties)
			{
				callback.call(scope, i, this.properties[i]);
			}
		},

		toString: function()
		{
			return 'object';
		}

	};

	function FunctionType(name)
	{
		ObjectType.call(this);

		this.name = name;
		this.index = 0;
		this.scope = new Scope();
		this.scope.this = new Symbol('this');

		this.initPrototype();
	}

	FunctionType.prototype = Object.create(ObjectType.prototype);

	extend(FunctionType.prototype, {

		/** @private */
		initPrototype: function()
		{
			var proto = new Symbol('prototype');
			proto.set(new ObjectType());
			proto.tags.missing = true;
			proto.tags.proto = true;
			this.add('prototype', proto);
		},

		toJSON: function()
		{
			var json = extend({}, this);
			delete json.body;
			return json;
		},

		toStringParam: function(p)
		{
			var result = p.name + ':' + p.type;

			if ('undefined' in p.type)
				result = '[' + result + ']';

			return result;
		},

		toString: function()
		{
			var result = 'function ' + (this.name || '') + '(';

			if (this.parameters)
				result += this.parameters.map(this.toStringParam).join(', ');

			return result + ')' + (this.returns ? ':' + this.returns : '');
		},

		findParameter: function(name)
		{
			var i=0, param;

			if (!this.parameters)
				this.parameters = [];

			if (name)
				for (;i<this.parameters.length; i++)
				{
					param = this.parameters[i];
					if (param.name === name)
						return param;
				}
			else if ((param = this.parameters[this.index++]))
				return param;

			this.parameters.push(param = new Symbol(name));
			return param;
		}

	});

	function Type() { }

	Type.prototype = {

		types: [ 'null', 'object', 'boolean', 'number', 'string', 'array', 'function' ],

		alias: {
			'Array': 'array',
			'String': 'string',
			'Number': 'number',
			'Object': 'object'
		},

		set: function(type)
		{
			var prop;

			if (type instanceof FunctionType)
				prop = 'function';
			else if (type instanceof Array)
				prop = 'array';
			else if (type===null)
				prop = 'null';
			else if (type instanceof Function)
				prop = 'native';
			else
				prop = typeof(type);

			delete this.undefined;

			this[prop] = type;
		},

		parseType: function(type)
		{
			var t = type.trim();

			if (this.types.indexOf(t) === -1)
				if (this.alias[t])
					t = this.alias[t];
				else
				{
					(this.other || (this.other=[])).push(t);
					return;
				}

			this[t] = t;
		},

		parse: function(type)
		{
			if (type)
				type.split('|').forEach(this.parseType, this);
		},

		toString: function()
		{
			var other = this.other ? this.other.join('|') : '';

			return (this.types.filter(function(r) {
				return r in this;
			}, this).join('|') + other) || '?';
		}

	};

	//////////////////////////////
	// PARSE FUNCTIONS
	/////////////////////////////


	function Scope()
	{
	}

	/**
	 * Scope Manager
	 * @class
	 */
	function ScopeManager()
	{
		var root = this.root = new ObjectType();

		this.root.scope = this.root.properties;
		this.module = new Symbol();
		this.module.value = root;
		this.module.tags.root = true;
		this.module.id = root.parent = '<root>';

		this.stack = [ this.current = this.root.properties ];
	}

	extend(ScopeManager.prototype, {

		addGlobal: function(symbol)
		{
			this.root.add(symbol.name, symbol);
			symbol.tags.global = true;
		},

		setCurrent: function(symbol)
		{
			this.current = symbol;
			return this;
		},

		push: function(scope)
		{
			this.stack.push(this.current);
			return this.setCurrent(scope);
		},

		pop: function()
		{
			return this.setCurrent(this.stack.pop());
		},

		/**
		 * Adds symbol to current scope
		 */
		add: function(symbol)
		{
			if (this.current === this.root.scope)
				this.addGlobal(symbol);
			else
				this.current[symbol.name] = symbol;

			return this;
		},

		/**
		 * Will look for symbol in current scope and in the global scope
		 */
		get: function(name)
		{
		var
			l = this.stack.length-1,
			scope = this.current,
			symbol
		;
			do {
				if ((symbol = scope[name]))
					return symbol;
			} while ((scope = this.stack[l--]));

			// Try property of global object.
			return this.root.get(name);
		},

		getThis: function()
		{
			return (this.current === this.root.scope) ?
				this.root :
				this.get('this');
		}

	});

	/**
	 * @mixin
	 *
	 * Handler functions to translate nodes into symbols
	 */
	var NodeHandler = {

		Program: function(node)
		{
			if (node.comments && node.comments[0] &&
				node.comments[0].range[0]===0)
			{
				this.jsdoc.parse(node.comments[0].value, this.scope.file);
				node.comments[0].value = '';
			}

			var result = this.walkProperty(node.body), dummy;

			if (node.comments)
			{
				dummy = new Symbol('dummy');
				node.comments.forEach(function(comment) {
					if (comment.value)
						this.jsdoc.parse(comment.value, dummy);
				}, this);
			}

			return result;
		},

		Parameter: function(node)
		{
			return new Symbol(node.name);
		},

		ThisExpression: function()
		{
			return this.scope.getThis();
		},

		BlockStatement: function(node)
		{
			return this.walkProperty(node.body);
		},

		IfStatement: function(node)
		{
			var test = this.walk(node.test);

			return this.walk(test ? node.consequent : node.alternate);
		},

		ConditionalExpression: function(node)
		{
			return this.IfStatement(node);
		},

		/**
		 * Makes sure result is always a value not a symbol
		 */
		Value: function(node)
		{
			var result = this.walk(node);
			return (result instanceof Symbol) ? result.value : result;
		},

		CallExpression: function(node)
		{
			var fn = this.Function(node);

			return fn ? this.doCall(fn, node.arguments) :
				(this.walkProperty(node.arguments), Unknown);
		},

		UnaryExpression: function(node)
		{
			var arg = this.Value(node.argument);

			switch (node.operator) {
			case 'typeof':
				return (arg instanceof FunctionType) ? 'function' : typeof(arg);
			case '-': return -arg;
			case '+': return +arg;
			case '!': return !arg;
			case '~': return ~arg;
			case 'void': return void(arg);
			// TODO implement delete?
			case 'delete': return true;
			}
		},

		BinaryExpression: function(node)
		{
		var
			left = this.Value(node.left),
			right = this.Value(node.right)
		;
			/* jshint eqeqeq:false */
			switch (node.operator) {
			case '===': return left === right;
			case '==': return left == right;
			case '!==': return left !== right;
			case '!=': return left != right;
			case '-': return left - right;
			case '+': return left + right;
			case '/': return left / right;
			case '*': return left * right;
			case 'in': return left in right;
			default:
				this.unsupported(node);
			}
		},

		String: function(node)
		{
			var result = this.walk(node);

			return result && result.toString();
		},

		Object: function(node)
		{
			var obj = this.walk(node), result = obj;

			if (obj instanceof Symbol)
				result = obj.value;

			return result || this.missingObject(obj);
		},

		MemberExpression: function(node)
		{
			var result, value, prop = node.property;

			this.transferComments(node, prop);

			value = this.Object(node.object);

			if (!(value instanceof ObjectType))
				return;

			if (node.computed)
				prop = { type: 'Identifier', loc: prop.loc, name: this.String(prop) };

			result = value.get(prop.name) ||
				this.missingProperty(value, prop);

			if (result.value instanceof FunctionType)
				result.value.obj = value;
			else if (result.type.native)
				result.value.obj = value.properties;

			return result;
		},

		AssignmentExpression: function(node)
		{
			if (node.operator==='=')
			{
				this.transferComments(node, node.left);

				var left = this.walk(node.left);
				var right = this.walk(node.right);

				if (left instanceof Symbol)
				{
					delete left.tags.missing;

					left.set(right);

					return left.value;
				}
			}
		},

		ForInStatement: function(node)
		{
		var
			left,
			right = this.Value(node.right),
			property, result
		;
			left = this.walk(node.left.declarations ?
				node.left.declarations[0] :
				node.left
			);

			if (left instanceof Symbol)
			{
				if (right && right.properties)
					right = right.properties;

				for (property in right)
				{
					left.set(property);
					result = this.walk(node.body);
				}
			}

			return result;
		},

		LogicalExpression: function(node)
		{
		var
			left = this.Value(node.left),
			right = this.Value(node.right)
		;
			switch(node.operator) {
			case '&&': return left && right;
			case '||': return left || right;
			default:
				return this.default(node);
			}
		},

		ExpressionStatement: function(node)
		{
			this.transferComments(node, node.expression);
			return this.walk(node.expression);
		},

		Literal: function(node)
		{
			return node.value;
		},

		ArrayExpression: function(node)
		{
			var result = node.elements.map(function(el) {
				return this.walk(el);
			}, this);

			return result;
		},

		Identifier: function(node)
		{
			return this.scope.get(node.name) || this.missingSymbol(node);
		},

		Property: function(node)
		{
			this.transferComments(node, node.key);

			var symbol = this.createSymbol(node.key, this.walk(node.value));

			if (node.kind==='get')
				symbol.tags.getter = true;
			else if (node.kind==='set')
				symbol.tags.setter = true;

			return symbol;
		},

		ObjectExpression: function(node)
		{
		var
			type = new ObjectType(),
			symbol, lends
		;

			if (node.properties.length)
			{
				this.transferComments(node, node.properties[0].key);
				node.properties.forEach(function(node) {
					symbol = this.Property(node);
					type.add(symbol.name, symbol);

					if (symbol.lends)
						lends = symbol.lends;

					if (lends)
						lends.add(symbol.name, symbol);
				}, this);
			}

			return type;
		},

		VariableDeclarator: function(node)
		{
		var
			symbol = this.declareSymbol(this.transferComments(node, node.id))
		;
			this.scope.add(symbol);

			return this.defineSymbol(symbol, node.init ? this.walk(node.init) : undefined);
		},

		VariableDeclaration: function(node)
		{
			if (node.declarations && node.declarations[0])
				this.transferComments(node, node.declarations[0]);

			node.declarations.forEach(this.VariableDeclarator.bind(this));
		},

		FunctionDeclaration: function(node)
		{
		var
			type = this.FunctionExpression(node),
			symbol = this.createSymbol(node.id, type)
		;
			this.scope.add(symbol);
			return symbol;
		},

		FunctionExpression: function(node)
		{
		var
			name = node.id && node.id.name,
			type = new FunctionType(name)
		;
			type.parameters = node.params.map(function(param) {
				type.scope[param.name] = this.Parameter(param);
				return type.scope[param.name];
			}, this);

			/// TODO see if this makes sense.
			if (node.id)
				this.transferComments(node, node.id);

			type.body = node.body;

			return type;
		},

		NewExpression: function(node)
		{
		var
			symbol = this.walk(node.callee),
			fn = (symbol instanceof Symbol) ? symbol.value : symbol,
			result = new ObjectType(),
			ctor
		;
			if (fn)
			{
				this.doCall(fn, node.arguments, result);
				ctor = new Symbol('constructor', symbol);
				ctor.tags.system = true;

				result.add('constructor', ctor);
			}

			return result;
		},

		ReturnStatement: function(node)
		{
			return this.walk(node.argument);
		},

		Function: function(node)
		{
		var
			symbol = this.walk(node.callee),
			fn = (symbol instanceof Symbol) ? symbol.value : symbol
		;
			if (fn && (fn instanceof FunctionType || fn.constructor===Function))
				return fn;
		},

		default: function(node)
		{
			this.unsupported(node);
		}

	};


	/**
	 * @mixin
	 *
	 * Error Handlers.
	 */
	var ErrorHandler = {

		error: function()
		{
			if (exports.docs.debug && typeof console !== undefined)
				/* global console */
				console.log.apply(console, arguments);
		},

		unsupported: function(node)
		{
			this.error("Unsupported node:", node);
		},

		warning: function()
		{
			if (exports.docs.debug && typeof console !== undefined)
				/* global console */
				console.warn.apply(console, arguments);
		},

		/** When symbol does not exist, it creates a global symbol. */
		missingSymbol: function(node)
		{
			var symbol = this.createSymbol(node);
			symbol.tags.missing = true;
			this.scope.addGlobal(symbol);
			return symbol;
		},

		missingObject: function(obj)
		{
			obj.value = new ObjectType();
			return obj.value;
		},

		missingProperty: function(obj, node)
		{
			var symbol = this.declareSymbol(node);
			symbol.tags.missing = true;
			obj.add(symbol.name, symbol);
			return this.defineSymbol(symbol);
		}

	};

	/**
	 * Handles parsed jsdoc data
	 */
	function JSDocHandler(compiler)
	{
		this.compiler = compiler;
	}

	JSDocHandler.prototype = {

		_makeFunction: function(match)
		{
			var val = match.meta.value, fn;

			if (!(val instanceof FunctionType))
			{
				fn = new FunctionType();

				if (val && val.properties)
					fn.properties = val.properties;
				if (fn.properties.prototype)
					fn.properties.prototype.tags.proto=true;

				match.meta.set(fn);
			}
		},

		constructor: function(match)
		{
			this._makeFunction(match);
			match.meta.tags.constructor = true;
		},

		class: function(match)
		{
			this._makeFunction(match);
			match.meta.tags.class = true;
		},

		fires: function(match)
		{
			this.applySymbol('event', match.type);

			match.meta.tags.set('fires', match.type);
		},

		param: function(match)
		{
			if (match.meta.value instanceof FunctionType)
			{
				var p = match.meta.value.findParameter(match.ident);
				p.type.parse(match.type);
				p.tags.desc = match.text;
			}
		},

		lends: function(match)
		{
		var
			symbol = this.compiler.findSymbol(match.type) ||
				this.compiler.scope.module,
			value = symbol.value || symbol.set(new ObjectType())
		;
			match.meta.lends = value;
		},

		applySymbol: function(tag, type, value)
		{
			var symbol = this.compiler.findSymbol(type);

			if (tag && symbol)
				symbol.tags.set(tag, value || true);

			return symbol;
		},

		this: function(match)
		{
			if (match.meta.value instanceof FunctionType)
			{
				var symbol = match.meta.value.scope.this;
				symbol.type.parse(match.type);
				symbol.tags.desc= match.text;
			}
		},

		type: function(match)
		{
			var s = match.meta;

			s.type.parse(match.type);

			if (!s.value)
			{
				if (s.type.object)
					s.value = new ObjectType();
				else if (s.type.function)
					s.value = new FunctionType();
			}
		},

		returns: function(match)
		{
			var type= match.meta.tags.returns = new Type();
			type.parse(match.type);
			type.desc = match.text;

			if (match.meta.value instanceof FunctionType)
				match.meta.value.returns = type;
		},

		handle: function(match)
		{
			switch (match.tag) {
			case 'external': case 'callback': case 'event':
				match.meta = this.applySymbol(match.tag, match.type);
				break;
			case 'name':
				match.meta = this.applySymbol(false, match.type);
				break;
			default:
				match.meta.tags.set(match.tag, match.text || true);
			}
		}

	};

	/**
	 * Default AST Walker
	 */
	function Walker(compiler)
	{
		this.scope = compiler.scope;
		this.jsdoc = new JSDocParser(new JSDocHandler(compiler));
	}

	extend(Walker.prototype, ErrorHandler);
	extend(Walker.prototype, NodeHandler);

	extend(Walker.prototype, {

		/** If true symbols will be treated as system symbols.
		 * These will be documented, but added a tag 'system'.
		 */
		system: false,

		isUnknown: function(result)
		{
			return result === Unknown;
		},

		transferComments: function(A, B)
		{
			var AC = A.leadingComments, BC = B.leadingComments;

			if (AC)
			{
				if (BC)
					BC.push.apply(BC, AC.leadingComments);
				else
					B.leadingComments = AC;
				delete A.leadingComments;
			}

			return B;
		},

		declareSymbol: function(node)
		{
		var
			name = node.type==='Identifier' ? node.name : this.walk(node),
			symbol = new Symbol(name)
		;

			if (node.loc)
				symbol.source = this.scope.file.name + '#' +
					(node.loc.start.line);

			if (this.system)
				symbol.tags.system = true;

			symbol.comments = node.leadingComments;

			return symbol;
		},

		parseComments: function(symbol)
		{
			if (symbol.comments)
			{
				symbol.comments.forEach(function(comment) {
					this.jsdoc.parse(comment.value, symbol);
					comment.value = false;
				}, this);
				delete symbol.comments;
			}

			return symbol;
		},

		defineSymbol: function(symbol, value)
		{
			symbol.set(value);
			this.parseComments(symbol);
			return symbol;
		},

		createSymbol: function(node, type)
		{
			return this.defineSymbol(this.declareSymbol(node), type);
		},

		doCallFunctionType: function(fn, args, scope)
		{
			var result;

			if (fn.parameters)
				fn.parameters.forEach(function(param, i) {
					param.set(this.Value(args[i]));
				}, this);

			if (fn.body) {
				fn.scope.this.value = scope || fn.obj;
				this.scope.push(fn.scope);
				result = this.walk(fn.body);
				this.scope.pop();
			}

			return result;
		},

		doCallNative: function(fn, args, scope)
		{
			var argv = [];
			if (args)
				args.forEach(function(arg) {
					argv.push(this.Value(arg));
				}, this);

			return fn.apply(scope || fn.obj, argv);
		},

		doCall: function(fn, args, thisValue)
		{
			if (fn instanceof FunctionType)
				return this.doCallFunctionType(fn, args, thisValue);

			return this.doCallNative(fn, args, thisValue);
		},

		walkProperty: function(prop, ret)
		{
			var i, result, unknown;

			for (i=0; i<prop.length; i++)
			{
				result = this.walk(prop[i]);

				// Invalidate Return result if a statement is Unknown
				if (result===Unknown)
					unknown = result;

				if (prop[i].type==='ReturnStatement' || (ret && ret(result)))
					break;
			}

			return unknown || result;
		},

		walk: function(node)
		{
			var fn;

			if (node && node.type && (fn = this[node.type] || this.default))
				return fn.call(this, node);
		}

	});

	function Inference(p)
	{
		extend(this, p);

		this.scope = new ScopeManager();
		this.walker = this.walker || new Walker(this);
		this.files = {};

		this.initSymbols();
	}

	Inference.prototype = {

		/** Add node.js system symbols */
		node: false,

		/**
		 * Initialize some built-in objects and functions
		 * @private
		 */
		initSymbols: function()
		{
			var symbols = "Object.create = function(proto) { var F = function() {}; " +
			"F.prototype = proto; return new F(); };";

			if (this.node)
				symbols += "this.exports = this;";

			var ast = esprima.parse(symbols);

			this.walker.system = true;
			this.walker.walk(ast);
			delete this.walker.system;
		},

		compile: function(name, source)
		{
			var file = new Symbol(name);

			file.tags.file = true;
			file.value = source;

			this.files[name] = this.scope.file = file;

			return this.interpret(source);
		},

		interpret: function(source)
		{
			var ast = esprima.parse(source, {
				attachComment: true,
				loc: true,
				range: false
			});

			return this.walker.walk(ast);
		},

		findSymbol: function(id)
		{
			if (!id)
				return id;

			id = id.replace(/#$/g, '.prototype')
				.replace(/#/g, '.prototype.')
			;

			var ast = esprima.parse(id, {range: false});
			return this.walker.walk(ast);
		},

		getSymbols: function()
		{
			this.table = new SymbolTable(this.scope);
			return this.table.symbols;
		}

	};

	extend(Inference, {
		Symbol: Symbol,
		ObjectType: ObjectType,
		FunctionType: FunctionType,
		ScopeManager: ScopeManager
	});

	/** @namespace */
	exports.Inference = Inference;

}));