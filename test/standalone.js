
(function(window) {

	module('Tags', {
		setup: function()
		{
			this.infer = new j5g3.Inference({ debug: true });
		}
	});
	
	test('lends - double definition', function() {

		this.infer.compile('lends', "var a = window.a = new View.extend({ /** @lends a */ prop1: true });");
		var symbols = this.infer.getSymbols();
		ok(symbols.a);
		ok(symbols['a.prop1']);
		console.log(symbols);
	});
	test('lends - Inside NewExpression', function() {

		this.infer.compile('lends', "var lends = new View.extend({ /** @lends lends */ prop1: true });");
		var symbols = this.infer.getSymbols();

		ok(symbols.lends);
		ok(symbols['lends.prop1']);

	});

})(this);

