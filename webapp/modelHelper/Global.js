/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/model/Global",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const"
], function (Model, Util, Const) {
	"use strict";
	return {
		getExceptionList: function () {
			return Model.getProperty("/exceptionList");
		},
		setExceptionList: function (aExceptionList) {
			Model.setProperty("/exceptionList", aExceptionList);
			return this;
		},
		getSourceId: function () {
			return Model.getProperty("/sourceId");
		},
		setSourceId: function (sourceId) {
			Model.setProperty("/sourceId", sourceId);
			return this;
		},

		getSourceType: function () {
			return Model.getProperty("/sourceType");
		},
		setSourceType: function (sourceType) {
			Model.setProperty("/sourceType", sourceType);
			return this;
		},
		isSourceTypeODO: function () {
			var sSourceType = this.getSourceType();
			return sSourceType === Const.SOURCE_TYPE_ODO;
		},
		setWarehouseNumber: function (warehouseNumber) {
			Model.setProperty("/warehouseNumber", warehouseNumber);
			return this;
		},
		setDefaultWarehouseNumber: function (warehouseNumber) {
			Model.setProperty("/defaultWarehouseNumber", warehouseNumber);
			return this;
		},
		getDefaultWarehouseNumber: function () {
			return Model.getProperty("/defaultWarehouseNumber");
		},
		
		setPackStation: function (workstation) {
			Model.setProperty("/workstation", workstation);
			return this;
		},
		getWarehouseNumber: function () {
			return Model.getProperty("/warehouseNumber");
		},
		getPackStation: function () {
			return Model.getProperty("/workstation");
		},
		setScaleEnabled: function (bEnable) {
			Model.setProperty("/scaleEnabled", bEnable);
		},
		getScaleEnabled: function (bEnable) {
			return Model.getProperty("/scaleEnabled");
		},
		setCurrentShipHandlingUnit: function (handlingUnitId) {
			Model.setProperty("/currentShipHandlingUnit", handlingUnitId);
			return this;
		},
		getCurrentShipHandlingUnit: function () {
			return Model.getProperty("/currentShipHandlingUnit");
		},
		setCurrentShipHandlingUnitClosed: function (bClosed) {
			Model.setProperty("/currentShipHandlingUnitClosed", bClosed);
			return this;
		},
		getCurrentShipHandlingUnitClosed: function () {
			return Model.getProperty("/currentShipHandlingUnitClosed");
		},
		getShipHandlingUnits: function () {
			return Model.getProperty("/shipHandlingUnits");
		},
		setShipHandlingUnits: function (aHus) {
			Model.setProperty("/shipHandlingUnits", aHus);
			return this;
		},               
		removeAllShipHandlingUnits: function () {
			Model.setProperty("/shipHandlingUnits", []);
			return this;
		},
		removeShipHandlingUnit: function (handlingUnitId) {
			var aHandlingUnit = Model.getProperty("/shipHandlingUnits");
			var iIndex = aHandlingUnit.indexOf(handlingUnitId);

			if (iIndex !== -1) {
				aHandlingUnit.splice(iIndex, 1);
			}
			Model.setProperty("/shipHandlingUnits", aHandlingUnit);
			return this;
		},
		addShipHandlingUnit: function (handlingUnitId) {
			var aHandlingUnit = Model.getProperty("/shipHandlingUnits");
			aHandlingUnit.unshift(handlingUnitId);
			Model.setProperty("/shipHandlingUnits", aHandlingUnit);
			return this;
		},
		changeShipHandlingUnit: function (sOldId, sNewId) {
			var aHandlingUnit = Model.getProperty("/shipHandlingUnits");
			var iIndex = aHandlingUnit.indexOf(sOldId);

			if (iIndex !== -1) {
				aHandlingUnit[iIndex] = sNewId;
			}
			Model.setProperty("/shipHandlingUnits", aHandlingUnit);
			return this;
		},
		setExceptionEnable: function (bExceptionEnable) {
			Model.setProperty("/exceptionEnable", bExceptionEnable);
		},
		getExceptionEnable: function () {
			return Model.getProperty("/exceptionEnable");
		},

		setPackAllEnable: function (bEnable) {
			Model.setProperty("/packAllEnable", bEnable);
		},
		getPackAllEnable: function () {
			return Model.getProperty("/packAllEnable");
		},
		setSourceMaterialId: function (sMaterialId) {
			Model.setProperty("/sourceMaterialId", sMaterialId);
		},
		getSourceMaterialId: function () {
			return Model.getProperty("/sourceMaterialId");
		},
		isShipHandlingUnitExist: function (sHandlingUnitId) {
			var aHandlingUnit = Model.getProperty("/shipHandlingUnits");
			var oResult = Util.find(aHandlingUnit, function (sHandlingUnit) {
				if (sHandlingUnit === sHandlingUnitId) {
					return true;
				}
				return false;
			});
			if (oResult) {
				return true;
			}
			return false;
		},
		isShipHandlingUintActived: function (sHandlingUnitId) {
			var sCurrentShipHUId = this.getCurrentShipHandlingUnit();
			return sCurrentShipHUId === sHandlingUnitId;
		},
		hasOpenShipHandlingUnit: function () {
			var aShipHUs = this.getShipHandlingUnits();
			return aShipHUs.length === 0 ? false : true;
		},
		setBusy: function (bBusy) {
			Model.setProperty("/busy", !!bBusy);
		},
		setCloseShipHUEnable: function (bEnable) {
			Model.setProperty("/closeShipHUEnable", bEnable);
		},
		getCloseShipHUEnable: function () {
			return Model.getProperty("/closeShipHUEnable");
		},
		isOnCloud: function () {
			return Model.getProperty("/isOnCloud");
		},
		setIsOnCloud: function (bOnCloud) {
			Model.setProperty("/isOnCloud", bOnCloud);
			return this;
		},
		setBin: function (sBin) {
			Model.setProperty("/bin", sBin);
			return this;
		},
		getBin: function () {
			return Model.getProperty("/bin");
		},
		setUnpackEnable: function (bValue) {
			Model.setProperty("/unpackEnable", bValue);
			return this;
		},
		getProductId: function () {
			return Model.getProperty("/productId");
		},
		setProductId: function (bValue) {
			Model.setProperty("/productId", bValue);
			return this;
		},
		setAsyncMode: function (bAsync) {
			Model.setProperty("/asyncMode", bAsync);
			return this;
		},
		getAsyncMode: function () {
			return Model.getProperty("/asyncMode");
		},
		getPendingTaskNumber: function () {
			return Model.getProperty("/pendingTaskNumber");
		},
		increasePendingTaskNumber: function () {
			var iNumber = Model.getProperty("/pendingTaskNumber") + 1;
			Model.setProperty("/pendingTaskNumber", iNumber);
			return iNumber;
		},
		decreasePendingTaskNumber: function () {
			var iNumber = Model.getProperty("/pendingTaskNumber") - 1;
			Model.setProperty("/pendingTaskNumber", iNumber > 0 ? iNumber : 0);
			return iNumber;
		},
		resetPendingTaskNumber: function () {
			Model.setProperty("/pendingTaskNumber", 0);
		},
		isPackFromBin: function () {
			return this.getBin() === this.getSourceId();
		},
		//set if a source handling unit/bin or ship handling unit is displaying in the source side
		setIsPickHUInSourceSide: function (bValue) {
			Model.setProperty("/isPickHUInSourceSide", bValue);
		},
		//get if a source handling unit/bin or ship handling unit is displaying in the source side
		getIsPickHUInSourceSide: function () {
			return Model.getProperty("/isPickHUInSourceSide");
		},
		getCheckConsolidationGroup: function () {
			return Model.getProperty("/checkConsolidationGroup");
		},
		setCheckConsolidationGroup: function (bValue) {
			Model.setProperty("/checkConsolidationGroup", bValue);
		},
		setSelectedProductInSource: function(mProduct) {
			Model.setProperty("/selectedProductInSource", mProduct);
		},
		getSelectedProductInSource: function() {
			return Model.getProperty("/selectedProductInSource");
		},
		setSelectedProductInShip: function(mProduct) {
			Model.setProperty("/selectedProductInShip", mProduct);
		},
		getSelectedProductInShip: function() {
			return Model.getProperty("/selectedProductInShip");
		}
	};
});