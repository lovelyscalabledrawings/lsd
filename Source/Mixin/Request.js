/*
---
 
script: Request.js
 
description: Make various requests to back end
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - Core/Request
  - Ext/Request.Form
  - Ext/Request.Auto
  - Ext/document.createFragment
  
provides: 
  - LSD.Mixin.Request
 
...
*/

LSD.Mixin.Request = new Class({
  behaviour: '[action], [src], [href]',
  
  options: {
    request: {
      method: 'get'
    },
    targetAction: 'update',
    states: {
      working: {
        enabler: 'busy',
        disabler: 'idle'
      }
    }
  },
  
  initialize: function() {
    this.parent.apply(this, arguments);
    if (this.attributes.autosend) this.callChain();
  },
  
  send: function() {
		var options = Object.merge({}, this.options.request, {data: this.getRequestData(), url: this.getRequestURL(), method: this.getRequestMethod()});
		for (var i = 0, j = arguments.length, arg, opts; i < j; i++) {
      var arg = arguments[i];
			if (!arg) continue;
			if (typeof arg == 'object') {
		    if (("url" in arg) || ("method" in arg) || ("data" in arg)) opts = arg
				else opts = {data: arg};
      } else if (arg.call) var callback = arg;
    }
    var request = this.getRequest(options);
    if (callback) request.addEvent('complete:once', callback);
    return request.send(options);
  },
  
  getRequest: function(options) {
		var type = this.getRequestType();
    if (!this.request || this.request.type != type) {
      this.request = this[type == 'xhr' ? 'getXHRRequest' : 'getFormRequest'](options)
      if (!this.request.type) {
        this.request.type = type;
        if (!this.events._request) {
          var events = {
            request: 'onRequest',
            complete: 'onRequestComplete',
            success: 'onRequestSuccess',
            failure: 'onRequestFailure'
          };
          this.events._request = this.bindEvents(events);
        }
        if (this.events.request) this.request.addEvents(this.events.request);
        if (this.events.$request) this.request.addEvents(this.events.$request);
        this.request.addEvents(this.events._request)
      }
    }
    return this.request;
  },
  
  onRequestSuccess: function() {
	  if (this.chainPhase == -1 && this.getCommandAction() == 'send') this.callOptionalChain.apply(this, arguments);
  },
  
  onRequest: function() {
    this.busy();
  },
  
  onRequestComplete: function() {
    this.idle();
  },
  
  getRequestData: Macro.defaults(function() {
    return null;
  }),
  
  getXHRRequest: function(options) {
    return new Request.Auto(options);
  },
  
  getFormRequest: function(options) {
    return new Request.Form(options);
  },
  
  getRequestType: function() {
    return this.attributes.transport || this.options.request.type;
  },
  
  getRequestMethod: function() {
    return this.attributes.method || this.options.request.method;
  },
  
  getRequestURL: function() {
    return this.attributes.href || this.attributes.src || this.attributes.action;
  },
  
  isRequestURLLocal: function(base, host) {
    if (!host) host = location.host;
    if (!base) base = location.pathname;
    var url = this.getRequestURL();
    return (url.charAt(0) == "#") || url.match(new RegExp('(?:' + host + ')?' + base + '/?#'));
  },
  
  getCommandAction: function() {
    if (!this.isRequestURLLocal()) return 'send';
  }
});