jQuery Combinators
===

*The jQuery plugin with the academic name and the pragmatic methods*

jQuery Combinators adds five very useful methods to every jQuery object: `tap`, `into`, `select`, `ergo` and `when`. These allow you to use your own functions as if they were built-in jQuery methods, which makes your code cleaner and more "jQuery-like."

tl;dr
---

All five methods are documented in full, but here's a cheat sheet. Given that `$(...)` is a jQuery selection of some kind, and given that `fn` is a function taking a jQuery selection as an argument:

**tap** executes the function for side effects, then returns the original selection. This is useful for making your own jQuery methods that "chain" fluently:
    
    $(...).tap(fn) =>
      fn($(...));
      return $(...);

**into** returns the result of the function. This is useful for making your own jQuery traverses or inspectors that act like `.size()` and `.attr`:
    
    $(...).into(fn) =>
      return fn($(...));

**select** returns the result of the function, just like `.into`, however it preserves the atomicity of filters. This is useful for making complex filter functions, because they work as expected when you use `.end()`:
    
    $(...).select(fn) =>
      return fn($(...));
    
**ergo** always return the selection. It will execute the function if the selection is not empty. This is useful for eliminating selection checks in methods:
    
    $(...).ergo(fn) =>
      if ($(...).length)
        fn($(...));
      return $(...)
    
**when** executes the function, and returns the original selection if the function returned truthy, otherwise it returns an empty selection. This is useful for refactoring if statements into chaining jQuery methods:
    
    $(...).when(fn) =>
      if (fn($(...)))
        return $(...).filter('*');
      else
        return $(...).filter(':not(*)');

tap
---

It's common to want to perform a series of operations on a selection. jQuery has many built-in methods that always return their receiver to facilitate this kind of programming. You can make your own methods that return the selection with `.tap`: It turns any function into a jQuery style "fluent" function that returns its argument. For example:

    $('...')
      .tap(function (bar) {
        ...
        return 'blitz';
      })
  
    // => passes $('...') to the function and always returns $('...') and not 'blitz'.
  
Here's a real example from [a Go program][go]. The sample code calculates how many white and black stones have been captured, then uses `.tap` to call a function that updates a display element:

    var increment_captured_display = function (captured_stones, colour) {
      // ...
    };

    board
    	.find($.map(this_move['K'].split(','), '"#" + _'.lambda()).join(','))
    		.filter('.white')
    			.tap(increment_captured_display, 'white')
    			.removeClass('white')
    			.addClass('changed was_white')
    			.end()
    		.filter('.black')
    			.tap(increment_captured_display, 'black')
    			.removeClass('black')
    			.addClass('changed was_black')
    			.end();
  			
We could have used `.into` to make this code clean, but then we'd have to fiddle around with our functions to make sure they return their receiver. With `.tap`, we are sure that we will get "self" back whether the function returns something else or even nothing at all.

Also, did you notice that we passed the function and another parameter to `.tap`? With all of jQuery Combinators, extra parameters will be passed to the function along with the selection. Functional programmers will tell you that this isn't strictly necessary, however `.curry` isn't to everybody's taste. 
      

into
---

`into` is a method that works with any jQuery object. You pass a function to `.into`, and `into` passes its
receiver to the function and returns whatever the function returns. In other words, `into` turns any function
(including an anonymous function) into your own jQuery method. `into` also handy in OO languages like Ruby when you want to make chains of function calls into a chain of methods. Since jQuery's style is to prefer chains of methods, `into` is a natural fit with jQuery.

For example, you might have a function that turns a jQuery selection into a selector string that selects the elements by id:

    var selectors = function (selection) {
      return $.map(selection, function (el) {
       return '#' + el.id;
      }).join(',');
    };
    
With `into`, you can use that anywhere you like in jQuery style:

    $(...)
      .into(selectors) // returns a selector string

Now your function works just like one of jQuery's built-in methods. You can do this with any function that takes a jQuery object as its parameter, even an anonymous function. `into` is especially useful with functions that transform one selection into another. This is equivalent to adding your own DOM traverses to jQuery. jQuery's built-in traverses like `closest` or `siblings` are all general-purpose. But your specific web application will probably need its own domain-specific traverses.

In the game [Go][go], it is very common to want to find the intersections that are adjacent to some set of intersections on the board. The intersections are arranged in rows, so while `previous` and `next` an find adjacent intersections in the same row, you need something else to find the intersections above and below an intersection. Furthermore, Go's rules often require working with the intersections that are adjacent to a group of intersections on the board.

Without boring you with the exact code, let's assume you write a function to find the intersections adjacent to a selection of intersections:

    var adjacent = function (selection_of_intersections) {
    	...
    	return adjacent_intersections;
    };

Now you can use `adjacent` just like any other jQuery traversal:

    $(...)
      .into(adjacent) // returns a selection of adjacent intersections

In summary, `.into` lets you write your own jQuery methods on the fly without having to inject them into the global namespace as your own plugin. This encourages you to write your code in "jQuery style."

select
---

jQuery's built-in selection filters do clever things with a stack so that you can always call `.end()` to restore the previous selection. `into` does no such thing, although any `.find` or `.filter` you call inside of `.into` will work with jQuery's built-in stack. For creating your own filters, jQuery Combinators provides `.select`. It always preserves the previous state of the filter stack.

In Go, it's common to want to find the empty intersections within a selection. This code is short enough to repeat here:

		var empties = function (intersections) {
			return intersections
				.filter('.intersection:not(.black):not(.white)');
		};
		
You can use `empties` just like a jQuery filter:

    $(...)
      .select(empties) // returns a selection of empty intersections
      
Or combine a traverse with a filter to find the number of liberties (empty adjacent intersections):

    $(...)
      .into(adjacent)
        .select(empties)

**Conflicts**

Some other libraries, such as JQTouch, define `tap` for handling touch events on tablets or mobile devices. To avoid conflicts, if you load jQuery Combinators *after* other such libraries, jQuery Combinators will not re-define `tap`. In that case, you must use `K` (see below) since `tap` will be reserved for handling touch events. I'm not aware of any other library defining `into`, but if it does, jQuery Combinators will not redefine `into` and you will have to use `T` instead.

ergo
---

Ruby programmers are familiar with [andand][andand] and the closely related [try][try]. These allow for conditional method invocation: In Ruby, you sometimes want to invoke a method provided the receiver is not null. This is important, because most methods raise an exception when invoked on a null object. If you use `.andand` or `.try`, you can send a method to an object and nothing happens if it's null.

jQuery's built-in methods already work like this. If you have an empty selection, you can invoke all kinds of jQuery methods on it, and nothing happens if your selection is empty. For example, `$('.aBcXyZ').addClass('fubar')` does absolutely nothing if you don't have any elements of class `aBcXyZ`. That's great, and it keeps jQuery code clean: You don't have to litter jQuery code with `if (selection.length)` checks everywhere.

But what about methods you create with `.tap`? If all they do is call jQuery's built-in methods, they will work just fine. But once in a while, you might write a function containing some code that you don't want executed on an empty selection. For example:

    var updated_killed_count = function (killed_stones) {
      // ...
      // some code updating a counter on the board
      // ...
      alert("Congratulations, you have killed " + killed_stones + ' stone(s).');
    }
    
This won't work very well if there are no killed stones:

![Congratulations](http://github.com/raganwald/JQuery-Combinators/raw/master/congratulations.png)

With `tap`, you would have to wrap your function call in a conditional to avoid an embarrassment:

    board
      .find('.killed')
        .tap(function (killed_stones) {
          if (killed_stones.length) updated_killed_count(killed_stones);
        })
        .removeClass('black white');
      
This comes up so often, jQuery Combinators provides a special form of `tap` called `ergo` that bakes the selection check right in:

    board
      .find('.killed')
        .ergo(updated_killed_count)
        .removeClass('black white');

Like `tap`, `ergo` always returns its receiver. The difference is that `ergo` only invokes the function if the selection isn't empty. Getting rid of the conditional makes the code much cleaner, and it saves you from having to add conditional checks to your functions.

There's another, more subtle benefit. If you use jQuery Combinator with Oliver Steele's excellent [Functional Javascript][fj], you already can use string lambdas as well as functions. For example, you can write `$(...).T(".attr('id)")` instead of `$(...).T(function (el) {  return el.attr('id); })`. The limitation of String Lambdas is that they work with functions that are expressions. You can't write `.tap('if (_.length) alert("congratulations, you killed "+_.length+" stones")')`. But you *can* write `.ergo('alert("congratulations, you killed "+_.length+" stones")')`. Aha!

when
---

Once you start using `into`, it'll only be a matter of time before you look at code like this:

    var group = board.find(...);
    
    if (group.into(liberties).length == 1)
      group
        .removeClass('dead')
        .addClass('atari');

And wonder whether there's some way to get rid of the clumsy `if` statement so that everything can chain in fluent jQuery style. You could do something by stuffing the `if` inside of a function with `into`, but the cure would be worse than the disease. But "Do something with a selection when such-and-such an expression is truthy" is common enough that jQuery Combinators provides a method for this special case called `when`.

`when` is a special filter that passes your selection to a function. If the function returns truthy, `when` keeps your selection. If the function returns falsy, when reduces the selection to an empty selection. So the code above could be written like this:

    board
      .find(...)
        .when(function(group) { return group.into(liberties).length == 1; })
          .removeClass('dead')
          .addClass('atari');

`when` is really handy with string lambdas. For example, here's how to mark the intersection that would "kill" a group in atari:

    board
      .find(...)
        .into(liberties)
          .when('.length == 1')
            .addClass('kills_a_group');
              
This code finds a group, uses `adjacent` and `empties` to traverse to the adjacent empty intersections, then passes that selection along to add the class `'kills_a_group'` if its length is one. `when` can be combined with `ergo` to replace complex if statements with chains of method calls in jQuery style.

Why is this plugin called jQuery "Combinators?"
---

`into` is known in some CS circles as the [Thrush][t] or `T` combinator.  For that reason, you can also write `.T` instead of `.into` with jQuery Combinators. Both `.into` and `.T` work, and both are acceptable. Prefer `into` if you like a conversational program that will be familiar to Ruby programmers. Prefer `T` if you and your team are comfortable with the more brief, academic terminology. Neither is superior to the other. `T` is not a snobbish, intellectually violent choice, and `into` isn't "instantly readable" for anyone who has never seen it before.

`tap` is known in combinatory logic circles as the "K Combinator" or [Kestrel][k]. For this reason, you can write `$(...).K(...)` as well as `$(...).tap(...)`. Like `into` and `T`, use what you prefer, they're both correct.

To simplify the explanation radically, `T` and `K` are called combinators because they combine things to produce a result in different ways. Functional programmers call such things higher-order functions, but what makes combinators interesting is that combinators work by rearranging the order of things in an expression.

For example, `T` reverses the order of two things. Think about it: Instead of writing `adjacent $(...)` we use `T` to write `$(...).T(adjacent)`. That rearrangement is very handy for making our code conform to jQuery style. Likewise, `K` leaves them in the same order but removes something. So if `update(...)` returns some text, `$(...).T(update) => "some text"`, but `$(...).K(update) => $(...)`. It's like `update` got dropped out of our expression. This ability to rearrange things is what makes them so useful for taking code that would normally have function calls sprinkled throughout it and rearranging it into a nice tree of method calls in jQuery style.

Many other combinators exist, and they are all interesting with applications for functional and OO programmers. With combinators you can even get rid of parentheses in a programming language! If you aren't familiar with Combinatory Logic, I encourage you to follow the links to my posts about Kestrels and Thrushes, and better still do a little digging about Combinatory Logic in general. It's a rich, fascinating field of study that is so simple it's incredibly easy to pick up, and it leads naturally into functional and [concatenative][joy] languages.

I like it so much I want to use it with everything, not just jQuery
---

Good news! [Katy][katy] is a library that adds `.K` ("tap") and `.T` ("into") to any JavaScript/CoffeeScript class or object.

[katy]: http://github.com/raganwald/Katy

post scriptum
-------------

I'm writing a book called [CoffeeScript Ristretto](http://leanpub.com/coffeescript-ristretto). Check it out!

License
---

    The MIT License

    Copyright (c) 2010 Reginald Braithwaite http://reginald.braythwayt.com
    with contributions from Ben Alman

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
[joy]: http://github.com/raganwald/homoiconic/blob/master/2008-11-16/joy.md
[fj]: http://osteele.com/sources/javascript/functional/ "Functional Javascript"
[andand]: http://github.com/raganwald/andand
[try]: http://ozmm.org/posts/try.html