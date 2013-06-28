//     Underscore.js 1.2.4
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js** and **"CommonJS"**, with
  // backwards-compatibility for the old `require()` API. If we're not in
  // CommonJS, add `_` to the global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else if (typeof define === 'function' && define.amd) {
    // Register as a named module with AMD.
    define('underscore', function() {
      return _;
    });
  } else {
    // Exported as a string, for Closure Compiler "advanced" mode.
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.2.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var result = [];
    _.reduce(initial, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
        memo[memo.length] = el;
        result[result.length] = array[i];
      }
      return memo;
    }, []);
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        func.apply(context, args);
      }
      whenDone();
      throttling = true;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (hasOwnProperty.call(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (hasOwnProperty.call(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && hasOwnProperty.call(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape || noMatch, function(match, code) {
           return "',_.escape(" + code.replace(/\\'/g, "'") + "),'";
         })
         .replace(c.interpolate || noMatch, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || noMatch, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ')
                              .replace(/\\\\/g, '\\') + ";__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', '_', tmpl);
    if (data) return func(data, _);
    return function(data) {
      return func.call(this, data, _);
    };
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);
//     Backbone.js 0.5.3
//     (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://documentcloud.github.com/backbone

(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object.
  var root = this;

  // Save the previous value of the `Backbone` variable.
  var previousBackbone = root.Backbone;

  // The top-level namespace. All public Backbone classes and modules will
  // be attached to this. Exported for both CommonJS and the browser.
  var Backbone;
  if (typeof exports !== 'undefined') {
    Backbone = exports;
  } else {
    Backbone = root.Backbone = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '0.5.3';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;

  // For Backbone's purposes, jQuery or Zepto owns the `$` variable.
  var $ = root.jQuery || root.Zepto;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option will
  // fake `"PUT"` and `"DELETE"` requests via the `_method` parameter and set a
  // `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // -----------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may `bind` or `unbind` a callback function to an event;
  // `trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.bind('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Backbone.Events = {

    // Bind an event, specified by a string name, `ev`, to a `callback` function.
    // Passing `"all"` will bind the callback to all events fired.
    bind : function(ev, callback, context) {
      var calls = this._callbacks || (this._callbacks = {});
      var list  = calls[ev] || (calls[ev] = []);
      list.push([callback, context]);
      return this;
    },

    // Remove one or many callbacks. If `callback` is null, removes all
    // callbacks for the event. If `ev` is null, removes all bound callbacks
    // for all events.
    unbind : function(ev, callback) {
      var calls;
      if (!ev) {
        this._callbacks = {};
      } else if (calls = this._callbacks) {
        if (!callback) {
          calls[ev] = [];
        } else {
          var list = calls[ev];
          if (!list) return this;
          for (var i = 0, l = list.length; i < l; i++) {
            if (list[i] && callback === list[i][0]) {
              list[i] = null;
              break;
            }
          }
        }
      }
      return this;
    },

    // Trigger an event, firing all bound callbacks. Callbacks are passed the
    // same arguments as `trigger` is, apart from the event name.
    // Listening for `"all"` passes the true event name as the first argument.
    trigger : function(eventName) {
      var list, calls, ev, callback, args;
      var both = 2;
      if (!(calls = this._callbacks)) return this;
      while (both--) {
        ev = both ? eventName : 'all';
        if (list = calls[ev]) {
          for (var i = 0, l = list.length; i < l; i++) {
            if (!(callback = list[i])) {
              list.splice(i, 1); i--; l--;
            } else {
              args = both ? Array.prototype.slice.call(arguments, 1) : arguments;
              callback[0].apply(callback[1] || this, args);
            }
          }
        }
      }
      return this;
    }

  };

  // Backbone.Model
  // --------------

  // Create a new model, with defined attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  Backbone.Model = function(attributes, options) {
    var defaults;
    attributes || (attributes = {});
    if (defaults = this.defaults) {
      if (_.isFunction(defaults)) defaults = defaults.call(this);
      attributes = _.extend({}, defaults, attributes);
    }
    this.attributes = {};
    this._escapedAttributes = {};
    this.cid = _.uniqueId('c');
    this.set(attributes, {silent : true});
    this._changed = false;
    this._previousAttributes = _.clone(this.attributes);
    if (options && options.collection) this.collection = options.collection;
    this.initialize(attributes, options);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Backbone.Model.prototype, Backbone.Events, {

    // A snapshot of the model's previous attributes, taken immediately
    // after the last `"change"` event was fired.
    _previousAttributes : null,

    // Has the item been changed since the last `"change"` event?
    _changed : false,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute : 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize : function(){},

    // Return a copy of the model's `attributes` object.
    toJSON : function() {
      return _.clone(this.attributes);
    },

    // Get the value of an attribute.
    get : function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape : function(attr) {
      var html;
      if (html = this._escapedAttributes[attr]) return html;
      var val = this.attributes[attr];
      return this._escapedAttributes[attr] = escapeHTML(val == null ? '' : '' + val);
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has : function(attr) {
      return this.attributes[attr] != null;
    },

    // Set a hash of model attributes on the object, firing `"change"` unless you
    // choose to silence it.
    set : function(attrs, options) {

      // Extract attributes and options.
      options || (options = {});
      if (!attrs) return this;
      if (attrs.attributes) attrs = attrs.attributes;
      var now = this.attributes, escaped = this._escapedAttributes;

      // Run validation.
      if (!options.silent && this.validate && !this._performValidation(attrs, options)) return false;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // We're about to start triggering change events.
      var alreadyChanging = this._changing;
      this._changing = true;

      // Update attributes.
      for (var attr in attrs) {
        var val = attrs[attr];
        if (!_.isEqual(now[attr], val)) {
          now[attr] = val;
          delete escaped[attr];
          this._changed = true;
          if (!options.silent) this.trigger('change:' + attr, this, val, options);
        }
      }

      // Fire the `"change"` event, if the model has been changed.
      if (!alreadyChanging && !options.silent && this._changed) this.change(options);
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"` unless you choose
    // to silence it. `unset` is a noop if the attribute doesn't exist.
    unset : function(attr, options) {
      if (!(attr in this.attributes)) return this;
      options || (options = {});
      var value = this.attributes[attr];

      // Run validation.
      var validObj = {};
      validObj[attr] = void 0;
      if (!options.silent && this.validate && !this._performValidation(validObj, options)) return false;

      // Remove the attribute.
      delete this.attributes[attr];
      delete this._escapedAttributes[attr];
      if (attr == this.idAttribute) delete this.id;
      this._changed = true;
      if (!options.silent) {
        this.trigger('change:' + attr, this, void 0, options);
        this.change(options);
      }
      return this;
    },

    // Clear all attributes on the model, firing `"change"` unless you choose
    // to silence it.
    clear : function(options) {
      options || (options = {});
      var attr;
      var old = this.attributes;

      // Run validation.
      var validObj = {};
      for (attr in old) validObj[attr] = void 0;
      if (!options.silent && this.validate && !this._performValidation(validObj, options)) return false;

      this.attributes = {};
      this._escapedAttributes = {};
      this._changed = true;
      if (!options.silent) {
        for (attr in old) {
          this.trigger('change:' + attr, this, void 0, options);
        }
        this.change(options);
      }
      return this;
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overriden,
    // triggering a `"change"` event.
    fetch : function(options) {
      options || (options = {});
      var model = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        if (!model.set(model.parse(resp, xhr), options)) return false;
        if (success) success(model, resp);
      };
      options.error = wrapError(options.error, model, options);
      return (this.sync || Backbone.sync).call(this, 'read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save : function(attrs, options) {
      options || (options = {});
      if (attrs && !this.set(attrs, options)) return false;
      var model = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        if (!model.set(model.parse(resp, xhr), options)) return false;
        if (success) success(model, resp, xhr);
      };
      options.error = wrapError(options.error, model, options);
      var method = this.isNew() ? 'create' : 'update';
      return (this.sync || Backbone.sync).call(this, method, this, options);
    },

    // Destroy this model on the server if it was already persisted. Upon success, the model is removed
    // from its collection, if it has one.
    destroy : function(options) {
      options || (options = {});
      if (this.isNew()) return this.trigger('destroy', this, this.collection, options);
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        model.trigger('destroy', model, model.collection, options);
        if (success) success(model, resp);
      };
      options.error = wrapError(options.error, model, options);
      return (this.sync || Backbone.sync).call(this, 'delete', this, options);
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url : function() {
      var base = getUrl(this.collection) || this.urlRoot || urlError();
      if (this.isNew()) return base;
      return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse : function(resp, xhr) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone : function() {
      return new this.constructor(this);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew : function() {
      return this.id == null;
    },

    // Call this method to manually fire a `change` event for this model.
    // Calling this will cause all objects observing the model to update.
    change : function(options) {
      this.trigger('change', this, options);
      this._previousAttributes = _.clone(this.attributes);
      this._changed = false;
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged : function(attr) {
      if (attr) return this._previousAttributes[attr] != this.attributes[attr];
      return this._changed;
    },

    // Return an object containing all the attributes that have changed, or false
    // if there are no changed attributes. Useful for determining what parts of a
    // view need to be updated and/or what attributes need to be persisted to
    // the server.
    changedAttributes : function(now) {
      now || (now = this.attributes);
      var old = this._previousAttributes;
      var changed = false;
      for (var attr in now) {
        if (!_.isEqual(old[attr], now[attr])) {
          changed = changed || {};
          changed[attr] = now[attr];
        }
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous : function(attr) {
      if (!attr || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes : function() {
      return _.clone(this._previousAttributes);
    },

    // Run validation against a set of incoming attributes, returning `true`
    // if all is well. If a specific `error` callback has been passed,
    // call that instead of firing the general `"error"` event.
    _performValidation : function(attrs, options) {
      var error = this.validate(attrs);
      if (error) {
        if (options.error) {
          options.error(this, error, options);
        } else {
          this.trigger('error', this, error, options);
        }
        return false;
      }
      return true;
    }

  });

  // Backbone.Collection
  // -------------------

  // Provides a standard collection class for our sets of models, ordered
  // or unordered. If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.comparator) this.comparator = options.comparator;
    _.bindAll(this, '_onModelEvent', '_removeReference');
    this._reset();
    if (models) this.reset(models, {silent: true});
    this.initialize.apply(this, arguments);
  };

  // Define the Collection's inheritable methods.
  _.extend(Backbone.Collection.prototype, Backbone.Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model : Backbone.Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize : function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON : function() {
      return this.map(function(model){ return model.toJSON(); });
    },

    // Add a model, or list of models to the set. Pass **silent** to avoid
    // firing the `added` event for every new model.
    add : function(models, options) {
      if (_.isArray(models)) {
        for (var i = 0, l = models.length; i < l; i++) {
          this._add(models[i], options);
        }
      } else {
        this._add(models, options);
      }
      return this;
    },

    // Remove a model, or a list of models from the set. Pass silent to avoid
    // firing the `removed` event for every model removed.
    remove : function(models, options) {
      if (_.isArray(models)) {
        for (var i = 0, l = models.length; i < l; i++) {
          this._remove(models[i], options);
        }
      } else {
        this._remove(models, options);
      }
      return this;
    },

    // Get a model from the set by id.
    get : function(id) {
      if (id == null) return null;
      return this._byId[id.id != null ? id.id : id];
    },

    // Get a model from the set by client id.
    getByCid : function(cid) {
      return cid && this._byCid[cid.cid || cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Force the collection to re-sort itself. You don't need to call this under normal
    // circumstances, as the set will maintain sort order as each item is added.
    sort : function(options) {
      options || (options = {});
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      this.models = this.sortBy(this.comparator);
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck : function(attr) {
      return _.map(this.models, function(model){ return model.get(attr); });
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any `added` or `removed` events. Fires `reset` when finished.
    reset : function(models, options) {
      models  || (models = []);
      options || (options = {});
      this.each(this._removeReference);
      this._reset();
      this.add(models, {silent: true});
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `add: true` is passed, appends the
    // models to the collection instead of resetting.
    fetch : function(options) {
      options || (options = {});
      var collection = this;
      var success = options.success;
      options.success = function(resp, status, xhr) {
        collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
        if (success) success(collection, resp);
      };
      options.error = wrapError(options.error, collection, options);
      return (this.sync || Backbone.sync).call(this, 'read', this, options);
    },

    // Create a new instance of a model in this collection. After the model
    // has been created on the server, it will be added to the collection.
    // Returns the model, or 'false' if validation on a new model fails.
    create : function(model, options) {
      var coll = this;
      options || (options = {});
      model = this._prepareModel(model, options);
      if (!model) return false;
      var success = options.success;
      options.success = function(nextModel, resp, xhr) {
        coll.add(nextModel, options);
        if (success) success(nextModel, resp, xhr);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse : function(resp, xhr) {
      return resp;
    },

    // Proxy to _'s chain. Can't be proxied the same way the rest of the
    // underscore methods are proxied because it relies on the underscore
    // constructor.
    chain: function () {
      return _(this.models).chain();
    },

    // Reset all internal state. Called when the collection is reset.
    _reset : function(options) {
      this.length = 0;
      this.models = [];
      this._byId  = {};
      this._byCid = {};
    },

    // Prepare a model to be added to this collection
    _prepareModel: function(model, options) {
      if (!(model instanceof Backbone.Model)) {
        var attrs = model;
        model = new this.model(attrs, {collection: this});
        if (model.validate && !model._performValidation(attrs, options)) model = false;
      } else if (!model.collection) {
        model.collection = this;
      }
      return model;
    },

    // Internal implementation of adding a single model to the set, updating
    // hash indexes for `id` and `cid` lookups.
    // Returns the model, or 'false' if validation on a new model fails.
    _add : function(model, options) {
      options || (options = {});
      model = this._prepareModel(model, options);
      if (!model) return false;
      var already = this.getByCid(model);
      if (already) throw new Error(["Can't add the same model to a set twice", already.id]);
      this._byId[model.id] = model;
      this._byCid[model.cid] = model;
      var index = options.at != null ? options.at :
                  this.comparator ? this.sortedIndex(model, this.comparator) :
                  this.length;
      this.models.splice(index, 0, model);
      model.bind('all', this._onModelEvent);
      this.length++;
      if (!options.silent) model.trigger('add', model, this, options);
      return model;
    },

    // Internal implementation of removing a single model from the set, updating
    // hash indexes for `id` and `cid` lookups.
    _remove : function(model, options) {
      options || (options = {});
      model = this.getByCid(model) || this.get(model);
      if (!model) return null;
      delete this._byId[model.id];
      delete this._byCid[model.cid];
      this.models.splice(this.indexOf(model), 1);
      this.length--;
      if (!options.silent) model.trigger('remove', model, this, options);
      this._removeReference(model);
      return model;
    },

    // Internal method to remove a model's ties to a collection.
    _removeReference : function(model) {
      if (this == model.collection) {
        delete model.collection;
      }
      model.unbind('all', this._onModelEvent);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent : function(ev, model, collection, options) {
      if ((ev == 'add' || ev == 'remove') && collection != this) return;
      if (ev == 'destroy') {
        this._remove(model, options);
      }
      if (model && ev === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight', 'find', 'detect',
    'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
    'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
    'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Backbone.Collection.prototype[method] = function() {
      return _[method].apply(_, [this.models].concat(_.toArray(arguments)));
    };
  });

  // Backbone.Router
  // -------------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var namedParam    = /:([\w\d]+)/g;
  var splatParam    = /\*([\w\d]+)/g;
  var escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Backbone.Router.prototype, Backbone.Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize : function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route : function(route, name, callback) {
      Backbone.history || (Backbone.history = new Backbone.History);
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      Backbone.history.route(route, _.bind(function(fragment) {
        var args = this._extractParameters(route, fragment);
        callback.apply(this, args);
        this.trigger.apply(this, ['route:' + name].concat(args));
      }, this));
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate : function(fragment, triggerRoute) {
      Backbone.history.navigate(fragment, triggerRoute);
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes : function() {
      if (!this.routes) return;
      var routes = [];
      for (var route in this.routes) {
        routes.unshift([route, this.routes[route]]);
      }
      for (var i = 0, l = routes.length; i < l; i++) {
        this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp : function(route) {
      route = route.replace(escapeRegExp, "\\$&")
                   .replace(namedParam, "([^\/]*)")
                   .replace(splatParam, "(.*?)");
      return new RegExp('^' + route + '$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted parameters.
    _extractParameters : function(route, fragment) {
      return route.exec(fragment).slice(1);
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on URL fragments. If the
  // browser does not support `onhashchange`, falls back to polling.
  Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');
  };

  // Cached regex for cleaning hashes.
  var hashStrip = /^#*/;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Has the history handling already been started?
  var historyStarted = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(Backbone.History.prototype, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment : function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || forcePushState) {
          fragment = window.location.pathname;
          var search = window.location.search;
          if (search) fragment += search;
          if (fragment.indexOf(this.options.root) == 0) fragment = fragment.substr(this.options.root.length);
        } else {
          fragment = window.location.hash;
        }
      }
      return decodeURIComponent(fragment.replace(hashStrip, ''));
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start : function(options) {

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      if (historyStarted) throw new Error("Backbone.history has already been started");
      this.options          = _.extend({}, {root: '/'}, this.options, options);
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && window.history && window.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));
      if (oldIE) {
        this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        $(window).bind('popstate', this.checkUrl);
      } else if ('onhashchange' in window && !oldIE) {
        $(window).bind('hashchange', this.checkUrl);
      } else {
        setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      historyStarted = true;
      var loc = window.location;
      var atRoot  = loc.pathname == this.options.root;
      if (this._wantsPushState && !this._hasPushState && !atRoot) {
        this.fragment = this.getFragment(null, true);
        window.location.replace(this.options.root + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;
      } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
        this.fragment = loc.hash.replace(hashStrip, '');
        window.history.replaceState({}, document.title, loc.protocol + '//' + loc.host + this.options.root + this.fragment);
      }

      if (!this.options.silent) {
        return this.loadUrl();
      }
    },

    // Add a route to be tested when the fragment changes. Routes added later may
    // override previous routes.
    route : function(route, callback) {
      this.handlers.unshift({route : route, callback : callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl : function(e) {
      var current = this.getFragment();
      if (current == this.fragment && this.iframe) current = this.getFragment(this.iframe.location.hash);
      if (current == this.fragment || current == decodeURIComponent(this.fragment)) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl() || this.loadUrl(window.location.hash);
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl : function(fragmentOverride) {
      var fragment = this.fragment = this.getFragment(fragmentOverride);
      var matched = _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
      return matched;
    },

    // Save a fragment into the hash history. You are responsible for properly
    // URL-encoding the fragment in advance. This does not trigger
    // a `hashchange` event.
    navigate : function(fragment, triggerRoute) {
      var frag = (fragment || '').replace(hashStrip, '');
      if (this.fragment == frag || this.fragment == decodeURIComponent(frag)) return;
      if (this._hasPushState) {
        var loc = window.location;
        if (frag.indexOf(this.options.root) != 0) frag = this.options.root + frag;
        this.fragment = frag;
        window.history.pushState({}, document.title, loc.protocol + '//' + loc.host + frag);
      } else {
        window.location.hash = this.fragment = frag;
        if (this.iframe && (frag != this.getFragment(this.iframe.location.hash))) {
          this.iframe.document.open().close();
          this.iframe.location.hash = frag;
        }
      }
      if (triggerRoute) this.loadUrl(fragment);
    }

  });

  // Backbone.View
  // -------------

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.delegateEvents();
    this.initialize.apply(this, arguments);
  };

  // Element lookup, scoped to DOM elements within the current view.
  // This should be prefered to global lookups, if you're dealing with
  // a specific view.
  var selectorDelegate = function(selector) {
    return $(selector, this.el);
  };

  // Cached regex to split keys for `delegate`.
  var eventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(Backbone.View.prototype, Backbone.Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName : 'div',

    // Attach the `selectorDelegate` function as the `$` property.
    $       : selectorDelegate,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize : function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render : function() {
      return this;
    },

    // Remove this view from the DOM. Note that the view isn't present in the
    // DOM by default, so calling this method may be a no-op.
    remove : function() {
      $(this.el).remove();
      return this;
    },

    // For small amounts of DOM Elements, where a full-blown template isn't
    // needed, use **make** to manufacture elements, one at a time.
    //
    //     var el = this.make('li', {'class': 'row'}, this.model.escape('title'));
    //
    make : function(tagName, attributes, content) {
      var el = document.createElement(tagName);
      if (attributes) $(el).attr(attributes);
      if (content) $(el).html(content);
      return el;
    },

    // Set callbacks, where `this.callbacks` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save'
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents : function(events) {
      if (!(events || (events = this.events))) return;
      if (_.isFunction(events)) events = events.call(this);
      $(this.el).unbind('.delegateEvents' + this.cid);
      for (var key in events) {
        var method = this[events[key]];
        if (!method) throw new Error('Event "' + events[key] + '" does not exist');
        var match = key.match(eventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          $(this.el).bind(eventName, method);
        } else {
          $(this.el).delegate(selector, eventName, method);
        }
      }
    },

    // Performs the initial configuration of a View with a set of options.
    // Keys with special meaning *(model, collection, id, className)*, are
    // attached directly to the view.
    _configure : function(options) {
      if (this.options) options = _.extend({}, this.options, options);
      for (var i = 0, l = viewOptions.length; i < l; i++) {
        var attr = viewOptions[i];
        if (options[attr]) this[attr] = options[attr];
      }
      this.options = options;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` proeprties.
    _ensureElement : function() {
      if (!this.el) {
        var attrs = this.attributes || {};
        if (this.id) attrs.id = this.id;
        if (this.className) attrs['class'] = this.className;
        this.el = this.make(this.tagName, attrs);
      } else if (_.isString(this.el)) {
        this.el = $(this.el).get(0);
      }
    }

  });

  // The self-propagating extend function that Backbone classes use.
  var extend = function (protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

  // Set up inheritance for the model, collection, and view.
  Backbone.Model.extend = Backbone.Collection.extend =
    Backbone.Router.extend = Backbone.View.extend = extend;

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read'  : 'GET'
  };

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, uses makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded` instead of
  // `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default JSON-request options.
    var params = _.extend({
      type:         type,
      dataType:     'json'
    }, options);

    // Ensure that we have a URL.
    if (!params.url) {
      params.url = getUrl(model) || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (!params.data && model && (method == 'create' || method == 'update')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(model.toJSON());
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (Backbone.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data        = params.data ? {model : params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (Backbone.emulateHTTP) {
      if (type === 'PUT' || type === 'DELETE') {
        if (Backbone.emulateJSON) params.data._method = type;
        params.type = 'POST';
        params.beforeSend = function(xhr) {
          xhr.setRequestHeader('X-HTTP-Method-Override', type);
        };
      }
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !Backbone.emulateJSON) {
      params.processData = false;
    }

    // Make the request.
    return $.ajax(params);
  };

  // Helpers
  // -------

  // Shared empty constructor function to aid in prototype-chain creation.
  var ctor = function(){};

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function(parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call `super()`.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Inherit class (static) properties from parent.
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Add static properties to the constructor function, if supplied.
    if (staticProps) _.extend(child, staticProps);

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Helper function to get a URL from a Model or Collection as a property
  // or as a function.
  var getUrl = function(object) {
    if (!(object && object.url)) return null;
    return _.isFunction(object.url) ? object.url() : object.url;
  };

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(onError, model, options) {
    return function(resp) {
      if (onError) {
        onError(model, resp, options);
      } else {
        model.trigger('error', model, resp, options);
      }
    };
  };

  // Helper function to escape a string for HTML rendering.
  var escapeHTML = function(string) {
    return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

}).call(this);
(function(){function d(a,b){try{for(var c in b)Object.defineProperty(a.prototype,c,{value:b[c],enumerable:!1})}catch(d){a.prototype=b}}function f(a){var b=-1,c=a.length,d=[];while(++b<c)d.push(a[b]);return d}function g(a){return Array.prototype.slice.call(a)}function j(){}function m(a){return a}function n(){return this}function o(){return!0}function p(a){return typeof a=="function"?a:function(){return a}}function q(a,b,c){return function(){var d=c.apply(b,arguments);return arguments.length?a:d}}function r(a){return a!=null&&!isNaN(a)}function s(a){return a.length}function u(a){return a==null}function v(a){return a.trim().replace(/\s+/g," ")}function w(a){var b=1;while(a*b%1)b*=10;return b}function z(){}function A(a){function d(){var c=b,d=-1,e=c.length,f;while(++d<e)(f=c[d].on)&&f.apply(this,arguments);return a}var b=[],c=new j;return d.on=function(d,e){var f=c.get(d),g;return arguments.length<2?f&&f.on:(f&&(f.on=null,b=b.slice(0,g=b.indexOf(f)).concat(b.slice(g+1)),c.remove(d)),e&&b.push(c.set(d,{on:e})),a)},d}function D(a,b){return b-(a?1+Math.floor(Math.log(a+Math.pow(10,1+Math.floor(Math.log(a)/Math.LN10)-b))/Math.LN10):1)}function E(a){return a+""}function F(a){var b=a.lastIndexOf("."),c=b>=0?a.substring(b):(b=a.length,""),d=[];while(b>0)d.push(a.substring(b-=3,b+3));return d.reverse().join(",")+c}function H(a,b){var c=Math.pow(10,Math.abs(8-b)*3);return{scale:b>8?function(a){return a/c}:function(a){return a*c},symbol:a}}function N(a){return function(b){return b<=0?0:b>=1?1:a(b)}}function O(a){return function(b){return 1-a(1-b)}}function P(a){return function(b){return.5*(b<.5?a(2*b):2-a(2-2*b))}}function Q(a){return a}function R(a){return function(b){return Math.pow(b,a)}}function S(a){return 1-Math.cos(a*Math.PI/2)}function T(a){return Math.pow(2,10*(a-1))}function U(a){return 1-Math.sqrt(1-a*a)}function V(a,b){var c;return arguments.length<2&&(b=.45),arguments.length<1?(a=1,c=b/4):c=b/(2*Math.PI)*Math.asin(1/a),function(d){return 1+a*Math.pow(2,10*-d)*Math.sin((d-c)*2*Math.PI/b)}}function W(a){return a||(a=1.70158),function(b){return b*b*((a+1)*b-a)}}function X(a){return a<1/2.75?7.5625*a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+.9375:7.5625*(a-=2.625/2.75)*a+.984375}function Y(){d3.event.stopPropagation(),d3.event.preventDefault()}function Z(){var a=d3.event,b;while(b=a.sourceEvent)a=b;return a}function $(a){var b=new z,c=0,d=arguments.length;while(++c<d)b[arguments[c]]=A(b);return b.of=function(c,d){return function(e){try{var f=e.sourceEvent=d3.event;e.target=a,d3.event=e,b[e.type].apply(c,d)}finally{d3.event=f}}},b}function _(a){var b=[a.a,a.b],c=[a.c,a.d],d=bb(b),e=ba(b,c),f=bb(bc(c,b,-e))||0;b[0]*c[1]<c[0]*b[1]&&(b[0]*=-1,b[1]*=-1,d*=-1,e*=-1),this.rotate=(d?Math.atan2(b[1],b[0]):Math.atan2(-c[0],c[1]))*bd,this.translate=[a.e,a.f],this.scale=[d,f],this.skew=f?Math.atan2(e,f)*bd:0}function ba(a,b){return a[0]*b[0]+a[1]*b[1]}function bb(a){var b=Math.sqrt(ba(a,a));return b&&(a[0]/=b,a[1]/=b),b}function bc(a,b,c){return a[0]+=c*b[0],a[1]+=c*b[1],a}function bg(a){return a=="transform"?d3.interpolateTransform:d3.interpolate}function bh(a,b){return b=b-(a=+a)?1/(b-a):0,function(c){return(c-a)*b}}function bi(a,b){return b=b-(a=+a)?1/(b-a):0,function(c){return Math.max(0,Math.min(1,(c-a)*b))}}function bj(a,b,c){return new bk(a,b,c)}function bk(a,b,c){this.r=a,this.g=b,this.b=c}function bl(a){return a<16?"0"+Math.max(0,a).toString(16):Math.min(255,a).toString(16)}function bm(a,b,c){var d=0,e=0,f=0,g,h,i;g=/([a-z]+)\((.*)\)/i.exec(a);if(g){h=g[2].split(",");switch(g[1]){case"hsl":return c(parseFloat(h[0]),parseFloat(h[1])/100,parseFloat(h[2])/100);case"rgb":return b(bq(h[0]),bq(h[1]),bq(h[2]))}}return(i=br.get(a))?b(i.r,i.g,i.b):(a!=null&&a.charAt(0)==="#"&&(a.length===4?(d=a.charAt(1),d+=d,e=a.charAt(2),e+=e,f=a.charAt(3),f+=f):a.length===7&&(d=a.substring(1,3),e=a.substring(3,5),f=a.substring(5,7)),d=parseInt(d,16),e=parseInt(e,16),f=parseInt(f,16)),b(d,e,f))}function bn(a,b,c){var d=Math.min(a/=255,b/=255,c/=255),e=Math.max(a,b,c),f=e-d,g,h,i=(e+d)/2;return f?(h=i<.5?f/(e+d):f/(2-e-d),a==e?g=(b-c)/f+(b<c?6:0):b==e?g=(c-a)/f+2:g=(a-b)/f+4,g*=60):h=g=0,bs(g,h,i)}function bo(a,b,c){a=bp(a),b=bp(b),c=bp(c);var d=bH((.4124564*a+.3575761*b+.1804375*c)/bB),e=bH((.2126729*a+.7151522*b+.072175*c)/bC),f=bH((.0193339*a+.119192*b+.9503041*c)/bD);return by(116*e-16,500*(d-e),200*(e-f))}function bp(a){return(a/=255)<=.04045?a/12.92:Math.pow((a+.055)/1.055,2.4)}function bq(a){var b=parseFloat(a);return a.charAt(a.length-1)==="%"?Math.round(b*2.55):b}function bs(a,b,c){return new bt(a,b,c)}function bt(a,b,c){this.h=a,this.s=b,this.l=c}function bu(a,b,c){function f(a){return a>360?a-=360:a<0&&(a+=360),a<60?d+(e-d)*a/60:a<180?e:a<240?d+(e-d)*(240-a)/60:d}function g(a){return Math.round(f(a)*255)}var d,e;return a%=360,a<0&&(a+=360),b=b<0?0:b>1?1:b,c=c<0?0:c>1?1:c,e=c<=.5?c*(1+b):c+b-c*b,d=2*c-e,bj(g(a+120),g(a),g(a-120))}function bv(a,b,c){return new bw(a,b,c)}function bw(a,b,c){this.h=a,this.c=b,this.l=c}function bx(a,b,c){return by(c,Math.cos(a*=Math.PI/180)*b,Math.sin(a)*b)}function by(a,b,c){return new bz(a,b,c)}function bz(a,b,c){this.l=a,this.a=b,this.b=c}function bE(a,b,c){var d=(a+16)/116,e=d+b/500,f=d-c/200;return e=bG(e)*bB,d=bG(d)*bC,f=bG(f)*bD,bj(bI(3.2404542*e-1.5371385*d-.4985314*f),bI(-0.969266*e+1.8760108*d+.041556*f),bI(.0556434*e-.2040259*d+1.0572252*f))}function bF(a,b,c){return bv(Math.atan2(c,b)/Math.PI*180,Math.sqrt(b*b+c*c),a)}function bG(a){return a>.206893034?a*a*a:(a-4/29)/7.787037}function bH(a){return a>.008856?Math.pow(a,1/3):7.787037*a+4/29}function bI(a){return Math.round(255*(a<=.00304?12.92*a:1.055*Math.pow(a,1/2.4)-.055))}function bJ(a){return i(a,bP),a}function bQ(a){return function(){return bK(a,this)}}function bR(a){return function(){return bL(a,this)}}function bS(a,b){function c(){this.removeAttribute(a)}function d(){this.removeAttributeNS(a.space,a.local)}function e(){this.setAttribute(a,b)}function f(){this.setAttributeNS(a.space,a.local,b)}function g(){var c=b.apply(this,arguments);c==null?this.removeAttribute(a):this.setAttribute(a,c)}function h(){var c=b.apply(this,arguments);c==null?this.removeAttributeNS(a.space,a.local):this.setAttributeNS(a.space,a.local,c)}return a=d3.ns.qualify(a),b==null?a.local?d:c:typeof b=="function"?a.local?h:g:a.local?f:e}function bT(a){return new RegExp("(?:^|\\s+)"+d3.requote(a)+"(?:\\s+|$)","g")}function bU(a,b){function d(){var d=-1;while(++d<c)a[d](this,b)}function e(){var d=-1,e=b.apply(this,arguments);while(++d<c)a[d](this,e)}a=a.trim().split(/\s+/).map(bV);var c=a.length;return typeof b=="function"?e:d}function bV(a){var b=bT(a);return function(c,d){if(e=c.classList)return d?e.add(a):e.remove(a);var e=c.className,f=e.baseVal!=null,g=f?e.baseVal:e;d?(b.lastIndex=0,b.test(g)||(g=v(g+" "+a),f?e.baseVal=g:c.className=g)):g&&(g=v(g.replace(b," ")),f?e.baseVal=g:c.className=g)}}function bW(a,b,c){function d(){this.style.removeProperty(a)}function e(){this.style.setProperty(a,b,c)}function f(){var d=b.apply(this,arguments);d==null?this.style.removeProperty(a):this.style.setProperty(a,d,c)}return b==null?d:typeof b=="function"?f:e}function bX(a,b){function c(){delete this[a]}function d(){this[a]=b}function e(){var c=b.apply(this,arguments);c==null?delete this[a]:this[a]=c}return b==null?c:typeof b=="function"?e:d}function bY(a){return{__data__:a}}function bZ(a){return function(){return bO(this,a)}}function b$(a){return arguments.length||(a=d3.ascending),function(b,c){return a(b&&b.__data__,c&&c.__data__)}}function b_(a,b,c){function f(){var b=this[d];b&&(this.removeEventListener(a,b,b.$),delete this[d])}function g(){function h(a){var c=d3.event;d3.event=a,g[0]=e.__data__;try{b.apply(e,g)}finally{d3.event=c}}var e=this,g=arguments;f.call(this),this.addEventListener(a,this[d]=h,h.$=c),h._=b}var d="__on"+a,e=a.indexOf(".");return e>0&&(a=a.substring(0,e)),b?g:f}function ca(a,b){for(var c=0,d=a.length;c<d;c++)for(var e=a[c],f=0,g=e.length,h;f<g;f++)(h=e[f])&&b(h,f,c);return a}function cc(a){return i(a,cd),a}function ce(a,b,c){i(a,cf);var d=new j,e=d3.dispatch("start","end"),f=cn;return a.id=b,a.time=c,a.tween=function(b,c){return arguments.length<2?d.get(b):(c==null?d.remove(b):d.set(b,c),a)},a.ease=function(b){return arguments.length?(f=typeof b=="function"?b:d3.ease.apply(d3,arguments),a):f},a.each=function(b,c){return arguments.length<2?co.call(a,b):(e.on(b,c),a)},d3.timer(function(g){return ca(a,function(a,h,i){function o(f){return m.active>b?q():(m.active=b,d.forEach(function(b,c){(c=c.call(a,n,h))&&j.push(c)}),e.start.call(a,n,h),p(f)||d3.timer(p,0,c),1)}function p(c){if(m.active!==b)return q();var d=(c-k)/l,g=f(d),i=j.length;while(i>0)j[--i].call(a,g);if(d>=1)return q(),ch=b,e.end.call(a,n,h),ch=0,1}function q(){return--m.count||delete a.__transition__,1}var j=[],k=a.delay,l=a.duration,m=(a=a.node).__transition__||(a.__transition__={active:0,count:0}),n=a.__data__;++m.count,k<=g?o(g):d3.timer(o,k,c)})},0,c),a}function co(a){var b=ch,c=cn,d=cl,e=cm;return ch=this.id,cn=this.ease(),ca(this,function(b,c,d){cl=b.delay,cm=b.duration,a.call(b=b.node,b.__data__,c,d)}),ch=b,cn=c,cl=d,cm=e,this}function cq(a,b,c){return c!=""&&cp}function cr(a,b){return d3.tween(a,bg(b))}function cv(){var a,b=Date.now(),c=cs;while(c)a=b-c.then,a>=c.delay&&(c.flush=c.callback(a)),c=c.next;var d=cw()-b;d>24?(isFinite(d)&&(clearTimeout(cu),cu=setTimeout(cv,d)),ct=0):(ct=1,cx(cv))}function cw(){var a=null,b=cs,c=Infinity;while(b)b.flush?b=a?a.next=b.next:cs=b.next:(c=Math.min(c,b.then+b.delay),b=(a=b).next);return c}function cz(a,b){var c=a.ownerSVGElement||a;if(c.createSVGPoint){var d=c.createSVGPoint();if(cy<0&&(window.scrollX||window.scrollY)){c=d3.select(document.body).append("svg").style("position","absolute").style("top",0).style("left",0);var e=c[0][0].getScreenCTM();cy=!e.f&&!e.e,c.remove()}return cy?(d.x=b.pageX,d.y=b.pageY):(d.x=b.clientX,d.y=b.clientY),d=d.matrixTransform(a.getScreenCTM().inverse()),[d.x,d.y]}var f=a.getBoundingClientRect();return[b.clientX-f.left-a.clientLeft,b.clientY-f.top-a.clientTop]}function cA(){}function cB(a){var b=a[0],c=a[a.length-1];return b<c?[b,c]:[c,b]}function cC(a){return a.rangeExtent?a.rangeExtent():cB(a.range())}function cD(a,b){var c=0,d=a.length-1,e=a[c],f=a[d],g;f<e&&(g=c,c=d,d=g,g=e,e=f,f=g);if(b=b(f-e))a[c]=b.floor(e),a[d]=b.ceil(f);return a}function cE(){return Math}function cF(a,b,c,d){function g(){var g=Math.min(a.length,b.length)>2?cM:cL,i=d?bi:bh;return e=g(a,b,i,c),f=g(b,a,i,d3.interpolate),h}function h(a){return e(a)}var e,f;return h.invert=function(a){return f(a)},h.domain=function(b){return arguments.length?(a=b.map(Number),g()):a},h.range=function(a){return arguments.length?(b=a,g()):b},h.rangeRound=function(a){return h.range(a).interpolate(d3.interpolateRound)},h.clamp=function(a){return arguments.length?(d=a,g()):d},h.interpolate=function(a){return arguments.length?(c=a,g()):c},h.ticks=function(b){return cJ(a,b)},h.tickFormat=function(b){return cK(a,b)},h.nice=function(){return cD(a,cH),g()},h.copy=function(){return cF(a,b,c,d)},g()}function cG(a,b){return d3.rebind(a,b,"range","rangeRound","interpolate","clamp")}function cH(a){return a=Math.pow(10,Math.round(Math.log(a)/Math.LN10)-1),a&&{floor:function(b){return Math.floor(b/a)*a},ceil:function(b){return Math.ceil(b/a)*a}}}function cI(a,b){var c=cB(a),d=c[1]-c[0],e=Math.pow(10,Math.floor(Math.log(d/b)/Math.LN10)),f=b/d*e;return f<=.15?e*=10:f<=.35?e*=5:f<=.75&&(e*=2),c[0]=Math.ceil(c[0]/e)*e,c[1]=Math.floor(c[1]/e)*e+e*.5,c[2]=e,c}function cJ(a,b){return d3.range.apply(d3,cI(a,b))}function cK(a,b){return d3.format(",."+Math.max(0,-Math.floor(Math.log(cI(a,b)[2])/Math.LN10+.01))+"f")}function cL(a,b,c,d){var e=c(a[0],a[1]),f=d(b[0],b[1]);return function(a){return f(e(a))}}function cM(a,b,c,d){var e=[],f=[],g=0,h=Math.min(a.length,b.length)-1;a[h]<a[0]&&(a=a.slice().reverse(),b=b.slice().reverse());while(++g<=h)e.push(c(a[g-1],a[g])),f.push(d(b[g-1],b[g]));return function(b){var c=d3.bisect(a,b,1,h)-1;return f[c](e[c](b))}}function cN(a,b){function d(c){return a(b(c))}var c=b.pow;return d.invert=function(b){return c(a.invert(b))},d.domain=function(e){return arguments.length?(b=e[0]<0?cQ:cP,c=b.pow,a.domain(e.map(b)),d):a.domain().map(c)},d.nice=function(){return a.domain(cD(a.domain(),cE)),d},d.ticks=function(){var d=cB(a.domain()),e=[];if(d.every(isFinite)){var f=Math.floor(d[0]),g=Math.ceil(d[1]),h=c(d[0]),i=c(d[1]);if(b===cQ){e.push(c(f));for(;f++<g;)for(var j=9;j>0;j--)e.push(c(f)*j)}else{for(;f<g;f++)for(var j=1;j<10;j++)e.push(c(f)*j);e.push(c(f))}for(f=0;e[f]<h;f++);for(g=e.length;e[g-1]>i;g--);e=e.slice(f,g)}return e},d.tickFormat=function(a,e){arguments.length<2&&(e=cO);if(arguments.length<1)return e;var f=Math.max(.1,a/d.ticks().length),g=b===cQ?(h=-1e-12,Math.floor):(h=1e-12,Math.ceil),h;return function(a){return a/c(g(b(a)+h))<=f?e(a):""}},d.copy=function(){return cN(a.copy(),b)},cG(d,a)}function cP(a){return Math.log(a<0?0:a)/Math.LN10}function cQ(a){return-Math.log(a>0?0:-a)/Math.LN10}function cR(a,b){function e(b){return a(c(b))}var c=cS(b),d=cS(1/b);return e.invert=function(b){return d(a.invert(b))},e.domain=function(b){return arguments.length?(a.domain(b.map(c)),e):a.domain().map(d)},e.ticks=function(a){return cJ(e.domain(),a)},e.tickFormat=function(a){return cK(e.domain(),a)},e.nice=function(){return e.domain(cD(e.domain(),cH))},e.exponent=function(a){if(!arguments.length)return b;var f=e.domain();return c=cS(b=a),d=cS(1/b),e.domain(f)},e.copy=function(){return cR(a.copy(),b)},cG(e,a)}function cS(a){return function(b){return b<0?-Math.pow(-b,a):Math.pow(b,a)}}function cT(a,b){function f(b){return d[((c.get(b)||c.set(b,a.push(b)))-1)%d.length]}function g(b,c){return d3.range(a.length).map(function(a){return b+c*a})}var c,d,e;return f.domain=function(d){if(!arguments.length)return a;a=[],c=new j;var e=-1,g=d.length,h;while(++e<g)c.has(h=d[e])||c.set(h,a.push(h));return f[b.t].apply(f,b.a)},f.range=function(a){return arguments.length?(d=a,e=0,b={t:"range",a:arguments},f):d},f.rangePoints=function(c,h){arguments.length<2&&(h=0);var i=c[0],j=c[1],k=(j-i)/(a.length-1+h);return d=g(a.length<2?(i+j)/2:i+k*h/2,k),e=0,b={t:"rangePoints",a:arguments},f},f.rangeBands=function(c,h,i){arguments.length<2&&(h=0),arguments.length<3&&(i=h);var j=c[1]<c[0],k=c[j-0],l=c[1-j],m=(l-k)/(a.length-h+2*i);return d=g(k+m*i,m),j&&d.reverse(),e=m*(1-h),b={t:"rangeBands",a:arguments},f},f.rangeRoundBands=function(c,h,i){arguments.length<2&&(h=0),arguments.length<3&&(i=h);var j=c[1]<c[0],k=c[j-0],l=c[1-j],m=Math.floor((l-k)/(a.length-h+2*i)),n=l-k-(a.length-h)*m;return d=g(k+Math.round(n/2),m),j&&d.reverse(),e=Math.round(m*(1-h)),b={t:"rangeRoundBands",a:arguments},f},f.rangeBand=function(){return e},f.rangeExtent=function(){return cB(b.a[0])},f.copy=function(){return cT(a,b)},f.domain(a)}function cY(a,b){function d(){var d=0,f=a.length,g=b.length;c=[];while(++d<g)c[d-1]=d3.quantile(a,d/g);return e}function e(a){return isNaN(a=+a)?NaN:b[d3.bisect(c,a)]}var c;return e.domain=function(b){return arguments.length?(a=b.filter(function(a){return!isNaN(a)}).sort(d3.ascending),d()):a},e.range=function(a){return arguments.length?(b=a,d()):b},e.quantiles=function(){return c},e.copy=function(){return cY(a,b)},d()}function cZ(a,b,c){function f(b){return c[Math.max(0,Math.min(e,Math.floor(d*(b-a))))]}function g(){return d=c.length/(b-a),e=c.length-1,f}var d,e;return f.domain=function(c){return arguments.length?(a=+c[0],b=+c[c.length-1],g()):[a,b]},f.range=function(a){return arguments.length?(c=a,g()):c},f.copy=function(){return cZ(a,b,c)},g()}function c$(a,b){function c(c){return b[d3.bisect(a,c)]}return c.domain=function(b){return arguments.length?(a=b,c):a},c.range=function(a){return arguments.length?(b=a,c):b},c.copy=function(){return c$(a,b)},c}function c_(a){function b(a){return+a}return b.invert=b,b.domain=b.range=function(c){return arguments.length?(a=c.map(b),b):a},b.ticks=function(b){return cJ(a,b)},b.tickFormat=function(b){return cK(a,b)},b.copy=function(){return c_(a)},b}function dc(a){return a.innerRadius}function dd(a){return a.outerRadius}function de(a){return a.startAngle}function df(a){return a.endAngle}function dg(a){function h(f){function o(){h.push("M",e(a(i),g))}var h=[],i=[],j=-1,k=f.length,l,m=p(b),n=p(c);while(++j<k)d.call(this,l=f[j],j)?i.push([+m.call(this,l,j),+n.call(this,l,j)]):i.length&&(o(),i=[]);return i.length&&o(),h.length?h.join(""):null}var b=dh,c=di,d=o,e=dk,f=e.key,g=.7;return h.x=function(a){return arguments.length?(b=a,h):b},h.y=function(a){return arguments.length?(c=a,h):c},h.defined=function(a){return arguments.length?(d=a,h):d},h.interpolate=function(a){return arguments.length?(typeof a=="function"?f=e=a:f=(e=dj.get(a)||dk).key,h):f},h.tension=function(a){return arguments.length?(g=a,h):g},h}function dh(a){return a[0]}function di(a){return a[1]}function dk(a){return a.join("L")}function dl(a){return dk(a)+"Z"}function dm(a){var b=0,c=a.length,d=a[0],e=[d[0],",",d[1]];while(++b<c)e.push("V",(d=a[b])[1],"H",d[0]);return e.join("")}function dn(a){var b=0,c=a.length,d=a[0],e=[d[0],",",d[1]];while(++b<c)e.push("H",(d=a[b])[0],"V",d[1]);return e.join("")}function dp(a,b){return a.length<4?dk(a):a[1]+ds(a.slice(1,a.length-1),dt(a,b))}function dq(a,b){return a.length<3?dk(a):a[0]+ds((a.push(a[0]),a),dt([a[a.length-2]].concat(a,[a[1]]),b))}function dr(a,b,c){return a.length<3?dk(a):a[0]+ds(a,dt(a,b))}function ds(a,b){if(b.length<1||a.length!=b.length&&a.length!=b.length+2)return dk(a);var c=a.length!=b.length,d="",e=a[0],f=a[1],g=b[0],h=g,i=1;c&&(d+="Q"+(f[0]-g[0]*2/3)+","+(f[1]-g[1]*2/3)+","+f[0]+","+f[1],e=a[1],i=2);if(b.length>1){h=b[1],f=a[i],i++,d+="C"+(e[0]+g[0])+","+(e[1]+g[1])+","+(f[0]-h[0])+","+(f[1]-h[1])+","+f[0]+","+f[1];for(var j=2;j<b.length;j++,i++)f=a[i],h=b[j],d+="S"+(f[0]-h[0])+","+(f[1]-h[1])+","+f[0]+","+f[1]}if(c){var k=a[i];d+="Q"+(f[0]+h[0]*2/3)+","+(f[1]+h[1]*2/3)+","+k[0]+","+k[1]}return d}function dt(a,b){var c=[],d=(1-b)/2,e,f=a[0],g=a[1],h=1,i=a.length;while(++h<i)e=f,f=g,g=a[h],c.push([d*(g[0]-e[0]),d*(g[1]-e[1])]);return c}function du(a){if(a.length<3)return dk(a);var b=1,c=a.length,d=a[0],e=d[0],f=d[1],g=[e,e,e,(d=a[1])[0]],h=[f,f,f,d[1]],i=[e,",",f];dC(i,g,h);while(++b<c)d=a[b],g.shift(),g.push(d[0]),h.shift(),h.push(d[1]),dC(i,g,h);b=-1;while(++b<2)g.shift(),g.push(d[0]),h.shift(),h.push(d[1]),dC(i,g,h);return i.join("")}function dv(a){if(a.length<4)return dk(a);var b=[],c=-1,d=a.length,e,f=[0],g=[0];while(++c<3)e=a[c],f.push(e[0]),g.push(e[1]);b.push(dy(dB,f)+","+dy(dB,g)),--c;while(++c<d)e=a[c],f.shift(),f.push(e[0]),g.shift(),g.push(e[1]),dC(b,f,g);return b.join("")}function dw(a){var b,c=-1,d=a.length,e=d+4,f,g=[],h=[];while(++c<4)f=a[c%d],g.push(f[0]),h.push(f[1]);b=[dy(dB,g),",",dy(dB,h)],--c;while(++c<e)f=a[c%d],g.shift(),g.push(f[0]),h.shift(),h.push(f[1]),dC(b,g,h);return b.join("")}function dx(a,b){var c=a.length-1;if(c){var d=a[0][0],e=a[0][1],f=a[c][0]-d,g=a[c][1]-e,h=-1,i,j;while(++h<=c)i=a[h],j=h/c,i[0]=b*i[0]+(1-b)*(d+j*f),i[1]=b*i[1]+(1-b)*(e+j*g)}return du(a)}function dy(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]}function dC(a,b,c){a.push("C",dy(dz,b),",",dy(dz,c),",",dy(dA,b),",",dy(dA,c),",",dy(dB,b),",",dy(dB,c))}function dD(a,b){return(b[1]-a[1])/(b[0]-a[0])}function dE(a){var b=0,c=a.length-1,d=[],e=a[0],f=a[1],g=d[0]=dD(e,f);while(++b<c)d[b]=(g+(g=dD(e=f,f=a[b+1])))/2;return d[b]=g,d}function dF(a){var b=[],c,d,e,f,g=dE(a),h=-1,i=a.length-1;while(++h<i)c=dD(a[h],a[h+1]),Math.abs(c)<1e-6?g[h]=g[h+1]=0:(d=g[h]/c,e=g[h+1]/c,f=d*d+e*e,f>9&&(f=c*3/Math.sqrt(f),g[h]=f*d,g[h+1]=f*e));h=-1;while(++h<=i)f=(a[Math.min(i,h+1)][0]-a[Math.max(0,h-1)][0])/(6*(1+g[h]*g[h])),b.push([f||0,g[h]*f||0]);return b}function dG(a){return a.length<3?dk(a):a[0]+ds(a,dF(a))}function dH(a){var b,c=-1,d=a.length,e,f;while(++c<d)b=a[c],e=b[0],f=b[1]+da,b[0]=e*Math.cos(f),b[1]=e*Math.sin(f);return a}function dI(a){function l(h){function y(){l.push("M",g(a(n),k),j,i(a(m.reverse()),k),"Z")}var l=[],m=[],n=[],o=-1,q=h.length,r,s=p(b),t=p(d),u=b===c?function(){return w}:p(c),v=d===e?function(){return x}:p(e),w,x;while(++o<q)f.call(this,r=h[o],o)?(m.push([w=+s.call(this,r,o),x=+t.call(this,r,o)]),n.push([+u.call(this,r,o),+v.call(this,r,o)])):m.length&&(y(),m=[],n=[]);return m.length&&y(),l.length?l.join(""):null}var b=dh,c=dh,d=0,e=di,f=o,g=dk,h=g.key,i=g,j="L",k=.7;return l.x=function(a){return arguments.length?(b=c=a,l):c},l.x0=function(a){return arguments.length?(b=a,l):b},l.x1=function(a){return arguments.length?(c=a,l):c},l.y=function(a){return arguments.length?(d=e=a,l):e},l.y0=function(a){return arguments.length?(d=a,l):d},l.y1=function(a){return arguments.length?(e=a,l):e},l.defined=function(a){return arguments.length?(f=a,l):f},l.interpolate=function(a){return arguments.length?(typeof a=="function"?h=g=a:h=(g=dj.get(a)||dk).key,i=g.reverse||g,j=g.closed?"M":"L",l):h},l.tension=function(a){return arguments.length?(k=a,l):k},l}function dJ(a){return a.source}function dK(a){return a.target}function dL(a){return a.radius}function dM(a){return a.startAngle}function dN(a){return a.endAngle}function dO(a){return[a.x,a.y]}function dP(a){return function(){var b=a.apply(this,arguments),c=b[0],d=b[1]+da;return[c*Math.cos(d),c*Math.sin(d)]}}function dQ(){return 64}function dR(){return"circle"}function dS(a){var b=Math.sqrt(a/Math.PI);return"M0,"+b+"A"+b+","+b+" 0 1,1 0,"+ -b+"A"+b+","+b+" 0 1,1 0,"+b+"Z"}function dW(a,b){a.attr("transform",function(a){return"translate("+b(a)+",0)"})}function dX(a,b){a.attr("transform",function(a){return"translate(0,"+b(a)+")"})}function dY(a,b,c){e=[];if(c&&b.length>1){var d=cB(a.domain()),e,f=-1,g=b.length,h=(b[1]-b[0])/++c,i,j;while(++f<g)for(i=c;--i>0;)(j=+b[f]-i*h)>=d[0]&&e.push(j);for(--f,i=0;++i<c&&(j=+b[f]+i*h)<d[1];)e.push(j)}return e}function eb(){d_||(d_=d3.select("body").append("div").style("visibility","hidden").style("top",0).style("height",0).style("width",0).style("overflow-y","scroll").append("div").style("height","2000px").node().parentNode);var a=d3.event,b;try{d_.scrollTop=1e3,d_.dispatchEvent(a),b=1e3-d_.scrollTop}catch(c){b=a.wheelDelta||-a.detail*5}return b}function ec(a){var b=a.source,c=a.target,d=ee(b,c),e=[b];while(b!==d)b=b.parent,e.push(b);var f=e.length;while(c!==d)e.splice(f,0,c),c=c.parent;return e}function ed(a){var b=[],c=a.parent;while(c!=null)b.push(a),a=c,c=c.parent;return b.push(a),b}function ee(a,b){if(a===b)return a;var c=ed(a),d=ed(b),e=c.pop(),f=d.pop(),g=null;while(e===f)g=e,e=c.pop(),f=d.pop();return g}function eh(a){a.fixed|=2}function ei(a){a!==eg&&(a.fixed&=1)}function ej(){eg.fixed&=1,ef=eg=null}function ek(){eg.px=d3.event.x,eg.py=d3.event.y,ef.resume()}function el(a,b,c){var d=0,e=0;a.charge=0;if(!a.leaf){var f=a.nodes,g=f.length,h=-1,i;while(++h<g){i=f[h];if(i==null)continue;el(i,b,c),a.charge+=i.charge,d+=i.charge*i.cx,e+=i.charge*i.cy}}if(a.point){a.leaf||(a.point.x+=Math.random()-.5,a.point.y+=Math.random()-.5);var j=b*c[a.point.index];a.charge+=a.pointCharge=j,d+=j*a.point.x,e+=j*a.point.y}a.cx=d/a.charge,a.cy=e/a.charge}function em(a){return 20}function en(a){return 1}function ep(a){return a.x}function eq(a){return a.y}function er(a,b,c){a.y0=b,a.y=c}function eu(a){return d3.range(a.length)}function ev(a){var b=-1,c=a[0].length,d=[];while(++b<c)d[b]=0;return d}function ew(a){var b=1,c=0,d=a[0][1],e,f=a.length;for(;b<f;++b)(e=a[b][1])>d&&(c=b,d=e);return c}function ex(a){return a.reduce(ey,0)}function ey(a,b){return a+b[1]}function ez(a,b){return eA(a,Math.ceil(Math.log(b.length)/Math.LN2+1))}function eA(a,b){var c=-1,d=+a[0],e=(a[1]-d)/b,f=[];while(++c<=b)f[c]=e*c+d;return f}function eB(a){return[d3.min(a),d3.max(a)]}function eC(a,b){return d3.rebind(a,b,"sort","children","value"),a.links=eG,a.nodes=function(b){return eH=!0,(a.nodes=a)(b)},a}function eD(a){return a.children}function eE(a){return a.value}function eF(a,b){return b.value-a.value}function eG(a){return d3.merge(a.map(function(a){return(a.children||[]).map(function(b){return{source:a,target:b}})}))}function eI(a,b){return a.value-b.value}function eJ(a,b){var c=a._pack_next;a._pack_next=b,b._pack_prev=a,b._pack_next=c,c._pack_prev=b}function eK(a,b){a._pack_next=b,b._pack_prev=a}function eL(a,b){var c=b.x-a.x,d=b.y-a.y,e=a.r+b.r;return e*e-c*c-d*d>.001}function eM(a){function n(a){c=Math.min(a.x-a.r,c),d=Math.max(a.x+a.r,d),e=Math.min(a.y-a.r,e),f=Math.max(a.y+a.r,f)}if(!(b=a.children)||!(m=b.length))return;var b,c=Infinity,d=-Infinity,e=Infinity,f=-Infinity,g,h,i,j,k,l,m;b.forEach(eN),g=b[0],g.x=-g.r,g.y=0,n(g);if(m>1){h=b[1],h.x=h.r,h.y=0,n(h);if(m>2){i=b[2],eQ(g,h,i),n(i),eJ(g,i),g._pack_prev=i,eJ(i,h),h=g._pack_next;for(j=3;j<m;j++){eQ(g,h,i=b[j]);var o=0,p=1,q=1;for(k=h._pack_next;k!==h;k=k._pack_next,p++)if(eL(k,i)){o=1;break}if(o==1)for(l=g._pack_prev;l!==k._pack_prev;l=l._pack_prev,q++)if(eL(l,i))break;o?(p<q||p==q&&h.r<g.r?eK(g,h=k):eK(g=l,h),j--):(eJ(g,i),h=i,n(i))}}}var r=(c+d)/2,s=(e+f)/2,t=0;for(j=0;j<m;j++)i=b[j],i.x-=r,i.y-=s,t=Math.max(t,i.r+Math.sqrt(i.x*i.x+i.y*i.y));a.r=t,b.forEach(eO)}function eN(a){a._pack_next=a._pack_prev=a}function eO(a){delete a._pack_next,delete a._pack_prev}function eP(a,b,c,d){var e=a.children;a.x=b+=d*a.x,a.y=c+=d*a.y,a.r*=d;if(e){var f=-1,g=e.length;while(++f<g)eP(e[f],b,c,d)}}function eQ(a,b,c){var d=a.r+c.r,e=b.x-a.x,f=b.y-a.y;if(d&&(e||f)){var g=b.r+c.r,h=e*e+f*f;g*=g,d*=d;var i=.5+(d-g)/(2*h),j=Math.sqrt(Math.max(0,2*g*(d+h)-(d-=h)*d-g*g))/(2*h);c.x=a.x+i*e+j*f,c.y=a.y+i*f-j*e}else c.x=a.x+d,c.y=a.y}function eR(a){return 1+d3.max(a,function(a){return a.y})}function eS(a){return a.reduce(function(a,b){return a+b.x},0)/a.length}function eT(a){var b=a.children;return b&&b.length?eT(b[0]):a}function eU(a){var b=a.children,c;return b&&(c=b.length)?eU(b[c-1]):a}function eV(a,b){return a.parent==b.parent?1:2}function eW(a){var b=a.children;return b&&b.length?b[0]:a._tree.thread}function eX(a){var b=a.children,c;return b&&(c=b.length)?b[c-1]:a._tree.thread}function eY(a,b){var c=a.children;if(c&&(e=c.length)){var d,e,f=-1;while(++f<e)b(d=eY(c[f],b),a)>0&&(a=d)}return a}function eZ(a,b){return a.x-b.x}function e$(a,b){return b.x-a.x}function e_(a,b){return a.depth-b.depth}function fa(a,b){function c(a,d){var e=a.children;if(e&&(i=e.length)){var f,g=null,h=-1,i;while(++h<i)f=e[h],c(f,g),g=f}b(a,d)}c(a,null)}function fb(a){var b=0,c=0,d=a.children,e=d.length,f;while(--e>=0)f=d[e]._tree,f.prelim+=b,f.mod+=b,b+=f.shift+(c+=f.change)}function fc(a,b,c){a=a._tree,b=b._tree;var d=c/(b.number-a.number);a.change+=d,b.change-=d,b.shift+=c,b.prelim+=c,b.mod+=c}function fd(a,b,c){return a._tree.ancestor.parent==b.parent?a._tree.ancestor:c}function fe(a){return{x:a.x,y:a.y,dx:a.dx,dy:a.dy}}function ff(a,b){var c=a.x+b[3],d=a.y+b[0],e=a.dx-b[1]-b[3],f=a.dy-b[0]-b[2];return e<0&&(c+=e/2,e=0),f<0&&(d+=f/2,f=0),{x:c,y:d,dx:e,dy:f}}function fg(a,b){function f(a,c){d3.text(a,b,function(a){c(a&&f.parse(a))})}function g(b){return b.map(h).join(a)}function h(a){return d.test(a)?'"'+a.replace(/\"/g,'""')+'"':a}var c=new RegExp("\r\n|["+a+"\r\n]","g"),d=new RegExp('["'+a+"\n]"),e=a.charCodeAt(0);return f.parse=function(a){var b;return f.parseRows(a,function(a,c){if(c){var d={},e=-1,f=b.length;while(++e<f)d[b[e]]=a[e];return d}return b=a,null})},f.parseRows=function(a,b){function k(){if(c.lastIndex>=a.length)return f;if(j)return j=!1,d;var b=c.lastIndex;if(a.charCodeAt(b)===34){var g=b;while(g++<a.length)if(a.charCodeAt(g)===34){if(a.charCodeAt(g+1)!==34)break;g++}c.lastIndex=g+2;var h=a.charCodeAt(g+1);return h===13?(j=!0,a.charCodeAt(g+2)===10&&c.lastIndex++):h===10&&(j=!0),a.substring(b+1,g).replace(/""/g,'"')}var i=c.exec(a);return i?(j=i[0].charCodeAt(0)!==e,a.substring(b,i.index)):(c.lastIndex=a.length,a.substring(b))}var d={},f={},g=[],h=0,i,j;c.lastIndex=0;while((i=k())!==f){var l=[];while(i!==d&&i!==f)l.push(i),i=k();if(b&&!(l=b(l,h++)))continue;g.push(l)}return g},f.format=function(a){return a.map(g).join("\n")},f}function fi(a,b){return function(c){return c&&a.hasOwnProperty(c.type)?a[c.type](c):b}}function fj(a){return"m0,"+a+"a"+a+","+a+" 0 1,1 0,"+ -2*a+"a"+a+","+a+" 0 1,1 0,"+2*a+"z"}function fk(a,b){fl.hasOwnProperty(a.type)&&fl[a.type](a,b)}function fm(a,b){fk(a.geometry,b)}function fn(a,b){for(var c=a.features,d=0,e=c.length;d<e;d++)fk(c[d].geometry,b)}function fo(a,b){for(var c=a.geometries,d=0,e=c.length;d<e;d++)fk(c[d],b)}function fp(a,b){for(var c=a.coordinates,d=0,e=c.length;d<e;d++)b.apply(null,c[d])}function fq(a,b){for(var c=a.coordinates,d=0,e=c.length;d<e;d++)for(var f=c[d],g=0,h=f.length;g<h;g++)b.apply(null,f[g])}function fr(a,b){for(var c=a.coordinates,d=0,e=c.length;d<e;d++)for(var f=c[d][0],g=0,h=f.length;g<h;g++)b.apply(null,f[g])}function fs(a,b){b.apply(null,a.coordinates)}function ft(a,b){for(var c=a.coordinates[0],d=0,e=c.length;d<e;d++)b.apply(null,c[d])}function fu(a){return a.source}function fv(a){return a.target}function fw(){function o(a){var b=Math.sin(a*=m)*n,c=Math.sin(m-a)*n,g=c*e+b*k,h=c*f+b*l,i=c*d+b*j;return[Math.atan2(h,g)/fh,Math.atan2(i,Math.sqrt(g*g+h*h))/fh]}var a,b,c,d,e,f,g,h,i,j,k,l,m,n;return o.distance=function(){return m==null&&(n=1/Math.sin(m=Math.acos(Math.max(-1,Math.min(1,d*j+c*i*Math.cos(g-a)))))),m},o.source=function(g){var h=Math.cos(a=g[0]*fh),i=Math.sin(a);return c=Math.cos(b=g[1]*fh),d=Math.sin(b),e=c*h,f=c*i,m=null,o},o.target=function(a){var b=Math.cos(g=a[0]*fh),c=Math.sin(g);return i=Math.cos(h=a[1]*fh),j=Math.sin(h),k=i*b,l=i*c,m=null,o},o}function fx(a,b){var c=fw().source(a).target(b);return c.distance(),c}function fA(a){var b=0,c=0;for(;;){if(a(b,c))return[b,c];b===0?(b=c+1,c=0):(b-=1,c+=1)}}function fB(a,b,c,d){var e,f,g,h,i,j,k;return e=d[a],f=e[0],g=e[1],e=d[b],h=e[0],i=e[1],e=d[c],j=e[0],k=e[1],(k-g)*(h-f)-(i-g)*(j-f)>0}function fC(a,b,c){return(c[0]-b[0])*(a[1]-b[1])<(c[1]-b[1])*(a[0]-b[0])}function fD(a,b,c,d){var e=a[0],f=b[0],g=c[0],h=d[0],i=a[1],j=b[1],k=c[1],l=d[1],m=e-g,n=f-e,o=h-g,p=i-k,q=j-i,r=l-k,s=(o*p-r*m)/(r*n-o*q);return[e+s*n,i+s*q]}function fF(a,b){var c={list:a.map(function(a,b){return{index:b,x:a[0],y:a[1]}}).sort(function(a,b){return a.y<b.y?-1:a.y>b.y?1:a.x<b.x?-1:a.x>b.x?1:0}),bottomSite:null},d={list:[],leftEnd:null,rightEnd:null,init:function(){d.leftEnd=d.createHalfEdge(null,"l"),d.rightEnd=d.createHalfEdge(null,"l"),d.leftEnd.r=d.rightEnd,d.rightEnd.l=d.leftEnd,d.list.unshift(d.leftEnd,d.rightEnd)},createHalfEdge:function(a,b){return{edge:a,side:b,vertex:null,l:null,r:null}},insert:function(a,b){b.l=a,b.r=a.r,a.r.l=b,a.r=b},leftBound:function(a){var b=d.leftEnd;do b=b.r;while(b!=d.rightEnd&&e.rightOf(b,a));return b=b.l,b},del:function(a){a.l.r=a.r,a.r.l=a.l,a.edge=null},right:function(a){return a.r},left:function(a){return a.l},leftRegion:function(a){return a.edge==null?c.bottomSite:a.edge.region[a.side]},rightRegion:function(a){return a.edge==null?c.bottomSite:a.edge.region[fE[a.side]]}},e={bisect:function(a,b){var c={region:{l:a,r:b},ep:{l:null,r:null}},d=b.x-a.x,e=b.y-a.y,f=d>0?d:-d,g=e>0?e:-e;return c.c=a.x*d+a.y*e+(d*d+e*e)*.5,f>g?(c.a=1,c.b=e/d,c.c/=d):(c.b=1,c.a=d/e,c.c/=e),c},intersect:function(a,b){var c=a.edge,d=b.edge;if(!c||!d||c.region.r==d.region.r)return null;var e=c.a*d.b-c.b*d.a;if(Math.abs(e)<1e-10)return null;var f=(c.c*d.b-d.c*c.b)/e,g=(d.c*c.a-c.c*d.a)/e,h=c.region.r,i=d.region.r,j,k;h.y<i.y||h.y==i.y&&h.x<i.x?(j=a,k=c):(j=b,k=d);var l=f>=k.region.r.x;return l&&j.side==="l"||!l&&j.side==="r"?null:{x:f,y:g}},rightOf:function(a,b){var c=a.edge,d=c.region.r,e=b.x>d.x;if(e&&a.side==="l")return 1;if(!e&&a.side==="r")return 0;if(c.a===1){var f=b.y-d.y,g=b.x-d.x,h=0,i=0;!e&&c.b<0||e&&c.b>=0?i=h=f>=c.b*g:(i=b.x+b.y*c.b>c.c,c.b<0&&(i=!i),i||(h=1));if(!h){var j=d.x-c.region.l.x;i=c.b*(g*g-f*f)<j*f*(1+2*g/j+c.b*c.b),c.b<0&&(i=!i)}}else{var k=c.c-c.a*b.x,l=b.y-k,m=b.x-d.x,n=k-d.y;i=l*l>m*m+n*n}return a.side==="l"?i:!i},endPoint:function(a,c,d){a.ep[c]=d;if(!a.ep[fE[c]])return;b(a)},distance:function(a,b){var c=a.x-b.x,d=a.y-b.y;return Math.sqrt(c*c+d*d)}},f={list:[],insert:function(a,b,c){a.vertex=b,a.ystar=b.y+c;for(var d=0,e=f.list,g=e.length;d<g;d++){var h=e[d];if(a.ystar>h.ystar||a.ystar==h.ystar&&b.x>h.vertex.x)continue;break}e.splice(d,0,a)},del:function(a){for(var b=0,c=f.list,d=c.length;b<d&&c[b]!=a;++b);c.splice(b,1)},empty:function(){return f.list.length===0},nextEvent:function(a){for(var b=0,c=f.list,d=c.length;b<d;++b)if(c[b]==a)return c[b+1];return null},min:function(){var a=f.list[0];return{x:a.vertex.x,y:a.ystar}},extractMin:function(){return f.list.shift()}};d.init(),c.bottomSite=c.list.shift();var g=c.list.shift(),h,i,j,k,l,m,n,o,p,q,r,s,t;for(;;){f.empty()||(h=f.min());if(g&&(f.empty()||g.y<h.y||g.y==h.y&&g.x<h.x))i=d.leftBound(g),j=d.right(i),n=d.rightRegion(i),s=e.bisect(n,g),m=d.createHalfEdge(s,"l"),d.insert(i,m),q=e.intersect
(i,m),q&&(f.del(i),f.insert(i,q,e.distance(q,g))),i=m,m=d.createHalfEdge(s,"r"),d.insert(i,m),q=e.intersect(m,j),q&&f.insert(m,q,e.distance(q,g)),g=c.list.shift();else if(!f.empty())i=f.extractMin(),k=d.left(i),j=d.right(i),l=d.right(j),n=d.leftRegion(i),o=d.rightRegion(j),r=i.vertex,e.endPoint(i.edge,i.side,r),e.endPoint(j.edge,j.side,r),d.del(i),f.del(j),d.del(j),t="l",n.y>o.y&&(p=n,n=o,o=p,t="r"),s=e.bisect(n,o),m=d.createHalfEdge(s,t),d.insert(k,m),e.endPoint(s,fE[t],r),q=e.intersect(k,m),q&&(f.del(k),f.insert(k,q,e.distance(q,n))),q=e.intersect(m,l),q&&f.insert(m,q,e.distance(q,n));else break}for(i=d.right(d.leftEnd);i!=d.rightEnd;i=d.right(i))b(i.edge)}function fG(){return{leaf:!0,nodes:[],point:null}}function fH(a,b,c,d,e,f){if(!a(b,c,d,e,f)){var g=(c+e)*.5,h=(d+f)*.5,i=b.nodes;i[0]&&fH(a,i[0],c,d,g,h),i[1]&&fH(a,i[1],g,d,e,h),i[2]&&fH(a,i[2],c,h,g,f),i[3]&&fH(a,i[3],g,h,e,f)}}function fI(a){return{x:a[0],y:a[1]}}function fL(){this._=new Date(arguments.length>1?Date.UTC.apply(this,arguments):arguments[0])}function fU(a){return a.substring(0,3)}function fV(a,b,c,d){var e,f,g=0,h=b.length,i=c.length;while(g<h){if(d>=i)return-1;e=b.charCodeAt(g++);if(e==37){f=gh[b.charAt(g++)];if(!f||(d=f(a,c,d))<0)return-1}else if(e!=c.charCodeAt(d++))return-1}return d}function fW(a){return new RegExp("^(?:"+a.map(d3.requote).join("|")+")","i")}function fX(a){var b=new j,c=-1,d=a.length;while(++c<d)b.set(a[c].toLowerCase(),c);return b}function gi(a,b,c){gb.lastIndex=0;var d=gb.exec(b.substring(c));return d?c+=d[0].length:-1}function gj(a,b,c){ga.lastIndex=0;var d=ga.exec(b.substring(c));return d?c+=d[0].length:-1}function gk(a,b,c){ge.lastIndex=0;var d=ge.exec(b.substring(c));return d?(a.m=gf.get(d[0].toLowerCase()),c+=d[0].length):-1}function gl(a,b,c){gc.lastIndex=0;var d=gc.exec(b.substring(c));return d?(a.m=gd.get(d[0].toLowerCase()),c+=d[0].length):-1}function gm(a,b,c){return fV(a,gg.c.toString(),b,c)}function gn(a,b,c){return fV(a,gg.x.toString(),b,c)}function go(a,b,c){return fV(a,gg.X.toString(),b,c)}function gp(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+4));return d?(a.y=+d[0],c+=d[0].length):-1}function gq(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+2));return d?(a.y=gr(+d[0]),c+=d[0].length):-1}function gr(a){return a+(a>68?1900:2e3)}function gs(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+2));return d?(a.m=d[0]-1,c+=d[0].length):-1}function gt(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+2));return d?(a.d=+d[0],c+=d[0].length):-1}function gu(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+2));return d?(a.H=+d[0],c+=d[0].length):-1}function gv(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+2));return d?(a.M=+d[0],c+=d[0].length):-1}function gw(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+2));return d?(a.S=+d[0],c+=d[0].length):-1}function gx(a,b,c){gy.lastIndex=0;var d=gy.exec(b.substring(c,c+3));return d?(a.L=+d[0],c+=d[0].length):-1}function gz(a,b,c){var d=gA.get(b.substring(c,c+=2).toLowerCase());return d==null?-1:(a.p=d,c)}function gB(a){var b=a.getTimezoneOffset(),c=b>0?"-":"+",d=~~(Math.abs(b)/60),e=Math.abs(b)%60;return c+fY(d)+fY(e)}function gD(a){return a.toISOString()}function gE(a,b,c){function d(b){var c=a(b),d=f(c,1);return b-c<d-b?c:d}function e(c){return b(c=a(new fJ(c-1)),1),c}function f(a,c){return b(a=new fJ(+a),c),a}function g(a,d,f){var g=e(a),h=[];if(f>1)while(g<d)c(g)%f||h.push(new Date(+g)),b(g,1);else while(g<d)h.push(new Date(+g)),b(g,1);return h}function h(a,b,c){try{fJ=fL;var d=new fL;return d._=a,g(d,b,c)}finally{fJ=Date}}a.floor=a,a.round=d,a.ceil=e,a.offset=f,a.range=g;var i=a.utc=gF(a);return i.floor=i,i.round=gF(d),i.ceil=gF(e),i.offset=gF(f),i.range=h,a}function gF(a){return function(b,c){try{fJ=fL;var d=new fL;return d._=b,a(d,c)._}finally{fJ=Date}}}function gG(a,b,c){function d(b){return a(b)}return d.invert=function(b){return gI(a.invert(b))},d.domain=function(b){return arguments.length?(a.domain(b),d):a.domain().map(gI)},d.nice=function(a){return d.domain(cD(d.domain(),function(){return a}))},d.ticks=function(c,e){var f=gH(d.domain());if(typeof c!="function"){var g=f[1]-f[0],h=g/c,i=d3.bisect(gM,h);if(i==gM.length)return b.year(f,c);if(!i)return a.ticks(c).map(gI);Math.log(h/gM[i-1])<Math.log(gM[i]/h)&&--i,c=b[i],e=c[1],c=c[0].range}return c(f[0],new Date(+f[1]+1),e)},d.tickFormat=function(){return c},d.copy=function(){return gG(a.copy(),b,c)},d3.rebind(d,a,"range","rangeRound","interpolate","clamp")}function gH(a){var b=a[0],c=a[a.length-1];return b<c?[b,c]:[c,b]}function gI(a){return new Date(a)}function gJ(a){return function(b){var c=a.length-1,d=a[c];while(!d[1](b))d=a[--c];return d[0](b)}}function gK(a){var b=new Date(a,0,1);return b.setFullYear(a),b}function gL(a){var b=a.getFullYear(),c=gK(b),d=gK(b+1);return b+(a-c)/(d-c)}function gU(a){var b=new Date(Date.UTC(a,0,1));return b.setUTCFullYear(a),b}function gV(a){var b=a.getUTCFullYear(),c=gU(b),d=gU(b+1);return b+(a-c)/(d-c)}Date.now||(Date.now=function(){return+(new Date)});try{document.createElement("div").style.setProperty("opacity",0,"")}catch(a){var b=CSSStyleDeclaration.prototype,c=b.setProperty;b.setProperty=function(a,b,d){c.call(this,a,b+"",d)}}d3={version:"2.10.0"};var e=g;try{e(document.documentElement.childNodes)[0].nodeType}catch(h){e=f}var i=[].__proto__?function(a,b){a.__proto__=b}:function(a,b){for(var c in b)a[c]=b[c]};d3.map=function(a){var b=new j;for(var c in a)b.set(c,a[c]);return b},d(j,{has:function(a){return k+a in this},get:function(a){return this[k+a]},set:function(a,b){return this[k+a]=b},remove:function(a){return a=k+a,a in this&&delete this[a]},keys:function(){var a=[];return this.forEach(function(b){a.push(b)}),a},values:function(){var a=[];return this.forEach(function(b,c){a.push(c)}),a},entries:function(){var a=[];return this.forEach(function(b,c){a.push({key:b,value:c})}),a},forEach:function(a){for(var b in this)b.charCodeAt(0)===l&&a.call(this,b.substring(1),this[b])}});var k="\0",l=k.charCodeAt(0);d3.functor=p,d3.rebind=function(a,b){var c=1,d=arguments.length,e;while(++c<d)a[e=arguments[c]]=q(a,b,b[e]);return a},d3.ascending=function(a,b){return a<b?-1:a>b?1:a>=b?0:NaN},d3.descending=function(a,b){return b<a?-1:b>a?1:b>=a?0:NaN},d3.mean=function(a,b){var c=a.length,d,e=0,f=-1,g=0;if(arguments.length===1)while(++f<c)r(d=a[f])&&(e+=(d-e)/++g);else while(++f<c)r(d=b.call(a,a[f],f))&&(e+=(d-e)/++g);return g?e:undefined},d3.median=function(a,b){return arguments.length>1&&(a=a.map(b)),a=a.filter(r),a.length?d3.quantile(a.sort(d3.ascending),.5):undefined},d3.min=function(a,b){var c=-1,d=a.length,e,f;if(arguments.length===1){while(++c<d&&((e=a[c])==null||e!=e))e=undefined;while(++c<d)(f=a[c])!=null&&e>f&&(e=f)}else{while(++c<d&&((e=b.call(a,a[c],c))==null||e!=e))e=undefined;while(++c<d)(f=b.call(a,a[c],c))!=null&&e>f&&(e=f)}return e},d3.max=function(a,b){var c=-1,d=a.length,e,f;if(arguments.length===1){while(++c<d&&((e=a[c])==null||e!=e))e=undefined;while(++c<d)(f=a[c])!=null&&f>e&&(e=f)}else{while(++c<d&&((e=b.call(a,a[c],c))==null||e!=e))e=undefined;while(++c<d)(f=b.call(a,a[c],c))!=null&&f>e&&(e=f)}return e},d3.extent=function(a,b){var c=-1,d=a.length,e,f,g;if(arguments.length===1){while(++c<d&&((e=g=a[c])==null||e!=e))e=g=undefined;while(++c<d)(f=a[c])!=null&&(e>f&&(e=f),g<f&&(g=f))}else{while(++c<d&&((e=g=b.call(a,a[c],c))==null||e!=e))e=undefined;while(++c<d)(f=b.call(a,a[c],c))!=null&&(e>f&&(e=f),g<f&&(g=f))}return[e,g]},d3.random={normal:function(a,b){var c=arguments.length;return c<2&&(b=1),c<1&&(a=0),function(){var c,d,e;do c=Math.random()*2-1,d=Math.random()*2-1,e=c*c+d*d;while(!e||e>1);return a+b*c*Math.sqrt(-2*Math.log(e)/e)}},logNormal:function(a,b){var c=arguments.length;c<2&&(b=1),c<1&&(a=0);var d=d3.random.normal();return function(){return Math.exp(a+b*d())}},irwinHall:function(a){return function(){for(var b=0,c=0;c<a;c++)b+=Math.random();return b/a}}},d3.sum=function(a,b){var c=0,d=a.length,e,f=-1;if(arguments.length===1)while(++f<d)isNaN(e=+a[f])||(c+=e);else while(++f<d)isNaN(e=+b.call(a,a[f],f))||(c+=e);return c},d3.quantile=function(a,b){var c=(a.length-1)*b+1,d=Math.floor(c),e=a[d-1],f=c-d;return f?e+f*(a[d]-e):e},d3.transpose=function(a){return d3.zip.apply(d3,a)},d3.zip=function(){if(!(e=arguments.length))return[];for(var a=-1,b=d3.min(arguments,s),c=new Array(b);++a<b;)for(var d=-1,e,f=c[a]=new Array(e);++d<e;)f[d]=arguments[d][a];return c},d3.bisector=function(a){return{left:function(b,c,d,e){arguments.length<3&&(d=0),arguments.length<4&&(e=b.length);while(d<e){var f=d+e>>>1;a.call(b,b[f],f)<c?d=f+1:e=f}return d},right:function(b,c,d,e){arguments.length<3&&(d=0),arguments.length<4&&(e=b.length);while(d<e){var f=d+e>>>1;c<a.call(b,b[f],f)?e=f:d=f+1}return d}}};var t=d3.bisector(function(a){return a});d3.bisectLeft=t.left,d3.bisect=d3.bisectRight=t.right,d3.first=function(a,b){var c=0,d=a.length,e=a[0],f;arguments.length===1&&(b=d3.ascending);while(++c<d)b.call(a,e,f=a[c])>0&&(e=f);return e},d3.last=function(a,b){var c=0,d=a.length,e=a[0],f;arguments.length===1&&(b=d3.ascending);while(++c<d)b.call(a,e,f=a[c])<=0&&(e=f);return e},d3.nest=function(){function f(c,g){if(g>=b.length)return e?e.call(a,c):d?c.sort(d):c;var h=-1,i=c.length,k=b[g++],l,m,n=new j,o,p={};while(++h<i)(o=n.get(l=k(m=c[h])))?o.push(m):n.set(l,[m]);return n.forEach(function(a){p[a]=f(n.get(a),g)}),p}function g(a,d){if(d>=b.length)return a;var e=[],f=c[d++],h;for(h in a)e.push({key:h,values:g(a[h],d)});return f&&e.sort(function(a,b){return f(a.key,b.key)}),e}var a={},b=[],c=[],d,e;return a.map=function(a){return f(a,0)},a.entries=function(a){return g(f(a,0),0)},a.key=function(c){return b.push(c),a},a.sortKeys=function(d){return c[b.length-1]=d,a},a.sortValues=function(b){return d=b,a},a.rollup=function(b){return e=b,a},a},d3.keys=function(a){var b=[];for(var c in a)b.push(c);return b},d3.values=function(a){var b=[];for(var c in a)b.push(a[c]);return b},d3.entries=function(a){var b=[];for(var c in a)b.push({key:c,value:a[c]});return b},d3.permute=function(a,b){var c=[],d=-1,e=b.length;while(++d<e)c[d]=a[b[d]];return c},d3.merge=function(a){return Array.prototype.concat.apply([],a)},d3.split=function(a,b){var c=[],d=[],e,f=-1,g=a.length;arguments.length<2&&(b=u);while(++f<g)b.call(d,e=a[f],f)?d=[]:(d.length||c.push(d),d.push(e));return c},d3.range=function(a,b,c){arguments.length<3&&(c=1,arguments.length<2&&(b=a,a=0));if((b-a)/c===Infinity)throw new Error("infinite range");var d=[],e=w(Math.abs(c)),f=-1,g;a*=e,b*=e,c*=e;if(c<0)while((g=a+c*++f)>b)d.push(g/e);else while((g=a+c*++f)<b)d.push(g/e);return d},d3.requote=function(a){return a.replace(x,"\\$&")};var x=/[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;d3.round=function(a,b){return b?Math.round(a*(b=Math.pow(10,b)))/b:Math.round(a)},d3.xhr=function(a,b,c){var d=new XMLHttpRequest;arguments.length<3?(c=b,b=null):b&&d.overrideMimeType&&d.overrideMimeType(b),d.open("GET",a,!0),b&&d.setRequestHeader("Accept",b),d.onreadystatechange=function(){if(d.readyState===4){var a=d.status;c(!a&&d.response||a>=200&&a<300||a===304?d:null)}},d.send(null)},d3.text=function(a,b,c){function d(a){c(a&&a.responseText)}arguments.length<3&&(c=b,b=null),d3.xhr(a,b,d)},d3.json=function(a,b){d3.text(a,"application/json",function(a){b(a?JSON.parse(a):null)})},d3.html=function(a,b){d3.text(a,"text/html",function(a){if(a!=null){var c=document.createRange();c.selectNode(document.body),a=c.createContextualFragment(a)}b(a)})},d3.xml=function(a,b,c){function d(a){c(a&&a.responseXML)}arguments.length<3&&(c=b,b=null),d3.xhr(a,b,d)};var y={svg:"http://www.w3.org/2000/svg",xhtml:"http://www.w3.org/1999/xhtml",xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};d3.ns={prefix:y,qualify:function(a){var b=a.indexOf(":"),c=a;return b>=0&&(c=a.substring(0,b),a=a.substring(b+1)),y.hasOwnProperty(c)?{space:y[c],local:a}:a}},d3.dispatch=function(){var a=new z,b=-1,c=arguments.length;while(++b<c)a[arguments[b]]=A(a);return a},z.prototype.on=function(a,b){var c=a.indexOf("."),d="";return c>0&&(d=a.substring(c+1),a=a.substring(0,c)),arguments.length<2?this[a].on(d):this[a].on(d,b)},d3.format=function(a){var b=B.exec(a),c=b[1]||" ",d=b[3]||"",e=b[5],f=+b[6],g=b[7],h=b[8],i=b[9],j=1,k="",l=!1;h&&(h=+h.substring(1)),e&&(c="0",g&&(f-=Math.floor((f-1)/4)));switch(i){case"n":g=!0,i="g";break;case"%":j=100,k="%",i="f";break;case"p":j=100,k="%",i="r";break;case"d":l=!0,h=0;break;case"s":j=-1,i="r"}return i=="r"&&!h&&(i="g"),i=C.get(i)||E,function(a){if(l&&a%1)return"";var b=a<0&&(a=-a)?"-":d;if(j<0){var m=d3.formatPrefix(a,h);a=m.scale(a),k=m.symbol}else a*=j;a=i(a,h);if(e){var n=a.length+b.length;n<f&&(a=(new Array(f-n+1)).join(c)+a),g&&(a=F(a)),a=b+a}else{g&&(a=F(a)),a=b+a;var n=a.length;n<f&&(a=(new Array(f-n+1)).join(c)+a)}return a+k}};var B=/(?:([^{])?([<>=^]))?([+\- ])?(#)?(0)?([0-9]+)?(,)?(\.[0-9]+)?([a-zA-Z%])?/,C=d3.map({g:function(a,b){return a.toPrecision(b)},e:function(a,b){return a.toExponential(b)},f:function(a,b){return a.toFixed(b)},r:function(a,b){return d3.round(a,b=D(a,b)).toFixed(Math.max(0,Math.min(20,b)))}}),G=["y","z","a","f","p","n","μ","m","","k","M","G","T","P","E","Z","Y"].map(H);d3.formatPrefix=function(a,b){var c=0;return a&&(a<0&&(a*=-1),b&&(a=d3.round(a,D(a,b))),c=1+Math.floor(1e-12+Math.log(a)/Math.LN10),c=Math.max(-24,Math.min(24,Math.floor((c<=0?c+1:c-1)/3)*3))),G[8+c/3]};var I=R(2),J=R(3),K=function(){return Q},L=d3.map({linear:K,poly:R,quad:function(){return I},cubic:function(){return J},sin:function(){return S},exp:function(){return T},circle:function(){return U},elastic:V,back:W,bounce:function(){return X}}),M=d3.map({"in":Q,out:O,"in-out":P,"out-in":function(a){return P(O(a))}});d3.ease=function(a){var b=a.indexOf("-"),c=b>=0?a.substring(0,b):a,d=b>=0?a.substring(b+1):"in";return c=L.get(c)||K,d=M.get(d)||Q,N(d(c.apply(null,Array.prototype.slice.call(arguments,1))))},d3.event=null,d3.transform=function(a){var b=document.createElementNS(d3.ns.prefix.svg,"g");return(d3.transform=function(a){b.setAttribute("transform",a);var c=b.transform.baseVal.consolidate();return new _(c?c.matrix:be)})(a)},_.prototype.toString=function(){return"translate("+this.translate+")rotate("+this.rotate+")skewX("+this.skew+")scale("+this.scale+")"};var bd=180/Math.PI,be={a:1,b:0,c:0,d:1,e:0,f:0};d3.interpolate=function(a,b){var c=d3.interpolators.length,d;while(--c>=0&&!(d=d3.interpolators[c](a,b)));return d},d3.interpolateNumber=function(a,b){return b-=a,function(c){return a+b*c}},d3.interpolateRound=function(a,b){return b-=a,function(c){return Math.round(a+b*c)}},d3.interpolateString=function(a,b){var c,d,e,f=0,g=0,h=[],i=[],j,k;bf.lastIndex=0;for(d=0;c=bf.exec(b);++d)c.index&&h.push(b.substring(f,g=c.index)),i.push({i:h.length,x:c[0]}),h.push(null),f=bf.lastIndex;f<b.length&&h.push(b.substring(f));for(d=0,j=i.length;(c=bf.exec(a))&&d<j;++d){k=i[d];if(k.x==c[0]){if(k.i)if(h[k.i+1]==null){h[k.i-1]+=k.x,h.splice(k.i,1);for(e=d+1;e<j;++e)i[e].i--}else{h[k.i-1]+=k.x+h[k.i+1],h.splice(k.i,2);for(e=d+1;e<j;++e)i[e].i-=2}else if(h[k.i+1]==null)h[k.i]=k.x;else{h[k.i]=k.x+h[k.i+1],h.splice(k.i+1,1);for(e=d+1;e<j;++e)i[e].i--}i.splice(d,1),j--,d--}else k.x=d3.interpolateNumber(parseFloat(c[0]),parseFloat(k.x))}while(d<j)k=i.pop(),h[k.i+1]==null?h[k.i]=k.x:(h[k.i]=k.x+h[k.i+1],h.splice(k.i+1,1)),j--;return h.length===1?h[0]==null?i[0].x:function(){return b}:function(a){for(d=0;d<j;++d)h[(k=i[d]).i]=k.x(a);return h.join("")}},d3.interpolateTransform=function(a,b){var c=[],d=[],e,f=d3.transform(a),g=d3.transform(b),h=f.translate,i=g.translate,j=f.rotate,k=g.rotate,l=f.skew,m=g.skew,n=f.scale,o=g.scale;return h[0]!=i[0]||h[1]!=i[1]?(c.push("translate(",null,",",null,")"),d.push({i:1,x:d3.interpolateNumber(h[0],i[0])},{i:3,x:d3.interpolateNumber(h[1],i[1])})):i[0]||i[1]?c.push("translate("+i+")"):c.push(""),j!=k?(j-k>180?k+=360:k-j>180&&(j+=360),d.push({i:c.push(c.pop()+"rotate(",null,")")-2,x:d3.interpolateNumber(j,k)})):k&&c.push(c.pop()+"rotate("+k+")"),l!=m?d.push({i:c.push(c.pop()+"skewX(",null,")")-2,x:d3.interpolateNumber(l,m)}):m&&c.push(c.pop()+"skewX("+m+")"),n[0]!=o[0]||n[1]!=o[1]?(e=c.push(c.pop()+"scale(",null,",",null,")"),d.push({i:e-4,x:d3.interpolateNumber(n[0],o[0])},{i:e-2,x:d3.interpolateNumber(n[1],o[1])})):(o[0]!=1||o[1]!=1)&&c.push(c.pop()+"scale("+o+")"),e=d.length,function(a){var b=-1,f;while(++b<e)c[(f=d[b]).i]=f.x(a);return c.join("")}},d3.interpolateRgb=function(a,b){a=d3.rgb(a),b=d3.rgb(b);var c=a.r,d=a.g,e=a.b,f=b.r-c,g=b.g-d,h=b.b-e;return function(a){return"#"+bl(Math.round(c+f*a))+bl(Math.round(d+g*a))+bl(Math.round(e+h*a))}},d3.interpolateHsl=function(a,b){a=d3.hsl(a),b=d3.hsl(b);var c=a.h,d=a.s,e=a.l,f=b.h-c,g=b.s-d,h=b.l-e;return f>180?f-=360:f<-180&&(f+=360),function(a){return bu(c+f*a,d+g*a,e+h*a)+""}},d3.interpolateLab=function(a,b){a=d3.lab(a),b=d3.lab(b);var c=a.l,d=a.a,e=a.b,f=b.l-c,g=b.a-d,h=b.b-e;return function(a){return bE(c+f*a,d+g*a,e+h*a)+""}},d3.interpolateHcl=function(a,b){a=d3.hcl(a),b=d3.hcl(b);var c=a.h,d=a.c,e=a.l,f=b.h-c,g=b.c-d,h=b.l-e;return f>180?f-=360:f<-180&&(f+=360),function(a){return bx(c+f*a,d+g*a,e+h*a)+""}},d3.interpolateArray=function(a,b){var c=[],d=[],e=a.length,f=b.length,g=Math.min(a.length,b.length),h;for(h=0;h<g;++h)c.push(d3.interpolate(a[h],b[h]));for(;h<e;++h)d[h]=a[h];for(;h<f;++h)d[h]=b[h];return function(a){for(h=0;h<g;++h)d[h]=c[h](a);return d}},d3.interpolateObject=function(a,b){var c={},d={},e;for(e in a)e in b?c[e]=bg(e)(a[e],b[e]):d[e]=a[e];for(e in b)e in a||(d[e]=b[e]);return function(a){for(e in c)d[e]=c[e](a);return d}};var bf=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;d3.interpolators=[d3.interpolateObject,function(a,b){return b instanceof Array&&d3.interpolateArray(a,b)},function(a,b){return(typeof a=="string"||typeof b=="string")&&d3.interpolateString(a+"",b+"")},function(a,b){return(typeof b=="string"?br.has(b)||/^(#|rgb\(|hsl\()/.test(b):b instanceof bk||b instanceof bt)&&d3.interpolateRgb(a,b)},function(a,b){return!isNaN(a=+a)&&!isNaN(b=+b)&&d3.interpolateNumber(a,b)}],d3.rgb=function(a,b,c){return arguments.length===1?a instanceof bk?bj(a.r,a.g,a.b):bm(""+a,bj,bu):bj(~~a,~~b,~~c)},bk.prototype.brighter=function(a){a=Math.pow(.7,arguments.length?a:1);var b=this.r,c=this.g,d=this.b,e=30;return!b&&!c&&!d?bj(e,e,e):(b&&b<e&&(b=e),c&&c<e&&(c=e),d&&d<e&&(d=e),bj(Math.min(255,Math.floor(b/a)),Math.min(255,Math.floor(c/a)),Math.min(255,Math.floor(d/a))))},bk.prototype.darker=function(a){return a=Math.pow(.7,arguments.length?a:1),bj(Math.floor(a*this.r),Math.floor(a*this.g),Math.floor(a*this.b))},bk.prototype.hsl=function(){return bn(this.r,this.g,this.b)},bk.prototype.toString=function(){return"#"+bl(this.r)+bl(this.g)+bl(this.b)};var br=d3.map({aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkgrey:"#a9a9a9",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dimgrey:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gray:"#808080",green:"#008000",greenyellow:"#adff2f",grey:"#808080",honeydew:"#f0fff0",hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavender:"#e6e6fa",lavenderblush:"#fff0f5",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgray:"#d3d3d3",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightslategrey:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370db",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#db7093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",slategrey:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32"});br.forEach(function(a,b){br.set(a,bm(b,bj,bu))}),d3.hsl=function(a,b,c){return arguments.length===1?a instanceof bt?bs(a.h,a.s,a.l):bm(""+a,bn,bs):bs(+a,+b,+c)},bt.prototype.brighter=function(a){return a=Math.pow(.7,arguments.length?a:1),bs(this.h,this.s,this.l/a)},bt.prototype.darker=function(a){return a=Math.pow(.7,arguments.length?a:1),bs(this.h,this.s,a*this.l)},bt.prototype.rgb=function(){return bu(this.h,this.s,this.l)},bt.prototype.toString=function(){return this.rgb().toString()},d3.hcl=function(a,b,c){return arguments.length===1?a instanceof bw?bv(a.h,a.c,a.l):a instanceof bz?bF(a.l,a.a,a.b):bF((a=bo((a=d3.rgb(a)).r,a.g,a.b)).l,a.a,a.b):bv(+a,+b,+c)},bw.prototype.brighter=function(a){return bv(this.h,this.c,Math.min(100,this.l+bA*(arguments.length?a:1)))},bw.prototype.darker=function(a){return bv(this.h,this.c,Math.max(0,this.l-bA*(arguments.length?a:1)))},bw.prototype.rgb=function(){return bx(this.h,this.c,this.l).rgb()},bw.prototype.toString=function(){return this.rgb()+""},d3.lab=function(a,b,c){return arguments.length===1?a instanceof bz?by(a.l,a.a,a.b):a instanceof bw?bx(a.l,a.c,a.h):bo((a=d3.rgb(a)).r,a.g,a.b):by(+a,+b,+c)};var bA=18,bB=.95047,bC=1,bD=1.08883;bz.prototype.brighter=function(a){return by(Math.min(100,this.l+bA*(arguments.length?a:1)),this.a,this.b)},bz.prototype.darker=function(a){return by(Math.max(0,this.l-bA*(arguments.length?a:1)),this.a,this.b)},bz.prototype.rgb=function(){return bE(this.l,this.a,this.b)},bz.prototype.toString=function(){return this.rgb()+""};var bK=function(a,b){return b.querySelector(a)},bL=function(a,b){return b.querySelectorAll(a)},bM=document.documentElement,bN=bM.matchesSelector||bM.webkitMatchesSelector||bM.mozMatchesSelector||bM.msMatchesSelector||bM.oMatchesSelector,bO=function(a,b){return bN.call(a,b)};typeof Sizzle=="function"&&(bK=function(a,b){return Sizzle(a,b)[0]||null},bL=function(a,b){return Sizzle.uniqueSort(Sizzle(a,b))},bO=Sizzle.matchesSelector);var bP=[];d3.selection=function(){return cb},d3.selection.prototype=bP,bP.select=function(a){var b=[],c,d,e,f;typeof a!="function"&&(a=bQ(a));for(var g=-1,h=this.length;++g<h;){b.push(c=[]),c.parentNode=(e=this[g]).parentNode;for(var i=-1,j=e.length;++i<j;)(f=e[i])?(c.push(d=a.call(f,f.__data__,i)),d&&"__data__"in f&&(d.__data__=f.__data__)):c.push(null)}return bJ(b)},bP.selectAll=function(a){var b=[],c,d;typeof a!="function"&&(a=bR(a));for(var f=-1,g=this.length;++f<g;)for(var h=this[f],i=-1,j=h.length;++i<j;)if(d=h[i])b.push(c=e(a.call(d,d.__data__,i))),c.parentNode=d;return bJ(b)},bP.attr=function(a,b){if(arguments.length<2){if(typeof a=="string"){var c=this.node();return a=d3.ns.qualify(a),a.local?c.getAttributeNS(a.space,a.local):c.getAttribute(a)}for(b in a)this.each(bS(b,a[b]));return this}return this.each(bS(a,b))},bP.classed=function(a,b){if(arguments.length<2){if(typeof a=="string"){var c=this.node(),d=(a=a.trim().split(/^|\s+/g)).length,e=-1;if(b=c.classList){while(++e<d)if(!b.contains(a[e]))return!1}else{b=c.className,b.baseVal!=null&&(b=b.baseVal);while(++e<d)if(!bT(a[e]).test(b))return!1}return!0}for(b in a)this.each(bU(b,a[b]));return this}return this.each(bU(a,b))},bP.style=function(a,b,c){var d=arguments.length;if(d<3){if(typeof a!="string"){d<2&&(b="");for(c in a)this.each(bW(c,a[c],b));return this}if(d<2)return window.getComputedStyle(this.node(),null).getPropertyValue(a);c=""}return this.each(bW(a,b,c))},bP.property=function(a,b){if(arguments.length<2){if(typeof a=="string")return this.node()[a];for(b in a)this.each(bX(b,a[b]));return this}return this.each(bX(a,b))},bP.text=function(a){return arguments.length<1?this.node().textContent:this.each(typeof a=="function"?function(){var b=a.apply(this,arguments);this.textContent=b==null?"":b}:a==null?function(){this.textContent=""}:function(){this.textContent=a})},bP.html=function(a){return arguments.length<1?this.node().innerHTML:this.each(typeof a=="function"?function(){var b=a.apply(this,arguments);this.innerHTML=b==null?"":b}:a==null?function(){this.innerHTML=""}:function(){this.innerHTML=a})},bP.append=function(a){function b(){return this.appendChild(document.createElementNS(this.namespaceURI,a))}function c(){return this.appendChild(document.createElementNS(a.space,a.local))}return a=d3.ns.qualify(a),this.select(a.local?c:b)},bP.insert=function(a,b){function c(){return this.insertBefore(document.createElementNS(this.namespaceURI,a),bK(b,this))}function d(){return this.insertBefore(document.createElementNS(a.space,a.local),bK(b,this))}return a=d3.ns.qualify(a),this.select(a.local?d:c)},bP.remove=function(){return this.each(function(){var a=this.parentNode;a&&a.removeChild(this)})},bP.data=function(a,b){function g(a,c){var d,e=a.length,f=c.length,g=Math.min(e,f),l=Math.max(e,f),m=[],n=[],o=[],p,q;if(b){var r=new j,s=[],t,u=c.length;for(d=-1;++d<e;)t=b.call(p=a[d],p.__data__,d),r.has(t)?o[u++]=p:r.set(t,p),s.push(t);for(d=-1;++d<f;)t=b.call(c,q=c[d],d),r.has(t)?(m[d]=p=r.get(t),p.__data__=q,n[d]=o[d]=null):(n[d]=bY(q),m[d]=o[d]=null),r.remove(t);for(d=-1;++d<e;)r.has(s[d])&&(o[d]=a[d])}else{for(d=-1;++d<g;)p=a[d],q=c[d],p?(p.__data__=q,m[d]=p,n[d]=o[d]=null):(n[d]=bY(q),m[d]=o[d]=null);for(;d<f;++d)n[d]=bY(c[d]),m[d]=o[d]=null;for(;d<l;++d)o[d]=a[d],n[d]=m[d]=null}n.update=m,n.parentNode=m.parentNode=o.parentNode=a.parentNode,h.push(n),i.push(m),k.push(o)}var c=-1,d=this.length,e,f;if(!arguments.length){a=new Array(d=(e=this[0]).length);while(++c<d)if(f=e[c])a[c]=f.__data__;return a}var h=cc([]),i=bJ([]),k=bJ([]);if(typeof a=="function")while(++c<d)g(e=this[c],a.call(e,e.parentNode.__data__,c));else while(++c<d)g(e=this[c],a);return i.enter=function(){return h},i.exit=function(){return k},i},bP.datum=bP.map=function(a){return arguments.length<1?this.property("__data__"):this.property("__data__",a)},bP.filter=function(a){var b=[],c,d,e;typeof a!="function"&&(a=bZ(a));for(var f=0,g=this.length;f<g;f++){b.push(c=[]),c.parentNode=(d=this[f]).parentNode;for(var h=0,i=d.length;h<i;h++)(e=d[h])&&a.call(e,e.__data__,h)&&c.push(e)}return bJ(b)},bP.order=function(){for(var a=-1,b=this.length;++a<b;)for(var c=this[a],d=c.length-1,e=c[d],f;--d>=0;)if(f=c[d])e&&e!==f.nextSibling&&e.parentNode.insertBefore(f,e),e=f;return this},bP.sort=function(a){a=b$.apply(this,arguments);for(var b=-1,c=this.length;++b<c;)this[b].sort(a);return this.order()},bP.on=function(a,b,c){var d=arguments.length;if(d<3){if(typeof a!="string"){d<2&&(b=!1);for(c in a)this.each(b_(c,a[c],b));return this}if(d<2)return(d=this.node()["__on"+a])&&d._;c=!1}return this.each(b_(a,b,c))},bP.each=function(a){return ca(this,function(b,c,d){a.call(b,b.__data__,c,d)})},bP.call=function(a){return a.apply(this,(arguments[0]=this,arguments)),this},bP.empty=function(){return!this.node()},bP.node=function(a){for(var b=0,c=this.length;b<c;b++)for(var d=this[b],e=0,f=d.length;e<f;e++){var g=d[e];if(g)return g}return null},bP.transition=function(){var a=[],b,c;for(var d=-1,e=this.length;++d<e;){a.push(b=[]);for(var f=this[d],g=-1,h=f.length;++g<h;)b.push((c=f[g])?{node:c,delay:cl,duration:cm}:null)}return ce(a,ch||++cg,Date.now())};var cb=bJ([[document]]);cb[0].parentNode=bM,d3.select=function(a){return typeof a=="string"?cb.select(a):bJ([[a]])},d3.selectAll=function(a){return typeof a=="string"?cb.selectAll(a):bJ([e(a)])};var cd=[];d3.selection.enter=cc,d3.selection.enter.prototype=cd,cd.append=bP.append,cd.insert=bP.insert,cd.empty=bP.empty,cd.node=bP.node,cd.select=function(a){var b=[],c,d,e,f,g;for(var h=-1,i=this.length;++h<i;){e=(f=this[h]).update,b.push(c=[]),c.parentNode=f.parentNode;for(var j=-1,k=f.length;++j<k;)(g=f[j])?(c.push(e[j]=d=a.call(f.parentNode,g.__data__,j)),d.__data__=g.__data__):c.push(null)}return bJ(b)};var cf=[],cg=0,ch=0,ci=0,cj=250,ck=d3.ease("cubic-in-out"),cl=ci,cm=cj,cn=ck;cf.call=bP.call,d3.transition=function(a){return arguments.length?ch?a.transition():a:cb.transition()},d3.transition.prototype=cf,cf.select=function(a){var b=[],c,d,e;typeof a!="function"&&(a=bQ(a));for(var f=-1,g=this.length;++f<g;){b.push(c=[]);for(var h=this[f],i=-1,j=h.length;++i<j;)(e=h[i])&&(d=a.call(e.node,e.node.__data__,i))?("__data__"in e.node&&(d.__data__=e.node.__data__),c.push({node:d,delay:e.delay,duration:e.duration})):c.push(null)}return ce(b,this.id,this.time).ease(this.ease())},cf.selectAll=function(a){var b=[],c,d,e;typeof a!="function"&&(a=bR(a));for(var f=-1,g=this.length;++f<g;)for(var h=this[f],i=-1,j=h.length;++i<j;)if(e=h[i]){d=a.call(e.node,e.node.__data__,i),b.push(c=[]);for(var k=-1,l=d.length;++k<l;)c.push({node:d[k],delay:e.delay,duration:e.duration})}return ce(b,this.id,this.time).ease(this.ease())},cf.filter=function(a){var b=[],c,d,e;typeof a!="function"&&(a=bZ(a));for(var f=0,g=this.length;f<g;f++){b.push(c=[]);for(var d=this[f],h=0,i=d.length;h<i;h++)(e=d[h])&&a.call(e.node,e.node.__data__,h)&&c.push(e)}return ce(b,this.id,this.time).ease(this.ease())},cf.attr=function(a,b){if(arguments.length<2){for(b in a)this.attrTween(b,cr(a[b],b));return this}return this.attrTween(a,cr(b,a))},cf.attrTween=function(a,b){function d(a,d){var e=b.call(this,a,d,this.getAttribute(c));return e===cp?(this.removeAttribute(c),null):e&&function(a){this.setAttribute(c,e(a))}}function e(a,d){var e=b.call(this,a,d,this.getAttributeNS(c.space,c.local));return e===cp?(this.removeAttributeNS(c.space,c.local),null):e&&function(a){this.setAttributeNS(c.space,c.local,e(a))}}var c=d3.ns.qualify(a);return this.tween("attr."+a,c.local?e:d)},cf.style=function(a,b,c){var d=arguments.length;if(d<3){if(typeof a!="string"){d<2&&(b="");for(c in a)this.styleTween(c,cr(a[c],c),b);return this}c=""}return this.styleTween(a,cr(b,a),c)},cf.styleTween=function(a,b,c){return arguments.length<3&&(c=""),this.tween("style."+a,function(d,e){var f=b.call(this,d,e,window.getComputedStyle(this,null).getPropertyValue(a));return f===cp?(this.style.removeProperty(a),null):f&&function(b){this.style.setProperty(a,f(b),c)}})},cf.text=function(a){return this.tween("text",function(b,c){this.textContent=typeof a=="function"?a.call(this,b,c):a})},cf.remove=function(){return this.each("end.transition",function(){var a;!this.__transition__&&(a=this.parentNode)&&a.removeChild(this)})},cf.delay=function(a){return ca(this,typeof a=="function"?function(b,c,d){b.delay=a.call(b=b.node,b.__data__,c,d)|0}:(a|=0,function(b){b.delay=a}))},cf.duration=function(a){return ca(this,typeof a=="function"?function(b,c,d){b.duration=Math.max(1,a.call(b=b.node,b.__data__,c,d)|0)}:(a=Math.max(1,a|0),function(b){b.duration=a}))},cf.transition=function(){return this.select(n)},d3.tween=function(a,b){function c(c,d,e){var f=a.call(this,c,d);return f==null?e!=""&&cp:e!=f&&b(e,f)}function d(c,d,e){return e!=a&&b(e,a)}return typeof a=="function"?c:a==null?cq:(a+="",d)};var cp={},cs=null,ct,cu;d3.timer=function(a,b,c){var d=!1,e,f=cs;if(arguments.length<3){if(arguments.length<2)b=0;else if(!isFinite(b))return;c=Date.now()}while(f){if(f.callback===a){f.then=c,f.delay=b,d=!0;break}e=f,f=f.next}d||(cs={callback:a,then:c,delay:b,next:cs}),ct||(cu=clearTimeout(cu),ct=1,cx(cv))},d3.timer.flush=function(){var a,b=Date.now(),c=cs;while(c)a=b-c.then,c.delay||(c.flush=c.callback
(a)),c=c.next;cw()};var cx=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){setTimeout(a,17)};d3.mouse=function(a){return cz(a,Z())};var cy=/WebKit/.test(navigator.userAgent)?-1:0;d3.touches=function(a,b){return arguments.length<2&&(b=Z().touches),b?e(b).map(function(b){var c=cz(a,b);return c.identifier=b.identifier,c}):[]},d3.scale={},d3.scale.linear=function(){return cF([0,1],[0,1],d3.interpolate,!1)},d3.scale.log=function(){return cN(d3.scale.linear(),cP)};var cO=d3.format(".0e");cP.pow=function(a){return Math.pow(10,a)},cQ.pow=function(a){return-Math.pow(10,-a)},d3.scale.pow=function(){return cR(d3.scale.linear(),1)},d3.scale.sqrt=function(){return d3.scale.pow().exponent(.5)},d3.scale.ordinal=function(){return cT([],{t:"range",a:[[]]})},d3.scale.category10=function(){return d3.scale.ordinal().range(cU)},d3.scale.category20=function(){return d3.scale.ordinal().range(cV)},d3.scale.category20b=function(){return d3.scale.ordinal().range(cW)},d3.scale.category20c=function(){return d3.scale.ordinal().range(cX)};var cU=["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],cV=["#1f77b4","#aec7e8","#ff7f0e","#ffbb78","#2ca02c","#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5","#8c564b","#c49c94","#e377c2","#f7b6d2","#7f7f7f","#c7c7c7","#bcbd22","#dbdb8d","#17becf","#9edae5"],cW=["#393b79","#5254a3","#6b6ecf","#9c9ede","#637939","#8ca252","#b5cf6b","#cedb9c","#8c6d31","#bd9e39","#e7ba52","#e7cb94","#843c39","#ad494a","#d6616b","#e7969c","#7b4173","#a55194","#ce6dbd","#de9ed6"],cX=["#3182bd","#6baed6","#9ecae1","#c6dbef","#e6550d","#fd8d3c","#fdae6b","#fdd0a2","#31a354","#74c476","#a1d99b","#c7e9c0","#756bb1","#9e9ac8","#bcbddc","#dadaeb","#636363","#969696","#bdbdbd","#d9d9d9"];d3.scale.quantile=function(){return cY([],[])},d3.scale.quantize=function(){return cZ(0,1,[0,1])},d3.scale.threshold=function(){return c$([.5],[0,1])},d3.scale.identity=function(){return c_([0,1])},d3.svg={},d3.svg.arc=function(){function e(){var e=a.apply(this,arguments),f=b.apply(this,arguments),g=c.apply(this,arguments)+da,h=d.apply(this,arguments)+da,i=(h<g&&(i=g,g=h,h=i),h-g),j=i<Math.PI?"0":"1",k=Math.cos(g),l=Math.sin(g),m=Math.cos(h),n=Math.sin(h);return i>=db?e?"M0,"+f+"A"+f+","+f+" 0 1,1 0,"+ -f+"A"+f+","+f+" 0 1,1 0,"+f+"M0,"+e+"A"+e+","+e+" 0 1,0 0,"+ -e+"A"+e+","+e+" 0 1,0 0,"+e+"Z":"M0,"+f+"A"+f+","+f+" 0 1,1 0,"+ -f+"A"+f+","+f+" 0 1,1 0,"+f+"Z":e?"M"+f*k+","+f*l+"A"+f+","+f+" 0 "+j+",1 "+f*m+","+f*n+"L"+e*m+","+e*n+"A"+e+","+e+" 0 "+j+",0 "+e*k+","+e*l+"Z":"M"+f*k+","+f*l+"A"+f+","+f+" 0 "+j+",1 "+f*m+","+f*n+"L0,0"+"Z"}var a=dc,b=dd,c=de,d=df;return e.innerRadius=function(b){return arguments.length?(a=p(b),e):a},e.outerRadius=function(a){return arguments.length?(b=p(a),e):b},e.startAngle=function(a){return arguments.length?(c=p(a),e):c},e.endAngle=function(a){return arguments.length?(d=p(a),e):d},e.centroid=function(){var e=(a.apply(this,arguments)+b.apply(this,arguments))/2,f=(c.apply(this,arguments)+d.apply(this,arguments))/2+da;return[Math.cos(f)*e,Math.sin(f)*e]},e};var da=-Math.PI/2,db=2*Math.PI-1e-6;d3.svg.line=function(){return dg(m)};var dj=d3.map({linear:dk,"linear-closed":dl,"step-before":dm,"step-after":dn,basis:du,"basis-open":dv,"basis-closed":dw,bundle:dx,cardinal:dr,"cardinal-open":dp,"cardinal-closed":dq,monotone:dG});dj.forEach(function(a,b){b.key=a,b.closed=/-closed$/.test(a)});var dz=[0,2/3,1/3,0],dA=[0,1/3,2/3,0],dB=[0,1/6,2/3,1/6];d3.svg.line.radial=function(){var a=dg(dH);return a.radius=a.x,delete a.x,a.angle=a.y,delete a.y,a},dm.reverse=dn,dn.reverse=dm,d3.svg.area=function(){return dI(m)},d3.svg.area.radial=function(){var a=dI(dH);return a.radius=a.x,delete a.x,a.innerRadius=a.x0,delete a.x0,a.outerRadius=a.x1,delete a.x1,a.angle=a.y,delete a.y,a.startAngle=a.y0,delete a.y0,a.endAngle=a.y1,delete a.y1,a},d3.svg.chord=function(){function f(c,d){var e=g(this,a,c,d),f=g(this,b,c,d);return"M"+e.p0+i(e.r,e.p1,e.a1-e.a0)+(h(e,f)?j(e.r,e.p1,e.r,e.p0):j(e.r,e.p1,f.r,f.p0)+i(f.r,f.p1,f.a1-f.a0)+j(f.r,f.p1,e.r,e.p0))+"Z"}function g(a,b,f,g){var h=b.call(a,f,g),i=c.call(a,h,g),j=d.call(a,h,g)+da,k=e.call(a,h,g)+da;return{r:i,a0:j,a1:k,p0:[i*Math.cos(j),i*Math.sin(j)],p1:[i*Math.cos(k),i*Math.sin(k)]}}function h(a,b){return a.a0==b.a0&&a.a1==b.a1}function i(a,b,c){return"A"+a+","+a+" 0 "+ +(c>Math.PI)+",1 "+b}function j(a,b,c,d){return"Q 0,0 "+d}var a=dJ,b=dK,c=dL,d=de,e=df;return f.radius=function(a){return arguments.length?(c=p(a),f):c},f.source=function(b){return arguments.length?(a=p(b),f):a},f.target=function(a){return arguments.length?(b=p(a),f):b},f.startAngle=function(a){return arguments.length?(d=p(a),f):d},f.endAngle=function(a){return arguments.length?(e=p(a),f):e},f},d3.svg.diagonal=function(){function d(d,e){var f=a.call(this,d,e),g=b.call(this,d,e),h=(f.y+g.y)/2,i=[f,{x:f.x,y:h},{x:g.x,y:h},g];return i=i.map(c),"M"+i[0]+"C"+i[1]+" "+i[2]+" "+i[3]}var a=dJ,b=dK,c=dO;return d.source=function(b){return arguments.length?(a=p(b),d):a},d.target=function(a){return arguments.length?(b=p(a),d):b},d.projection=function(a){return arguments.length?(c=a,d):c},d},d3.svg.diagonal.radial=function(){var a=d3.svg.diagonal(),b=dO,c=a.projection;return a.projection=function(a){return arguments.length?c(dP(b=a)):b},a},d3.svg.mouse=d3.mouse,d3.svg.touches=d3.touches,d3.svg.symbol=function(){function c(c,d){return(dT.get(a.call(this,c,d))||dS)(b.call(this,c,d))}var a=dR,b=dQ;return c.type=function(b){return arguments.length?(a=p(b),c):a},c.size=function(a){return arguments.length?(b=p(a),c):b},c};var dT=d3.map({circle:dS,cross:function(a){var b=Math.sqrt(a/5)/2;return"M"+ -3*b+","+ -b+"H"+ -b+"V"+ -3*b+"H"+b+"V"+ -b+"H"+3*b+"V"+b+"H"+b+"V"+3*b+"H"+ -b+"V"+b+"H"+ -3*b+"Z"},diamond:function(a){var b=Math.sqrt(a/(2*dV)),c=b*dV;return"M0,"+ -b+"L"+c+",0"+" 0,"+b+" "+ -c+",0"+"Z"},square:function(a){var b=Math.sqrt(a)/2;return"M"+ -b+","+ -b+"L"+b+","+ -b+" "+b+","+b+" "+ -b+","+b+"Z"},"triangle-down":function(a){var b=Math.sqrt(a/dU),c=b*dU/2;return"M0,"+c+"L"+b+","+ -c+" "+ -b+","+ -c+"Z"},"triangle-up":function(a){var b=Math.sqrt(a/dU),c=b*dU/2;return"M0,"+ -c+"L"+b+","+c+" "+ -b+","+c+"Z"}});d3.svg.symbolTypes=dT.keys();var dU=Math.sqrt(3),dV=Math.tan(30*Math.PI/180);d3.svg.axis=function(){function k(k){k.each(function(){var k=d3.select(this),l=h==null?a.ticks?a.ticks.apply(a,g):a.domain():h,m=i==null?a.tickFormat?a.tickFormat.apply(a,g):String:i,n=dY(a,l,j),o=k.selectAll(".minor").data(n,String),p=o.enter().insert("line","g").attr("class","tick minor").style("opacity",1e-6),q=d3.transition(o.exit()).style("opacity",1e-6).remove(),r=d3.transition(o).style("opacity",1),s=k.selectAll("g").data(l,String),t=s.enter().insert("g","path").style("opacity",1e-6),u=d3.transition(s.exit()).style("opacity",1e-6).remove(),v=d3.transition(s).style("opacity",1),w,x=cC(a),y=k.selectAll(".domain").data([0]),z=y.enter().append("path").attr("class","domain"),A=d3.transition(y),B=a.copy(),C=this.__chart__||B;this.__chart__=B,t.append("line").attr("class","tick"),t.append("text");var D=t.select("line"),E=v.select("line"),F=s.select("text").text(m),G=t.select("text"),H=v.select("text");switch(b){case"bottom":w=dW,p.attr("y2",d),r.attr("x2",0).attr("y2",d),D.attr("y2",c),G.attr("y",Math.max(c,0)+f),E.attr("x2",0).attr("y2",c),H.attr("x",0).attr("y",Math.max(c,0)+f),F.attr("dy",".71em").attr("text-anchor","middle"),A.attr("d","M"+x[0]+","+e+"V0H"+x[1]+"V"+e);break;case"top":w=dW,p.attr("y2",-d),r.attr("x2",0).attr("y2",-d),D.attr("y2",-c),G.attr("y",-(Math.max(c,0)+f)),E.attr("x2",0).attr("y2",-c),H.attr("x",0).attr("y",-(Math.max(c,0)+f)),F.attr("dy","0em").attr("text-anchor","middle"),A.attr("d","M"+x[0]+","+ -e+"V0H"+x[1]+"V"+ -e);break;case"left":w=dX,p.attr("x2",-d),r.attr("x2",-d).attr("y2",0),D.attr("x2",-c),G.attr("x",-(Math.max(c,0)+f)),E.attr("x2",-c).attr("y2",0),H.attr("x",-(Math.max(c,0)+f)).attr("y",0),F.attr("dy",".32em").attr("text-anchor","end"),A.attr("d","M"+ -e+","+x[0]+"H0V"+x[1]+"H"+ -e);break;case"right":w=dX,p.attr("x2",d),r.attr("x2",d).attr("y2",0),D.attr("x2",c),G.attr("x",Math.max(c,0)+f),E.attr("x2",c).attr("y2",0),H.attr("x",Math.max(c,0)+f).attr("y",0),F.attr("dy",".32em").attr("text-anchor","start"),A.attr("d","M"+e+","+x[0]+"H0V"+x[1]+"H"+e)}if(a.ticks)t.call(w,C),v.call(w,B),u.call(w,B),p.call(w,C),r.call(w,B),q.call(w,B);else{var I=B.rangeBand()/2,J=function(a){return B(a)+I};t.call(w,J),v.call(w,J)}})}var a=d3.scale.linear(),b="bottom",c=6,d=6,e=6,f=3,g=[10],h=null,i,j=0;return k.scale=function(b){return arguments.length?(a=b,k):a},k.orient=function(a){return arguments.length?(b=a,k):b},k.ticks=function(){return arguments.length?(g=arguments,k):g},k.tickValues=function(a){return arguments.length?(h=a,k):h},k.tickFormat=function(a){return arguments.length?(i=a,k):i},k.tickSize=function(a,b,f){if(!arguments.length)return c;var g=arguments.length-1;return c=+a,d=g>1?+b:c,e=g>0?+arguments[g]:c,k},k.tickPadding=function(a){return arguments.length?(f=+a,k):f},k.tickSubdivide=function(a){return arguments.length?(j=+a,k):j},k},d3.svg.brush=function(){function g(a){a.each(function(){var a=d3.select(this),e=a.selectAll(".background").data([0]),f=a.selectAll(".extent").data([0]),l=a.selectAll(".resize").data(d,String),m;a.style("pointer-events","all").on("mousedown.brush",k).on("touchstart.brush",k),e.enter().append("rect").attr("class","background").style("visibility","hidden").style("cursor","crosshair"),f.enter().append("rect").attr("class","extent").style("cursor","move"),l.enter().append("g").attr("class",function(a){return"resize "+a}).style("cursor",function(a){return dZ[a]}).append("rect").attr("x",function(a){return/[ew]$/.test(a)?-3:null}).attr("y",function(a){return/^[ns]/.test(a)?-3:null}).attr("width",6).attr("height",6).style("visibility","hidden"),l.style("display",g.empty()?"none":null),l.exit().remove(),b&&(m=cC(b),e.attr("x",m[0]).attr("width",m[1]-m[0]),i(a)),c&&(m=cC(c),e.attr("y",m[0]).attr("height",m[1]-m[0]),j(a)),h(a)})}function h(a){a.selectAll(".resize").attr("transform",function(a){return"translate("+e[+/e$/.test(a)][0]+","+e[+/^s/.test(a)][1]+")"})}function i(a){a.select(".extent").attr("x",e[0][0]),a.selectAll(".extent,.n>rect,.s>rect").attr("width",e[1][0]-e[0][0])}function j(a){a.select(".extent").attr("y",e[0][1]),a.selectAll(".extent,.e>rect,.w>rect").attr("height",e[1][1]-e[0][1])}function k(){function x(){var a=d3.event.changedTouches;return a?d3.touches(d,a)[0]:d3.mouse(d)}function y(){d3.event.keyCode==32&&(q||(r=null,s[0]-=e[1][0],s[1]-=e[1][1],q=2),Y())}function z(){d3.event.keyCode==32&&q==2&&(s[0]+=e[1][0],s[1]+=e[1][1],q=0,Y())}function A(){var a=x(),d=!1;t&&(a[0]+=t[0],a[1]+=t[1]),q||(d3.event.altKey?(r||(r=[(e[0][0]+e[1][0])/2,(e[0][1]+e[1][1])/2]),s[0]=e[+(a[0]<r[0])][0],s[1]=e[+(a[1]<r[1])][1]):r=null),o&&B(a,b,0)&&(i(m),d=!0),p&&B(a,c,1)&&(j(m),d=!0),d&&(h(m),l({type:"brush",mode:q?"move":"resize"}))}function B(a,b,c){var d=cC(b),g=d[0],h=d[1],i=s[c],j=e[1][c]-e[0][c],k,l;q&&(g-=i,h-=j+i),k=Math.max(g,Math.min(h,a[c])),q?l=(k+=i)+j:(r&&(i=Math.max(g,Math.min(h,2*r[c]-k))),i<k?(l=k,k=i):l=i);if(e[0][c]!==k||e[1][c]!==l)return f=null,e[0][c]=k,e[1][c]=l,!0}function C(){A(),m.style("pointer-events","all").selectAll(".resize").style("display",g.empty()?"none":null),d3.select("body").style("cursor",null),u.on("mousemove.brush",null).on("mouseup.brush",null).on("touchmove.brush",null).on("touchend.brush",null).on("keydown.brush",null).on("keyup.brush",null),l({type:"brushend"}),Y()}var d=this,k=d3.select(d3.event.target),l=a.of(d,arguments),m=d3.select(d),n=k.datum(),o=!/^(n|s)$/.test(n)&&b,p=!/^(e|w)$/.test(n)&&c,q=k.classed("extent"),r,s=x(),t,u=d3.select(window).on("mousemove.brush",A).on("mouseup.brush",C).on("touchmove.brush",A).on("touchend.brush",C).on("keydown.brush",y).on("keyup.brush",z);if(q)s[0]=e[0][0]-s[0],s[1]=e[0][1]-s[1];else if(n){var v=+/w$/.test(n),w=+/^n/.test(n);t=[e[1-v][0]-s[0],e[1-w][1]-s[1]],s[0]=e[v][0],s[1]=e[w][1]}else d3.event.altKey&&(r=s.slice());m.style("pointer-events","none").selectAll(".resize").style("display",null),d3.select("body").style("cursor",k.style("cursor")),l({type:"brushstart"}),A(),Y()}var a=$(g,"brushstart","brush","brushend"),b=null,c=null,d=d$[0],e=[[0,0],[0,0]],f;return g.x=function(a){return arguments.length?(b=a,d=d$[!b<<1|!c],g):b},g.y=function(a){return arguments.length?(c=a,d=d$[!b<<1|!c],g):c},g.extent=function(a){var d,h,i,j,k;return arguments.length?(f=[[0,0],[0,0]],b&&(d=a[0],h=a[1],c&&(d=d[0],h=h[0]),f[0][0]=d,f[1][0]=h,b.invert&&(d=b(d),h=b(h)),h<d&&(k=d,d=h,h=k),e[0][0]=d|0,e[1][0]=h|0),c&&(i=a[0],j=a[1],b&&(i=i[1],j=j[1]),f[0][1]=i,f[1][1]=j,c.invert&&(i=c(i),j=c(j)),j<i&&(k=i,i=j,j=k),e[0][1]=i|0,e[1][1]=j|0),g):(a=f||e,b&&(d=a[0][0],h=a[1][0],f||(d=e[0][0],h=e[1][0],b.invert&&(d=b.invert(d),h=b.invert(h)),h<d&&(k=d,d=h,h=k))),c&&(i=a[0][1],j=a[1][1],f||(i=e[0][1],j=e[1][1],c.invert&&(i=c.invert(i),j=c.invert(j)),j<i&&(k=i,i=j,j=k))),b&&c?[[d,i],[h,j]]:b?[d,h]:c&&[i,j])},g.clear=function(){return f=null,e[0][0]=e[0][1]=e[1][0]=e[1][1]=0,g},g.empty=function(){return b&&e[0][0]===e[1][0]||c&&e[0][1]===e[1][1]},d3.rebind(g,a,"on")};var dZ={n:"ns-resize",e:"ew-resize",s:"ns-resize",w:"ew-resize",nw:"nwse-resize",ne:"nesw-resize",se:"nwse-resize",sw:"nesw-resize"},d$=[["n","e","s","w","nw","ne","se","sw"],["e","w"],["n","s"],[]];d3.behavior={},d3.behavior.drag=function(){function c(){this.on("mousedown.drag",d).on("touchstart.drag",d)}function d(){function j(){var a=c.parentNode,b=d3.event.changedTouches;return b?d3.touches(a,b)[0]:d3.mouse(a)}function k(){if(!c.parentNode)return l();var a=j(),b=a[0]-g[0],e=a[1]-g[1];h|=b|e,g=a,Y(),d({type:"drag",x:a[0]+f[0],y:a[1]+f[1],dx:b,dy:e})}function l(){d({type:"dragend"}),h&&(Y(),d3.event.target===e&&i.on("click.drag",m,!0)),i.on("mousemove.drag",null).on("touchmove.drag",null).on("mouseup.drag",null).on("touchend.drag",null)}function m(){Y(),i.on("click.drag",null)}var c=this,d=a.of(c,arguments),e=d3.event.target,f,g=j(),h=0,i=d3.select(window).on("mousemove.drag",k).on("touchmove.drag",k).on("mouseup.drag",l,!0).on("touchend.drag",l,!0);b?(f=b.apply(c,arguments),f=[f.x-g[0],f.y-g[1]]):f=[0,0],Y(),d({type:"dragstart"})}var a=$(c,"drag","dragstart","dragend"),b=null;return c.origin=function(a){return arguments.length?(b=a,c):b},d3.rebind(c,a,"on")},d3.behavior.zoom=function(){function l(){this.on("mousedown.zoom",r).on("mousewheel.zoom",s).on("mousemove.zoom",t).on("DOMMouseScroll.zoom",s).on("dblclick.zoom",u).on("touchstart.zoom",v).on("touchmove.zoom",w).on("touchend.zoom",v)}function m(b){return[(b[0]-a[0])/c,(b[1]-a[1])/c]}function n(b){return[b[0]*c+a[0],b[1]*c+a[1]]}function o(a){c=Math.max(e[0],Math.min(e[1],a))}function p(b,c){c=n(c),a[0]+=b[0]-c[0],a[1]+=b[1]-c[1]}function q(b){h&&h.domain(g.range().map(function(b){return(b-a[0])/c}).map(g.invert)),j&&j.domain(i.range().map(function(b){return(b-a[1])/c}).map(i.invert)),d3.event.preventDefault(),b({type:"zoom",scale:c,translate:a})}function r(){function h(){d=1,p(d3.mouse(a),g),q(b)}function i(){d&&Y(),e.on("mousemove.zoom",null).on("mouseup.zoom",null),d&&d3.event.target===c&&e.on("click.zoom",j,!0)}function j(){Y(),e.on("click.zoom",null)}var a=this,b=f.of(a,arguments),c=d3.event.target,d=0,e=d3.select(window).on("mousemove.zoom",h).on("mouseup.zoom",i),g=m(d3.mouse(a));window.focus(),Y()}function s(){b||(b=m(d3.mouse(this))),o(Math.pow(2,eb()*.002)*c),p(d3.mouse(this),b),q(f.of(this,arguments))}function t(){b=null}function u(){var a=d3.mouse(this),b=m(a);o(d3.event.shiftKey?c/2:c*2),p(a,b),q(f.of(this,arguments))}function v(){var a=d3.touches(this),e=Date.now();d=c,b={},a.forEach(function(a){b[a.identifier]=m(a)}),Y();if(a.length===1){if(e-k<500){var g=a[0],h=m(a[0]);o(c*2),p(g,h),q(f.of(this,arguments))}k=e}}function w(){var a=d3.touches(this),c=a[0],e=b[c.identifier];if(g=a[1]){var g,h=b[g.identifier];c=[(c[0]+g[0])/2,(c[1]+g[1])/2],e=[(e[0]+h[0])/2,(e[1]+h[1])/2],o(d3.event.scale*d)}p(c,e),k=null,q(f.of(this,arguments))}var a=[0,0],b,c=1,d,e=ea,f=$(l,"zoom"),g,h,i,j,k;return l.translate=function(b){return arguments.length?(a=b.map(Number),l):a},l.scale=function(a){return arguments.length?(c=+a,l):c},l.scaleExtent=function(a){return arguments.length?(e=a==null?ea:a.map(Number),l):e},l.x=function(a){return arguments.length?(h=a,g=a.copy(),l):h},l.y=function(a){return arguments.length?(j=a,i=a.copy(),l):j},d3.rebind(l,f,"on")};var d_,ea=[0,Infinity];d3.layout={},d3.layout.bundle=function(){return function(a){var b=[],c=-1,d=a.length;while(++c<d)b.push(ec(a[c]));return b}},d3.layout.chord=function(){function j(){var a={},j=[],l=d3.range(e),m=[],n,o,p,q,r;b=[],c=[],n=0,q=-1;while(++q<e){o=0,r=-1;while(++r<e)o+=d[q][r];j.push(o),m.push(d3.range(e)),n+=o}g&&l.sort(function(a,b){return g(j[a],j[b])}),h&&m.forEach(function(a,b){a.sort(function(a,c){return h(d[b][a],d[b][c])})}),n=(2*Math.PI-f*e)/n,o=0,q=-1;while(++q<e){p=o,r=-1;while(++r<e){var s=l[q],t=m[s][r],u=d[s][t],v=o,w=o+=u*n;a[s+"-"+t]={index:s,subindex:t,startAngle:v,endAngle:w,value:u}}c[s]={index:s,startAngle:p,endAngle:o,value:(o-p)/n},o+=f}q=-1;while(++q<e){r=q-1;while(++r<e){var x=a[q+"-"+r],y=a[r+"-"+q];(x.value||y.value)&&b.push(x.value<y.value?{source:y,target:x}:{source:x,target:y})}}i&&k()}function k(){b.sort(function(a,b){return i((a.source.value+a.target.value)/2,(b.source.value+b.target.value)/2)})}var a={},b,c,d,e,f=0,g,h,i;return a.matrix=function(f){return arguments.length?(e=(d=f)&&d.length,b=c=null,a):d},a.padding=function(d){return arguments.length?(f=d,b=c=null,a):f},a.sortGroups=function(d){return arguments.length?(g=d,b=c=null,a):g},a.sortSubgroups=function(c){return arguments.length?(h=c,b=null,a):h},a.sortChords=function(c){return arguments.length?(i=c,b&&k(),a):i},a.chords=function(){return b||j(),b},a.groups=function(){return c||j(),c},a},d3.layout.force=function(){function t(a){return function(b,c,d,e,f){if(b.point!==a){var g=b.cx-a.x,h=b.cy-a.y,i=1/Math.sqrt(g*g+h*h);if((e-c)*i<k){var j=b.charge*i*i;return a.px-=g*j,a.py-=h*j,!0}if(b.point&&isFinite(i)){var j=b.pointCharge*i*i;a.px-=g*j,a.py-=h*j}}return!b.charge}}function u(b){eh(eg=b),ef=a}var a={},b=d3.dispatch("start","tick","end"),c=[1,1],d,e,f=.9,g=em,h=en,i=-30,j=.1,k=.8,l,n=[],o=[],q,r,s;return a.tick=function(){if((e*=.99)<.005)return b.end({type:"end",alpha:e=0}),!0;var a=n.length,d=o.length,g,h,k,l,m,p,u,v,w;for(h=0;h<d;++h){k=o[h],l=k.source,m=k.target,v=m.x-l.x,w=m.y-l.y;if(p=v*v+w*w)p=e*r[h]*((p=Math.sqrt(p))-q[h])/p,v*=p,w*=p,m.x-=v*(u=l.weight/(m.weight+l.weight)),m.y-=w*u,l.x+=v*(u=1-u),l.y+=w*u}if(u=e*j){v=c[0]/2,w=c[1]/2,h=-1;if(u)while(++h<a)k=n[h],k.x+=(v-k.x)*u,k.y+=(w-k.y)*u}if(i){el(g=d3.geom.quadtree(n),e,s),h=-1;while(++h<a)(k=n[h]).fixed||g.visit(t(k))}h=-1;while(++h<a)k=n[h],k.fixed?(k.x=k.px,k.y=k.py):(k.x-=(k.px-(k.px=k.x))*f,k.y-=(k.py-(k.py=k.y))*f);b.tick({type:"tick",alpha:e})},a.nodes=function(b){return arguments.length?(n=b,a):n},a.links=function(b){return arguments.length?(o=b,a):o},a.size=function(b){return arguments.length?(c=b,a):c},a.linkDistance=function(b){return arguments.length?(g=p(b),a):g},a.distance=a.linkDistance,a.linkStrength=function(b){return arguments.length?(h=p(b),a):h},a.friction=function(b){return arguments.length?(f=b,a):f},a.charge=function(b){return arguments.length?(i=typeof b=="function"?b:+b,a):i},a.gravity=function(b){return arguments.length?(j=b,a):j},a.theta=function(b){return arguments.length?(k=b,a):k},a.alpha=function(c){return arguments.length?(e?c>0?e=c:e=0:c>0&&(b.start({type:"start",alpha:e=c}),d3.timer(a.tick)),a):e},a.start=function(){function p(a,c){var d=t(b),e=-1,f=d.length,g;while(++e<f)if(!isNaN(g=d[e][a]))return g;return Math.random()*c}function t(){if(!l){l=[];for(d=0;d<e;++d)l[d]=[];for(d=0;d<f;++d){var a=o[d];l[a.source.index].push(a.target),l[a.target.index].push(a.source)}}return l[b]}var b,d,e=n.length,f=o.length,j=c[0],k=c[1],l,m;for(b=0;b<e;++b)(m=n[b]).index=b,m.weight=0;q=[],r=[];for(b=0;b<f;++b)m=o[b],typeof m.source=="number"&&(m.source=n[m.source]),typeof m.target=="number"&&(m.target=n[m.target]),q[b]=g.call(this,m,b),r[b]=h.call(this,m,b),++m.source.weight,++m.target.weight;for(b=0;b<e;++b)m=n[b],isNaN(m.x)&&(m.x=p("x",j)),isNaN(m.y)&&(m.y=p("y",k)),isNaN(m.px)&&(m.px=m.x),isNaN(m.py)&&(m.py=m.y);s=[];if(typeof i=="function")for(b=0;b<e;++b)s[b]=+i.call(this,n[b],b);else for(b=0;b<e;++b)s[b]=i;return a.resume()},a.resume=function(){return a.alpha(.1)},a.stop=function(){return a.alpha(0)},a.drag=function(){d||(d=d3.behavior.drag().origin(m).on("dragstart",u).on("drag",ek).on("dragend",ej)),this.on("mouseover.force",eh).on("mouseout.force",ei).call(d)},d3.rebind(a,b,"on")};var ef,eg;d3.layout.partition=function(){function c(a,b,d,e){var f=a.children;a.x=b,a.y=a.depth*e,a.dx=d,a.dy=e;if(f&&(h=f.length)){var g=-1,h,i,j;d=a.value?d/a.value:0;while(++g<h)c(i=f[g],b,j=i.value*d,e),b+=j}}function d(a){var b=a.children,c=0;if(b&&(f=b.length)){var e=-1,f;while(++e<f)c=Math.max(c,d(b[e]))}return 1+c}function e(e,f){var g=a.call(this,e,f);return c(g[0],0,b[0],b[1]/d(g[0])),g}var a=d3.layout.hierarchy(),b=[1,1];return e.size=function(a){return arguments.length?(b=a,e):b},eC(e,a)},d3.layout.pie=function(){function e(f,g){var h=f.map(function(b,c){return+a.call(e,b,c)}),i=+(typeof c=="function"?c.apply(this,arguments):c),j=((typeof d=="function"?d.apply(this,arguments):d)-c)/d3.sum(h),k=d3.range(f.length);b!=null&&k.sort(b===eo?function(a,b){return h[b]-h[a]}:function(a,c){return b(f[a],f[c])});var l=[];return k.forEach(function(a){var b;l[a]={data:f[a],value:b=h[a],startAngle:i,endAngle:i+=b*j}}),l}var a=Number,b=eo,c=0,d=2*Math.PI;return e.value=function(b){return arguments.length?(a=b,e):a},e.sort=function(a){return arguments.length?(b=a,e):b},e.startAngle=function(a){return arguments.length?(c=a,e):c},e.endAngle=function(a){return arguments.length?(d=a,e):d},e};var eo={};d3.layout.stack=function(){function g(h,i){var j=h.map(function(b,c){return a.call(g,b,c)}),k=j.map(function(a,b){return a.map(function(a,b){return[e.call(g,a,b),f.call(g,a,b)]})}),l=b.call(g,k,i);j=d3.permute(j,l),k=d3.permute(k,l);var m=c.call(g,k,i),n=j.length,o=j[0].length,p,q,r;for(q=0;q<o;++q){d.call(g,j[0][q],r=m[q],k[0][q][1]);for(p=1;p<n;++p)d.call(g,j[p][q],r+=k[p-1][q][1],k[p][q][1])}return h}var a=m,b=eu,c=ev,d=er,e=ep,f=eq;return g.values=function(b){return arguments.length?(a=b,g):a},g.order=function(a){return arguments.length?(b=typeof a=="function"?a:es.get(a)||eu,g):b},g.offset=function(a){return arguments.length?(c=typeof a=="function"?a:et.get(a)||ev,g):c},g.x=function(a){return arguments.length?(e=a,g):e},g.y=function(a){return arguments.length?(f=a,g):f},g.out=function(a){return arguments.length?(d=a,g):d},g};var es=d3.map({"inside-out":function(a){var b=a.length,c,d,e=a.map(ew),f=a.map(ex),g=d3.range(b).sort(function(a,b){return e[a]-e[b]}),h=0,i=0,j=[],k=[];for(c=0;c<b;++c)d=g[c],h<i?(h+=f[d],j.push(d)):(i+=f[d],k.push(d));return k.reverse().concat(j)},reverse:function(a){return d3.range(a.length).reverse()},"default":eu}),et=d3.map({silhouette:function(a){var b=a.length,c=a[0].length,d=[],e=0,f,g,h,i=[];for(g=0;g<c;++g){for(f=0,h=0;f<b;f++)h+=a[f][g][1];h>e&&(e=h),d.push(h)}for(g=0;g<c;++g)i[g]=(e-d[g])/2;return i},wiggle:function(a){var b=a.length,c=a[0],d=c.length,e=0,f,g,h,i,j,k,l,m,n,o=[];o[0]=m=n=0;for(g=1;g<d;++g){for(f=0,i=0;f<b;++f)i+=a[f][g][1];for(f=0,j=0,l=c[g][0]-c[g-1][0];f<b;++f){for(h=0,k=(a[f][g][1]-a[f][g-1][1])/(2*l);h<f;++h)k+=(a[h][g][1]-a[h][g-1][1])/l;j+=k*a[f][g][1]}o[g]=m-=i?j/i*l:0,m<n&&(n=m)}for(g=0;g<d;++g)o[g]-=n;return o},expand:function(a){var b=a.length,c=a[0].length,d=1/b,e,f,g,h=[];for(f=0;f<c;++f){for(e=0,g=0;e<b;e++)g+=a[e][f][1];if(g)for(e=0;e<b;e++)a[e][f][1]/=g;else for(e=0;e<b;e++)a[e][f][1]=d}for(f=0;f<c;++f)h[f]=0;return h},zero:ev});d3.layout.histogram=function(){function e(e,f){var g=[],h=e.map(b,this),i=c.call(this,h,f),j=d.call(this,i,h,f),k,f=-1,l=h.length,m=j.length-1,n=a?1:1/l,o;while(++f<m)k=g[f]=[],k.dx=j[f+1]-(k.x=j[f]),k.y=0;if(m>0){f=-1;while(++f<l)o=h[f],o>=i[0]&&o<=i[1]&&(k=g[d3.bisect(j,o,1,m)-1],k.y+=n,k.push(e[f]))}return g}var a=!0,b=Number,c=eB,d=ez;return e.value=function(a){return arguments.length?(b=a,e):b},e.range=function(a){return arguments.length?(c=p(a),e):c},e.bins=function(a){return arguments.length?(d=typeof a=="number"?function(b){return eA(b,a)}:p(a),e):d},e.frequency=function(b){return arguments.length?(a=!!b,e):a},e},d3.layout.hierarchy=function(){function d(e,g,h){var i=b.call(f,e,g),j=eH?e:{data:e};j.depth=g,h.push(j);if(i&&(l=i.length)){var k=-1,l,m=j.children=[],n=0,o=g+1,p;while(++k<l)p=d(i[k],o,h),p.parent=j,m.push(p),n+=p.value;a&&m.sort(a),c&&(j.value=n)}else c&&(j.value=+c.call(f,e,g)||0);return j}function e(a,b){var d=a.children,g=0;if(d&&(i=d.length)){var h=-1,i,j=b+1;while(++h<i)g+=e(d[h],j)}else c&&(g=+c.call(f,eH?a:a.data,b)||0);return c&&(a.value=g),g}function f(a){var b=[];return d(a,0,b),b}var a=eF,b=eD,c=eE;return f.sort=function(b){return arguments.length?(a=b,f):a},f.children=function(a){return arguments.length?(b=a,f):b},f.value=function(a){return arguments.length?(c=a,f):c},f.revalue=function(a){return e(a,0),a},f};var eH=!1;d3.layout.pack=function(){function d(d,e){var f=a.call(this,d,e),g=f[0];g.x=0,g.y=0,fa(g,function(a){a.r=Math.sqrt(a.value)}),fa(g,eM);var h=c[0],i=c[1],j=Math.max(2*g.r/h,2*g.r/i);if(b>0){var k=b*j/2;fa(g,function(a){a.r+=k}),fa(g,eM),fa(g,function(a){a.r-=k}),j=Math.max(2*g.r/h,2*g.r/i)}return eP(g,h/2,i/2,1/j),f}var a=d3.layout.hierarchy().sort(eI),b=0,c=[1,1];return d.size=function(a){return arguments.length?(c=a,d):c},d.padding=function(a){return arguments.length?(b=+a,d):b},eC(d,a)},d3.layout.cluster=function(){function d(d,e){var f=a.call(this,d,e),g=f[0],h,i=0,j,k;fa(g,function(a){var c=a.children;c&&c.length?(a.x=eS(c),a.y=eR(c)):(a.x=h?i+=b(a,h):0,a.y=0,h=a)});var l=eT(g),m=eU(g),n=l.x-b(l,m)/2,o=m.x+b(m,l)/2;return fa(g,function(a){a.x=(a.x-n)/(o-n)*c[0],a.y=(1-(g.y?a.y/g.y:1))*c[1]}),f}var a=d3.layout.hierarchy().sort(null).value(null),b=eV,c=[1,1];return d.separation=function(a){return arguments.length?(b=a,d):b},d.size=function(a){return arguments.length?(c=a,d):c},eC(d,a)},d3.layout.tree=function(){function d(d,e){function h(a,c){var d=a.children,e=a._tree;if(d&&(f=d.length)){var f,g=d[0],i,k=g,l,m=-1;while(++m<f)l=d[m],h(l,i),k=j(l,i,k),i=l;fb(a);var n=.5*(g._tree.prelim+l._tree.prelim);c?(e.prelim=c._tree.prelim+b(a,c),e.mod=e.prelim-n):e.prelim=n}else c&&(e.prelim=c._tree.prelim+b(a,c))}function i(a,b){a.x=a._tree.prelim+b;var c=a.children;if(c&&(e=c.length)){var d=-1,e;b+=a._tree.mod;while(++d<e)i(c[d],b)}}function j(a,c,d){if(c){var e=a,f=a,g=c,h=a.parent.children[0],i=e._tree.mod,j=f._tree.mod,k=g._tree.mod,l=h._tree.mod,m;while(g=eX(g),e=eW(e),g&&e)h=eW(h),f=eX(f),f._tree.ancestor=a,m=g._tree.prelim+k-e._tree.prelim-i+b(g,e),m>0&&(fc(fd(g,a,d),a,m),i+=m,j+=m),k+=g._tree.mod,i+=e._tree.mod,l+=h._tree.mod,j+=f._tree.mod;g&&!eX(f)&&(f._tree.thread=g,f._tree.mod+=k-j),e&&!eW(h)&&(h._tree.thread=e,h._tree.mod+=i-l,d=a)}return d}var f=a.call(this,d,e),g=f[0];fa(g,function(a,b){a._tree={ancestor:a,prelim:0,mod:0,change:0,shift:0,number:b?b._tree.number+1:0}}),h(g),i(g,-g._tree.prelim);var k=eY(g,e$),l=eY(g,eZ),m=eY(g,e_),n=k.x-b(k,l)/2,o=l.x+b(l,k)/2,p=m.depth||1;return fa(g,function(a){a.x=(a.x-n)/(o-n)*c[0],a.y=a.depth/p*c[1],delete a._tree}),f}var a=d3.layout.hierarchy().sort(null).value(null),b=eV,c=[1,1];return d.separation=function(a){return arguments.length?(b=a,d):b},d.size=function(a){return arguments.length?(c=a,d):c},eC(d,a)},d3.layout.treemap=function(){function i(a,b){var c=-1,d=a.length,e,f;while(++c<d)f=(e=a[c]).value*(b<0?0:b),e.area=isNaN(f)||f<=0?0:f}function j(a){var b=a.children;if(b&&b.length){var c=e(a),d=[],f=b.slice(),g,h=Infinity,k,n=Math.min(c.dx,c.dy),o;i(f,c.dx*c.dy/a.value),d.area=0;while((o=f.length)>0)d.push(g=f[o-1]),d.area+=g.area,(k=l(d,n))<=h?(f.pop(),h=k):(d.area-=d.pop().area,m(d,n,c,!1),n=Math.min(c.dx,c.dy),d.length=d.area=0,h=Infinity);d.length&&(m(d,n,c,!0),d.length=d.area=0),b.forEach(j)}}function k(a){var b=a.children;if(b&&b.length){var c=e(a),d=b.slice(),f,g=[];i(d,c.dx*c.dy/a.value),g.area=0;while(f=d.pop())g.push(f),g.area+=f.area,f.z!=null&&(m(g,f.z?c.dx:c.dy,c,!d.length),g.length=g.area=0);b.forEach(k)}}function l(a,b){var c=a.area,d,e=0,f=Infinity,g=-1,i=a.length;while(++g<i){if(!(d=a[g].area))continue;d<f&&(f=d),d>e&&(e=d)}return c*=c,b*=b,c?Math.max(b*e*h/c,c/(b*f*h)):Infinity}function m(a,c,d,e){var f=-1,g=a.length,h=d.x,i=d.y,j=c?b(a.area/c):0,k;if(c==d.dx){if(e||j>d.dy)j=d.dy;while(++f<g)k=a[f],k.x=h,k.y=i,k.dy=j,h+=k.dx=Math.min(d.x+d.dx-h,j?b(k.area/j):0);k.z=!0,k.dx+=d.x+d.dx-h,d.y+=j,d.dy-=j}else{if(e||j>d.dx)j=d.dx;while(++f<g)k=a[f],k.x=h,k.y=i,k.dx=j,i+=k.dy=Math.min(d.y+d.dy-i,j?b(k.area/j):0);k.z=!1,k.dy+=d.y+d.dy-i,d.x+=j,d.dx-=j}}function n(b){var d=g||a(b),e=d[0];return e.x=0,e.y=0,e.dx=c[0],e.dy=c[1],g&&a.revalue(e),i([e],e.dx*e.dy/e.value),(g?k:j)(e),f&&(g=d),d}var a=d3.layout.hierarchy(),b=Math.round,c=[1,1],d=null,e=fe,f=!1,g,h=.5*(1+Math.sqrt(5));return n.size=function(a){return arguments.length?(c=a,n):c},n.padding=function(a){function b(b){var c=a.call(n,b,b.depth);return c==null?fe(b):ff(b,typeof c=="number"?[c,c,c,c]:c)}function c(b){return ff(b,a)}if(!arguments.length)return d;var f;return e=(d=a)==null?fe:(f=typeof a)==="function"?b:f==="number"?(a=[a,a,a,a],c):c,n},n.round=function(a){return arguments.length?(b=a?Math.round:Number,n):b!=Number},n.sticky=function(a){return arguments.length?(f=a,g=null,n):f},n.ratio=function(a){return arguments.length?(h=a,n):h},eC(n,a)},d3.csv=fg(",","text/csv"),d3.tsv=fg("\t","text/tab-separated-values"),d3.geo={};var fh=Math.PI/180;d3.geo.azimuthal=function(){function i(b){var f=b[0]*fh-e,i=b[1]*fh,j=Math.cos(f),k=Math.sin(f),l=Math.cos(i),m=Math.sin(i),n=a!=="orthographic"?h*m+g*l*j:null,o,p=a==="stereographic"?1/(1+n):a==="gnomonic"?1/n:a==="equidistant"?(o=Math.acos(n),o?o/Math.sin(o):0):a==="equalarea"?Math.sqrt(2/(1+n)):1,q=p*l*k,r=p*(h*l*j-g*m);return[c*q+d[0],c*r+d[1]]}var a="orthographic",b,c=200,d=[480,250],e,f,g,h;return i.invert=function(b){var f=(b[0]-d[0])/c,i=(b[1]-d[1])/c,j=Math.sqrt(f*f+i*i),k=a==="stereographic"?2*Math.atan(j):a==="gnomonic"?Math.atan(j):a==="equidistant"?j:a==="equalarea"?2*Math.asin(.5*j):Math.asin(j),l=Math.sin(k),m=Math.cos(k);return[(e+Math.atan2(f*l,j*g*m+i*h*l))/fh,Math.asin(m*h-(j?i*l*g/j:0))/fh]},i.mode=function(b){return arguments.length?(a=b+"",i):a},i.origin=function(a){return arguments.length?(b=a,e=b[0]*fh,f=b[1]*fh,g=Math.cos(f),h=Math.sin(f),i):b},i.scale=function(a){return arguments.length?(c=+a,i):c},i.translate=function(a){return arguments.length?(d=[+a[0],+a[1]],i):d},i.origin([0,0])},d3.geo.albers=function(){function i(a){var b=f*(fh*a[0]-e),i=Math.sqrt(g-2*f*Math.sin(fh*a[1]))/f;return[c*i*Math.sin(b)+d[0],c*(i*Math.cos(b)-h)+d[1]]}function j(){var c=fh*b[0],d=fh*b[1],j=fh*a[1],k=Math.sin(c),l=Math.cos(c);return e=fh*a[0],f=.5*(k+Math.sin(d)),g=l*l+2*f*k,h=Math.sqrt(g-2*f*Math.sin(j))/f,i}var a=[-98,38],b=[29.5,45.5],c=1e3,d=[480,250],e,f,g,h;return i.invert=function(a){var b=(a[0]-d[0])/c,i=(a[1]-d[1])/c,j=h+i,k=Math.atan2(b,j),l=Math.sqrt(b*b+j*j);return[(e+k/f)/fh,Math.asin((g-l*l*f*f)/(2*f))/fh]},i.origin=function(b){return arguments.length?(a=[+b[0],+b[1]],j()):a},i.parallels=function(a){return arguments.length?(b=[+a[0],+a[1]],j()):b},i.scale=function(a){return arguments.length?(c=+a,i):c},i.translate=function(a){return arguments.length?(d=[+a[0],+a[1]],i):d},j()},d3.geo.albersUsa=function(){function e(e){var f=e[0],g=e[1];return(g>50?b:f<-140?c:g<21?d:a)(e)}var a=d3.geo.albers(),b=d3.geo.albers().origin([-160,60]).parallels([55,65]),c=d3.geo.albers().origin([-160,20]).parallels([8,18]),d=d3.geo.albers().origin([-60,10]).parallels([8,18]);return e.scale=function(f){return arguments.length?(a.scale(f),b.scale(f*.6),c.scale(f),d.scale(f*1.5),e.translate(a.translate())):a.scale()},e.translate=function(f){if(!arguments.length)return a.translate();var g=a.scale()/1e3,h=f[0],i=f[1];return a.translate(f),b.translate([h-400*g,i+170*g]),c.translate([h-190*g,i+200*g]),d.translate([h+580*g,i+430*g]),e},e.scale(a.scale())},d3.geo.bonne=function(){function g(g){var h=g[0]*fh-c,i=g[1]*fh-d;if(e){var j=f+e-i,k=h*Math.cos(i)/j;h=j*Math.sin(k),i=j*Math.cos(k)-f}else h*=Math.cos(i),i*=-1;return[a*h+b[0],a*i+b[1]]}var a=200,b=[480,250],c,d,e,f;return g.invert=function(d){var g=(d[0]-b[0])/a,h=(d[1]-b[1])/a;if(e){var i=f+h,j=Math.sqrt(g*g+i*i);h=f+e-j,g=c+j*Math.atan2(g,i)/Math.cos(h)}else h*=-1,g/=Math.cos(h);return[g/fh,h/fh]},g.parallel=function(a){return arguments.length?(f=1/
Math.tan(e=a*fh),g):e/fh},g.origin=function(a){return arguments.length?(c=a[0]*fh,d=a[1]*fh,g):[c/fh,d/fh]},g.scale=function(b){return arguments.length?(a=+b,g):a},g.translate=function(a){return arguments.length?(b=[+a[0],+a[1]],g):b},g.origin([0,0]).parallel(45)},d3.geo.equirectangular=function(){function c(c){var d=c[0]/360,e=-c[1]/360;return[a*d+b[0],a*e+b[1]]}var a=500,b=[480,250];return c.invert=function(c){var d=(c[0]-b[0])/a,e=(c[1]-b[1])/a;return[360*d,-360*e]},c.scale=function(b){return arguments.length?(a=+b,c):a},c.translate=function(a){return arguments.length?(b=[+a[0],+a[1]],c):b},c},d3.geo.mercator=function(){function c(c){var d=c[0]/360,e=-(Math.log(Math.tan(Math.PI/4+c[1]*fh/2))/fh)/360;return[a*d+b[0],a*Math.max(-0.5,Math.min(.5,e))+b[1]]}var a=500,b=[480,250];return c.invert=function(c){var d=(c[0]-b[0])/a,e=(c[1]-b[1])/a;return[360*d,2*Math.atan(Math.exp(-360*e*fh))/fh-90]},c.scale=function(b){return arguments.length?(a=+b,c):a},c.translate=function(a){return arguments.length?(b=[+a[0],+a[1]],c):b},c},d3.geo.path=function(){function e(c,e){typeof a=="function"&&(b=fj(a.apply(this,arguments))),g(c);var f=d.length?d.join(""):null;return d=[],f}function f(a){return c(a).join(",")}function i(a){var b=l(a[0]),c=0,d=a.length;while(++c<d)b-=l(a[c]);return b}function j(a){var b=d3.geom.polygon(a[0].map(c)),d=b.area(),e=b.centroid(d<0?(d*=-1,1):-1),f=e[0],g=e[1],h=d,i=0,j=a.length;while(++i<j)b=d3.geom.polygon(a[i].map(c)),d=b.area(),e=b.centroid(d<0?(d*=-1,1):-1),f-=e[0],g-=e[1],h-=d;return[f,g,6*h]}function l(a){return Math.abs(d3.geom.polygon(a.map(c)).area())}var a=4.5,b=fj(a),c=d3.geo.albersUsa(),d=[],g=fi({FeatureCollection:function(a){var b=a.features,c=-1,e=b.length;while(++c<e)d.push(g(b[c].geometry))},Feature:function(a){g(a.geometry)},Point:function(a){d.push("M",f(a.coordinates),b)},MultiPoint:function(a){var c=a.coordinates,e=-1,g=c.length;while(++e<g)d.push("M",f(c[e]),b)},LineString:function(a){var b=a.coordinates,c=-1,e=b.length;d.push("M");while(++c<e)d.push(f(b[c]),"L");d.pop()},MultiLineString:function(a){var b=a.coordinates,c=-1,e=b.length,g,h,i;while(++c<e){g=b[c],h=-1,i=g.length,d.push("M");while(++h<i)d.push(f(g[h]),"L");d.pop()}},Polygon:function(a){var b=a.coordinates,c=-1,e=b.length,g,h,i;while(++c<e){g=b[c],h=-1;if((i=g.length-1)>0){d.push("M");while(++h<i)d.push(f(g[h]),"L");d[d.length-1]="Z"}}},MultiPolygon:function(a){var b=a.coordinates,c=-1,e=b.length,g,h,i,j,k,l;while(++c<e){g=b[c],h=-1,i=g.length;while(++h<i){j=g[h],k=-1;if((l=j.length-1)>0){d.push("M");while(++k<l)d.push(f(j[k]),"L");d[d.length-1]="Z"}}}},GeometryCollection:function(a){var b=a.geometries,c=-1,e=b.length;while(++c<e)d.push(g(b[c]))}}),h=e.area=fi({FeatureCollection:function(a){var b=0,c=a.features,d=-1,e=c.length;while(++d<e)b+=h(c[d]);return b},Feature:function(a){return h(a.geometry)},Polygon:function(a){return i(a.coordinates)},MultiPolygon:function(a){var b=0,c=a.coordinates,d=-1,e=c.length;while(++d<e)b+=i(c[d]);return b},GeometryCollection:function(a){var b=0,c=a.geometries,d=-1,e=c.length;while(++d<e)b+=h(c[d]);return b}},0),k=e.centroid=fi({Feature:function(a){return k(a.geometry)},Polygon:function(a){var b=j(a.coordinates);return[b[0]/b[2],b[1]/b[2]]},MultiPolygon:function(a){var b=0,c=a.coordinates,d,e=0,f=0,g=0,h=-1,i=c.length;while(++h<i)d=j(c[h]),e+=d[0],f+=d[1],g+=d[2];return[e/g,f/g]}});return e.projection=function(a){return c=a,e},e.pointRadius=function(c){return typeof c=="function"?a=c:(a=+c,b=fj(a)),e},e},d3.geo.bounds=function(a){var b=Infinity,c=Infinity,d=-Infinity,e=-Infinity;return fk(a,function(a,f){a<b&&(b=a),a>d&&(d=a),f<c&&(c=f),f>e&&(e=f)}),[[b,c],[d,e]]};var fl={Feature:fm,FeatureCollection:fn,GeometryCollection:fo,LineString:fp,MultiLineString:fq,MultiPoint:fp,MultiPolygon:fr,Point:fs,Polygon:ft};d3.geo.circle=function(){function e(){}function f(a){return d.distance(a)<c}function h(a){var b=-1,e=a.length,f=[],g,h,j,k,l;while(++b<e)l=d.distance(j=a[b]),l<c?(h&&f.push(fx(h,j)((k-c)/(k-l))),f.push(j),g=h=null):(h=j,!g&&f.length&&(f.push(fx(f[f.length-1],h)((c-k)/(l-k))),g=h)),k=l;return g=a[0],h=f[0],h&&j[0]===g[0]&&j[1]===g[1]&&(j[0]!==h[0]||j[1]!==h[1])&&f.push(h),i(f)}function i(a){var b=0,c=a.length,e,f,g=c?[a[0]]:a,h,i=d.source();while(++b<c){h=d.source(a[b-1])(a[b]).coordinates;for(e=0,f=h.length;++e<f;)g.push(h[e])}return d.source(i),g}var a=[0,0],b=89.99,c=b*fh,d=d3.geo.greatArc().source(a).target(m);e.clip=function(b){return typeof a=="function"&&d.source(a.apply(this,arguments)),g(b)||null};var g=fi({FeatureCollection:function(a){var b=a.features.map(g).filter(m);return b&&(a=Object.create(a),a.features=b,a)},Feature:function(a){var b=g(a.geometry);return b&&(a=Object.create(a),a.geometry=b,a)},Point:function(a){return f(a.coordinates)&&a},MultiPoint:function(a){var b=a.coordinates.filter(f);return b.length&&{type:a.type,coordinates:b}},LineString:function(a){var b=h(a.coordinates);return b.length&&(a=Object.create(a),a.coordinates=b,a)},MultiLineString:function(a){var b=a.coordinates.map(h).filter(function(a){return a.length});return b.length&&(a=Object.create(a),a.coordinates=b,a)},Polygon:function(a){var b=a.coordinates.map(h);return b[0].length&&(a=Object.create(a),a.coordinates=b,a)},MultiPolygon:function(a){var b=a.coordinates.map(function(a){return a.map(h)}).filter(function(a){return a[0].length});return b.length&&(a=Object.create(a),a.coordinates=b,a)},GeometryCollection:function(a){var b=a.geometries.map(g).filter(m);return b.length&&(a=Object.create(a),a.geometries=b,a)}});return e.origin=function(b){return arguments.length?(a=b,typeof a!="function"&&d.source(a),e):a},e.angle=function(a){return arguments.length?(c=(b=+a)*fh,e):b},d3.rebind(e,d,"precision")},d3.geo.greatArc=function(){function g(){var a=g.distance.apply(this,arguments),c=0,h=e/a,i=[b];while((c+=h)<1)i.push(f(c));return i.push(d),{type:"LineString",coordinates:i}}var a=fu,b,c=fv,d,e=6*fh,f=fw();return g.distance=function(){return typeof a=="function"&&f.source(b=a.apply(this,arguments)),typeof c=="function"&&f.target(d=c.apply(this,arguments)),f.distance()},g.source=function(c){return arguments.length?(a=c,typeof a!="function"&&f.source(b=a),g):a},g.target=function(a){return arguments.length?(c=a,typeof c!="function"&&f.target(d=c),g):c},g.precision=function(a){return arguments.length?(e=a*fh,g):e/fh},g},d3.geo.greatCircle=d3.geo.circle,d3.geom={},d3.geom.contour=function(a,b){var c=b||fA(a),d=[],e=c[0],f=c[1],g=0,h=0,i=NaN,j=NaN,k=0;do k=0,a(e-1,f-1)&&(k+=1),a(e,f-1)&&(k+=2),a(e-1,f)&&(k+=4),a(e,f)&&(k+=8),k===6?(g=j===-1?-1:1,h=0):k===9?(g=0,h=i===1?-1:1):(g=fy[k],h=fz[k]),g!=i&&h!=j&&(d.push([e,f]),i=g,j=h),e+=g,f+=h;while(c[0]!=e||c[1]!=f);return d};var fy=[1,0,1,1,-1,0,-1,1,0,0,0,0,-1,0,-1,NaN],fz=[0,-1,0,0,0,-1,0,0,1,-1,1,1,0,-1,0,NaN];d3.geom.hull=function(a){if(a.length<3)return[];var b=a.length,c=b-1,d=[],e=[],f,g,h=0,i,j,k,l,m,n,o,p;for(f=1;f<b;++f)a[f][1]<a[h][1]?h=f:a[f][1]==a[h][1]&&(h=a[f][0]<a[h][0]?f:h);for(f=0;f<b;++f){if(f===h)continue;j=a[f][1]-a[h][1],i=a[f][0]-a[h][0],d.push({angle:Math.atan2(j,i),index:f})}d.sort(function(a,b){return a.angle-b.angle}),o=d[0].angle,n=d[0].index,m=0;for(f=1;f<c;++f)g=d[f].index,o==d[f].angle?(i=a[n][0]-a[h][0],j=a[n][1]-a[h][1],k=a[g][0]-a[h][0],l=a[g][1]-a[h][1],i*i+j*j>=k*k+l*l?d[f].index=-1:(d[m].index=-1,o=d[f].angle,m=f,n=g)):(o=d[f].angle,m=f,n=g);e.push(h);for(f=0,g=0;f<2;++g)d[g].index!==-1&&(e.push(d[g].index),f++);p=e.length;for(;g<c;++g){if(d[g].index===-1)continue;while(!fB(e[p-2],e[p-1],d[g].index,a))--p;e[p++]=d[g].index}var q=[];for(f=0;f<p;++f)q.push(a[e[f]]);return q},d3.geom.polygon=function(a){return a.area=function(){var b=0,c=a.length,d=a[c-1][0]*a[0][1],e=a[c-1][1]*a[0][0];while(++b<c)d+=a[b-1][0]*a[b][1],e+=a[b-1][1]*a[b][0];return(e-d)*.5},a.centroid=function(b){var c=-1,d=a.length,e=0,f=0,g,h=a[d-1],i;arguments.length||(b=-1/(6*a.area()));while(++c<d)g=h,h=a[c],i=g[0]*h[1]-h[0]*g[1],e+=(g[0]+h[0])*i,f+=(g[1]+h[1])*i;return[e*b,f*b]},a.clip=function(b){var c,d=-1,e=a.length,f,g,h=a[e-1],i,j,k;while(++d<e){c=b.slice(),b.length=0,i=a[d],j=c[(g=c.length)-1],f=-1;while(++f<g)k=c[f],fC(k,h,i)?(fC(j,h,i)||b.push(fD(j,k,h,i)),b.push(k)):fC(j,h,i)&&b.push(fD(j,k,h,i)),j=k;h=i}return b},a},d3.geom.voronoi=function(a){var b=a.map(function(){return[]});return fF(a,function(a){var c,d,e,f,g,h;a.a===1&&a.b>=0?(c=a.ep.r,d=a.ep.l):(c=a.ep.l,d=a.ep.r),a.a===1?(g=c?c.y:-1e6,e=a.c-a.b*g,h=d?d.y:1e6,f=a.c-a.b*h):(e=c?c.x:-1e6,g=a.c-a.a*e,f=d?d.x:1e6,h=a.c-a.a*f);var i=[e,g],j=[f,h];b[a.region.l.index].push(i,j),b[a.region.r.index].push(i,j)}),b.map(function(b,c){var d=a[c][0],e=a[c][1];return b.forEach(function(a){a.angle=Math.atan2(a[0]-d,a[1]-e)}),b.sort(function(a,b){return a.angle-b.angle}).filter(function(a,c){return!c||a.angle-b[c-1].angle>1e-10})})};var fE={l:"r",r:"l"};d3.geom.delaunay=function(a){var b=a.map(function(){return[]}),c=[];return fF(a,function(c){b[c.region.l.index].push(a[c.region.r.index])}),b.forEach(function(b,d){var e=a[d],f=e[0],g=e[1];b.forEach(function(a){a.angle=Math.atan2(a[0]-f,a[1]-g)}),b.sort(function(a,b){return a.angle-b.angle});for(var h=0,i=b.length-1;h<i;h++)c.push([e,b[h],b[h+1]])}),c},d3.geom.quadtree=function(a,b,c,d,e){function k(a,b,c,d,e,f){if(isNaN(b.x)||isNaN(b.y))return;if(a.leaf){var g=a.point;g?Math.abs(g.x-b.x)+Math.abs(g.y-b.y)<.01?l(a,b,c,d,e,f):(a.point=null,l(a,g,c,d,e,f),l(a,b,c,d,e,f)):a.point=b}else l(a,b,c,d,e,f)}function l(a,b,c,d,e,f){var g=(c+e)*.5,h=(d+f)*.5,i=b.x>=g,j=b.y>=h,l=(j<<1)+i;a.leaf=!1,a=a.nodes[l]||(a.nodes[l]=fG()),i?c=g:e=g,j?d=h:f=h,k(a,b,c,d,e,f)}var f,g=-1,h=a.length;h&&isNaN(a[0].x)&&(a=a.map(fI));if(arguments.length<5)if(arguments.length===3)e=d=c,c=b;else{b=c=Infinity,d=e=-Infinity;while(++g<h)f=a[g],f.x<b&&(b=f.x),f.y<c&&(c=f.y),f.x>d&&(d=f.x),f.y>e&&(e=f.y);var i=d-b,j=e-c;i>j?e=c+i:d=b+j}var m=fG();return m.add=function(a){k(m,a,b,c,d,e)},m.visit=function(a){fH(a,m,b,c,d,e)},a.forEach(m.add),m},d3.time={};var fJ=Date,fK=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];fL.prototype={getDate:function(){return this._.getUTCDate()},getDay:function(){return this._.getUTCDay()},getFullYear:function(){return this._.getUTCFullYear()},getHours:function(){return this._.getUTCHours()},getMilliseconds:function(){return this._.getUTCMilliseconds()},getMinutes:function(){return this._.getUTCMinutes()},getMonth:function(){return this._.getUTCMonth()},getSeconds:function(){return this._.getUTCSeconds()},getTime:function(){return this._.getTime()},getTimezoneOffset:function(){return 0},valueOf:function(){return this._.valueOf()},setDate:function(){fM.setUTCDate.apply(this._,arguments)},setDay:function(){fM.setUTCDay.apply(this._,arguments)},setFullYear:function(){fM.setUTCFullYear.apply(this._,arguments)},setHours:function(){fM.setUTCHours.apply(this._,arguments)},setMilliseconds:function(){fM.setUTCMilliseconds.apply(this._,arguments)},setMinutes:function(){fM.setUTCMinutes.apply(this._,arguments)},setMonth:function(){fM.setUTCMonth.apply(this._,arguments)},setSeconds:function(){fM.setUTCSeconds.apply(this._,arguments)},setTime:function(){fM.setTime.apply(this._,arguments)}};var fM=Date.prototype,fN="%a %b %e %H:%M:%S %Y",fO="%m/%d/%y",fP="%H:%M:%S",fQ=fK,fR=fQ.map(fU),fS=["January","February","March","April","May","June","July","August","September","October","November","December"],fT=fS.map(fU);d3.time.format=function(a){function c(c){var d=[],e=-1,f=0,g,h;while(++e<b)a.charCodeAt(e)==37&&(d.push(a.substring(f,e),(h=gg[g=a.charAt(++e)])?h(c):g),f=e+1);return d.push(a.substring(f,e)),d.join("")}var b=a.length;return c.parse=function(b){var c={y:1900,m:0,d:1,H:0,M:0,S:0,L:0},d=fV(c,a,b,0);if(d!=b.length)return null;"p"in c&&(c.H=c.H%12+c.p*12);var e=new fJ;return e.setFullYear(c.y,c.m,c.d),e.setHours(c.H,c.M,c.S,c.L),e},c.toString=function(){return a},c};var fY=d3.format("02d"),fZ=d3.format("03d"),f$=d3.format("04d"),f_=d3.format("2d"),ga=fW(fQ),gb=fW(fR),gc=fW(fS),gd=fX(fS),ge=fW(fT),gf=fX(fT),gg={a:function(a){return fR[a.getDay()]},A:function(a){return fQ[a.getDay()]},b:function(a){return fT[a.getMonth()]},B:function(a){return fS[a.getMonth()]},c:d3.time.format(fN),d:function(a){return fY(a.getDate())},e:function(a){return f_(a.getDate())},H:function(a){return fY(a.getHours())},I:function(a){return fY(a.getHours()%12||12)},j:function(a){return fZ(1+d3.time.dayOfYear(a))},L:function(a){return fZ(a.getMilliseconds())},m:function(a){return fY(a.getMonth()+1)},M:function(a){return fY(a.getMinutes())},p:function(a){return a.getHours()>=12?"PM":"AM"},S:function(a){return fY(a.getSeconds())},U:function(a){return fY(d3.time.sundayOfYear(a))},w:function(a){return a.getDay()},W:function(a){return fY(d3.time.mondayOfYear(a))},x:d3.time.format(fO),X:d3.time.format(fP),y:function(a){return fY(a.getFullYear()%100)},Y:function(a){return f$(a.getFullYear()%1e4)},Z:gB,"%":function(a){return"%"}},gh={a:gi,A:gj,b:gk,B:gl,c:gm,d:gt,e:gt,H:gu,I:gu,L:gx,m:gs,M:gv,p:gz,S:gw,x:gn,X:go,y:gq,Y:gp},gy=/^\s*\d+/,gA=d3.map({am:0,pm:1});d3.time.format.utc=function(a){function c(a){try{fJ=fL;var c=new fJ;return c._=a,b(c)}finally{fJ=Date}}var b=d3.time.format(a);return c.parse=function(a){try{fJ=fL;var c=b.parse(a);return c&&c._}finally{fJ=Date}},c.toString=b.toString,c};var gC=d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");d3.time.format.iso=Date.prototype.toISOString?gD:gC,gD.parse=function(a){var b=new Date(a);return isNaN(b)?null:b},gD.toString=gC.toString,d3.time.second=gE(function(a){return new fJ(Math.floor(a/1e3)*1e3)},function(a,b){a.setTime(a.getTime()+Math.floor(b)*1e3)},function(a){return a.getSeconds()}),d3.time.seconds=d3.time.second.range,d3.time.seconds.utc=d3.time.second.utc.range,d3.time.minute=gE(function(a){return new fJ(Math.floor(a/6e4)*6e4)},function(a,b){a.setTime(a.getTime()+Math.floor(b)*6e4)},function(a){return a.getMinutes()}),d3.time.minutes=d3.time.minute.range,d3.time.minutes.utc=d3.time.minute.utc.range,d3.time.hour=gE(function(a){var b=a.getTimezoneOffset()/60;return new fJ((Math.floor(a/36e5-b)+b)*36e5)},function(a,b){a.setTime(a.getTime()+Math.floor(b)*36e5)},function(a){return a.getHours()}),d3.time.hours=d3.time.hour.range,d3.time.hours.utc=d3.time.hour.utc.range,d3.time.day=gE(function(a){var b=new fJ(0,a.getMonth(),a.getDate());return b.setFullYear(a.getFullYear()),b},function(a,b){a.setDate(a.getDate()+b)},function(a){return a.getDate()-1}),d3.time.days=d3.time.day.range,d3.time.days.utc=d3.time.day.utc.range,d3.time.dayOfYear=function(a){var b=d3.time.year(a);return Math.floor((a-b-(a.getTimezoneOffset()-b.getTimezoneOffset())*6e4)/864e5)},fK.forEach(function(a,b){a=a.toLowerCase(),b=7-b;var c=d3.time[a]=gE(function(a){return(a=d3.time.day(a)).setDate(a.getDate()-(a.getDay()+b)%7),a},function(a,b){a.setDate(a.getDate()+Math.floor(b)*7)},function(a){var c=d3.time.year(a).getDay();return Math.floor((d3.time.dayOfYear(a)+(c+b)%7)/7)-(c!==b)});d3.time[a+"s"]=c.range,d3.time[a+"s"].utc=c.utc.range,d3.time[a+"OfYear"]=function(a){var c=d3.time.year(a).getDay();return Math.floor((d3.time.dayOfYear(a)+(c+b)%7)/7)}}),d3.time.week=d3.time.sunday,d3.time.weeks=d3.time.sunday.range,d3.time.weeks.utc=d3.time.sunday.utc.range,d3.time.weekOfYear=d3.time.sundayOfYear,d3.time.month=gE(function(a){return a=d3.time.day(a),a.setDate(1),a},function(a,b){a.setMonth(a.getMonth()+b)},function(a){return a.getMonth()}),d3.time.months=d3.time.month.range,d3.time.months.utc=d3.time.month.utc.range,d3.time.year=gE(function(a){return a=d3.time.day(a),a.setMonth(0,1),a},function(a,b){a.setFullYear(a.getFullYear()+b)},function(a){return a.getFullYear()}),d3.time.years=d3.time.year.range,d3.time.years.utc=d3.time.year.utc.range;var gM=[1e3,5e3,15e3,3e4,6e4,3e5,9e5,18e5,36e5,108e5,216e5,432e5,864e5,1728e5,6048e5,2592e6,7776e6,31536e6],gN=[[d3.time.second,1],[d3.time.second,5],[d3.time.second,15],[d3.time.second,30],[d3.time.minute,1],[d3.time.minute,5],[d3.time.minute,15],[d3.time.minute,30],[d3.time.hour,1],[d3.time.hour,3],[d3.time.hour,6],[d3.time.hour,12],[d3.time.day,1],[d3.time.day,2],[d3.time.week,1],[d3.time.month,1],[d3.time.month,3],[d3.time.year,1]],gO=[[d3.time.format("%Y"),function(a){return!0}],[d3.time.format("%B"),function(a){return a.getMonth()}],[d3.time.format("%b %d"),function(a){return a.getDate()!=1}],[d3.time.format("%a %d"),function(a){return a.getDay()&&a.getDate()!=1}],[d3.time.format("%I %p"),function(a){return a.getHours()}],[d3.time.format("%I:%M"),function(a){return a.getMinutes()}],[d3.time.format(":%S"),function(a){return a.getSeconds()}],[d3.time.format(".%L"),function(a){return a.getMilliseconds()}]],gP=d3.scale.linear(),gQ=gJ(gO);gN.year=function(a,b){return gP.domain(a.map(gL)).ticks(b).map(gK)},d3.time.scale=function(){return gG(d3.scale.linear(),gN,gQ)};var gR=gN.map(function(a){return[a[0].utc,a[1]]}),gS=[[d3.time.format.utc("%Y"),function(a){return!0}],[d3.time.format.utc("%B"),function(a){return a.getUTCMonth()}],[d3.time.format.utc("%b %d"),function(a){return a.getUTCDate()!=1}],[d3.time.format.utc("%a %d"),function(a){return a.getUTCDay()&&a.getUTCDate()!=1}],[d3.time.format.utc("%I %p"),function(a){return a.getUTCHours()}],[d3.time.format.utc("%I:%M"),function(a){return a.getUTCMinutes()}],[d3.time.format.utc(":%S"),function(a){return a.getUTCSeconds()}],[d3.time.format.utc(".%L"),function(a){return a.getUTCMilliseconds()}]],gT=gJ(gS);gR.year=function(a,b){return gP.domain(a.map(gV)).ticks(b).map(gU)},d3.time.scale.utc=function(){return gG(d3.scale.linear(),gR,gT)}})();
//
// this example is based on Tomer Doron's Google Gauge,
// https://github.com/tomerd
//

function Gauge(placeholderName, configuration)
{
	this.placeholderName = placeholderName;

	var self = this; // some internal d3 functions do not "like" the "this" keyword, hence setting a local variable

	this.configure = function(configuration)
	{
		this.config = configuration;

		this.config.size = this.config.size * 0.9;

		this.config.raduis = this.config.size * 0.97 / 2;
		this.config.cx = this.config.size / 2;
		this.config.cy = this.config.size / 2;

		this.config.min = configuration.min || 0; 
		this.config.max = configuration.max || 100; 
		this.config.range = this.config.max - this.config.min;

		this.config.majorTicks = configuration.majorTicks || 5;
		this.config.minorTicks = configuration.minorTicks || 2;

		this.config.greenColor 	= configuration.greenColor || "#109618";		
		this.config.yellowColor = configuration.yellowColor || "#FF9900";		
		this.config.redColor 	= configuration.redColor || "#DC3912";
	}

	this.render = function()
	{
		this.body = d3.select("#" + this.placeholderName)
							.append("svg:svg")
	   						.attr("class", "gauge")
	   						.attr("width", this.config.size)
	   						.attr("height", this.config.size);

		this.body.append("svg:circle")
          .attr("class","outer")
					.attr("cx", this.config.cx)						
					.attr("cy", this.config.cy)								
					.attr("r", this.config.raduis);

		this.body.append("svg:circle")							
          .attr("class","inner")
					.attr("cx", this.config.cx)						
					.attr("cy", this.config.cy)								
					.attr("r", 0.9 * this.config.raduis);

		for (var index in this.config.greenZones)
		{
			this.drawBand(this.config.greenZones[index].from, this.config.greenZones[index].to, self.config.greenColor);
		}

		for (var index in this.config.yellowZones)
		{
			this.drawBand(this.config.yellowZones[index].from, this.config.yellowZones[index].to, self.config.yellowColor);
		}

		for (var index in this.config.redZones)
		{
			this.drawBand(this.config.redZones[index].from, this.config.redZones[index].to, self.config.redColor);
		}

		if (undefined != this.config.label)
		{
			var fontSize = Math.round(this.config.size / 9);
			this.body.append("svg:text")
            .attr("class", "label")
						.attr("x", this.config.cx)
						.attr("y", this.config.cy / 2 + fontSize / 2)			 			
						.attr("dy", fontSize / 2)
						.attr("text-anchor", "middle")
						.text(this.config.label)
						.style("font-size", fontSize + "px");
		}

		var fontSize = Math.round(this.config.size / 16);		
		var majorDelta = this.config.range / (this.config.majorTicks - 1);
		for (var major = this.config.min; major <= this.config.max; major += majorDelta)
		{
			var minorDelta = majorDelta / this.config.minorTicks;
			for (var minor = major + minorDelta; minor < Math.min(major + majorDelta, this.config.max); minor += minorDelta)
			{
				var point1 = this.valueToPoint(minor, 0.75);
				var point2 = this.valueToPoint(minor, 0.85);

				this.body.append("svg:line")
              .attr("class","small-tick")
							.attr("x1", point1.x)
							.attr("y1", point1.y)
							.attr("x2", point2.x)
							.attr("y2", point2.y);
			}

			var point1 = this.valueToPoint(major, 0.7);
			var point2 = this.valueToPoint(major, 0.85);	

			this.body.append("svg:line")
            .attr("class","big-tick")
						.attr("x1", point1.x)
						.attr("y1", point1.y)
						.attr("x2", point2.x)
						.attr("y2", point2.y);

			if (major == this.config.min || major == this.config.max)
			{
				var point = this.valueToPoint(major, 0.63);

				this.body.append("svg:text")
              .attr("class", "limit")
				 			.attr("x", point.x)
				 			.attr("y", point.y)			 			
				 			.attr("dy", fontSize / 3)
				 			.attr("text-anchor", major == this.config.min ? "start" : "end")
				 			.text(major)
				 			.style("font-size", fontSize + "px");

			}
		}		

		var pointerContainer = this.body.append("svg:g").attr("class", "pointerContainer");		
		this.drawPointer(0);
		pointerContainer.append("svg:circle")
              .attr("class", "pointer-circle")
							.attr("cx", this.config.cx)						
							.attr("cy", this.config.cy)								
							.attr("r", 0.12 * this.config.raduis);
	}

	this.redraw = function(value, value_format)
	{
		this.drawPointer(value, value_format);
	}

	this.drawBand = function(start, end, color)
	{
		if (0 >= end - start) return;

		this.body.append("svg:path")
					.style("fill", color)
          .attr("class", "band")
					.attr("d", d3.svg.arc()
						.startAngle(this.valueToRadians(start))
						.endAngle(this.valueToRadians(end))
						.innerRadius(0.80 * this.config.raduis)
						.outerRadius(0.85 * this.config.raduis))
					.attr("transform", function() { return "translate(" + self.config.cx + ", " + self.config.cy + ") rotate(270)" });
	}

	this.drawPointer = function(value, value_format)
	{
		var delta = this.config.range / 13;

		var head = this.valueToPoint(value, 0.85);
		var head1 = this.valueToPoint(value - delta, 0.12);
		var head2 = this.valueToPoint(value + delta, 0.12);

		var tailValue = value -  (this.config.range * (1/(270/360)) / 2);
		var tail = this.valueToPoint(tailValue, 0.28);
		var tail1 = this.valueToPoint(tailValue - delta, 0.12);
		var tail2 = this.valueToPoint(tailValue + delta, 0.12);

		var data = [head, head1, tail2, tail, tail1, head2, head];

		var line = d3.svg.line()
							.x(function(d) { return d.x })
							.y(function(d) { return d.y })
							.interpolate("basis");

		var pointerContainer = this.body.select(".pointerContainer");	

		var pointer = pointerContainer.selectAll("path").data([data])										

		pointer.enter()
				.append("svg:path")
          .attr("class", "pointer")
					.attr("d", line);

		pointer.transition()
					.attr("d", line) 
					//.ease("linear")
					//.duration(5000);

		var fontSize = Math.round(this.config.size / 10);
		pointerContainer.selectAll("text")
							.data([value])
								.text(d3.format(value_format)(value))
							.enter()
								.append("svg:text")
                  .attr("class", "value")
									.attr("x", this.config.cx)
									.attr("y", this.config.size - this.config.cy / 4 - fontSize)			 			
									.attr("dy", fontSize / 2)
									.attr("text-anchor", "middle")
									.text(d3.format(value_format)(value))
									.style("font-size", fontSize + "px");
	}

	this.valueToDegrees = function(value)
	{
		return value / this.config.range * 270 - 45;
	}

	this.valueToRadians = function(value)
	{
		return this.valueToDegrees(value) * Math.PI / 180;
	}

	this.valueToPoint = function(value, factor)
	{
		var point = 
		{
			x: this.config.cx - this.config.raduis * factor * Math.cos(this.valueToRadians(value)),
			y: this.config.cy - this.config.raduis * factor * Math.sin(this.valueToRadians(value))
		}

		return point;
	}

	// initialization
	this.configure(configuration);	
}
;
(function() {
  var Graphene,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Graphene = (function() {

    function Graphene() {
      this.build = __bind(this.build, this);
    }

    Graphene.prototype.demo = function() {
      return this.is_demo = true;
    };

    Graphene.prototype.build = function(json) {
      var _this = this;
      return _.each(_.keys(json), function(k) {
        var klass, model_opts, ts;
        console.log("building [" + k + "]");
        if (_this.is_demo) {
          klass = Graphene.DemoTimeSeries;
        } else {
          klass = Graphene.TimeSeries;
        }
        model_opts = {
          source: json[k].source
        };
        delete json[k].source;
        if (json[k].refresh_interval) {
          model_opts.refresh_interval = json[k].refresh_interval;
          delete json[k].refresh_interval;
        }
        ts = new klass(model_opts);
        return _.each(json[k], function(opts, view) {
          klass = eval("Graphene." + view + "View");
          console.log(_.extend({
            model: ts,
            ymin: _this.getUrlParam(model_opts.source, "yMin"),
            ymax: _this.getUrlParam(model_opts.source, "yMax")
          }, opts));
          new klass(_.extend({
            model: ts,
            ymin: _this.getUrlParam(model_opts.source, "yMin"),
            ymax: _this.getUrlParam(model_opts.source, "yMax")
          }, opts));
          return ts.start();
        });
      });
    };

    Graphene.prototype.discover = function(url, dash, parent_specifier, cb) {
      return $.getJSON("" + url + "/dashboard/load/" + dash, function(data) {
        var desc, i;
        i = 0;
        desc = {};
        _.each(data['state']['graphs'], function(graph) {
          var conf, path, title;
          path = graph[2];
          conf = graph[1];
          title = conf.title ? conf.title : "n/a";
          desc["Graph " + i] = {
            source: "" + url + path + "&format=json",
            TimeSeries: {
              title: title,
              ymin: conf.yMin,
              parent: parent_specifier(i, url)
            }
          };
          return i++;
        });
        return cb(desc);
      });
    };

    Graphene.prototype.getUrlParam = function(url, variable) {
      var query, value, vars;
      value = '';
      query = url.split('?')[1];
      if (!query) return value;
      vars = query.split('&');
      if (!(vars && vars.length > 0)) return value;
      _.each(vars, function(v) {
        var pair;
        pair = v.split('=');
        if (decodeURIComponent(pair[0]) === variable) {
          return value = decodeURIComponent(pair[1]);
        }
      });
      return value;
    };

    return Graphene;

  })();

  this.Graphene = Graphene;

  Graphene.GraphiteModel = (function(_super) {

    __extends(GraphiteModel, _super);

    function GraphiteModel() {
      this.process_data = __bind(this.process_data, this);
      this.refresh = __bind(this.refresh, this);
      this.stop = __bind(this.stop, this);
      this.start = __bind(this.start, this);
      GraphiteModel.__super__.constructor.apply(this, arguments);
    }

    GraphiteModel.prototype.defaults = {
      source: '',
      data: null,
      ymin: 0,
      ymax: 0,
      refresh_interval: 10000
    };

    GraphiteModel.prototype.debug = function() {
      return console.log("" + (this.get('refresh_interval')));
    };

    GraphiteModel.prototype.start = function() {
      this.refresh();
      console.log("Starting to poll at " + (this.get('refresh_interval')));
      return this.t_index = setInterval(this.refresh, this.get('refresh_interval'));
    };

    GraphiteModel.prototype.stop = function() {
      return clearInterval(this.t_index);
    };

    GraphiteModel.prototype.refresh = function() {
      var options, url,
        _this = this;
      url = this.get('source');
      if (-1 === url.indexOf('&jsonp=?')) url = url + '&jsonp=?';
      options = {
        url: url,
        dataType: 'json',
        jsonp: 'jsonp',
        success: function(js) {
          console.log("got data.");
          return _this.process_data(js);
        }
      };
      return $.ajax(options);
    };

    GraphiteModel.prototype.process_data = function() {
      return null;
    };

    return GraphiteModel;

  })(Backbone.Model);

  Graphene.DemoTimeSeries = (function(_super) {

    __extends(DemoTimeSeries, _super);

    function DemoTimeSeries() {
      this.add_points = __bind(this.add_points, this);
      this.refresh = __bind(this.refresh, this);
      this.stop = __bind(this.stop, this);
      this.start = __bind(this.start, this);
      DemoTimeSeries.__super__.constructor.apply(this, arguments);
    }

    DemoTimeSeries.prototype.defaults = {
      range: [0, 1000],
      num_points: 100,
      num_new_points: 1,
      num_series: 2,
      refresh_interval: 3000
    };

    DemoTimeSeries.prototype.debug = function() {
      return console.log("" + (this.get('refresh_interval')));
    };

    DemoTimeSeries.prototype.start = function() {
      var _this = this;
      console.log("Starting to poll at " + (this.get('refresh_interval')));
      this.data = [];
      _.each(_.range(this.get('num_series')), function(i) {
        return _this.data.push({
          label: "Series " + i,
          ymin: 0,
          ymax: 0,
          points: []
        });
      });
      this.point_interval = this.get('refresh_interval') / this.get('num_new_points');
      _.each(this.data, function(d) {
        return _this.add_points(new Date(), _this.get('range'), _this.get('num_points'), _this.point_interval, d);
      });
      this.set({
        data: this.data
      });
      return this.t_index = setInterval(this.refresh, this.get('refresh_interval'));
    };

    DemoTimeSeries.prototype.stop = function() {
      return clearInterval(this.t_index);
    };

    DemoTimeSeries.prototype.refresh = function() {
      var last, num_new_points, start_date,
        _this = this;
      this.data = _.map(this.data, function(d) {
        d = _.clone(d);
        d.points = _.map(d.points, function(p) {
          return [p[0], p[1]];
        });
        return d;
      });
      last = this.data[0].points.pop();
      this.data[0].points.push(last);
      start_date = last[1];
      num_new_points = this.get('num_new_points');
      _.each(this.data, function(d) {
        return _this.add_points(start_date, _this.get('range'), num_new_points, _this.point_interval, d);
      });
      return this.set({
        data: this.data
      });
    };

    DemoTimeSeries.prototype.add_points = function(start_date, range, num_new_points, point_interval, d) {
      var _this = this;
      _.each(_.range(num_new_points), function(i) {
        var new_point;
        new_point = [range[0] + Math.random() * (range[1] - range[0]), new Date(start_date.getTime() + (i + 1) * point_interval)];
        d.points.push(new_point);
        if (d.points.length > _this.get('num_points')) return d.points.shift();
      });
      d.ymin = d3.min(d.points, function(d) {
        return d[0];
      });
      return d.ymax = d3.max(d.points, function(d) {
        return d[0];
      });
    };

    return DemoTimeSeries;

  })(Backbone.Model);

  Graphene.BarChart = (function(_super) {

    __extends(BarChart, _super);

    function BarChart() {
      this.process_data = __bind(this.process_data, this);
      BarChart.__super__.constructor.apply(this, arguments);
    }

    BarChart.prototype.process_data = function(js) {
      var data;
      console.log('process data barchart');
      data = _.map(js, function(dp) {
        var max, min;
        min = d3.min(dp.datapoints, function(d) {
          return d[0];
        });
        if (min === void 0) return null;
        max = d3.max(dp.datapoints, function(d) {
          return d[0];
        });
        if (max === void 0) return null;
        _.each(dp.datapoints, function(d) {
          return d[1] = new Date(d[1] * 1000);
        });
        return {
          points: _.reject(dp.datapoints, function(d) {
            return d[0] === null;
          }),
          ymin: min,
          ymax: max,
          label: dp.target
        };
      });
      data = _.reject(data, function(d) {
        return d === null;
      });
      return this.set({
        data: data
      });
    };

    return BarChart;

  })(Graphene.GraphiteModel);

  Graphene.TimeSeries = (function(_super) {

    __extends(TimeSeries, _super);

    function TimeSeries() {
      this.process_data = __bind(this.process_data, this);
      TimeSeries.__super__.constructor.apply(this, arguments);
    }

    TimeSeries.prototype.process_data = function(js) {
      var data;
      data = _.map(js, function(dp) {
        var last, max, min, _ref;
        min = d3.min(dp.datapoints, function(d) {
          return d[0];
        });
        if (min === void 0) return null;
        max = d3.max(dp.datapoints, function(d) {
          return d[0];
        });
        if (max === void 0) return null;
        last = (_ref = _.last(dp.datapoints)[0]) != null ? _ref : 0;
        if (last === void 0) return null;
        _.each(dp.datapoints, function(d) {
          return d[1] = new Date(d[1] * 1000);
        });
        return {
          points: _.map(dp.datapoints, function(d) {
            d[0] = d[0] === null ? 0 : d[0];
            return d;
          }),
          ymin: min,
          ymax: max,
          last: last,
          label: dp.target
        };
      });
      data = _.reject(data, function(d) {
        return d === null;
      });
      return this.set({
        data: data
      });
    };

    return TimeSeries;

  })(Graphene.GraphiteModel);

  Graphene.GaugeGadgetView = (function(_super) {

    __extends(GaugeGadgetView, _super);

    function GaugeGadgetView() {
      this.render = __bind(this.render, this);
      this.by_type = __bind(this.by_type, this);
      GaugeGadgetView.__super__.constructor.apply(this, arguments);
    }

    GaugeGadgetView.prototype.className = 'gauge-gadget-view';

    GaugeGadgetView.prototype.tagName = 'div';

    GaugeGadgetView.prototype.initialize = function() {
      var config;
      this.title = this.options.title;
      this.type = this.options.type;
      this.parent = this.options.parent || '#parent';
      this.value_format = this.options.value_format || ".3s";
      this.null_value = 0;
      this.from = this.options.from || 0;
      this.to = this.options.to || 100;
      this.observer = this.options.observer;
      this.vis = d3.select(this.parent).append("div").attr("class", "ggview").attr("id", this.title + "GaugeContainer");
      config = {
        size: this.options.size || 120,
        label: this.title,
        minorTicks: 5,
        min: this.from,
        max: this.to
      };
      config.redZones = [];
      config.redZones.push({
        from: this.options.red_from || 0.9 * this.to,
        to: this.options.red_to || this.to
      });
      config.yellowZones = [];
      config.yellowZones.push({
        from: this.options.yellow_from || 0.75 * this.to,
        to: this.options.yellow_to || 0.9 * this.to
      });
      this.gauge = new Gauge("" + this.title + "GaugeContainer", config);
      this.gauge.render();
      this.model.bind('change', this.render);
      return console.log("GG view ");
    };

    GaugeGadgetView.prototype.by_type = function(d) {
      switch (this.type) {
        case "min":
          return d.ymin;
        case "max":
          return d.ymax;
        case "current":
          return d.last;
        default:
          return d.points[0][0];
      }
    };

    GaugeGadgetView.prototype.render = function() {
      var data, datum;
      console.log("rendering.");
      data = this.model.get('data');
      datum = data && data.length > 0 ? data[0] : {
        ymax: this.null_value,
        ymin: this.null_value,
        points: [[this.null_value, 0]]
      };
      if (this.observer) this.observer(this.by_type(datum));
      return this.gauge.redraw(this.by_type(datum), this.value_format);
    };

    return GaugeGadgetView;

  })(Backbone.View);

  Graphene.GaugeLabelView = (function(_super) {

    __extends(GaugeLabelView, _super);

    function GaugeLabelView() {
      this.render = __bind(this.render, this);
      this.by_type = __bind(this.by_type, this);
      GaugeLabelView.__super__.constructor.apply(this, arguments);
    }

    GaugeLabelView.prototype.className = 'gauge-label-view';

    GaugeLabelView.prototype.tagName = 'div';

    GaugeLabelView.prototype.initialize = function() {
      this.unit = this.options.unit;
      this.title = this.options.title;
      this.type = this.options.type;
      this.parent = this.options.parent || '#parent';
      this.value_format = this.options.value_format || ".3s";
      this.value_format = d3.format(this.value_format);
      this.null_value = 0;
      this.observer = this.options.observer;
      this.vis = d3.select(this.parent).append("div").attr("class", "glview");
      if (this.title) {
        this.vis.append("div").attr("class", "label").text(this.title);
      }
      this.model.bind('change', this.render);
      return console.log("GL view ");
    };

    GaugeLabelView.prototype.by_type = function(d) {
      switch (this.type) {
        case "min":
          return d.ymin;
        case "max":
          return d.ymax;
        case "current":
          return d.last;
        default:
          return d.points[0][0];
      }
    };

    GaugeLabelView.prototype.render = function() {
      var data, datum, metric, metric_items, vis,
        _this = this;
      data = this.model.get('data');
      console.log(data);
      datum = data && data.length > 0 ? data[0] : {
        ymax: this.null_value,
        ymin: this.null_value,
        points: [[this.null_value, 0]]
      };
      if (this.observer) this.observer(this.by_type(datum));
      vis = this.vis;
      metric_items = vis.selectAll('div.metric').data([datum], function(d) {
        return _this.by_type(d);
      });
      metric_items.exit().remove();
      metric = metric_items.enter().insert('div', ":first-child").attr('class', "metric" + (this.type ? ' ' + this.type : ''));
      metric.append('span').attr('class', 'value').text(function(d) {
        return _this.value_format(_this.by_type(d));
      });
      if (this.unit) {
        return metric.append('span').attr('class', 'unit').text(this.unit);
      }
    };

    return GaugeLabelView;

  })(Backbone.View);

  Graphene.TimeSeriesView = (function(_super) {

    __extends(TimeSeriesView, _super);

    function TimeSeriesView() {
      this.render = __bind(this.render, this);
      TimeSeriesView.__super__.constructor.apply(this, arguments);
    }

    TimeSeriesView.prototype.tagName = 'div';

    TimeSeriesView.prototype.initialize = function() {
      this.line_height = this.options.line_height || 16;
      this.animate_ms = this.options.animate_ms || 500;
      this.num_labels = this.options.num_labels || 3;
      this.sort_labels = this.options.labels_sort;
      this.display_verticals = this.options.display_verticals || false;
      this.width = this.options.width || 400;
      this.height = this.options.height || 100;
      this.padding = this.options.padding || [this.line_height * 2, 32, this.line_height * (3 + this.num_labels), 32];
      this.title = this.options.title;
      this.label_formatter = this.options.label_formatter || function(label) {
        return label;
      };
      this.firstrun = true;
      this.parent = this.options.parent || '#parent';
      this.null_value = 0;
      this.show_current = this.options.show_current || false;
      this.observer = this.options.observer;
      this.vis = d3.select(this.parent).append("svg").attr("class", "tsview").attr("width", this.width + (this.padding[1] + this.padding[3])).attr("height", this.height + (this.padding[0] + this.padding[2])).append("g").attr("transform", "translate(" + this.padding[3] + "," + this.padding[0] + ")");
      this.value_format = this.options.value_format || ".3s";
      this.value_format = d3.format(this.value_format);
      this.model.bind('change', this.render);
      return console.log("TS view: " + this.width + "x" + this.height + " padding:" + this.padding + " animate: " + this.animate_ms + " labels: " + this.num_labels);
    };

    TimeSeriesView.prototype.render = function() {
      var area, d, data, dmax, dmin, leg_items, line, litem_enters, litem_enters_text, order, points, title, vis, x, xAxis, xmax, xmin, xpoints, xtick_sz, y, yAxis, _ref,
        _this = this;
      console.log("rendering.");
      data = this.model.get('data');
      data = data && data.length > 0 ? data : [
        {
          ymax: this.null_value,
          ymin: this.null_value,
          points: [[this.null_value, 0], [this.null_value, 0]]
        }
      ];
      dmax = _.max(data, function(d) {
        return d.ymax;
      });
      dmax.ymax_graph = this.options.ymax || dmax.ymax;
      dmin = _.min(data, function(d) {
        return d.ymin;
      });
      dmin.ymin_graph = (_ref = this.options.ymin) != null ? _ref : dmin.ymin;
      xpoints = _.flatten((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          d = data[_i];
          _results.push(d.points.map(function(p) {
            return p[1];
          }));
        }
        return _results;
      })());
      xmin = _.min(xpoints, function(x) {
        return x.valueOf();
      });
      xmax = _.max(xpoints, function(x) {
        return x.valueOf();
      });
      x = d3.time.scale().domain([xmin, xmax]).range([0, this.width]);
      y = d3.scale.linear().domain([dmin.ymin_graph, dmax.ymax_graph]).range([this.height, 0]).nice();
      xtick_sz = this.display_verticals ? -this.height : 0;
      xAxis = d3.svg.axis().scale(x).ticks(4).tickSize(xtick_sz).tickSubdivide(true);
      yAxis = d3.svg.axis().scale(y).ticks(4).tickSize(-this.width).orient("left").tickFormat(d3.format("s"));
      vis = this.vis;
      line = d3.svg.line().x(function(d) {
        return x(d[1]);
      }).y(function(d) {
        return y(d[0]);
      });
      area = d3.svg.area().x(function(d) {
        return x(d[1]);
      }).y0(this.height - 1).y1(function(d) {
        return y(d[0]);
      });
      if (this.sort_labels) {
        order = this.sort_labels === 'desc' ? -1 : 1;
        data = _.sortBy(data, function(d) {
          return order * d.ymax;
        });
      }
      if (this.observer) this.observer(data);
      points = _.map(data, function(d) {
        return d.points;
      });
      if (this.firstrun) {
        this.firstrun = false;
        vis.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")").transition().duration(this.animate_ms).call(xAxis);
        vis.append("svg:g").attr("class", "y axis").call(yAxis);
        vis.selectAll("path.line").data(points).enter().append('path').attr("d", line).attr('class', function(d, i) {
          return 'line ' + ("h-col-" + (i + 1));
        });
        vis.selectAll("path.area").data(points).enter().append('path').attr("d", area).attr('class', function(d, i) {
          return 'area ' + ("h-col-" + (i + 1));
        });
        vis.selectAll('circle').data(points[0]).enter().append('circle').attr('r', 5).attr('cx', function(d) {
          return x(d[1]);
        }).attr('cy', function(d) {
          return y(d[0]);
        }).append('title').text(function(d) {
          return d[0];
        });
        if (this.title) {
          title = vis.append('svg:text').attr('class', 'title').attr('transform', "translate(0, -" + this.line_height + ")").text(this.title);
        }
        this.legend = vis.append('svg:g').attr('transform', "translate(0, " + (this.height + this.line_height * 2) + ")").attr('class', 'legend');
      }
      leg_items = this.legend.selectAll('g.l').data(_.first(data, this.num_labels), function(d) {
        return Math.random();
      });
      leg_items.exit().remove();
      litem_enters = leg_items.enter().append('svg:g').attr('transform', function(d, i) {
        return "translate(0, " + (i * _this.line_height) + ")";
      }).attr('class', 'l');
      litem_enters.append('svg:rect').attr('width', 5).attr('height', 5).attr('class', function(d, i) {
        return 'ts-color ' + ("h-col-" + (i + 1));
      });
      litem_enters_text = litem_enters.append('svg:text').attr('dx', 10).attr('dy', 6).attr('class', 'ts-text').text(function(d) {
        return _this.label_formatter(d.label);
      });
      litem_enters_text.append('svg:tspan').attr('class', 'min-tag').attr('dx', 10).text(function(d) {
        return _this.value_format(d.ymin) + "min";
      });
      litem_enters_text.append('svg:tspan').attr('class', 'max-tag').attr('dx', 2).text(function(d) {
        return _this.value_format(d.ymax) + "max";
      });
      if (this.show_current === true) {
        litem_enters_text.append('svg:tspan').attr('class', 'last-tag').attr('dx', 2).text(function(d) {
          return _this.value_format(d.last) + "last";
        });
      }
      vis.transition().ease("linear").duration(this.animate_ms).select(".x.axis").call(xAxis);
      vis.select(".y.axis").call(yAxis);
      vis.selectAll("path.area").data(points).attr("d", area).transition().ease("linear").duration(this.animate_ms);
      return vis.selectAll("path.line").data(points).attr("d", line).transition().ease("linear").duration(this.animate_ms);
    };

    return TimeSeriesView;

  })(Backbone.View);

  Graphene.BarChartView = (function(_super) {

    __extends(BarChartView, _super);

    function BarChartView() {
      this.render = __bind(this.render, this);
      BarChartView.__super__.constructor.apply(this, arguments);
    }

    BarChartView.prototype.tagName = 'div';

    BarChartView.prototype.initialize = function() {
      this.line_height = this.options.line_height || 16;
      this.animate_ms = this.options.animate_ms || 500;
      this.num_labels = this.options.labels || 3;
      this.sort_labels = this.options.labels_sort || 'desc';
      this.display_verticals = this.options.display_verticals || false;
      this.width = this.options.width || 400;
      this.height = this.options.height || 100;
      this.padding = this.options.padding || [this.line_height * 2, 32, this.line_height * (3 + this.num_labels), 32];
      this.title = this.options.title;
      this.label_formatter = this.options.label_formatter || function(label) {
        return label;
      };
      this.firstrun = true;
      this.parent = this.options.parent || '#parent';
      this.null_value = 0;
      this.vis = d3.select(this.parent).append("svg").attr("class", "tsview").attr("width", this.width + (this.padding[1] + this.padding[3])).attr("height", this.height + (this.padding[0] + this.padding[2])).append("g").attr("transform", "translate(" + this.padding[3] + "," + this.padding[0] + ")");
      this.bar_width = Math.min(this.options.bar_width, 1) || 0.50;
      return this.model.bind('change', this.render);
    };

    BarChartView.prototype.render = function() {
      var calculate_bar_width, canvas_height, data, dmax, dmin, points, vis, x, xAxis, xtick_sz, y, yAxis;
      data = this.model.get('data');
      dmax = _.max(data, function(d) {
        return d.ymax;
      });
      dmin = _.min(data, function(d) {
        return d.ymin;
      });
      data = _.sortBy(data, function(d) {
        return 1 * d.ymax;
      });
      points = _.map(data, function(d) {
        return d.points;
      });
      calculate_bar_width = function(points, width, scale) {
        if (scale == null) scale = 1;
        console.log(scale);
        return (width / points[0].length) * scale;
      };
      x = d3.time.scale().domain([data[0].points[0][1], data[0].points[data[0].points.length - 1][1]]).range([0, this.width - calculate_bar_width(points, this.width)]);
      y = d3.scale.linear().domain([dmin.ymin, dmax.ymax]).range([this.height, 0]).nice();
      xtick_sz = this.display_verticals ? -this.height : 0;
      xAxis = d3.svg.axis().scale(x).ticks(4).tickSize(xtick_sz).tickSubdivide(true);
      yAxis = d3.svg.axis().scale(y).ticks(4).tickSize(-this.width).orient("left").tickFormat(d3.format("s"));
      vis = this.vis;
      vis.append("svg:g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")").transition().duration(this.animate_ms).call(xAxis);
      vis.append("svg:g").attr("class", "y axis").call(yAxis);
      canvas_height = this.height;
      if (this.firstrun) {
        this.firstrun = false;
        vis.selectAll("rect").remove();
        vis.selectAll("rect").data(points[0]).enter().append("rect").attr("x", function(d, i) {
          console.log(x(d[1]));
          return x(d[1]);
        }).attr("y", function(d, i) {
          return canvas_height - (canvas_height - y(d[0]));
        }).attr("width", calculate_bar_width(points, this.width, this.bar_width)).attr("height", function(d, i) {
          return canvas_height - y(d[0]);
        }).attr("class", "h-col-1 area");
      }
      vis.selectAll("rect").data(points[0]).transition().ease("linear").duration(250).attr("x", function(d, i) {
        return x(d[1]);
      }).attr("y", function(d, i) {
        return canvas_height - (canvas_height - y(d[0]));
      }).attr("width", calculate_bar_width(points, this.width, this.bar_width)).attr("height", function(d, i) {
        return canvas_height - y(d[0]);
      }).attr("class", "h-col-1 area");
      vis.transition().ease("linear").duration(this.animate_ms).select(".x.axis").call(xAxis);
      vis.select(".y.axis").call(yAxis);
      return console.log("done drawing");
    };

    return BarChartView;

  })(Backbone.View);

}).call(this);







var GRAPHITE_URL = 'http://129.215.193.214/render?from=-1hours&until=now&format=json&';

function createTimeSeries( titleText, datapoint, div, numlabels ) {
  var targets = _.reduce( datapoint, function( state, target ) {
    return state + 'target=' + target + '&';
  }, '');
  return {
    source: GRAPHITE_URL + targets,
    refresh_interval: 60000,
    TimeSeries: {
      parent: div,
      title: titleText,
      ymin: 0,
      width: 300,
      height: 100,
      num_labels: numlabels ? numlabels : '0',
      null_value: 0,
      label_formatter: function( label ) {
        return label.replace( /.*\.(.*)\)$/, '$1' );
      }
    }
  };
}

function createGaugeLabel( titleText, datapoint, div, type ) {
  return {
    source: GRAPHITE_URL + 'target=' + datapoint,
      refresh_interval: 60000,
      GaugeLabel: {
        parent: div,
        title: titleText,
        type: type
      }
  };
}

function maxSeriesTarget( maps, prefix, suffix ) {
  var datapoints = _.reduce( maps, function( state, map ) {
    return state += this.prefix + map + this.suffix + ',';
  }, '', { prefix: prefix, suffix: suffix } );

  return 'maxSeries(' + datapoints.slice( 0, -1 ) + ')';
}

function getText( coord, vis, ts ) {
  var width = ts.width;
  var points = ts.model.attributes.data[0].points;
  var x = _.min( [_.max([coord[0], 0]), width] );
  var position = parseInt( (x / width) * (points.length-1) );
  return points[position];
}

;
