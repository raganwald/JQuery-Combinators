// # Conway's Game of Life
//
// With [jQuery Combinators][jc], you can write your own application logic
// using exactly the same fluent style that jQuery's methods use, creating a single, consistent
// and easy-to-read style for your jQuery-powered JavaScript or CoffeeScript.
//
// This toy implementation of [Life] was written to demonstrate fluent application logic. You can
// try it **[here]**. Click to toggle any cell between alive and dead. Press return
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
		  iterating = false,
			incrementNeighbourCount = incrementCountBy('n'),
			incrementLeftRightCount = incrementCountBy('lr'),
			resetNeighbourCount = resetCount('n'),
			resetLeftRightCount = resetCount('lr'),
			cellSelector = '.cell',
			aliveSelector = '.alive',
			oneLeftRightNeighbourSelector = '.lr1',
			twoLeftRightNeighboursSelector = '.lr2';
	
	// ## Set the page up

	// Construct a table of cells dynamically and then set up ts click and event handlers to create
	// an affordance-free UI.
	buildLifeUniverse();
	bindEventHandlers();
	
	// ## The core algorithm

	// This is the core algorithm for iterating the Life Universe.
	// It is one continuous fluid jQuery expression, starting with a
	// selection of every cell
	function stepForwardOneGeneration () {
		
		// Starting with every cell...
		$(cellSelector)
	
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
			.tap(resetNeighbourCount)

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
			.tap(resetLeftRightCount)
		
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
			.select(hasOnLeftOrRight(aliveSelector))
				.tap(incrementNeighbourCount(1))
				.tap(incrementLeftRightCount(1))
				.end()
		
			// and if they have a `.alive` to the left AND right, we increment their 
			// neighbour count by two.
			.select(hasOnLeftAndRight(aliveSelector))
				.tap(incrementNeighbourCount(2))
				.tap(incrementLeftRightCount(2))
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
			.select(hasAboveOrBelow(aliveSelector))
				.tap(incrementNeighbourCount(1))
				.end()
			.select(hasAboveAndBelow(aliveSelector))
				.tap(incrementNeighbourCount(2))
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
			.select(hasAboveOrBelow(oneLeftRightNeighbourSelector))
				.tap(incrementNeighbourCount(1))
				.end()
			.select(hasAboveOrBelow(twoLeftRightNeighboursSelector))
				.tap(incrementNeighbourCount(2))
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
			.select(hasAboveAndBelow(oneLeftRightNeighbourSelector))
				.tap(incrementNeighbourCount(2))
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
		  .select(hasAboveAndBelow(twoLeftRightNeighboursSelector))
				.tap(incrementNeighbourCount(4))
				.end()
		
		  // We can now discard the `lr` classes
			.tap(resetLeftRightCount)
		
		  // ### Implementing Life's Rules
		
		  // Any cell that is not alive and has exactly three neighbours
		  // becomes alive
			.select(willBeBorn)
				.tap(animateBirths)
				.end()
				
			// Any cell that is alive and does not have two or three nighbours
			// dies
			.select(willDie)
				.tap(animateDeaths)
				.end()
			
			// That's it, remove the neighbour counts.
			.tap(resetNeighbourCount)
			
	}
	
	// ## Setup Functions
	
	// Build the table dynamically. No real reason for this except to
	// play with the size. Maybe one day there'll be a user option to
	// resize things, or to resize the universe as the window grows and
	// shrinks.
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
	
	// The smallest and most affordance-free UI.
	function bindEventHandlers () {
		$(document)
			.keyup(function (event) {
				if (event.keyCode == 13) {
					stepForwardOneGeneration()
				}
			});
		$tbody
			.on('click', cellSelector, function (event) {
				$(event.currentTarget)
					.toggleClass("alive")
			})
	}
	
	// ## The Filters
	
	function hasOnLeft (clazz) {
		return function hasOnLeft ($selection) {
			return $selection
				.filter(cellSelector + clazz + ' + ' + cellSelector)
		}
	}
	
	function hasOnRight (clazz) {
		return function hasOnRight ($selection) {
			return $selection
				.next(cellSelector + aliveSelector)
					.prev(cellSelector)
		}
	}
	
	// Nota Bene: Even though jQuery Combinators provides `.select` specifically
	// for filters, `.into` works just fine and is slightly faster if you don't
	// need to preserve atomicity for use with `.end()`.
	function hasOnLeftOrRight (clazz) {
		return function hasOnLeftOrRight ($selection) {
			var $a = $selection.into(hasOnLeft(clazz)),
			    $b = $selection.into(hasOnRight(clazz));
			
			return $a
				.add($b)
					.not($a.filter($b));
		}
	}
	
	function hasOnLeftAndRight (clazz) {
		return function hasOnLeftAndRight ($selection) {
			return $selection
				.into(hasOnLeft(clazz))
					.into(hasOnRight(clazz))
		}
	}
	
	function hasAbove (clazz) {
		return function hasAbove ($selection) {
			var $result = $selection.filter(),
			    columnIndex,
			    $columnWithinSelection;
		
			for (columnIndex = 1; columnIndex <= SIZE; columnIndex++) {
				$result = $result.add(
					$(cellSelector+clazz)
						.into(cellsInColumnByIndex(columnIndex))
							.parent()
								.next('tr')
									.children()
										.into(cellsInColumnByIndex(columnIndex))
											.filter($selection)
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
				$result = $result.add(
					$(cellSelector+clazz)
						.into(cellsInColumnByIndex(columnIndex))
							.parent()
								.prev('tr')
									.children()
										.into(cellsInColumnByIndex(columnIndex))
											.filter($selection)
				)
			}
			return $result;
		}
	}
	
	function hasAboveOrBelow (clazz) {
		return function hasAboveOrBelow ($selection) {
			var $a = $selection.into(hasAbove(clazz)),
			    $b = $selection.into(hasBelow(clazz));
			
			return $a
				.add($b)
					.not($a.filter($b))
		}
	}
	
	function hasAboveAndBelow (clazz) {
		return function hasAboveAndBelow ($selection) {
			return $selection
				.into(hasAbove(clazz))
					.into(hasBelow(clazz))
		}
	}
	
	function cellsInColumnByIndex (index) {
		return function cellsInColumnByIndex ($selection) {
			return $selection
				.filter(cellSelector + ':nth-child('+index+')')
		}
	}
	
	function hasNeighbours () {
		var clazzes = cellSelector,
		    i;
		
		for (i = 0; i < arguments.length; i++) {
			clazzes = clazzes + '.n' + number
		}
		
		return function hasNeighbours ($selection) {
			return $selection
				.filter(clazzes)
		}
	}
	
	function willBeBorn ($selection) {
		return $selection
			.not(aliveSelector)
				.into(hasNeighbours(3))
	}
	
	function willDie ($selection) {
		return $selection
			.filter(aliveSelector)
				.into(hasNeighbours(2,3))
	}
	
	// ## Side-Effectful Operations
	
	function incrementCountBy (prefix) {
		return function incrementCountBy (number) {
			return function incrementCountBy ($selection) {
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
	
	function resetCount (prefix) {
		return function resetCount ($selection) {
			$selection
				.removeClass(prefix + '1 ' + prefix + '2 ' + prefix +
				  '3 ' + prefix + '4 ' + prefix + '5 ' + prefix + '6 ' +
				  '7 ' + prefix + '8'
				)
				.addClass(prefix + '0')
		}
	}
	
	function animateBirths ($selection) {
		$selection
			.addClass('alive', 1000, 'easeInSine')
	}
	
	function animateDeaths ($selection) {
		$selection
			.removeClass('alive', 1000, 'easeInSine')
	}
	
	// ## Debug
	
	function log ($selection) {
		var $i;
		
		for (i = 0; i < arguments.length; i++) {

			console.log(
				arguments[i].map(function (i, e) {
					return $(e).attr('id')
				}).sort()
			)
		
		}
	}

});