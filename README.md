jQuery Combinators
===

*The jQuery plugin with the funny name and the useful methods*

jQuery Combinators adds two very useful methods to every jQuery object: `into` and `tap`. These allow you to use your own functions as if they were built-in jQuery methods, which makes your code cleaner and more "jQuery-like."

into
---

`into` is a method that works with any jQuery object. You pass a function to `.into`, and `into` passes its
receiver to the function and returns whatever the function returns. In other words, `into` turns any function
(including an anonymous function) into your own jQuery method. `into` also handy in OO languages like Ruby when you want to make chains of function calls into a chain of methods. Since jQuery's style is to prefer chains of methods, `into` is a natural fit with jQuery.

For example, you might have a Go program where every intersection has its own unique id on each board. If you want a selector for any set of intersections, you might write:

    $.map(intersections, function (el) {
      return '#' + $(el).attr('id');
    }).join(',')
      

With `into`, you could then abstract that into a function:

    var selectors = function (intersections) {
      return $.map(intersections, function (el) {
       return '#' + $(el).attr('id');
      }).join(',');
    }

and then you can use that anywhere you like in jQuery style with `into`:

    $(...)
      .into(selectors) // returns a selector string

`into` can also be used with functions that transform one selection into another. This is equivalent to adding your own DOM traverses to jQuery. In the game Go, it is very common to want to find the intersections that are adjacent to some set of intersections on the board. You might define a function called `adjacent(...)` that does this exact thing:

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
		
One rule of Go is that any empty intersection that is adjacent to at least one other empty intersection is playable. Here's how that code looks without our two functions:

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

With them, we can write:

			empties(board.find('.intersection'))
			  .each(function (i, el) {
						var intersection = $(el);
						var adjacent_empties = 
						if (0 != empties(adjacent(intersection)).size())
							intersection.addClass('playable_black playable_white');
					})
					.end();

This is certainly more readable and "functional," but it isn't really the jQuery style. The core expression that counts the number of empty adjacent intersections is `empties(adjacent(intersection)).size()`. It mixes functions and methods, whereas jQuery prefers methods. We could try to define "empties" and "adjacent" as jQuery methods, but those would wind up being defined for every jQuery object everywhere. Instead, let's use `into` as we did with our selectors example:


			board
				.find('.intersection')
				  .into(empties)
  					.each(function (i, el) {
  						var intersection = $(el);
  						if (0 != intersection.into(adjacent).into(empties).size())
  							intersection.addClass('playable_black playable_white');
  					})
  					.end();

Now our core expression reads `intersection.into(adjacent).into(empties).size()` which reads like a native jQuery expression, because `into` makes our one-off functions "adjacent" and "empties" into jQuery traversal methods just like jQuery's built-in `children` or `closest`. 

**caveat**

jQuery's built-in selection traverses do clever things with a stack so that you can call `.end()` to restore the previous selection. `into` does no such thing, although any `.find` or `.filter` you call inside of `.into` will work with jQuery's built-in stack. If you need to use `.end()`, you may find that `.into` produces unexpected results under some circumstances.

tap
---

Although writing your own selection traverses is a common pattern in jQuery, it's also very common to want to perform a series of operations on a selection. jQuery has many built-in methods that always return their receiver to facilitate this kind of programming. For example:

    $(...)
      .removeClass('foo')
      .addClass('bar blitz')
      .each(function (i, el) {
        ...
      })
      .end();

You can use `into` for this, however you will have to make sure that any function called by `into` returns its receiver. Failing to do this can produce unexpected results. To avoid these errors and to make your code clearer, you can use `tap` instead of `into`.

`tap` is a jQuery method that turns any function into a jQuery style "fluent" function that returns its argument. For example:

    $('...')
      .tap(function (bar) {
        ...
        return 'blitz';
      })
  
    // => passes $('...') to the function and always returns $('...') and not 'blitz'.
  
Here's a real  example from [a Go program][go]. The sample code calculates how many white and black stones have been captured, then uses `tap` to call a function that updates a display element:

    var increment_captured_white_stones = increment_captured_display.curry('white')
    var increment_captured_black_stones = increment_captured_display.curry('black');

    board
    	.find($.map(this_move['K'].split(','), '"#" + _'.lambda()).join(','))
    		.filter('.white')
    			.tap(increment_captured_white_stones)
    			.removeClass('white')
    			.addClass('changed was_white')
    			.end()
    		.filter('.black')
    			.tap(increment_captured_black_stones)
    			.removeClass('black')
    			.addClass('changed was_black')
    			.end();
  			
(`increment_captured_display.curry('white')` uses [Functional Javascript][fj] to return a function that updates the display of captured stones of the appropriate colour). We could have used `into` to make this code clean, but then we'd have to fiddle around with our functions to make sure they return their receiver.

**Conflicts**

Some other libraries, such as JQTouch, define `tap` for handling touch events on tablets or mobile devices. To avoid conflicts, if you load jQuery Combinators *after* other such libraries, jQuery Combinators will not re-define `tap`. In that case, you must use `K` since `tap` will be reserved for handling touch events.

Combinators
---

`into` is known in some CS circles as the [Thrush][t] or `T` combinator.  For that reason, you can also write `.T` instead of `.into` with jQuery Combinators. Both `.into` and `.T` work, and both are acceptable. Prefer `into` if you like a conversational program that will be familiar to Ruby programmers. Prefer `T` if you and your team are comfortable with the more brief, academic terminology. Neither is superior to the other. `T` is not a snobbish, intellectually violent choice, and `into` isn't "instantly readable" for anyone who has never seen it before.

`tap` is known in combinatory logic circles as the "K Combinator" or [Kestrel][k]. For this reason, you can write `$(...).K(...)` as well as `$(...).tap(...)`. Like `into` and `T`, use what you prefer, they're both correct.

To simplify the explanation radically, `T` and `K` are called combinators because they combine things to produce a result in different ways. Functional programmers call such things higher-order functions, but what makes combinators interesting is that combinators work by rearranging the order of things in an expression.

For example, `T` reverses the order of two things. Think about it: Instead of writing `adjacent $(...)` we use `T` to write `$(...).T(adjacent)`. That rearrangement is very handy for making our code conform to jQuery style. Likewise, `K` leaves them in the same order but removes something. So if `update(...)` returns some text, `$(...).T(update) => "some text"`, but `$(...).K(update) => $(...)`. It's like `update` got dropped out of our expression. This ability to rearrange things is what makes them so useful for taking code that would normally have function calls sprinkled throughout it and rearranging it into a nice tree of method calls in jQuery style.

Many other combinators exist, and they are all interesting with applications for functional and OO programmers. With combinators you can even get rid of parentheses in a programming language! If you aren't familiar with Combinatory Logic, I encourage you to follow the links to my posts about Kestrels and Thrushes, and better still do a little digging about Combinatory Logic in general. It's a rich, fascinating field of study that is so simple it's incredibly easy to pick up, and it leads naturally into functional and [concatenative][joy] languages.

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

See Also
---

[Jiayong Ou][jou] has written a plugin for jQuery called [tap][tap]. It can handle extra arguments and does one thing--implement `tap`-- extremely well.

*Secret Bonus! Shhhh!!*

If you use jQuery Combinator's with Oliver Steele's excellent [Functional Javascript][fj], you can use string lambdas as well as functions. For example, you can write `$(...).T(".attr('id)")` instead of `$(...).T(function (el) {  return el.attr('id); })`. You don't have to include all of Functional Javascript to use string lambdas, just `to-function.js`. But as long as you're using string lambdas... Why not give the rest of his library a try?
					
[k]: http://github.com/raganwald/homoiconic/blob/master/2008-10-29/kestrel.markdown#readme
[t]: http://github.com/raganwald/homoiconic/blob/master/2008-10-30/thrush.markdown#readme
[go]: http://raganwald.github.com/go/
[jou]: http://orly.ch/
[tap]: http://github.com/jou/jquery.tap.js
[raganwald]: http://reginald.braythwayt.com
[joy]: http://github.com/raganwald/homoiconic/blob/master/2008-11-16/joy.md
[fj]: http://osteele.com/sources/javascript/functional/ "Functional Javascript"