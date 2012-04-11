/*
---

script: ClassList.js

description: Base objects for accessories holders - attributes, classes, dataset

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Struct

provides:
  - LSD.Properties.ClassList

...
*/

LSD.Properties.ClassList = LSD.Struct({
  _name: '.className'
}, 'Journal');
LSD.Properties.ClassList.prototype.onChange = function(key, value, memo, old) {
  if (key == '_name') return value || old;
  var owner = this._owner, ns = owner.document || LSD.Document.prototype;
  if ((!memo || memo !== 'states') && ns.states[key])
    owner.mix(key, true, 'classes', old);
  var index = (' ' + this._name + ' ').indexOf(' ' + key + ' ');
  if (value && index == -1) this.set('_name', this._name.length ? this._name + ' ' + key : key);
  else if (old && index > -1) this.set('_name', this._name.substring(0, index - 1) + this._name.substring(key.length));
  var element = owner.element;
  if (element) element.className = this._name
  if (owner.matches) {
    if (value != null) owner.matches.add('classes', key, value);
    if (old != null) owner.matches.remove('classes', key, old);
  }
  return value || old;
};
LSD.Properties.ClassList.prototype._name = '';
LSD.Properties.ClassList.prototype.contains =function(name) {
  return this[name];
};
LSD.Properties.ClassList.prototype.add = function(name) {
  return this.set(name, true);
};
LSD.Properties.ClassList.prototype.remove = function(name) {
  return this.unset(name, true);
};
