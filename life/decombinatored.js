// # Conway's Game of Life
// ## Standard Implementation
//
// This is the companion code to [life.js](./life.html).
	
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
		var allCells = $(cellSelector)
	
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
		resetNeighbourCount(allCells);

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
		resetLeftRightCount(allCells);
		
		var selectionWithAliveOnLeftOrRight = hasOnLeftOrRight(aliveSelector)(allCells);
		
		incrementNeighbourCount(1)(selectionWithAliveOnLeftOrRight);
		incrementLeftRightCount(1)(selectionWithAliveOnLeftOrRight);
		
		// and if they have a `.alive` to the left AND right, we increment their 
		// neighbour count by two.
		var selectionWithAliveOnLeftAndRight = hasOnLeftAndRight(aliveSelector)(allCells);
		
		incrementNeighbourCount(2)(selectionWithAliveOnLeftAndRight);
		incrementLeftRightCount(2)(selectionWithAliveOnLeftAndRight);
		
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
		incrementNeighbourCount(1)(
			hasAboveOrBelow(aliveSelector)(allCells)
		);
		incrementNeighbourCount(2)(
			hasAboveAndBelow(aliveSelector)(allCells)
		);
		
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
		incrementNeighbourCount(1)(
			hasAboveOrBelow(oneLeftRightNeighbourSelector)(allCells)
		);
		incrementNeighbourCount(2)(
			hasAboveOrBelow(twoLeftRightNeighboursSelector)(allCells)
		);

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
		incrementNeighbourCount(2)(
			hasAboveAndBelow(oneLeftRightNeighbourSelector)(allCells)
		);

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
		incrementNeighbourCount(4)(
			hasAboveAndBelow(twoLeftRightNeighboursSelector)(allCells)
		);
		
	  // We can now discard the `lr` classes
		resetLeftRightCount(allCells);
		
	  // ### Implementing Life's Rules
	
	  // Any cell that is not alive and has exactly three neighbours
	  // becomes alive
		animateBirths(
			willBeBorn(allCells)
		);
				
		// Any cell that is alive and does not have two or three nighbours
		// dies
		animateDeaths(
			willDie(allCells)
		);
			
		// That's it, remove the neighbour counts.
		resetNeighbourCount(allCells)
			
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
	
	function hasOnLeftOrRight (clazz) {
		return function hasOnLeftOrRight ($selection) {
			var $a = hasOnLeft(clazz)($selection),
			    $b = hasOnRight(clazz)($selection);
			
			return $a
				.add($b)
					.not($a.filter($b));
		}
	}
	
	function hasOnLeftAndRight (clazz) {
		return function hasOnLeftAndRight ($selection) {
			return hasOnRight(clazz)(
				hasOnLeft(clazz)($selection)
			)
		}
	}
	
	function hasAbove (clazz) {
		return function hasAbove ($selection) {
			var $result = $selection.filter(),
			    columnIndex,
			    $columnWithinSelection;
		
			for (columnIndex = 1; columnIndex <= SIZE; columnIndex++) {
				$result = $result.add(
					cellsInColumnByIndex(columnIndex)(
						cellsInColumnByIndex(columnIndex)(
							$(cellSelector+clazz)
						)
							.parent()
								.next('tr')
									.children()
					)
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
					cellsInColumnByIndex(columnIndex)(
						cellsInColumnByIndex(columnIndex)(
							$(cellSelector+clazz)
						)
							.parent()
								.prev('tr')
									.children()
					)
						.filter($selection)
				)
			}
			return $result;
		}
	}
	
	function hasAboveOrBelow (clazz) {
		return function hasAboveOrBelow ($selection) {
			var $a = hasAbove(clazz)($selection),
			    $b = hasBelow(clazz)($selection);
			
			return $a
				.add($b)
					.not($a.filter($b))
		}
	}
	
	function hasAboveAndBelow (clazz) {
		return function hasAboveAndBelow ($selection) {
			return hasBelow(clazz)(
				hasAbove(clazz)($selection)
			)
		}
	}
	
	function cellsInColumnByIndex (index) {
		return function cellsInColumnByIndex ($selection) {
			return $selection
				.filter(cellSelector + ':nth-child('+index+')')
		}
	}
	
	function hasNeighbours () {
		var selector = cellSelector + '.n' + arguments[0],
		    i;
		
		for (i = 1; i < arguments.length; i++) {
			selector = selector + ',' + cellSelector +'.n' + arguments[i]
		}
		
		return function hasNeighbours ($selection) {
			return $selection
				.filter(selector)
		}
	}
	
	function willBeBorn ($selection) {
		return hasNeighbours(3)(
			$selection
				.not(aliveSelector)
		)
	}
	
	function willDie ($selection) {
		return hasNeighbours(0,1,4,5,6,7,8)(
			$selection
				.filter(aliveSelector)
		)
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