JQuery Combinators
===

JQuery Combinators adds the K and T combinators (or Kestrel and Thrush) to JQuery. These allow you to use your own functions as if they were built-in JQuery methods. This makes your code cleaner and more "JQuery-like."

The Kestrel
---

The [Kestrel][k] or `K` combinator is a JQuery method that turns any function into a JQuery style "fluent" function that returns its argument. For example:

    foo
      .K(function (bar) {
        ...
        return 'blitz';
      })
  
    // => returns foo and not 'blitz'.
  
How is this useful for JQuery? Well, most of JQuery's own methods return "self" so that they can be chained. But sometimes you want to do something of your own and make it part of an existing JQuery chain. Now you can slip in your own function and get the exact same behaviour without having to make sure that every path through the function returns its argument.

Here's an example from [a Go program][go]. The sample code calculates how many white and black stones have been captured, then uses the Kestrel to call a function that updates a display element:

    board
    	.find($.map(this_move['K'].split(','), '"#" + _'.lambda()).join(','))
    		.filter('.white')
    			.removeClass('white')
    			.addClass('changed was_white')
    			.K(increment_captured_display.curry('white'))
    			.end()
    		.filter('.black')
    			.removeClass('black')
    			.addClass('changed was_black')
    			.K(increment_captured_display.curry('black'))
    			.end();
  			
(`increment_captured_display.curry('white')` returns a function that updates the display of captured stones of the appropriate colour). Without the Kestrel, we'd have to assign things to extra variables and the code would be less "JQuery-like." With the Kestrel, we can treat our own functions as if they were built-in JQuery methods that chain.

(The Kestrel is called "Tap" in Ruby, and [Jiayong Ou][jou] has written a kestrel called `tap`. I'd use it, if it wasn't for the fact that JQTouch also uses `tap` as a JQuery method for handling a tap event on mobile devices.)

The Thrush
---

The [Thrush][t] or `T` combinator is a combinator like the Kestrel, however it returns whatever its function returns. Just as the Kestrel allows you to use your own functions to make JQuery methods that chain, the Thrush allows you to use your own functions to make JQuery methods that return a different result.

One handy use for them is adding your own traversal methods. In Go, it is very common to want to find the intersections that are adjacent to some set of intersections on the board. `adjacent(...)` does this exact thing:

    var adjacent = function(optional_board, intersections) {
    	if (intersections == undefined) {
    		intersections = optional_board;
    		optional_board = intersections.first().closest('.board');
    	}
    	return optional_board
    		.find(their_adjacent_selector(intersections));
    };

It's also common to want to find the empty intersections within a selection:

		var empties = function (intersections) {
			return intersections
				.filter('.intersection:not(.black):not(.white)');
		};
    
Now we can treat `adjacent` and `empties` just like `.parents()` or anything else. One rule of Go is that any empty intersection that is adjacent to at least one other empty intersection is playable. Here's how that code looks without the Thrush:

			board
				.find('.intersection:not(.black):not(.white)')
					.each(function (i, el) {
						var intersection = $(el);
						if (0 != board
							.find(adjacents[intersection.attr('id')])
								.filter('.intersection:not(.black):not(.white)')
									.size())
							intersection.addClass('playable_black playable_white');
					})
					.end();

With the Thrush, we can write:

			board
				.find('.intersection:not(.black):not(.white)')
					.each(function (i, el) {
						var intersection = $(el);
						if (0 != intersection.T(adjacent).T(empties).size())
							intersection.addClass('at_liberty');
					})
					.end();

License
---

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
					
[k]: http://github.com/raganwald/homoiconic/blob/master/2008-10-29/kestrel.markdown#readme
[t]: http://github.com/raganwald/homoiconic/blob/master/2008-10-30/thrush.markdown#readme
[go]: http://raganwald.github.com/go/
[jou]: http://orly.ch/
[tap]: http://github.com/jou/jquery.tap.js
[raganwald]: http://reginald.braythwayt.com