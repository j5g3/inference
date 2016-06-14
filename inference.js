/**
 * @license GPLv3
 * @author Giancarlo Bellido
 * @requires esprima.js
 */
(function (root, factory) {
	'use strict';
	var ns, esprima, jsdoc;

	if (typeof exports !== 'undefined')
	{
		/* global exports */
		/* global require */
		ns = exports;
		esprima = require('esprima');
		jsdoc = exports.JSDocParser;
	} else {
		ns = /** @type {object} */ root;
		esprima = root.esprima;
		jsdoc = ns.JSDocParser;
    }

    factory(ns, esprima, jsdoc);

}(this, function (exports, esprima, JSDocParser) {
	'use strict';

	/** When we dont have a return value */
	function Unknown() { return Unknown; }

	Unknown.toString = function() { return '?'; };

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

		set: function(name, value)
		{
			var v = this[name];

			if (v instanceof Array)
				v.push(value);
			else if (typeof(v)==='string' && typeof(value)==='string')
				this[name] = [ v, value ];
			else
				this[name] = value;

			if (this.private || this.protected)
				delete this.public;
		},

		toArray: function()
		{
			var result = [];

			function Many(val)
			{
				return result.push(this + ': ' + val);
			}

			for (var i in this)
				if (this.hasOwnProperty(i))
					if (Array.isArray(this[i]))
						this[i].forEach(Many.bind(this[i]));
					else if (this[i])
						result.push(i);

			return result;
		}

	};

	/**
	 * A reference to an ObjectType property.
	 */
	function Symbol(parent, name)
	{
		var symbol = this;
		
		symbol.name = name;
		symbol.parent = parent;
		symbol.tags = new Tags();
		symbol.type = new Type();
		
		// Set missing as default until symbol is set.
		symbol.tags.missing = true;
	}

	Symbol.prototype = {
		
		/** @type {ObjectType} */
		parent: null,
		
		/** Name of symbol @type {String} */
		name: null,
		
		/** @type Tags */
		tags: null,
		
		/** History of types. @type Type */
		type: null,

		/**
		 * Sets symbol value.
		 * @param value {ObjectType|Symbol}
		 */
		set: function(value)
		{
			if (value !== UnknownType)
			{
				if (value instanceof Symbol)
					this.copy(value);
				else
				{
					if (value!==undefined)
						delete this.tags.missing;
					
					if (!(value instanceof ObjectType))
						value = new ObjectType(value);
					
					this.type.set(value.native);
					// TODO is this safe?
					if (this.parent.native[this.name]!==value.native)
					{
						this.parent.native[this.name] = value.native;
					}
					
					this.value = value;
				}
			} else if (this.getValue() === UndefinedType)
				this.value = UnknownType;

			return value;
		},
		
		getValue: function()
		{
			return this.value || this.set(this.parent.native[this.name]);
		},

		/** Copies symbol value and tags. */
		copy: function(symbol)
		{
			extend(this.tags, symbol.tags);
			
			this.set(symbol.getValue());

			if (this.tags.private || this.tags.protected)
				delete this.tags.public;

			delete this.tags.system;
		},

		toString: function()
		{
			return this.getValue().toString();
		}

	};
	
	function SymbolTable(scope, options)
	{
		this.scope = scope;
		this.options = options || {};
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

				if (prop.tags.system ||
					(!this.options.missing && prop.tags.missing))
					continue;

				value = prop.getValue();

				this.process(prop, parent);

				if (value && !value.const && value.properties && !value.parent)
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
				ctor = fn.get('prototype').getValue().properties.constructor;
				
				if (ctor && ctor!==Object)
					symbol.tags.extends = ctor;
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
			var val = symbol.getValue();
			
			if (val && !symbol.tags.method &&
				(symbol.type.function || symbol.type.object))
			{
				var obj = val.properties &&
					val.properties.prototype &&
					val.properties.prototype.value;

				if (obj)
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
	
	function ObjectType(native)
	{
		if (native===undefined) return UndefinedType;
		if (native===null) return NullType;
		if (native===true) return TrueType;
		if (native===false) return FalseType;
		if (native===Unknown) return UnknownType;
		
		var instance = native[objid];
		if (instance)
			return instance;
		
		if (native instanceof Function)
			return new FunctionType(native);
		
		this.init(native);
	}
	
	extend(ObjectType.prototype, {
		
		/** Native value */
		native: undefined,
		
		init: function(native)
		{
			this.native = native;
			this.properties = {};
			var type = typeof(native);
			
			if (type!=='string' && type!=='number')
				Object.defineProperty(native, objid,
					{ enumerable: false, value: this });
		},
		
		/** @type {Array<Symbol>} */
		properties: null,
		
		get: function(property)
		{
			if (Object.hasOwnProperty.call(this.properties, property))
				return this.properties[property];
			
			return (this.properties[property] = new Symbol(this, property));
		},
		
		toString: function()
		{
			var v = this.native;
			
			if (v===undefined) return 'undefined';
			if (v===null) return 'null';
			
			return v.toString();
		}
		
	});

	function FunctionType(native, name)
	{
		this.init(native);
		this.name = name || native.name || '';
		this.scope = new ObjectType({});
		
		this.initPrototype();
	}

	FunctionType.prototype = Object.create(ObjectType.prototype);

	extend(FunctionType.prototype, {
		
		name: null,
		
		parameters: null,
		
		returns: null,

		/** @private */
		initPrototype: function()
		{
		var
			proto = this.get('prototype')
		;
			proto.tags.proto = true;
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
		
		getLocal: function(name)
		{
			return this.scope.get(name);
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

			this.parameters.push(param = new Symbol(this.scope, name));
			return param;
		}

	});

	function Type() {}

	Type.prototype = {
		
		// Custom types
		other: null,
		__cached: null,

		TYPES: {
			'Array': 'array',
			'String': 'string',
			'Number': 'number',
			'Object': 'object',
			'null': 'null',
			'object': 'object',
			'boolean': 'boolean',
			'number':'number',
			'string': 'string',
			'array': 'array',
			'function': 'function'
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
			this.__cached=null;
		},

		parseType: function(type)
		{
			type = type.trim();
		var
			t = this.TYPES[type],
			other = this.other || (this.other=[])
		;
			if (t)
				this[t] = t;
			else
				other.push(type);
			
			this.__cached=null;
		},

		parse: function(type)
		{
			if (type)
				type.split('|').forEach(this.parseType, this);
		},

		toString: function()
		{
			if (this.__cached === null)
			{
				var types = this.other ? this.other.concat() : [];
				
				if (this.array!==undefined) types.push('array');
				if (this.boolean!==undefined) types.push('boolean');
				if (this.function) types.push('function');
				if (this.null!==undefined) types.push('null');
				if (this.number!==undefined) types.push('number');
				if (this.object!==undefined) types.push('object');
				if (this.string!==undefined) types.push('string');
				
				this.__cached = types.join('|') || '?';
			}
			
			return this.__cached;
		}

	};
	
	function ConstType(native)
	{
		this.const = true;
		this.native = native;
		this.properties = {};
	}
	
	ConstType.prototype = Object.create(ObjectType.prototype);
	
	var
		objid = '__' + Date.now(),
		UndefinedType = new ConstType(undefined),
		NullType = new ConstType(null),
		TrueType = new ConstType(true),
		FalseType = new ConstType(false),
		UnknownType = new FunctionType(Unknown)
	;
	
	UnknownType.const = true;

	//////////////////////////////
	// PARSE FUNCTIONS
	/////////////////////////////

	/**
	 * Scope Manager
	 * @class
	 */
	function ScopeManager(infer)
	{
		this.infer = infer;
		
		var root = this.root = new ObjectType({});
		var thisVal = root.get('this');
		root.scope = root;
		thisVal.set(root);
		thisVal.tags.system = true;

		this.module = new Symbol();
		this.module.value = root;
		this.module.tags.root = true;
		this.module.id = '<root>';

		this.stack = [];
		this.push(this.root.scope);
	}

	extend(ScopeManager.prototype, {

		with: function(scope, cb, cbscope)
		{
			var c = this.current, s = this.stack, result;

			this.stack = [ this.current = scope ];
			result = cb.call(cbscope);
			this.stack = s;
			this.current = c;
			return result;
		},

		getGlobal: function(name)
		{
			var symbol = this.root.get(name);
			symbol.tags.global = true;
			
			return symbol;
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
		 * Will look for symbol in current scope and in the global scope
		 */
		get: function(name)
		{
		var
			scope = this.current,
			symbol
		;
			do {
				if ((symbol = scope.properties[name]))
					return symbol;
			} while ((scope = scope.parent));

			// Try property of global object.
			return this.root.get(name);
		},

		getThis: function()
		{
			return this.current.get('this');
		}

	});

	/**
	 * @mixin
	 *
	 * Handler functions to translate nodes into symbols
	 */
	var NodeHandler = {
		
		result: function(val)
		{
			if (val instanceof Symbol)
				return val;
			
			return val instanceof ObjectType ? val : new ObjectType(val);
		},
		
		/**
		 * Makes sure result is always a native value not a Symbol or ObjectType
		 */
		Value: function(node)
		{
			var result = this.walk(node);
			
			if (result instanceof Symbol)
				result = result.getValue();
			
			return result.native;
		},
		
		Symbol: function(node)
		{
		var	
			result = this.walk(node),
			symbol
		;
			if (result instanceof ObjectType)
			{
				symbol = new Symbol();
				symbol.value = result;
				result = symbol;
			}
				
			return result;
		},
		
		EmptyStatement: function() { },

		Program: function(node)
		{
			/*if (node.comments && node.comments[0] &&
				node.comments[0].range[0]===0)
			{
				this.jsdoc.parse(node.comments[0].value, this.scope.file);
				node.comments[0].value = '';
			}*/

			var result = this.walkProperty(node.body), dummy;

			if (node.comments)
			{
				dummy = new Symbol('dummy');
				node.comments.forEach(function(comment) {
					if (comment.value)
					{
						this.warning('Parsing comment from global scope: "' +
							comment.value + '"');
						this.jsdoc.parse(comment.value, dummy);
					}
				}, this);
			}

			return result;
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
			var test = this.Value(node.test);

			return this.walk(test ? node.consequent : node.alternate);
		},

		ConditionalExpression: function(node)
		{
			return this.IfStatement(node);
		},

		CallExpression: function(node)
		{
		var
			sym = this.Function(node),
			fn = sym.getValue()
		;
			return (fn && fn !== UnknownType) ?
				this.doCall(fn, node.arguments, sym.parent) :
				(this.walkProperty(node.arguments), sym);
		},

		UnaryExpression: function(node)
		{
			var arg = this.Value(node.argument);

			switch (node.operator) {
			case 'typeof': return this.result(typeof(arg));
			case '-': return this.result(-arg);
			case '+': return this.result(+arg);
			case '!': return this.result(!arg);
			case '~': return this.result(~arg);
			case 'void': return this.result(void(arg));
			// TODO implement delete?
			case 'delete': return this.result(true);
			default:
				console.log('Unhandled UnaryExpression operator: ' + node.operator);
			}
		},
		
		BinaryExpression: function(node)
		{
			return this.result(this.doBinaryExpression(node));
		},

		doBinaryExpression: function(node)
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
			case '>': return left > right;
			case '<': return left < right;
			case '>=': return left >= right;
			case '<=': return left <= right;
			case '%': return left % right;
			case '&': return left & right;
			case '&&': return left && right;
			case '|': return left | right;
			case '||': return left || right;
			case '>>>': return left >>> right;
			case 'instanceof': try {
				return left instanceof right;
			} catch(e) { return; }
				break;
			case 'in': try {
				return left in right;
			} catch(e) { return; }
				break;
			default:
				this.unsupported(node);
			}
		},
		
		WhileStatement: function(node)
		{
			var loops = this.infer.maxLoops;
			
			while (this.Value(node.test) && loops-->0)
			{
				this.walk(node.body);
			}
		},
		
		TryStatement: function(node)
		{
			// TODO
			this.walk(node.block);
			this.walk(node.finalizer);
		},

		String: function(node)
		{
			return this.walk(node).toString();
		},

		Object: function(node)
		{
		var
			result = this.walk(node),
			isSymbol = result instanceof Symbol,
			value = isSymbol ? result.getValue() : result,
			obj = value.native
		;
			if (obj===null || obj===undefined || value===UnknownType)
			{
				value = this.missingObject(obj);
				if (isSymbol)
					result.set(value);
			}

			return value;
		},

		MemberExpression: function(node)
		{
		var
			prop = node.property,
			object = this.Object(node.object)
		;
			if (node.computed)
				prop = { type: 'Identifier', loc: prop.loc, name: this.String(prop) };
			this.transferComments(node, prop);
			
			return this.initSymbol(prop, object);
		},

		AssignmentExpression: function(node)
		{
			this.transferComments(node, node.left);

			var right = this.walk(node.right);
			var left = this.Symbol(node.left);
			
			if (node.operator==='=')
				left.set(right);
			else
				this.unsupported(node);
			
			return left;
		},

		ForInStatement: function(node)
		{
		var
			left,
			right = this.Object(node.right),
			property, result
		;
			left = this.Symbol(node.left.declarations ?
				node.left.declarations[0] :
				node.left
			);

			for (property in right.native)
			{
				left.set(property);
				result = this.walk(node.body);
			}

			return result;
		},
		
		ForStatement: function(node)
		{
			var loops = this.infer.maxLoops;
			
			this.walk(node.init);
			
			do {
				this.walk(node.body);
				this.walk(node.update);
			} while(this.Value(node.test) && loops-->0);
		},
		
		UpdateExpression: function(node)
		{
		var
			left = this.Value(node.argument),
			result
		;
			switch(node.operator) {
			case '++': result = node.prefix ? ++left : left++; break;
			case '--': result = node.prefix ? --left : left--; break;
			default:
				result = this.unsupported(node);
			}
			
			return this.result(result);
		},

		LogicalExpression: function(node)
		{
		var
			left = this.Value(node.left),
			right = this.Value(node.right)
		;
			switch(node.operator) {
			case '&&': return this.result(left && right);
			case '||': return this.result(left || right);
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
			return this.result(node.value);
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

		Property: function(node, parent)
		{
			this.transferComments(node, node.key);

			var symbol = this.initSymbol(node.key, parent, this.walk(node.value));

			if (node.kind==='get')
				symbol.tags.getter = true;
			else if (node.kind==='set')
				symbol.tags.setter = true;

			return symbol;
		},

		ObjectExpression: function(node)
		{
		var
			type = new ObjectType({}),
			symbol, lends
		;
			if (node.properties.length)
			{
				this.transferComments(node, node.properties[0].key);
				node.properties.forEach(function(node) {
					symbol = this.Property(node, type);

					if (symbol.lends)
						lends = symbol.lends;
					if (lends)
						lends.get(symbol.name).set(symbol);
					
				}, this);
			}

			return this.result(type);
		},

		VariableDeclarator: function(node)
		{
		var
			value = node.init ? this.walk(node.init) : undefined,
			symbol
		;
			this.transferComments(node, node.id);
			symbol = this.initSymbol(node.id, this.scope.current, value);

			return symbol;
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
			symbol = this.initSymbol(node.id, this.scope.current, type)
		;
			return symbol;
		},

		FunctionExpression: function(node)
		{
		var
			name = node.id && node.id.name,
			walker = this,
			body = node.body,
			fn = new FunctionType(function() {
			var
				argv = arguments,
				result
			;
				fn.getLocal('arguments').set(argv);
				fn.getLocal('this').set(this);
				
				if (argv && fn.parameters)
					fn.parameters.forEach(function(param, i) {
						var val = argv[i];
						param.set(val);
					});

				if (body) {
					try {
						walker.scope.push(fn.scope);
						walker.walk(body);
					} catch(e)
					{
						if (e.scope === fn.scope)
							result = e.result;
						else
							throw e;
					} finally {
						walker.scope.pop();
					}
				}

				return walker.result(result);
			}, name)
		;
			fn.parameters = node.params.map(function(param) {
				return fn.getLocal(param.name);
			}, this);

			if (node.id)
				this.transferComments(node, node.id);
			
			this.infer.file.registerFunction(fn, body.loc);

			return this.result(fn);
		},

		NewExpression: function(node)
		{
		var
			fn = this.Function(node).getValue(),
			inst, result
		;
			if (fn)
			{
				inst = Object.create(fn.native.prototype);
				result = this.doCall(fn, node.arguments, inst);
				
				if (!result)
					result = inst;

			} else if (node.arguments)
			{
				node.arguments.forEach(this.walk, this);
			}

			return this.result(result);
		},

		ReturnStatement: function(node)
		{
			var result = this.walk(node.argument);
			
			throw { scope: this.scope.current, result: result };
		},

		Function: function(node)
		{
		var
			result = this.Symbol(node.callee),
			fn = result.getValue()
		;
			if (fn.native && fn!==UnknownType && (fn instanceof FunctionType))
				return result;
			
			return this.missingFunction(node.callee);
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
			if (this.debug && typeof console !== undefined)
				/* global console */
				console.log.apply(console, arguments);
		},

		unsupported: function(node)
		{
			this.error("Unsupported node:", node);
		},

		warning: function()
		{
			if (this.debug && typeof console !== undefined)
				/* global console */
				console.warn.apply(console, arguments);
		},

		/** When symbol does not exist, it creates a global symbol. */
		missingSymbol: function(node)
		{
			if (this.strict)
				throw "Could not find symbol.";
			
			var symbol = this.initSymbol(node, this.scope.root, UnknownType);
			symbol.tags.missing = true;
			
			return symbol;
		},

		missingObject: function(obj)
		{
			var result = new ObjectType({});

			if (obj instanceof Symbol)
			{
				obj.set(result);
				obj.tags.missing = true;
			}

			return result;
		},
		
		missingFunction: function(node)
		{
		var
			val = UnknownType,
			symbol = this.initSymbol(node, this.scope.root, val)
		;
			return symbol;
		},

		missingProperty: function(obj, node)
		{
			var symbol = this.initSymbol(node, obj, UnknownType);
			symbol.tags.missing = true;
			return symbol;
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
				fn = new FunctionType(function() { return Unknown; });
				//if (val && val.properties)
				//	fn.properties = val.properties;
				//if (fn.properties.prototype)
				//	fn.properties.prototype.tags.proto=true;

				match.meta.set(fn);
			}
		},

		applySymbol: function(tag, type, value)
		{
			var symbol = this.compiler.findSymbol(type);

			if (tag && symbol)
				symbol.tags.set(tag, value || true);

			return symbol;
		},

		callback: function(match)
		{
			match.meta = this.applySymbol(match.tag, match.type);
			this._makeFunction(match);
		},

		constructor: function(match)
		{
			this._makeFunction(match);
			match.meta.tags.constructor = true;
		},

		constructs: function(match)
		{
			var fn = match.meta && match.meta.getValue();
			
			match.meta = this.applySymbol(match.tag, match.type);
			
			if (fn instanceof FunctionType)
				match.meta.set(fn);
			
			match.meta.tags.class = true;
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

		name: function(match)
		{
			match.meta = new Symbol(new ObjectType({}), match.type);
			match.meta.name = match.type;
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

		memberof: function(match)
		{
		var
			symbol = this.compiler.findSymbol(match.type)
		;
			if (symbol.value===undefined || symbol.value === UnknownType)
				symbol.set(new ObjectType({}));

			symbol.getValue().get(match.meta.name).set(match.meta);
		},

		lends: function(match)
		{
		var
			symbol = this.compiler.findSymbol(match.type) ||
				this.compiler.scope.module,
			value = symbol.getValue()
		;
			if (value.native===undefined || value===UnknownType)
				value = symbol.set(new ObjectType({}));

			match.meta.lends = value;
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
					s.value = new ObjectType({});
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
			case 'external': case 'event':
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
		this.infer = compiler;
		this.debug = compiler.debug;
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
		
		/**
		 * Enables strict parsing mode. Throws when a symbol is not found.
		 */
		strict: false,

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
		
		initSymbol: function(node, object, value)
		{
		var
			name = node.type==='Identifier' ? node.name : this.String(node),
			symbol = object.get(name)
		;
			symbol.file = this.infer.file;
			symbol.loc = node.loc;

			if (this.system)
				symbol.tags.system = true;

			symbol.comments = node.leadingComments;
			
			if (arguments.length===3)
				symbol.set(value);

			return this.parseComments(symbol);
		},

		doCall: function(fn, args, thisValue)
		{
			if (thisValue===undefined)
				thisValue = this.scope.root;
			
			if (!(fn instanceof FunctionType))
				return this.result(Unknown);
			
			var argv = args && args.map(function(arg) {
				return this.Value(arg);
			}, this);
			
			return this.result(fn.native.apply(thisValue.native, argv));
		},

		walkProperty: function(prop)
		{
			var result;
			
			for (var i=0; i<prop.length; i++)
				result = this.walk(prop[i]);

			return result || this.result();
		},

		walk: function(node)
		{
			var fn;

			if (node && node.type && (fn = this[node.type] || this.default))
				return fn.call(this, node);
		}

	});
	
	function File(name, source)
	{
		this.functions = [];
		/// Stores member symbols. Used by findSymbol()
		this.symbols = [];
		this.tags = new Tags();
		this.name = name;
		this.source = source;
		this.tags.file = true;
	}
	
	File.prototype = Object.create(Symbol.prototype);
	
	extend(File.prototype, {
		
		registerFunction: function(scope, loc)
		{
			scope.loc = loc;
			this.functions.push(scope);
		},
		
		registerSymbol: function(symbol, loc)
		{
			symbol.loc = loc;
			this.symbols.push(symbol);
		}
		
	});
	
	function Inference(p)
	{
		extend(this, p);

		this.file = new File();
		this.scope = new ScopeManager(this);
		this.walker = this.walker || new Walker(this);
		this.files = {};
		this.initSymbols();
	}

	Inference.prototype = {

		/** Enable output of system errors and warnings to console. */
		debug: false,
		
		/** Maximum number of loop counts allowed */
		maxLoops: 1000,

		/** Add node.js system symbols */
		node: false,

		/**
		 * Initialize some built-in objects and functions
		 * @private
		 */
		initSymbols: function()
		{
			if (this.node)
			{
				this.system('exports', {});
			} else
			{
				this.system('window', this.scope.get('this'));
				this.system('self', this.scope.get('this'));
			}

			this.systemObject('Object', Object);
			this.systemObject('Date', Date);
			this.systemObject('Array', Array);
			this.systemObject('String', String);
		},

		/**
		 * Add system symbols
		 */
		system: function(name, value)
		{
			var s = this.scope.getGlobal(name);
			s.set(value);
			s.tags.system = true;
			return s;
		},
		
		systemObject: function(name, Native)
		{
		var
			s = this.scope.getGlobal(name)
		;
			s.set(extend(
				function(a,b,c,d,e,f,g,h) { new Native(a,b,c,d,e,f,g,h); },
				Native
			));
			s.tags.system = true;
			return s;
		},
		
		setFile: function(file)
		{
			this.files[file.name] = this.file = file;
		},

		compile: function(name, source)
		{
			this.setFile(new File(name, source));
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
		
/*		findAll: function(filename, line, ch, token, id)
		{
		var
			result = {},
			symbol = this.findMember(filename, line, ch),
			parent
		;
			if (symbol)
			{
				result.symbol = symbol.symbol;
				id = result.symbol.name.substr(0, ch-symbol.startCh);
				parent = symbol.symbol.parent;
				
				if (parent)
					result.suggestions = this.findSuggestions(parent.properties, id, result.symbol);
			} else
			{
				parent = this.findScope(filename, line, ch);
				symbol = this.findSymbol(token, parent);
				
				if (symbol && symbol.name)
					result.symbol = symbol;
				
				do {
					result.suggestions = this.findSuggestions(parent.symbols, id, result.symbol);
				} while ((parent = parent.parent));
			}
			
			return result;
		},*/
		
		findSymbol: function(id, scope)
		{
			if (!id)
				return id;

			id = id.replace(/#$/g, '.prototype')
				.replace(/#/g, '.prototype.')
			;
			
			scope = scope || this.scope.current;
			
			return this.scope.with(scope,
				function() {
					try {
						return this.walker.walk(
							esprima.parse(id, {range: false})
						);
					} catch (e) {
						return;
					}
				}, this
			);
		},

		getSymbols: function(options)
		{
			this.table = new SymbolTable(this.scope, options);
			return this.table.symbols;
		},
		
		findSuggestions: function(obj, id)
		{
			var result = [];
			
			for (var i in obj)
				if (!id || i.indexOf(id)===0)
					result.push(obj[i]);
			
			return result;
		},
		
		findInMap: function(map, line, ch)
		{
		var
			l = map.length, scope, loc
		;
			while (l--)
			{
				scope = map[l];
				loc = scope.loc;
				
				if (loc && (line===loc.start.line && ch>=loc.start.column || line > loc.start.line) &&
				(line===loc.end.line && ch <= loc.end.column || line < loc.end.line))
					return scope;
			}
		},
		
		findMember: function(filename, line, ch)
		{
		var
			file = this.files[filename]
		;
			return file && this.findInMap(file.map, line, ch);
		},
		
		findScope: function(filename, line, ch)
		{
		var
			file = this.files[filename],
			fn = this.findInMap(file.functions, line, ch)
		;
			return fn && fn.scope || this.scope.root;
		},
		
		symbolAt: function(filename, line, ch, token)
		{
			var symbol = this.findInMap(filename, line, ch, token);
			return symbol.symbol;
		}

	};
	
	extend(Inference, {
		Symbol: Symbol,
		ObjectType: ObjectType,
		FunctionType: FunctionType,
		ScopeManager: ScopeManager,
		Tags: Tags
	});

	/** @namespace */
	exports.Inference = Inference;

}));