/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function() {
	"use strict";
	function CustomError(sName, sDescription, vPara) {
		this._sKey = sName;
		this._vPara = vPara;
		this._sDescription = sDescription;
		this._oError = new Error(sName);
		this._bProcessed = false;
	}
	
	jQuery.extend(CustomError.prototype, Error.prototype, {
		constructor: CustomError,
		getKey: function() {
			return this._sKey;
		},
		getDescription: function() {
			return this._sDescription;	
		},
		getParameters: function() {
			return this._vPara;
		},
		setProcessed: function(bProcessed) {
			this._bProcessed = !!bProcessed;
		},
		getProcessed: function() {
			return this._bProcessed;
		}
		
	});
	
	return CustomError;
});