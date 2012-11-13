// # Conway's Game of Life
//
// This toy implementation of [Life] was written to demonstrate the use of [jQuery Combinators][jc].
//
// The thesis is that with jQuery Combinators, you can write your own application logic
// using exactly the same fluent style that jQuery's methods use, creating a single, consistent
// and easy-to-read style for your jQuery-powered JavaScript or CoffeeScript.
//
// You can try it **[here]**. Click to toggle any cell between alive and dead. Press return
// to advance a generation.
//
// [Life]: https://en.wikipedia.org/wiki/Conway's_Game_of_Life
// [jc]: http://raganwald.github.com/JQuery-Combinators
// [here]: ./index.html

// ## Introduction
//
// jQuery is a general-purpose library that provides a number of browser-specific functions. Its core
// functionality manipulates selections of DOM entities in a fluent style. There are four fundamental
// operations on a selection:
//
// 1. Filter a selection, analagous to `Array.prototype.filter`. Special case:
//    Create a selection by filtering the entire document.
// 2. Traverse from a selection to another selection, e.g. from a selection of DOM elements
//    to their children.
// 3. Perform some operation on the selection for side effects, e.g. making the selected
//    elements visible.
// 4. Map from a selection to some other value or values, e.g from a selction to an integer
//    representing the size of the selection.

// jQuery provides a large number of methods that fit into one of these four categories, and
// when you use its built-in methods, you can write idomatic, "fluent" jQuery code. But when you
// incorporate your own logic, you have to break out of the fluent style.
//
// ### Life, the Universe, and jQuery
//
// Let's say we are writing an implementation of Life (because we are). And let's
// say that we are representing the Life Universe as a table, with one `td` for each cell in the
// universe (because we did). And live cells have the class `alive`.
//
// If we wanted to select all the cells to the right of a live cell, we could do this in jQuery:
// `$('td.alive + td')`. And if we wanted to filter a selection of cells to thoe that were to the
// right of a live cell, we could write `$selection.filter('td.alive + td')`.
//
// So far, so good. Yay jQuery. But how do we name this relationship? How do we DRY up our code?
// And how do we do it in a way that naturally fits in with jQuery's style?
//
// ### jQuery Combinators
//
// jQuery Combinators to the rescue. jQuery Combinators provides a method called `.into` that turns
// any function into a traverse, and `.select` that turns any function into a filter. So we can write:
//
//     function liveOnTheLeft ($selection) {
//       return $selection
//         .filter('td.alive + td')
//     }
//
// And now, whenever we want to use this, we can write `$selection.select(liveOnTheLeft)` just as
// if `liveOnTheLeft` was a built-in jQuery filter. There's also `.tap` for turning your own
// functions into methods that perform an operation and return the selection, just like jQuery's 
// built-in operations.

// ## Disclaimer
//
// For instructive purposes, this implementation of Life is gratuitously coded to do everything 
// with operations on DOM elements rather than working at lightening speed on a model and then 
// displaying the result in a canvas or on the DOM. This is not intended as anything except
// an excuse to pack as many DOM operations as possible in the space provided.
//
// ---

// # The Code
	
;jQuery(function life() {
		
	var $      = jQuery,
	    $tbody = $('table tbody'),
		  SIZE   = 16,
		  iterating = false;
	
	// ## Set the page up
	//
	// Construct a table of cells dynamically and then set up ts click and event handlers to create
	// an affordance-free UI.
	buildLifeUniverse();
	bindEventHandlers();
	
	// ## The core algorithm
	//
	// This is the core algorithm for iterating the Life Universe.
	// It is one continuous fluid jQuery expression, starting with a
	// selection of every cell
	function stepForwardOneGeneration () {
		
		// Starting with every cell...
		$('.cell')
	
			// ### Counting Neighbours
			//
			// Most of the work we're going to do is counting neighbours.
			// This is a little complicated because the tree structure of an
			// HTML table is not a direct fit with the 2D structure of the
			// Life Universe. That's actually a good excuse to demonstrate
			// how to streamline complex operations, but if you ever want to
			// write a fast life engine, start with good data structures.
			//
			// We'll encode the number of neighbours in a class, from `n0`
			// (zero neighbours) to `n8` (eight neighbours).
			.addClass('n0')

			// First, we're going to count the neighbours to the left and the right
			// of every cell. In addition to encoding the result from `n0` though `n2`, 
			// we'll also encode the result in one of three classes,
			// `lr0`, `lr1`, and `lr2`. This will be useful later for counting
			// diagonal neighbours.
			//
			//     +---+---+---+
			//     |   |   |   |
			//     |   |   |   |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     | ? | X | ? |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   |   |   |
			//     |   |   |   |
			//     +---+---+---+
			.addClass('lr0')
		
			// Here's our first use of `.select`. It passes the selection to a function
			// that is understood to apply a filter. It has the special property of 
			// treating the filter as atomic, so if that function applies several filters adn/or
			// traverses, `.end()` will still work just as if this was a single call to jQuery's
			// `.filter` method.
			//
			// We also have our first use of `.tap`. It passes the selection to a function
			// but always return the selection. We use that to implement operations,
			// such as incrementing the left-right neighbour cont by one.
			//
			// We fnish with jQuery's `.end` to "pop the stack" and return to the original
			// unfiltered selection.
			.select(hasOnLeftOrRight('.alive'))
				.tap(incrementNeighbourCountBy('n')(1))
				.tap(incrementNeighbourCountBy('lr')(1))
				.end()
		
			// and if they have a `.alive` to the left AND right, we increment their 
			// neighbour count by two.
			.select(hasOnLeftAndRight('.alive'))
				.tap(incrementNeighbourCountBy('n')(2))
				.tap(incrementNeighbourCountBy('lr')(2))
				.end()
		
			// Now we count whether each cell has one or two vertical neighbours.
			//
			//     +---+---+---+
			//     |   |   |   |
			//     |   | ? |   |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   | X |   |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   | ? |   |
			//     |   |   |   |
			//     +---+---+---+
			.select(hasAboveOrBelow('.alive'))
				.tap(incrementNeighbourCountBy('n')(1))
				.end()
			.select(hasAboveAndBelow('.alive'))
				.tap(incrementNeighbourCountBy('n')(2))
				.end()
		
		  // Observation:
		  //
		  // If a cell above or below us has one horizontal neighbour,
		  // we must have one diagonal neighbour. If it has two
		  // horizontal neighbours, we must have two diagonal neighbours.
			//
			//     +---+---+---+
			//     |   |   |   |
			//     | ? |   | ? |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   | X |   |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   |   |   |
			//     |   |   |   |
			//     +---+---+---+
			.select(hasAboveOrBelow('.lr1'))
				.tap(incrementNeighbourCountBy('n')(1))
				.end()
			.select(hasAboveOrBelow('.lr2'))
				.tap(incrementNeighbourCountBy('n')(2))
				.end()

			// And therefore, if the cells both above and below us
			// have one horizontal neighbour, we must have two
			// diagonal neighbours
			//
			//     +---+---+---+
			//     |   |   |   |
			//     |   |   | ? |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   | X |   |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   |   | ? |
			//     |   |   |   |
			//     +---+---+---+
			.select(hasAboveAndBelow('.lr1'))
				.tap(incrementNeighbourCountBy('n')(2))
				.end()

			// And finally, if the cells both above and below us
			// have two horizontal neighbours, we must have four
			// diagonal neighbours
			//
			//     +---+---+---+
			//     |   |   |   |
			//     | ? |   | ? |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     |   | X |   |
			//     |   |   |   |
			//     +---+---+---+
			//     |   |   |   |
			//     | ? |   | ? |
			//     |   |   |   |
			//     +---+---+---+
		  .select(hasAboveAndBelow('.lr2'))
				.tap(incrementNeighbourCountBy('n')(4))
				.end()
		
		  // We can now discard the `lr` classes
			.removeClass('lr0 lr1 lr2')
		
		  // ### Implementing Life's Rules
		
		  // Any cell that is not alive and has exactly three neighbours
		  // becomes alive
			.filter('.n3:not(.alive)')
				.addClass('alive', 1000, 'easeInSine')
				.end()
				
			// Any cell that is alive and does not have two or three nighbours
			// dies
			.filter('.alive:not(.n2,.n3)')
				.removeClass('alive', 1000, 'easeInSine')
				.end()
			
			// That's it, remove the neighbour counts.
			.removeClass('n0 n1 n2 n3 n4 n5 n6 n7 n8');
			
	}
	
	// ## Setup Functions
	function buildLifeUniverse () {
		var i,
				j,
				$tr;

		for (i = 0; i < SIZE; i++) {
			$tr = $('<tr></tr>');
			for (j = 0; j < SIZE; j++) {
				$('<td></td>')
					.addClass('cell')
					.attr('id', 'h'+j+'v'+i)
					.appendTo($tr)
			}
			$tbody.append($tr)
		}
	}
	
	function bindEventHandlers () {
		$(document)
			.keyup(function (event) {
				if (event.keyCode == 13) {
					stepForwardOneGeneration()
				}
			});
		$tbody
			.on('click', '.cell', function (event) {
				$(event.currentTarget)
					.toggleClass("alive")
			})
	}
	
	// ## The Filters
	function hasOnLeft (clazz) {
		return function hasOnLeft ($selection) {
			return $selection
				.filter('.cell'+clazz+' + .cell')
		}
	}
	
	function hasOnRight (clazz) {
		return function hasOnRight ($selection) {
			return $selection
				.next('.cell.alive')
					.prev('.cell')
		}
	}
	
	// Nota Bene: EVen though jQuery Combinators provides `.select` specifically
	// for filters, `.into` works just fine and is slightly faster if you don't
	// need to preserve atomicity for usew with `.end()`.
	function hasOnLeftOrRight (clazz) {
		return function hasOnLeftOrRight ($selection) {
			var $a = $selection.into(hasOnLeft(clazz)),
			    $b = $selection.into(hasOnRight(clazz)),
			    $ab = $a.filter($b);
			
			return $a.add($b).not($ab);
		}
	}
	
	function hasOnLeftAndRight (clazz) {
		return function hasOnLeftAndRight ($selection) {
			var $a = $selection.into(hasOnLeft(clazz)),
			    $b = $selection.into(hasOnRight(clazz)),
			    $ab = $a.filter($b);
			
			return $ab
		}
	}
	
	function hasAbove (clazz) {
		return function hasAbove ($selection) {
			var $result = $selection.filter(),
			    columnIndex,
			    $column;
		
			for (columnIndex = 1; columnIndex <= SIZE; columnIndex++) {
				$column = $selection
					.into(cellsInColumnByIndex(columnIndex));
				$result = $result.add(
					$column
						.filter('.cell'+clazz)
							.parent()
								.next('tr')
									.children()
										.filter($column)
				)
			}
			return $result;
		}
	}
	
	function hasBelow (clazz) {
		return function hasAbove ($selection) {
			var $result = $(),
			    columnIndex,
			    $column;
		
			for (columnIndex = 1; columnIndex <= SIZE; columnIndex++) {
				$column = $selection
					.into(cellsInColumnByIndex(columnIndex));
				$result = $result.add(
					$column
						.filter('.cell'+clazz)
							.parent()
								.prev('tr')
									.children()
										.filter($column)
				)
			}
			return $result;
		}
	}
	
	function hasAboveOrBelow (clazz) {
		return function hasAboveOrBelow ($selection) {
			var $a = $selection.into(hasAbove(clazz)),
			    $b = $selection.into(hasBelow(clazz)),
			    $ab = $a.filter($b);
			
			return $a.add($b).not($ab)
		}
	}
	
	function hasAboveAndBelow (clazz) {
		return function hasAboveAndBelow ($selection) {
			var $a = $selection.into(hasAbove(clazz)),
			    $b = $selection.into(hasBelow(clazz)),
			    $ab = $a.filter($b);
			
			return $ab;
		}
	}
	
	function cellsInColumnByIndex (index) {
		return function cellsInColumnByIndex ($selection) {
			return $selection
				.filter('.cell:nth-child('+index+')')
		}
	}
	
	// ## The Sole Operation
	function incrementNeighbourCountBy (prefix) {
		return function incrementNeighbourCountBy (number) {
			return function incrementNeighbourCountBy ($selection) {
				var i,
				    was,
				    next;
		
				if (number === 0) return;
			
				for (i = 8; i >= 0; i--) {
					was = prefix + i;
					next = prefix + (i + number);
					$selection
						.filter('.' + was)
							.removeClass(was)
							.addClass(next)
				}
			}
		}
	}

});