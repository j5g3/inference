
/** Support for phantomJS... */
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

(function(window) {

	function setup()
	{
		var infer = this.infer = new j5g3.Inference({ debug: true });

		this.run = function(code) {
			infer.compile('test', code);
			return infer.getSymbols();
		};
	}

	module('Function', { setup: setup });

	test('Function#call', function(a) {

		var s = this.run('!function() { this.a = "yes"; }.call(this)');
		a.ok(s.a);

	});

	module('Inference.Tags');

	test('Tags#set', function() {

		var tags = new j5g3.Inference.Tags();

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
	
	test('Inference.findScope', function(a) {
		
		this.infer.compile('A.js', "function x(a) {\n var b=10;\n } x();");
		this.infer.compile('B.js', 'function y(b) { var c=10; }');
		var files = this.infer.files;
		var s1 = this.infer.findScope('A.js', 2, 1);
		var s2 = this.infer.findScope('B.js', 1, 15);
		
		a.equal(files['A.js'].scopes.length, 1);
		a.equal(files['B.js'].scopes.length, 1);
		a.equal(s1, files['A.js'].scopes[0]);
		a.equal(s2, files['B.js'].scopes[0]);
		
		s1 = this.infer.findScope('A.js', 1, 1);
		
		a.equal(s1, this.infer.scope.root.scope);
	});
	
	test('Inference.findSymbol', function(a) {
		
		this.infer.compile('A.js', "function x(c) {\n var b=10;\n } x();");
		
		var x = this.infer.findSymbol('x');
		var scope = x.value.scope;
		var c = this.infer.findSymbol('c', scope);
		var b = this.infer.findSymbol('b', scope);
		
		a.ok(x);
		a.equal(x.name, 'x');
		a.equal(c.name, 'c');
		a.equal(b.value, 10);
		a.ok(!c.tags.missing);
		a.ok(!b.tags.missing);
		
		c = this.infer.findSymbol('c');
		a.ok(c.tags.missing);
	});

	module('Inference.Symbol');

	test('Symbol#copy', function() {
		var s1 = new j5g3.Inference.Symbol();
		var s2 = new j5g3.Inference.Symbol();

		s1.tags.set('public', true);

		s2.set('Hello');
		s2.tags.private = true;

		s1.copy(s2);

		equal(s1.value, 'Hello');
		equal(s1.tags.private, true);
		ok(!s1.tags.public);
	});

	test('Symbol#toString', function() {

		var s1 = new j5g3.Inference.Symbol();

		equal(s1.toString(), 'undefined');
		s1.set('Test');
		equal(s1.toString(), 'Test');

	});

	module('Nodes', { setup: setup });

	test('Global scope and window scope', function() {
		var s = this.run('var w = window, a = 10, b = window.b = 30;');
		equal(s.a, s.w.value.properties.a);
		equal(s.a.value, s.w.value.properties.a.value);
		equal(s.b, s.w.value.properties.b);
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
		equal(s.a.value.properties.a, s.a);
	});

	test('Object - Unknown Value', function() {

		var s = this.run('var x = new Type(); x.test = 10;');
		ok(s.x.type.object);
		equal(s['x.test'].value, 10);

	});

	module('Tags', { setup: setup });

	function testTag(name, alias, value)
	{
	var
		comment = '/** @' + name + ' ' + (value||'') + ' */',
		template = 'var g1 = { {{comment}} p: null };' +
			'{{comment}} var g2; {{comment}} g1.p2 = true;' +
			'g1.p3 = {{comment}} { sp1: false };' +
			'{{comment}} function fn() { };'
			,
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
	});

	test('@lends - double definition', function() {
		var symbols = this.run("var a = window.a = new View.extend({ /** @lends a */ prop1: 10 });");
		ok(symbols.a);
		ok(symbols.a.type.object);
		ok(symbols['a.prop1']);
		equal(symbols['a.prop1'].value, 10);
	});

	test('@lends - double definition parenthesis', function() {
		var symbols = this.run("var a = window.a = new (View.extend({ /** @lends a */ prop1: 10 }));");
		ok(symbols.a);
		ok(symbols.a.type.object);
		ok(symbols['a.prop1']);
		equal(symbols['a.prop1'].value, 10);
	});

	test('@lends - global variable', function() {
		var symbols = this.run("var a = window.a = new (View.extend({ /** @lends window.a */ prop1: true }));");
		ok(symbols.a);
		ok(symbols.a.type.object);
		ok(symbols['a.prop1']);
		equal(symbols['a.prop1'].value, true);
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
		ok(symbols.lends.value instanceof j5g3.Inference.ObjectType);
		ok(symbols['lends.prop0']);
		ok(symbols['lends.prop1'].tags.class);
		equal(symbols['lends.prop1.prototype.prop2'].value, true);
		ok(symbols['lends.prop3']);
		ok(symbols['lends.prop4']);
		ok(symbols['lends.prop4'].tags.class);
		equal(symbols['lends.prop4.prototype.prop0'].value, true);
	});

	test('@memberof', function(a) {
		var s = this.run('/** @name delete @memberOf _.memoize.Cache' +
			' @param {string} key The key of the value to remove. */' +
			' function mapDelete() {}');

		a.ok(s['_.memoize.Cache']);
	});

})(this);

