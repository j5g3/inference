
(function(window) {

	module('Tags', {
		setup: function()
		{
			var infer = this.infer = new j5g3.Inference({ debug: true });
			infer.compile('test', 'var window = this;');

			this.run = function(code) {
				infer.compile('test', code);
				return infer.getSymbols();
			};
		}

	});

	test('@lends - double definition', function() {
		var symbols = this.run("var a = window.a = new View.extend({ /** @lends a */ prop1: true });");
		ok(symbols.a);
		ok(symbols['a.prop1']);
	});

	test('@lends - global variable', function() {
		var symbols = this.run("var a = window.a = new View.extend({ /** @lends window.a */ prop1: true });");
		ok(symbols.a);
		ok(symbols['a.prop1']);
	});

	test('@lends - global variable inside module', function() {
		var symbols = this.run("(function(window) {" +
			"var a = window.a = new View.extend({ /** @lends window.a */ prop1: true });" +
			"})(this);");
		ok(symbols.a);
		ok(symbols['a.prop1']);
	});


	test('@lends - Inside NewExpression', function() {

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
		var symbols = this.run('var lends = window.lends = new View.extend({' +
			'/** @lends lends */'  +
			'prop0: 1,' +
			'prop1: new Model({ /** @lends lends.prop1# */' +
				'prop2: true' +
			'}),' +
			'prop3: true,' +
			'prop4: new View({ /** @lends lends.prop4# */' +
				'prop0: true' +
			'})' +
			'});'
		);

		ok(symbols.lends);
		ok(symbols['lends.prop0']);
		ok(symbols['lends.prop1']);
		ok(symbols['lends.prop1.prototype.prop2']);
		ok(symbols['lends.prop3']);
		ok(symbols['lends.prop4']);
		ok(symbols['lends.prop4.prototype.prop0']);
		console.log(symbols.lends);

	});

})(this);

