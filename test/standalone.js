
(function(window) {

	module('Tags', {
		setup: function()
		{
			this.infer = new j5g3.Inference({ debug: true });
		}
	});
	test('lends - Inside object', function() {

		this.infer.compile('lends', "var lends = new View.extend({ /** @lends lends */ prop1: true });");
		var symbols = this.infer.getSymbols();

		ok(symbols.lends);
		ok(symbols['lends.prop1']);

	});

})(this);

