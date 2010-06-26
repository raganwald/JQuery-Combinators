
/*
The MIT License

Copyright (c) 2010 Reginald Braithwaite http://reginald.braythwayt.com
and Ben Alman http://benalman.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

(function($,undefined){
	
	var jq_fn = $.fn,
		aps = Array.prototype.slice,
		noop = function () {};
	
	// combinators
	
	jq_fn.T = function( fn ) {
		fn = typeof Functional != 'undefined' ? Functional.lambda( fn ) : fn;
		return fn.apply( this, [this].concat(aps.call( arguments, 1 )) );
	};
	
	jq_fn.K = function( fn ) {
		fn = typeof Functional != 'undefined' ? Functional.lambda( fn ) : fn;
		fn.apply( this, [this].concat(aps.call( arguments, 1 )) );
		return this;
	};
	
	// variations
	
	jq_fn.ergo = function( fn, optionalUnless ) {
		var whichFn = this.length ? fn : (optionalUnless ? optionalUnless : noop);
		whichFn = typeof Functional != 'undefined' ? Functional.lambda( whichFn ) : whichFn;
		whichFn.apply( this, [this].concat(aps.call( arguments, 1 )) );
		return this;
	};
	
	jq_fn.when = function (fn) {
		fn = typeof Functional != 'undefined' ? Functional.lambda( fn ) : fn;
		return fn.apply( this, [this].concat(aps.call( arguments, 1 )) ) ? this.filter('*') : this.filter('not(*)');
	};
	
	// aliases
	
	if ( jq_fn.tap === undefined ) {
		jq_fn.tap = jq_fn.K;
	}
	
	if ( jq_fn.into === undefined ) {
		jq_fn.into = jq_fn.T;
	}
	
})(jQuery);