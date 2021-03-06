/*
---

script: Microdata.js

description: DOM-embedded typed data objects 

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Struct

provides:
  - LSD.Properties.Microdata

...
*/

LSD.Properties.Microdata = LSD.Struct('Data');
LSD.Properties.Microdata.prototype.onChange = function(key, value, old, meta) {
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  if (meta !== 'microdata' && meta !== 'textContent') {
    if (!this._elements) return;
    var element = this._elements[key];
    var storage = this._values;
    if (!storage) storage = this._values = {};
    if (odef && old !== storage[key]) odef = old = undefined;
    if (typeof storage[key] == 'undefined' ? !vdef || value === element.nodeValue : !odef) return;
    if (vdef) storage[key] = value;
    else delete storage[key];
    element.mix('nodeValue', value, old, 'microdata');
  }
}
LSD.Properties.Microdata.prototype._script = function(key, value, meta) {
  var storage = this._elements;
  if (!storage) storage = this._elements = {};
  var group = storage[key];
  if (group != null) {
    if (group.push) group.push(value);
    else group = [group, value];
  } else storage[key] = value;
  value.watch('nodeValue', [this, key]);
  return true;
}
LSD.Properties.Microdata.prototype._unscript = function(key, value, meta) {
  var group = this._elements[key];
  value.unwatch('nodeValue', [this, key]);
  return true;
}
LSD.Properties.Microdata.prototype._shared = true;
LSD.Properties.Microdata.prototype._trigger = 'lsd';
LSD.Properties.Microdata.prototype._nonenumerable = LSD.Struct.implement(LSD.Properties.Microdata.prototype._nonenumerable, {
  _values: true,
  _elements: true
})