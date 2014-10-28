
(function(window) {

	function setup()
	{
		var infer = this.infer = new j5g3.Inference({ debug: true });

		this.run = function(code) {
			infer.compile('test', code);
			return infer.getSymbols();
		};
	}

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

})(this);

