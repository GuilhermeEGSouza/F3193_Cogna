/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/model/Global",
	"scm/ewm/packoutbdlvs1/utils/Util",
], function (Model, Util) {
	//todo:: consider a more elegant way, or in a more propriate place
	"use strict";
	var _mCache = {};
	return {
		isItemWeightForSpecificPackMatExisted: function (sPackMat) {
			return _mCache[sPackMat] === undefined ? false : true;
		},

		getItemWeightIndex: function (sPackMat, sStockItemUUID) {
			if (!this.isItemWeightForSpecificPackMatExisted(sPackMat)) {
				return -1;
			}

			var aItemWeight = _mCache[sPackMat];
			var iIndex = Util.findIndex(aItemWeight, function (oWeight) {
				if (oWeight.StockItemUUID === sStockItemUUID) {
					return true;
				}
				return false;
			});

			return iIndex;
		},

		isSpecificItemWeightExisted: function (sPackMat, sStockItemUUID) {
			return this.getItemWeightIndex(sPackMat, sStockItemUUID) === -1 ? false : true;
		},

		getItemAlterWeight: function (sPackMat, sStockItemUUID) {
			var iIndex = this.getItemWeightIndex(sPackMat, sStockItemUUID);
			if (iIndex !== -1) {
				var aItemWeight = _mCache[sPackMat];
				return aItemWeight[iIndex].AlterWeight;
			}
			return 0;
		},
		
		getItemWeight: function (sPackMat, sStockItemUUID) {
			var iIndex = this.getItemWeightIndex(sPackMat, sStockItemUUID);
			if (iIndex !== -1) {
				var aItemWeight = _mCache[sPackMat];
				return aItemWeight[iIndex].NetWeight;
			}
			return 0;
		},

		clear: function (sPackMat) {
			_mCache = {};
		},
		addItemWeightForPackMat: function (sPackMat, aItemWeight) {
			var aExstingItemWeight = _mCache[sPackMat];
			if (Util.isEmpty(aExstingItemWeight)) {
				_mCache[sPackMat] = aItemWeight;
				return;
			}

			aItemWeight.forEach(function (oNewItemWeight) {
				var iIndex = this.getItemWeightIndex(sPackMat, oNewItemWeight.StockItemUUID);
				if (iIndex === -1) {
					aExstingItemWeight.push(oNewItemWeight);
				}
			}.bind(this));
		},
		getWeightUOMForSpecificPackMat: function (sPackMat) {
			if (!this.isItemWeightForSpecificPackMatExisted(sPackMat)) {
				return "";
			}
			return _mCache[sPackMat][0].UoM;

		},
		getObject_Cache:function()
		{
			return _mCache;
		},
		setObject_Cache:function(oData)
		{
			_mCache = oData;
		}

	};
});