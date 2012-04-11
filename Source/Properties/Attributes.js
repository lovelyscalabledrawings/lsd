/*
---

script: Attributes.js

description: Base object for attributes dispatch

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Properties
  - LSD.Struct
  - LSD.Journal
  - LSD.Document

provides:
  - LSD.Properties.Classes
  - LSD.Properties.Attributes
  - LSD.Properties.Dataset
  - LSD.Properties.Variables

...
*/

LSD.Properties.Attributes = LSD.Struct(LSD.attributes, 'Journal');
LSD.Properties.Attributes.prototype.onChange = function(key, value, memo, old) {
  var owner = this._owner, ns = owner.document || LSD.Document.prototype;
  var attribute = ns.attributes && ns.attributes[key]
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  if (attribute) {
    if (typeof attribute == 'string') {
      owner.mix(attribute, value, memo, old);
    } else if (value){
      var result = attribute.call(owner, value, old);
      if (typeof result != 'undefined') value = result;
    }
  }
  if (owner.element && (key != 'type' || LSD.toLowerCase(owner.element.tagName) != 'input')) {
    owner.element[key] = vdef;
    if (vdef) owner.element.setAttribute(key, value === true ? key : value);
    else owner.element.removeAttribute(key);
  }
  if (((!memo || memo !== 'states') && ns.states[key]) || owner.__properties[key])
    owner.mix(key, value, 'attributes', old);
  if (key.substr(0, 5) == 'data-')
    owner.mix('variables.' + key.substring(5), value, memo, old);
  if (owner.matches) {
    if (value != null) owner.matches.add('attributes', key, value);
    if (old != null) owner.matches.remove('attributes', key, old);
  }
  return value;
};
LSD.Properties.Attributes.prototype._global = true;
LSD.Properties.Microdata = LSD.Struct();
LSD.Properties.Microdata.prototype.onChange = function(key, value, memo, old) {
  var vdef = typeof value != 'undefined', odef = typeof old != 'undefined';
  if (memo !== 'microdata' && memo !== 'textContent') {
    if (!this._elements) return;
    var element = this._elements[key];
    var storage = this._values;
    if (!storage) storage = this._values = {};
    if (odef && old !== storage[key]) odef = old = undefined;
    if (typeof storage[key] == 'undefined' ? !vdef || value === element.nodeValue : !odef) return;
    if (vdef) storage[key] = value;
    element.mix('nodeValue', value, 'microdata', old);
  }
}
LSD.Properties.Microdata.prototype._trigger = 'lsd';
LSD.Properties.Microdata.prototype._shared = true;
LSD.Properties.Microdata.prototype._script = function(key, value, memo) {
  var storage = this._elements;
  if (!storage) storage = this._elements = {};
  var group = storage[key];
  if (group != null) {
    if (group.push) group.push(value);
    else group = [group, value];
  } else storage[key] = value;
  value.watch('nodeValue', [this, key]);
}
LSD.Properties.Microdata.prototype._unscript = function(key, value, memo) {
  if (this._elements[key] === value) delete this._elements[key];
  else this._elements[key].splice(this._elements[key].indexOf(value), 1);
  value.unwatch('nodeValue', [this, key]);
}
LSD.Properties.Variables = LSD.Struct('Journal');

LSD.Document.prototype.mix('attributes', {
  tabindex:  Number,
  width:     Number,
  height:    Number,
  readonly:  Boolean,
  disabled:  Boolean,
  hidden:    Boolean,
  open:      Boolean,
  checked:   Boolean,
  multiple:  Boolean
})