
function run()
{
	module('symbols');
	test('Initialization', function() {
		ok(symbols);
	});

	test('Functions', function()
	{
		ok(symbols.Doctor);
		equal(symbols.Doctor.name, 'Doctor');
		ok(symbols.Doctor.type.function);
		ok(symbols.deprecated);
		ok(symbols.deprecated2);
		ok(symbols.param0);
		ok(symbols.param2);
		ok(symbols.param3);
		ok(symbols.param4);
		ok(symbols.param5);
		ok(symbols.param6);
		ok(symbols.private);
		ok(symbols.protected);
		ok(symbols.public);
		ok(symbols.returns1);
		ok(symbols.returns2);
		ok(symbols.returns3);
		ok(symbols.constructor);
		ok(symbols.final);
	});

	test('Function Parameters', function()
	{
		var fn = symbols.param0.type.function;
		ok(fn.parameters);
		equal(fn.parameters.length, 1);
		equal(fn.parameters[0].name, 'targetName');

		fn = symbols.param2.type.function;
		ok(fn.parameters);
		equal(fn.parameters.length, 2);
		equal(fn.parameters[0].name, 'callback');

		fn = symbols.param3.type.function;
		ok(fn.parameters);
		equal(fn.parameters.length, 1);
		equal(fn.parameters[0].name, 'id');
	});

	test('Function Prototypes', function() {
		// Make sure there's no global scope prototype
		var p = symbols.Doctor.value.get('prototype');
		ok(p);
		ok(p.tags.proto);
		equal(p.name, 'prototype');

		var say = p.value.get('say');
		ok(say);
		equal(say.name, 'say');

		ok(symbols['Doctor#']);
		ok(symbols['Doctor#'].tags.proto);
		ok(symbols['Doctor#say']);

		ok(symbols.prototype.type.function);
		ok(!symbols.prototype.tags.prototype);
	});

	test('UnaryExpression', function() {
		equal(symbols['unary.type'].value, 'string');
		equal(symbols['unary.type'].type.string, 'string');
		equal(symbols['unary.fn'].value, 'function');
		equal(symbols['unary.obj'].value, 'object');
		equal(symbols['unary.str'].value, 'string');
		equal(symbols['unary.num'].value, 'number');
		equal(symbols['unary.plus'].value, 10);
		equal(symbols['unary.neg'].value, -10);
		equal(symbols['unary.und'].value, undefined);
		equal(symbols['unary.del'].value, true);
	});

	test('Globals', function() {
		ok(symbols.Person);
		ok(symbols.Const);
		strictEqual(symbols.Const.value, 100);
		strictEqual(symbols.Const.type.number, 100);
		ok(symbols.Constant);
		strictEqual(symbols.Constant.value, '200');
		strictEqual(symbols.Constant.type.string, '200');
		ok(symbols.param1);
		ok(symbols.Teacher);

		ok(symbols.global);
		strictEqual(symbols.global.type.number, 100);
		strictEqual(symbols.global.value, 100);

		ok(symbols.globalObj);
		ok(symbols.globalObj.type.object);
		ok(symbols.globalObj.value);
		ok(symbols.globalObj.value.properties.abstract);
		ok(symbols['globalObj.abstract']);
	});

	test('Object Assignment', function() {
		var say = symbols['Doctor#say'];
		var staticVar = symbols['Doctor.staticVar'];

		ok(staticVar);
		ok(staticVar.type.number);
		equal(staticVar.value, 300);
		ok(say.type.function);
		ok(!say.value.name);
	});

	test('Symbol Location', function() {
		equal(symbols.Person.source, 'fixture.js#8');
	});

	test('Built-In Functions', function() {
		ok(symbols['Object.create']);
		ok(!symbols['Object.create'].tags.missing);
	});

	test('ForInStatement', function() {
		equal(symbols.i.value, 'CANCELCANCEL');
		equal(symbols['enumerate.OKOK'].value, 'OK');
		equal(symbols['enumerate.CANCELCANCEL'].value, 'CANCEL');
	});

	///////////////////////////
	// TAGS
	//////////////////////////

	module('tags');
	test('abstract', function() {
		var p = symbols['globalObj.abstract'];
		ok(p.tags.abstract);
		p = symbols['globalObj.virtual'];
		ok(p.tags.abstract);
	});

	test('alias', function() {
		strictEqual(symbols.scope.tags.alias, '<root>');
		equal(symbols.deprecated2.tags.alias, 'deprecated');
	});

	test('author', function() {
		equal(compiler.files['fixture.js'].tags.author, 'Giancarlo Bellido');
		ok(!symbols.Person.tags.author);
		strictEqual(symbols.Doctor.tags.author, 'Author Name <email@gmail.com>');
	});

	test('callback', function() {
		equal(symbols.callback.tags.callback, true);
		var r = symbols.requestResponseCallback;
		ok(r);
		ok(r.tags.callback);
	});

	test('class', function(assert) {
		assert.ok(symbols.Hurl.tags.class);
	});

	test('constant', function() {
		ok(symbols.Const.tags.constant);
		ok(symbols.Constant.tags.constant);
	});

	test('constructor', function() {
		strictEqual(symbols.constructor.tags.constructor, true);
		ok(symbols.constructor.tags.namespace);
	});

	test('constructs', function() {
		ok(symbols['Person#initialize']);
		equal(symbols['Person#initialize'].tags.constructs, 'Person');
	});

	test('copyright', function() {
		strictEqual(symbols.Doctor.tags.copyright, 'Copyright Message');
	});

	test('deprecated', function() {
		ok(symbols.deprecated.tags.deprecated);
		equal(symbols.deprecated2.tags.deprecated, 'since v2.0');
	});

	test('desc', function() {
		equal(symbols['Doctor#say'].tags.desc, 'Says nothing');
	});

	test('enum', function() {
		ok(symbols.enumerate.tags.enum);
	});

	test('event', function() {
		ok(symbols['Hurl#snowball'].tags.event);
	});

	test('extends', function() {
		strictEqual(symbols.Doctor.tags.extends, 'Person');
		strictEqual(symbols.deprecated.tags.extends, 'Person');
		equal(symbols.Teacher.tags.extends, 'Person');
	});

	test('external', function() {
		ok(symbols.String);
		ok(symbols.String.tags.external);
	});

	test('file', function() {
		equal(compiler.files['fixture.js'].tags.desc, 'Test file for cxl-docs');
	});

	test('fires', function() {
		ok(symbols['Hurl#snowball'].tags.event);
		ok(symbols['Hurl#footballMatch'].tags.event);
	});

	test('global', function() {
		ok(symbols.global.tags.global);
		ok(symbols.Person.tags.global);
		ok(symbols.Constant.tags.global);
		ok(symbols.Doctor.tags.global);
		ok(!symbols['Doctor.staticVar'].tags.global);
	});

	test('ignore', function() {
		ok(!symbols.ignore.tags.desc);
		ok(symbols.ignored.tags.desc);
	});

	test('lends', function() {
		ok(symbols['Person#say']);
		ok(symbols['Person#private']);
		ok(symbols['Person#protected']);
		ok(symbols.lends);
		ok(symbols['lends.prop1']);
	});

	test('license', function() {
		equal(compiler.files['fixture.js'].tags.license, 'GPLv2');
	});

	test('method', function() {
		ok(symbols['Person#say'].tags.method);
	});

	test('mixin', function() {
		ok(symbols.mixin.tags.mixin);
	});

	test('name', function() {
		ok(symbols.highlightSearchTerm);
	});

	test('namespace', function() {
		ok(symbols.constructor.tags.namespace);
	});

	test('param', function() {
		equal(symbols.param0.value.parameters.length, 1);
		ok(symbols.param0.value.parameters[0].type.string);
		ok(symbols.param0.value.parameters[0].type.number);
		ok(symbols.param0.value.parameters[0].type.other);
		equal(symbols.param0.value.parameters[0].type.other, 'Array<String>');
		equal(symbols.param0.value.parameters[0].tags.desc,
			'The name (or names) of what to find.' );

		ok(symbols.param2.value.parameters[0].type.function);
		ok(symbols.param2.value.parameters[1].type.object);

		equal(symbols.param4.value.parameters[0].name, '...');
		equal(symbols.param4.value.parameters[0].tags.desc, 'Two or more elements.');
	});

	test('private', function() {
		ok(symbols.private.tags.private);
		ok(!symbols.private.tags.public);
	});

	test('property', function() {
		ok(symbols['Person#property'].tags.property);
		ok(symbols['enumerate.CANCEL'].tags.property);
	});

	test('protected', function() {
		ok(symbols.protected.tags.protected);
		ok(!symbols.protected.tags.public);
	});

	test('public', function() {
		ok(symbols.public.tags.public);
	});

	test('readonly', function() {
		ok(symbols['Doctor.staticVar'].tags.readonly);
	});

	test('requires', function() {
		equal(symbols.requires.tags.requires, 'cxl');
	});

	test('returns', function() {
		var r = symbols.returns1;
		ok(r.value.returns);
		equal(r.tags.returns.other, 'Array<String>');
		equal(r.tags.returns.desc, 'The names of the found item(s).');

		equal(symbols.returns3.tags.returns.desc, 'An object to be passed to {returns1}.');
	});

	test('see', function() {
		equal(symbols.String.tags.see, '{@link https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String String}');
	});

	test('since', function() {
		equal(symbols.since.tags.since, '1.2.3');

	});

	test('static', function() {
		ok(symbols['Doctor.staticVar'].tags.static);
	});

	test('summary', function() {
		equal(symbols.summary.tags.summary, 'I do not like green eggs and ham!');

	});

	test('this', function() {
		var t = symbols.throws1.value.scope.this;
		ok(t);
		equal(t.tags.desc, 'description for symbol.');
		equal(t.type.other, 'Type');
	});

	test('throws', function() {
		var t = symbols.throws1;
		equal(t.tags.throws[0], '{ErrorType}');
		equal(t.tags.throws[1], 'Throws an error message.');
	});

	test('todo', function() {
		var t = symbols.throws1;
		equal(t.tags.todo[0], 'Make it work.');
		equal(t.tags.todo[1], 'Second');
		equal(t.tags.todo[2], 'Third');
	});

	test('type', function() {
		ok(symbols.type1.type.string);
		ok(symbols.type1.type.other.length);
		equal(symbols.type1.type.other, 'Array<string>');
		equal(symbols.type2.type.other, 'integer');
	});

	test('version', function() {
		equal(symbols.since.tags.version, '1.2.3');
	});

}

var symbols, compiler;

$.ajax({ url: 'fixture.js', dataType: 'html' })
	.done(function(fixture, infer) {

	compiler = new j5g3.Inference({ debug: true });
	compiler.compile('fixture.js', fixture);
	symbols = compiler.getSymbols();

	run();
});