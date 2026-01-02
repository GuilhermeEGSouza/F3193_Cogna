/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["scm/ewm/packoutbdlvs1/utils/ErrorHandler","scm/ewm/packoutbdlvs1/utils/Util"],function(E,U){"use strict";function W(){this._aHandler=[];this._oErrorHandler=new E();this._oResult=null;}W.prototype.then=function(h,c){this._aHandler.push(h.bind(c));return this;};W.prototype.run=function(p){var t=this;var s={};this._oResult=new Promise(function(r,a){var _=Promise.resolve(p);this._aHandler.forEach(function(h){_=_.then(function(R){return h(R,s);});});_.then(function(){r();});_.catch(function(e){t._oErrorHandler.catch(e,s);a(e);});}.bind(this));return this;};W.prototype.getResult=function(){return this._oResult;};W.prototype.errors=function(){return this._oErrorHandler;};return W;});
