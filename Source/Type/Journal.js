/*
---

script: Journal.js

description: An observable object that remembers values

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Object
  - LSD.Struct

provides:
  - LSD.Journal

...
*/

/*
  Journal object is an abstraction that aggregates have its key-values pairs 
  from multiple sources. All calls to `set` and `unset` functions are logged, 
  so when the value gets unset, it returns to previous value 
  (that was set before, possibly by a different external object).
  
  Journal objects are useful in an environment where objects influence state of
  each other, in a possibly circular way. It provides gentle conflict 
  resolution based on order in which values were set. The latest change is more 
  important, but it's easy to roll back. It is possible to insert the value
  into the beginning of the journal, or reverse merge objects persistently. 
  Values set in a reverse mode never overwrite values that were already there,
  and dont fire callbacks for those values. Shadowed values may be used later. 
  When a shadowing value is removed from journal, journal picks the previous
  value. A call to `unset` function  with a value that is on top of the stack
  may result in a call to `set` as a side effect, that sets the previous 
  value in journal. Very handy for live merging of objects.
  
  Setter method also accepts special `prepend` argument. When true it adds
  values to the bottom of the stack. When number, it writes the value into 
  a separate section of a journal by that index. 
  
  Journal setters optionally accepts `old` value that will be removed from 
  the stack. It's a nice little convention that makes all the difference. 
  All callbacks in LSD accept both new and an old value, so when both values 
  are fed to setter, it handles side effects and ensures that a single 
  callback wrote a single value to the journal.
*/

LSD.Journal = function(object) {
  if (object != null) this.mix(object)
};

LSD.Journal.prototype = new LSD.Object;
LSD.Journal.prototype.constructor = LSD.Journal;
LSD.Journal.prototype._hash = function(key, value, old, meta, prepend, index) {
  if (this.__hash) {
    var hash = this.__hash(key, value, old, meta);
    switch (typeof hash) {
      case 'string':
        key = hash;
        hash = index = undefined;
        break;
      case 'boolean':
        return hash;
      case 'object':
        if (hash != null) var group = hash;
    }
  }
  if (hash === undefined && typeof index != 'number') 
    index = key.indexOf('.');
  if (index > -1) return;
/*
  Most of hash table implementations have a simplistic way to delete
  a key - they just erase the value. LSD.Journal's unset function 
  call may result in one of 3 cases

  * Value becomes undefined, like after a `delete object.key` call in
    javascript. It only happens if there was a single logged value by
    that key. Callbacks are called and passed that value as a second
    argument.
  * Value is reverted to previous value on the stack. Callbacks are
    fired with both new and old value as arguments.
  * Value does not change, if the value being unset was not on top of
    the stack. It may also happen if there were two identical values 
    on top of the stack, so removing the top value falls back to the
    same value. Callbacks don't fire.
*/
  var current = this[key];
  var journal = this._journal;
  if (journal) {
    var group = journal[key];
    if (group) {
      var j = group.length;
      if (j && value === undefined)
        for (var k = j; old === undefined && --k > -1;)
          old = group[k];
      var positioned = group.position
    }
  }
  if (typeof prepend == 'number') {
    var position = prepend;
    prepend = false;
  }    
  var chunked = this._chunked;
  if (chunked) chunked = chunked[key];
  if (positioned == null) positioned = -1;
/*
  When Journal setter is given an old value, it removes it from the
  journal. If a new value is not given and the old value was on top
  of the stack, it falls back to a previous value from the stack.
*/  
  if (old !== undefined) {
    var erasing = old === current;
    if (j && position == null)
      for (var i = prepend ? positioned : j;; ) {
        if (prepend ? ++i == j : --i < positioned + 1) break;
        if (group[i] === old) {
          group.splice(i, 1);
          if (i == j - 1) erasing = true;
          break;
        }
      }
    if (old && old[this._trigger] && !old._ignore)
      this._unscript(key, old, meta)
  } else old = current;
  if (position != null) {
    if (!group) {
      if (!journal) journal = this._journal = {};
      group = journal[key] = [current];
    }
    if (position > positioned) {
      for (var i = j; --i > positioned;)
        group[i + position - positioned] = group[i];
      group.position = position;
    }
    if (value !== undefined) 
      group[position] = value;
    else
      delete group[position];
    if (!chunked && j)
      for (var k = j; --k > -1;)
        if (group[k] !== undefined)
          if (value === undefined) {
            value = group[k]
            break;
          } else if (k > position) return true;
          
    if (chunked) 
      return null;
    else if (k > -1)
      return this.set(key, value, undefined, meta, prepend, index, false);
    else
      return;
  }
  if (value !== undefined) {
    if (group || (current !== undefined && !erasing && this.hasOwnProperty(key))) {
      if (!group) {
        if (!journal) journal = this._journal = {};
        group = journal[key] = [current];
      }
      if (prepend) {
        group.splice(positioned + 1, 0, value);
        if (group.length > positioned + 2)
          return true;
      } else {
        group.push(value);
      }
    }
  } else {
    if (j != null) {
      if (i < positioned + 1 || i === j)
        return false;
      else if (!erasing)
        return true;
      else if (j > 1) {
        for (var k = j; k > -1; k--)
          if ((value = group[k]) !== undefined && (!value || !value[this._trigger] || !value._ignore))
            break;
      } else return;
    } else if (old !== current) 
      return false;
    return this.set(key, value, undefined, meta, prepend, index, false);
  }
    
};
/*
  If a given value was transformed and the journal was not initialized yet,
  create a journal and write the given value
*/
LSD.Journal.prototype._finalize = function(key, value, old, meta, prepend, hash, val) {
  if (val === value) return;
  var journal = this._journal;
  var group = journal && journal[key];
  if (!group) (journal || (this._journal = {}))[key] = [val]
}
/*
  LSD.Journal is a subclass of LSD.Object and thus it inherits a method
  named `change` that is an alias to `set` with predefined `old` argument.
  As a LSD.Object method it does nothing of interest, but in LSD.Journal
  it pops the value on top the stack and then adds a new value instead.
  
  The method is useful to alter the value by the key in journalized hash
  from the outside:
    
    object.set('a', 1);             // adds value to stack
    console.log(object._journal.a)  // [1]
    object.set('a', 2);             // adds another value to the stack
    console.log(object._journal.a)  // [1, 2]
    object.change('a', 3);          // changes the value on top of the stack
    console.log(object._journal.a)  // [1, 3]
  
  Change method removes a value on top from the journal, but that may lead to
  unexpected results, if the top value was set by another entity that does
  not expect that value to be removed. It is possible to avoid side-effects
  completely by unsetting specific value that is known to be given by the party
  that invokes `change`. It is easy to do within a callback, because callbacks
  in LSD receive both old and new value:
  
    object.watch('a', function(value, old, meta) {
      object.set('b', value, old, meta);
    })
*/
LSD.Journal.prototype.change = function(key, value, meta, prepend) {
  return this.set(key, value, this[key], meta, prepend);
};
LSD.Struct.implement({
  _skip: {
    _journal: true
  }
}, LSD.Journal.prototype);