
/** Support for phantomJS... */

/* global Inference, QUnit */

if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        NOP    = function() {},
        Bound  = function() {
          return fToBind.apply(this instanceof NOP ? this : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    NOP.prototype = this.prototype;
    Bound.prototype = new NOP();

    return Bound;
  };
}

(function() {
	
	var module = QUnit.module.bind(QUnit), test = QUnit.test.bind(QUnit);
	
	function setup()
	{
		var infer = this.infer = new Inference({ debug: true });

		this.run = function(code) {
			infer.compile('test', code);
			return infer.getSymbols({ missing: true });
		};
	}
	
	module('ObjectType');
	test('ObjectType#constructor', function(a) {
		var obj = new Inference.ObjectType();
		a.strictEqual(obj.native, undefined);
		a.ok(obj.properties);
		
		obj = new Inference.ObjectType(false);
		a.strictEqual(obj.native, false);
		var toString = obj.get('toString');
		var value = toString.getValue();
		a.ok(toString);
		a.equal(toString.parent, obj);
		a.ok(value instanceof Inference.ObjectType);
		a.ok(value instanceof Inference.FunctionType);
		
		var undefProp = obj.get('undefined');
		value = undefProp.getValue();
		a.ok(undefProp);
		a.ok(value);
		a.strictEqual(value.native, undefined);
		
	});
	
	module('FunctionType');
	test('FunctionType#constructor', function(a) {
		
		var obj = new Inference.ObjectType({ a: 1 });
		var fn = obj.get('hasOwnProperty').getValue();
		
		a.ok(fn instanceof Inference.FunctionType);
		a.equal(fn.name, 'hasOwnProperty');
		//a.ok(fn.run(null, [ new Inference.ObjectType('a') ]));
		
		fn = new Inference.FunctionType(function a() {});
		a.equal(fn.name, 'a');
	});
	
	test('FunctionType#toString', function(a) {
		
		var fn = new Inference.FunctionType(function () {});
		a.ok(fn.toString());
		
	});
	
	module('Unknown', { beforeEach: setup });
	
	test('Unknown.toString', function(a) {
		var s = this.run('var a = func();');
		a.equal(s.a.value.native.toString(), '?');
	});

	module('Function', { beforeEach: setup });

	test('Function#call', function(a) {

		var s = this.run('!function() { this.a = "yes"; }.call(this)');
		a.ok(s.a);

	});
	
	test('Function#call - scope', function(a) {
		var s = this.run('var c, a={ fn: function() { c=arguments.length; return this; } }, b=a.fn();');
		
		a.ok(s.a);
		a.strictEqual(s.c.getValue().native, 0);
		a.equal(s.b.getValue(), s.a.getValue());
		
	});
	
	module('Inference.Tags');

	test('Tags#set', function(a) {

		var tags = new Inference.Tags();

		a.equal(tags.constructor, false);
		tags.set('constructor', true);
		a.equal(tags.constructor, true);
		tags.set('constructor', false);
		a.equal(tags.constructor, false);
		tags.set('test', 0);
		tags.set('test', 1);
		tags.set('test', 2);
		a.equal(tags.test, 2);
		tags.set('test', 'hello');
		tags.set('test', 'world');
		tags.set('test', 'ftw');
		a.deepEqual(tags.test, ['hello','world','ftw']);
		tags.set('public', true);
		tags.set('private', true);
		a.strictEqual(tags.public, undefined);
		tags.set('public', true);
		tags.set('protected', true);
		a.strictEqual(tags.public, undefined);
	});
	

	
	module('Inference', { beforeEach: setup });
	
	test('Inference#findScope', function(a) {
		
		this.infer.compile('A.js', "function x(a) {\n var b=10;\n }\n x();");
		this.infer.compile('B.js', 'function y(b) { var c=10; }');
		this.infer.compile('C.js', 'var x=function(a){ function b(d) { var c=9; }' +
			'b(); }; x();');
		var files = this.infer.files;
		var engine = this.infer;
		var s1 = engine.findScope('A.js', 2, 1);
		var s2 = engine.findScope('B.js', 1, 15);
		var s3 = engine.findScope('C.js', 1, 34);
		
		a.equal(files['A.js'].functions.length, 1);
		a.equal(files['B.js'].functions.length, 1);
		a.equal(s1, files['A.js'].functions[0].scope);
		a.equal(s2, files['B.js'].functions[0].scope);
		
		a.equal(s3.get('c').getValue().native, 9);
		a.ok(s3.properties.d);
		
		s1 = engine.findScope('A.js', 4, 1);
		
		a.equal(s1, this.infer.scope.root.scope);
	});
	test('Inference.findSymbol', function(a) {
		
		this.infer.compile('A.js', "function x(c) {\n var d={}, b=10;\n d.test = 9; } x(10);");
		
		var x = this.infer.findSymbol('x');
		var scope = x.value.scope;
		var c = this.infer.findSymbol('c', scope);
		var b = this.infer.findSymbol('b', scope);
		
		a.ok(x);
		a.equal(x.name, 'x');
		a.equal(c.name, 'c');
		a.equal(b.getValue().native, 10);
		a.ok(!c.tags.missing);
		a.ok(!b.tags.missing);
	});
	
	test('Inference.findMember', function(a) {
		
		this.infer.compile('A.js', "var x = { hello: 'world' };\nthis.test = 10;\n x.test = this.test;");
		
		var x = this.infer.findSymbol('x');
		var hello = this.infer.findMember('A.js', 1, 12);
		var test = this.infer.findMember('A.js', 2, 5);
		var x2 = this.infer.findMember('A.js', 3, 1);
		var this1 = this.infer.findMember('A.js', 2, 1);
		var this2 = this.infer.findMember('A.js', 3, 11);
		var xTest = this.infer.findMember('A.js', 3, 5);
		var thisTest = this.infer.findMember('A.js', 3, 16);
		
		a.ok(x);
		a.equal(hello.getValue().native, 'world');
		a.equal(test.getValue().native, 10);
		a.equal(x2.getValue(), x.getValue());
		a.equal(this1, this2);
		a.equal(xTest.getValue().native, thisTest.getValue().native);
	});
	
	test('Inference.findAll', function(a) {
		
		this.infer.compile('A.js', "var x = { hello: 'world', help: true };\n" + 
			"this.test = 10;\n x.test = this.test;");
		
		var s = this.infer.findAll('A.js', 1, 4);
		var hello = this.infer.findAll('A.js', 1, 13);
		var test = this.infer.findAll('A.js', 2, 6);
		var x = this.infer.findAll('A.js', 3, 4);
		var all = this.infer.findAll('A.js', 3, 0);
		
		a.ok(s);
		a.equal(hello.suggestions.hello, 'world');
		a.equal(hello.suggestions.help, true);
		a.ok(hello.symbol.name, 'hello');
		a.ok(test.suggestions.test);
		a.ok(x.suggestions.test);
		a.ok(all);
		a.ok(!all.symbol);
		
	});

	module('Inference.Symbol');

	test('Symbol#copy', function(a) {
		var obj = new Inference.ObjectType({});
		var s1 = obj.get('s1');
		var s2 = obj.get('s2');

		s1.tags.set('public', true);

		s2.set('Hello');
		s2.tags.private = true;

		s1.copy(s2);

		a.equal(s1.value, s2.value);
		a.equal(s1.tags.private, true);
		a.ok(!s1.tags.public);
	});

	test('Symbol#toString', function(a) {

		var obj = new Inference.ObjectType({});
		var s1 = obj.get('undefined');

		a.equal(s1.toString(), 'undefined');
		s1.set('Test');
		a.equal(s1.toString(), 'Test');
		s1.set(null);
		a.equal(s1.toString(), 'null');

	});

	module('Nodes', { beforeEach: setup });

	test('Global scope and window scope', function(a) {
		var s = this.run('var w = window, a = 10, b = window.b = 30, c=typeof(this);');
		var win = this.infer.scope.getGlobal('window').getValue();
		
		a.equal(this.infer.scope.getGlobal('this').value, win);
		a.equal(s.w.value,win);
		a.equal(s.a, s.w.value.properties.a);
		a.equal(s.a.value, s.w.value.properties.a.value);
		a.equal(s.b, s.w.value.properties.b);
		a.equal(s.b.value.native, 30);
		a.equal(s.c.value.native, 'object');
	});

	test('ThisExpression - this and window', function(a)
	{
		var s = this.run('var a = window, b = this;');
		a.equal(s.a.value, s.b.value);
		a.equal(s.a.value.properties.a, s.a);
	});

	test('ThisExpression - window as a parameter', function(a) {

		var s = this.run('var t=this, a = (function(window) { window.b = 20; return window; })(this);');
		a.equal(s.a.value, s.t.value);
		a.equal(s.b, s.a.value.properties.b);
		a.equal(s.b.value.native, 20);
		a.equal(s.a.value.properties.a, s.a);
	});
	
	test('ForInStatement', function(a) {
		var s = this.run('var x={}; for (var i in this) { x[i]=this[i]; }');
		
		a.ok(s.x);
		a.ok(s['x.Object']);
		a.ok(s['x.x']);
	});
	
	test('MemberExpression - global', function(a) {
		var s = this.run('var x = this.abc;');
		
		a.ok(s.abc.tags.missing);
		a.ok(s.abc.tags.global);
		a.ok(s.x.tags.global);
	});
	
	test('TryStatement', function(a) {
		var s = this.run('var a, b; try { throw new Error(); } catch(e) { a = e;}' +
			'finally { b = 10; }');
		
		a.ok(s.a.getValue().native);
		a.equal(s.b.getValue().native, 10);
	});

	test('Object - Unknown Value', function(a) {

		var s = this.run('var x = new Type(); x.test = 10;');
		a.ok(s.x.type.object);
		a.equal(s['x.test'].value.native, 10);

	});

	module('Tags', { beforeEach: setup });

	function testTag(a, name, alias, value)
	{
	var
		comment = '/** @' + name + ' ' + (value||'') + ' */',
		template = 'var g1 = { {{comment}} p: null };' +
			'{{comment}} var g2; {{comment}} g1.p2 = true;' +
			'g1.p3 = {{comment}} { sp1: false };' +
			'{{comment}} function fn() { };',
		s = this.run(template.replace(/\{\{comment\}\}/g, comment))
	;
		value = value || true;
		alias = alias || name;

		a.ok(s.g1);
		a.ok(s['g1.p']);
		a.equal(s['g1.p'].tags[alias], value);
		a.equal(s['g1.p2'].tags[alias], value);
		a.ok(s.g2);
		a.equal(s.g2.tags[alias], value);
		a.equal(s['g1.p3.sp1'].tags[alias], value);
		a.equal(s.fn.tags[alias], value);
	}

	test('@abstract', function(a) {
		testTag.call(this, a, 'abstract');
		testTag.call(this, a, 'virtual', 'abstract');
	});

	test('@alias', function(a) {
		var s = this.run(
			'var fn1=function() { }; /** @alias fn1 */function fn2() {};' +
			'function fn3() {}; /** @alias fn3 */function fn4(){};'
		);

		a.equal(s.fn2.tags.alias, 'fn1');
		a.equal(s.fn4.tags.alias, 'fn3');
		testTag.call(this, a, 'alias', null, 'hello');
	});

	test('@author', function(a) {
		testTag.call(this, a, 'author', null, 'The Author');
	});

	test('@callback', function(a) {
		var s = this.run('/** @callback Fn1 @param {number} num */');

		a.ok(s.Fn1);
		a.equal(s.Fn1.value.toString(), 'function (num:number)');
	});

	test('@class', function(a) {
		var s = this.run('/** Description @class */ function fn() {}');
		a.ok(s.fn);
		a.ok(s.fn.tags.class);
	});

	test('@const', function(a) {
		var s = this.run('/** @constant */ var a = 1;');
		a.ok(s.a.tags.constant);
		testTag.call(this, a, 'const', 'constant');
	});

	test('@constructs', function(a) {
		var s = this.run('/** @constructs TextBlock */function a() { }');

		a.ok(s.TextBlock);
		a.ok(s.TextBlock.tags.class);
	});

	test('@copyright', function(a) {
		var s = this.run('/** @copyright (c) 2011 Author Name */var s;');
		a.ok(s.s);
		a.equal(s.s.tags.copyright, '(c) 2011 Author Name');
	});

	test('@deprecated', function(a) {
		testTag.call(this, a, 'deprecated');
	});

	test('@description', function(a) {
		var s = this.run('/** Some description. */ /** @desc More Desc. */' +
			'/** @description Even More Desc. */ var s;');
		a.equal(s.s.tags.desc.join(''), 'Some description.More Desc.Even More Desc.');
		
		s = this.run("/** Comment\n\n@private\n */\nfunction a() {} var b = a;");
		
		a.equal(s.a.tags.desc, 'Comment');
		a.equal(s.b.tags.desc, s.a.tags.desc);
	});
	
	test('@description - Multiline', function(a) {
		var s = this.run("/** One Line\n\n * Two Lines.\n\n * Three Line @private */ var a = {};");
		
		a.equal(s.a.tags.desc, "One Line\n\nTwo Lines.\n\nThree Line");
		
	});

	test('@lends - double definition', function(a) {
		var symbols = this.run("var a = window.a = new View.extend({ /** @lends a */ prop1: 10 });");
		a.ok(symbols.a);
		a.ok(symbols.a.type.object);
		a.ok(symbols['a.prop1']);
		a.equal(symbols['a.prop1'].value.native, 10);
	});

	test('@lends - double definition parenthesis', function(a) {
		var symbols = this.run("var a = window.a = new (View.extend({ /** @lends a */ prop1: 10 }));");
		a.ok(symbols.a);
		a.ok(symbols.a.type.object);
		a.ok(symbols['a.prop1']);
		a.equal(symbols['a.prop1'].value.native, 10);
	});

	test('@lends - global variable', function(a) {
		var symbols = this.run("var a = window.a = new (View.extend({ /** @lends window.a */ prop1: true }));");
		a.ok(symbols.a);
		a.ok(symbols.a.type.object);
		a.ok(symbols['a.prop1']);
		a.equal(symbols['a.prop1'].value.native, true);
	});

	test('@lends - global variable inside module', function(a) {
		var symbols = this.run("(function(window) {" +
			"var a = window.a = new View.extend({ /** @lends window.a */ prop1: true });" +
			"})(this);");
		a.ok(symbols.a);
		a.ok(symbols.a.type.object);
		a.ok(symbols['a.prop1']);
	});

	test('@lends - inside FunctionExpression', function(a) {
		var symbols = this.run("var lends = View.extend({ /** @lends lends */ prop1: true });");

		a.ok(symbols.lends);
		a.ok(symbols['lends.prop1']);
	});

	test('@lends - inside NewExpression', function(a) {

		var symbols = this.run("var lends = new View.extend({ /** @lends lends */ prop1: true });");

		a.ok(symbols.lends);
		a.ok(symbols['lends.prop1']);
	});

	test('@lends - prototype', function(a) {
		var symbols = this.run("var lends = new View.extend({ /** @lends lends# */ prop1: true });");

		a.ok(symbols.lends);
		a.ok(symbols['lends.prototype.prop1']);
	});

	test('@lends - nested', function(a) {
		var symbols = this.run('(function(window) { var lends = window.lends = new (View.extend({' +
			'/** @lends lends */'  +
			'prop0: 1,' +
			'prop1: new Model({ /** @lends lends.prop1# */' +
				'prop2: true' +
			'}),' +
			'prop3: true,' +
			'prop4: View.extend({ /** @lends lends.prop4# */' +
				'prop0: true' +
			'})' +
			'})); })(this);'
		);

		a.ok(symbols.lends);
		a.ok(symbols.lends.type.object);
		a.ok(symbols.lends.value instanceof Inference.ObjectType);
		a.ok(!symbols.lends.tags.missing);
		a.ok(symbols['View.extend']);
		a.ok(symbols.Model);
		a.ok(symbols.Model.tags.missing);
		a.ok(symbols['lends.prop0']);
		a.equal(symbols['lends.prop0'].getValue().native, 1);
		a.ok(!symbols['lends.prop1'].tags.missing);
		a.equal(symbols['lends.prop1.prototype.prop2'].value.native, true);
		a.ok(symbols['lends.prop3']);
		a.ok(symbols['lends.prop4']);
		a.equal(symbols['lends.prop4.prototype.prop0'].value.native, true);
	});

	test('@memberof', function(a) {
		var s = this.run('/** @name delete @memberOf _.memoize.Cache' +
			' @param {string} key The key of the value to remove. */' +
			' function mapDelete() {}');

		a.ok(s['_.memoize.Cache']);
	});
	
	test('@param - default', function(a) {
		
		var s = this.run('/** @param {string} [x_2=hello world] Description*/' +
			'function a() {}');
		
		var p = s.a.getValue().parameters[0];
		
		a.ok(s.a);
		a.equal(p.name, 'x_2');
		a.equal(p.tags.default, 'hello world');
		a.equal(p.tags.desc, 'Description');
	});
	
	test('@param - optional', function(a) {
		
		var s = this.run('/** @param- {string} [x_2=hello world] Description*/' +
			'function a() {}');
		
		var p = s.a.getValue().parameters[0];
		
		a.ok(s.a);
		a.equal(p.name, 'x_2');
		a.equal(p.tags.default, 'hello world');
		a.equal(p.tags.desc, 'Description');
		a.equal(s.a.toString(), 'function a([x_2:string])');
	});
	
	test('@returns - type', function(a) {
		
		var s = this.run('/** @returns {Object[]} Returns `type`. */function a() {}');
		
		a.ok(s.a);
		a.equal(s.a.tags.returns.toString(), 'Object[]');
		a.equal(s.a.tags.returns.desc, 'Returns `type`.');
	});
	
	test('@returns - all', function(a) {
		
		var s = this.run('/** @returns {*} ALL THE ABOVE */ function a() {}');
		
		a.ok(s.a);
		a.equal(s.a.tags.returns.desc, 'ALL THE ABOVE');
		
	});
	
	module('Object', { beforeEach: setup });
	
	test('Object.create', function(a) {
	var
		s = this.run("var a = Object, b = Object.create;")
	;
		a.equal(typeof(s.a.value.native), 'function');
		a.ok(s.b.value, Object.create);
	});
	
	test('Object.hasOwnProperty', function(a) {
	var
		s = this.run("var a = { a1: 1 }, b=a.hasOwnProperty('a1')," +
			"c=a.hasOwnProperty('toString');")
	;
		a.ok(s.a);
		a.strictEqual(s.b.value.native, true);
		a.strictEqual(s.c.value.native, false);
	});
	
	test('Object.isPlainObject', function(a) {
	var
		src = 'function isPlainObject(obj) { var key;' +
		'if ( typeof(obj) !== "object" || obj.nodeType || obj===window ) {' +
			'return false; } if ( obj.constructor &&' +
		'!Object.hasOwnProperty.call( obj, "constructor" ) &&' +
		'!Object.hasOwnProperty.call( obj.constructor.prototype || {},' +
		'"isPrototypeOf" ) ) { return false; } for ( key in obj ) {}' +
		'return key === undefined || Object.hasOwnProperty.call( obj, key ); }' +
		'var a = isPlainObject({}), b=isPlainObject(new Date());',
		s = this.run(src)
	;
		a.ok(s.a.getValue().native);
		a.strictEqual(s.b.getValue().native, false);
	});
	
	module('SymbolTable', { beforeEach: setup });
	
	test('SymbolTable#tagClass', function(a) {
		
		var s = this.run('var A=function() {}, B=function() {};' +
			'B.prototype = Object.create(A.prototype);');
		
		a.ok(s.A);
		a.ok(s.B);
		a.equal(s.B.tags.extends, s.A.getValue());
	});
	

})(this);

