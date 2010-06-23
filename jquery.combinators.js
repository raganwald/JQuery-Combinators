
/*
The MIT License

Copyright (c) 2010 Reginald Braithwaite http://reginald.braythwayt.com

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
		aps = Array.prototype.slice;
	
	jq_fn.K = function( fn ) {
		fn = typeof Functional != 'undefined' ? Functional.lambda( fn ) : fn;
		fn.apply( this, aps.call( arguments, 1 ) );
		return this;
	};
	
	if ( jq_fn.tap === undefined ) {
		jq_fn.tap = jq_fn.K;
	}
	
	jq_fn.T = function( fn ) {
		fn = typeof Functional != 'undefined' ? Functional.lambda( fn ) : fn;
		return fn.apply( this, aps.call( arguments, 1 ) );
	};
	
	if ( jq_fn.into === undefined ) {
		jq_fn.into = jq_fn.T;
	}
	
})(jQuery);