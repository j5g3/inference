inference.js
============

A quick and dirty Javascript inference engine.

How to Use
----------

Import it into your project, add and compile files.

	var infer = j5g3.Inference();
	infer.compile('source.js', source);
	
	// getSymbols() returns an object with the symbol names as the keys, and the Symbol
	// objects as values.
	infer.getSymbols();
	
	// You can also access the symbols in a tree structure using the scope property.
	infer.scope;
	
Documentation
-------------

Read the documentation [here](https://j5g3.github.io/inference/docs).