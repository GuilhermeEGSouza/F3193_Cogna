/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([],function(){"use strict";function C(n,d,p){this._sKey=n;this._vPara=p;this._sDescription=d;this._oError=new Error(n);this._bProcessed=false;}jQuery.extend(C.prototype,Error.prototype,{constructor:C,getKey:function(){return this._sKey;},getDescription:function(){return this._sDescription;},getParameters:function(){return this._vPara;},setProcessed:function(p){this._bProcessed=!!p;},getProcessed:function(){return this._bProcessed;}});return C;});
