/*
---

script: Document.js

description: Provides a virtual root to all the widgets. DOM-Compatible for Slick traversals.

license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Element
  - LSD.Fragment
  - LSD.Textnode
  - LSD.Instruction
  - LSD.Comment
  - Core/DomReady

provides:
  - LSD.Document

...
*/


/*
  Document is a big disguise proxy class that contains the tree
  of widgets and a link to document element.
  
  It is DOM-compatible (to some degree), so tools that crawl DOM
  tree (we use Slick) can work with the widget tree like it usually
  does with the real DOM so we get selector engine for free.
  
  The document itself is not in the tree, it's a container.
  
  The class contains a few hacks that allows Slick to initialize.
*/

LSD.Document = LSD.Struct.Stack({
  childNodes: LSD.Properties.Children,
  events: LSD.Properties.Events,
  title: 'origin.title',
  origin: function(document, old) {
    if (!this.onDomReady) this.onDomReady = this.onReady.bind(this);
    Element[document ? 'addEvent' : 'removeEvent']((document || old), 'domready', this.onDomReady);
  }
});
LSD.Document.prototype._preconstruct = ['childNodes', 'events'];
LSD.Document.prototype.__initialize = function() {
  var doc = this, proto = LSD.Document.prototype;
  Object.each(LSD.NodeTypes, function(name, type) {
    var Node = LSD.Document.NodeTypes[type] = LSD[name];
    var constructor = function() {
      return Node.apply(doc === this || proto === this ? Node : this, arguments);
    };
    constructor.prototype = new Node;
    constructor.prototype.document = doc;
    LSD.Document.prototype['create' + name] = LSD.Document.prototype[name] = constructor;
    if (type === 3)
      LSD.Document.prototype.createTextNode = LSD.Document.prototype.createText =
      LSD.Document.prototype.TextNode = LSD.Document.prototype.Text = constructor;
  });
  if (!LSD.document) LSD.document = this;
  return LSD.Element.prototype.__initialize.apply(this, arguments);
}
LSD.Document.prototype.onReady = function() {
  this.events.fire('domready', this.origin.body);
  this.set('body', this.createElement(this.origin.body));
};
/*
  The following is a basic set of structures that every
  LSD namespace implements. Those are global objects
  that customize the behavior of widgets by providing 
  reusable pieces of configuration and defining various
  possible collections.
  
  For example LSD.attributes contains functions that are
  called whenever a widget in that namespaces recieves
  by that name. 
  
  LSD.relations provides a set of preconfigured relations 
  that can be further customized for each of the widgets.  
*/
LSD.Document.prototype.mix({
  states:      {
    built:     ['build',      'destroy'],
    hidden:    ['hide',       'show'],
    disabled:  ['disable',    'enable'],
    active:    ['activate',   'deactivate'],
    focused:   ['focus',      'blur'],     
    selected:  ['select',     'unselect'], 
    chosen:    ['choose',     'forget'],
    checked:   ['check',      'uncheck'],
    open:      ['collapse',   'expand'],
    started:   ['start',      'finish'],
    empty:     ['unfill',     'fill'],
    invalid:   ['invalidate', 'validate'],
    editing:   ['edit',       'save'],
    placeheld: ['placehold',  'unplacehold'],
    invoked:   ['invoke',     'revoke']
  },
  attributes:  {
    tabindex:  Number,
    width:     Number,
    height:    Number,
    readonly:  Boolean,
    disabled:  Boolean,
    hidden:    Boolean,
    open:      Boolean,
    checked:   Boolean,
    multiple:  Boolean,
    id:        '.id',
    name:      '.name',
    title:     '.title',
    accesskey: '.accesskey',
    action:    '.action',
    href:      '.href',
    itemtype:  '.itemtype',
    radiogroup:'.radiogroup'
  },
  allocations: {
    lightbox:     'body[type=lightbox]',
    dialog:       'body[type=dialog]',
    contextmenu:  'menu[type=context]',
    toolbar:      'menu[type=toolbar]',
    scrollbar:    'input[type=range][kind=scrollbar]',
    message:      'p.message',
    container:    '.container << :inline',
    submit:       'input[type=submit]'
  },
  layers:      {
    shadow:     ['size', 'radius', 'shape',  'shadow'],
    stroke:     [        'radius', 'stroke', 'shape',  'fill'],
    background: ['size', 'radius', 'stroke', 'offset', 'shape',  'color'],
    foreground: ['size', 'radius', 'stroke', 'offset', 'shape',  'color'],
    reflection: ['size', 'radius', 'stroke', 'offset', 'shape',  'color'],
    icon:       ['size', 'scale',  'color',  'stroke', 'offset', 'shape', 'position', 'shadow'],
    glyph:      ['size', 'scale',  'color',  'stroke', 'offset', 'shape', 'position', 'shadow']
  },
  styles:      {},
  relations:   {},
  properties:  {},
  roles:       {}
});
LSD.NodeTypes = {
  1:  'Element',
  3:  'Textnode',
  5:  'Instruction',
  8:  'Comment',
  11: 'Fragment'
};
LSD.Document.NodeTypes = {};
LSD.Document.prototype.createNode = function(type, element, options) {
  return new (this[LSD.NodeTypes[type]])(element, options)
};