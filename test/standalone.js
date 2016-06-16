
/** Support for phantomJS... */

/* global module */
/* global test */
/* global Inference */
/* global ok, equal, deepEqual, strictEqual */

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
		
		var fn = new Inference.FunctionType(function a() {});
		a.ok(fn.toString());
		
	});
	
	module('Unknown', { setup: setup });
	
	test('Unknown.toString', function(a) {
		var s = this.run('var a = func();');
		a.equal(s.a.value.native.toString(), '?');
	});

	module('Function', { setup: setup });

	test('Function#call', function(a) {

		var s = this.run('!function() { this.a = "yes"; }.call(this)');
		a.ok(s.a);

	});

	module('Inference.Tags');

	test('Tags#set', function() {

		var tags = new Inference.Tags();

		equal(tags.constructor, false);
		tags.set('constructor', true);
		equal(tags.constructor, true);
		tags.set('constructor', false);
		equal(tags.constructor, false);
		tags.set('test', 0);
		tags.set('test', 1);
		tags.set('test', 2);
		equal(tags.test, 2);
		tags.set('test', 'hello');
		tags.set('test', 'world');
		tags.set('test', 'ftw');
		deepEqual(tags.test, ['hello','world','ftw']);
		tags.set('public', true);
		tags.set('private', true);
		strictEqual(tags.public, undefined);
		tags.set('public', true);
		tags.set('protected', true);
		strictEqual(tags.public, undefined);
	});
	

	
	module('Inference', { setup: setup });
	
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

	module('Inference.Symbol');

	test('Symbol#copy', function() {
		var obj = new Inference.ObjectType({});
		var s1 = obj.get('s1');
		var s2 = obj.get('s2');

		s1.tags.set('public', true);

		s2.set('Hello');
		s2.tags.private = true;

		s1.copy(s2);

		equal(s1.value, s2.value);
		equal(s1.tags.private, true);
		ok(!s1.tags.public);
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

	module('Nodes', { setup: setup });

	test('Global scope and window scope', function(a) {
		var s = this.run('var w = window, a = 10, b = window.b = 30;');
		var win = this.infer.scope.getGlobal('window').getValue();
		
		a.equal(this.infer.scope.getGlobal('this').value, win);
		a.equal(s.w.value,win);
		a.equal(s.a, s.w.value.properties.a);
		a.equal(s.a.value, s.w.value.properties.a.value);
		a.equal(s.b, s.w.value.properties.b);
		a.equal(s.b.value.native, 30);
	});

	test('ThisExpression - this and window', function()
	{
		var s = this.run('var a = window, b = this;');
		equal(s.a.value, s.b.value);
		equal(s.a.value.properties.a, s.a);
	});

	test('ThisExpression - window as a parameter', function() {

		var s = this.run('var t=this, a = (function(window) { window.b = 20; return window; })(this);');
		equal(s.a.value, s.t.value);
		equal(s.b, s.a.value.properties.b);
		equal(s.b.value.native, 20);
		equal(s.a.value.properties.a, s.a);
	});

	test('Object - Unknown Value', function() {

		var s = this.run('var x = new Type(); x.test = 10;');
		ok(s.x.type.object);
		equal(s['x.test'].value.native, 10);

	});

	module('Tags', { setup: setup });

	function testTag(name, alias, value)
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

		ok(s.g1);
		ok(s['g1.p']);
		equal(s['g1.p'].tags[alias], value);
		equal(s['g1.p2'].tags[alias], value);
		ok(s.g2);
		equal(s.g2.tags[alias], value);
		equal(s['g1.p3.sp1'].tags[alias], value);
		equal(s.fn.tags[alias], value);
	}

	test('@abstract', function() {
		testTag.call(this, 'abstract');
		testTag.call(this, 'virtual', 'abstract');
	});

	test('@alias', function() {
		var s = this.run(
			'var fn1=function() { }; /** @alias fn1 */function fn2() {};' +
			'function fn3() {}; /** @alias fn3 */function fn4(){};'
		);

		equal(s.fn2.tags.alias, 'fn1');
		equal(s.fn4.tags.alias, 'fn3');
		testTag.call(this, 'alias', null, 'hello');
	});

	test('@author', function() {
		testTag.call(this, 'author', null, 'The Author');
	});

	test('@callback', function() {
		var s = this.run('/** @callback Fn1 @param {number} num */');

		ok(s.Fn1);
		equal(s.Fn1.value.toString(), 'function (num:number)');
	});

	test('@class', function() {
		var s = this.run('/** Description @class */ function fn() {}');
		ok(s.fn);
		ok(s.fn.tags.class);
	});

	test('@const', function() {
		var s = this.run('/** @constant */ var a = 1;');
		ok(s.a.tags.constant);
		testTag.call(this, 'const', 'constant');
	});

	test('@constructs', function() {
		var s = this.run('/** @constructs TextBlock */function a() { }');

		ok(s.TextBlock);
		ok(s.TextBlock.tags.class);
	});

	test('@copyright', function() {
		var s = this.run('/** @copyright (c) 2011 Author Name */var s;');
		ok(s.s);
		equal(s.s.tags.copyright, '(c) 2011 Author Name');
	});

	test('@deprecated', function() {
		testTag.call(this, 'deprecated');
	});

	test('@description', function() {
		var s = this.run('/** Some description. */ /** @desc More Desc. */' +
			'/** @description Even More Desc. */ var s;');
		equal(s.s.tags.desc.join(''), 'Some description.More Desc.Even More Desc.');
		
		s = this.run("/** Comment\n\n@private\n */\nfunction a() {} var b = a;");
		
		equal(s.a.tags.desc, 'Comment');
		equal(s.b.tags.desc, s.a.tags.desc);
	});

	test('@lends - double definition', function() {
		var symbols = this.run("var a = window.a = new View.extend({ /** @lends a */ prop1: 10 });");
		ok(symbols.a);
		ok(symbols.a.type.object);
		ok(symbols['a.prop1']);
		equal(symbols['a.prop1'].value.native, 10);
	});

	test('@lends - double definition parenthesis', function() {
		var symbols = this.run("var a = window.a = new (View.extend({ /** @lends a */ prop1: 10 }));");
		ok(symbols.a);
		ok(symbols.a.type.object);
		ok(symbols['a.prop1']);
		equal(symbols['a.prop1'].value.native, 10);
	});

	test('@lends - global variable', function() {
		var symbols = this.run("var a = window.a = new (View.extend({ /** @lends window.a */ prop1: true }));");
		ok(symbols.a);
		ok(symbols.a.type.object);
		ok(symbols['a.prop1']);
		equal(symbols['a.prop1'].value.native, true);
	});

	test('@lends - global variable inside module', function() {
		var symbols = this.run("(function(window) {" +
			"var a = window.a = new View.extend({ /** @lends window.a */ prop1: true });" +
			"})(this);");
		ok(symbols.a);
		ok(symbols.a.type.object);
		ok(symbols['a.prop1']);
	});

	test('@lends - inside FunctionExpression', function() {
		var symbols = this.run("var lends = View.extend({ /** @lends lends */ prop1: true });");

		ok(symbols.lends);
		ok(symbols['lends.prop1']);
	});

	test('@lends - inside NewExpression', function() {

		var symbols = this.run("var lends = new View.extend({ /** @lends lends */ prop1: true });");

		ok(symbols.lends);
		ok(symbols['lends.prop1']);
	});

	test('@lends - prototype', function() {
		var symbols = this.run("var lends = new View.extend({ /** @lends lends# */ prop1: true });");

		ok(symbols.lends);
		ok(symbols['lends.prototype.prop1']);
	});

	test('@lends - nested', function() {
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

		ok(symbols.lends);
		ok(symbols.lends.type.object);
		ok(symbols.lends.value instanceof Inference.ObjectType);
		ok(!symbols.lends.tags.missing);
		ok(symbols['View.extend']);
		ok(symbols.Model);
		ok(symbols.Model.tags.missing);
		ok(symbols['lends.prop0']);
		equal(symbols['lends.prop0'].getValue().native, 1);
		ok(!symbols['lends.prop1'].tags.missing);
		equal(symbols['lends.prop1.prototype.prop2'].value.native, true);
		ok(symbols['lends.prop3']);
		ok(symbols['lends.prop4']);
		equal(symbols['lends.prop4.prototype.prop0'].value.native, true);
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
	
	module('Object', { setup: setup });
	
	test('Object.create', function() {
	var
		s = this.run("var a = Object, b = Object.create;")
	;
		equal(typeof(s.a.value.native), 'function');
		ok(s.b.value, Object.create);
	});
	
	test('Object.hasOwnProperty', function() {
	var
		s = this.run("var a = { a1: 1 }, b=a.hasOwnProperty('a1')," +
			"c=a.hasOwnProperty('toString');")
	;
		ok(s.a);
		strictEqual(s.b.value.native, true);
		strictEqual(s.c.value.native, false);
	});
	
	module('Parser', { setup: setup });
	
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
	
	module('SymbolTable', { setup: setup });
	
	test('SymbolTable#tagClass', function(a) {
		
		var s = this.run('var A=function() {}, B=function() {};' +
			'B.prototype = Object.create(A.prototype);');
		
		a.ok(s.A);
		a.ok(s.B);
		a.equal(s.B.tags.extends, s.A.getValue());
	});
	

})(this);

