/*
---
 
script: Shape.js
 
description: Draw a widget with any SVG path you want
 
license: MIT-style license.

authors: Yaroslaff Fedin
 
requires:
- ART.Shape
- ART.Widget.Base
provides: [ART.Widget.Trait.Shape]
 
...
*/

ART.Widget.Trait.Shape = new Class({
  options: {
    shape: 'rectangle'
  },
  
  getShape: function(name) {
    if (!this.shape) {
      this.shape = new ART.Shape[(name || this.options.shape).camelCase().capitalize()];
      this.addEvent('redraw', function() {
        var style = this.getChangedStyles('shape', this.shape.properties);
        if (style) this.shape.style = style;
      }.bind(this))
    }
    return this.shape;
  }  
  
});