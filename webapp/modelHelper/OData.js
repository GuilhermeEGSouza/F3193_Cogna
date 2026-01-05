/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material"
], function (Util, Const, Global, Material) {
	"use strict";
	var _oModel;
	return {
		init: function (oDataModel) {
			_oModel = oDataModel;
			return this;
		},
		destroy: function () {
			_oModel = null;
		},
		getDefaultBinPath: function (sBin) {
			var sBinEncoded = this.encodeSpecialCharacter(sBin);
			var sPackStation = this.encodeSpecialCharacter(Global.getPackStation());
			var sTemplate = "/PackingStationSet(EWMWarehouse=''{0}'',EWMWorkCenter=''{1}'',EWMStorageBin=''{2}'')";
			return Util.formatText(sTemplate, [Global.getWarehouseNumber(), sPackStation, sBinEncoded]);
		},
		getWorkCenterPath: function (sWorkCenter) {
			var sWorkCenterEncoded = this.encodeSpecialCharacter(sWorkCenter);
			var sTemplate = "/PackingStationSet(EWMWarehouse=''{0}'',EWMWorkCenter=''{1}'',EWMStorageBin='''')";
			return Util.formatText(sTemplate, [Global.getWarehouseNumber(), sWorkCenterEncoded]);
		},
		getWarehousePath: function (sWarehosue) {
			var sTemplate = "/EWMWarehouseVH_Set(EWMWarehouse=''{0}'',EWMWorkCenter='''',EWMStorageBin='''')";
			return Util.formatText(sTemplate, [sWarehosue]);
		},
		getHUPath: function (sHUId, sHUType) {
			if (!sHUId) {
				sHUId = Global.getSourceId();
			}
			if (sHUType === undefined) {
				sHUType = Global.getSourceType();
			}
			sHUId = this.encodeSpecialCharacter(sHUId);
			var sBinEncoded = this.encodeSpecialCharacter(Global.getBin());
			var sWorkCenterEncoded = this.encodeSpecialCharacter(Global.getPackStation());
			var sTemplate = "/HUSet(HuId=''{0}'',EWMStorageBin=''{1}'',EWMWarehouse=''{2}'',EWMWorkCenter=''{3}'',Type=''{4}'')";
			return Util.formatText(sTemplate, [sHUId, sBinEncoded, Global.getWarehouseNumber(), sWorkCenterEncoded, sHUType]);
		},
		getUpdateHUPath: function () {
			var sHuId = this.encodeSpecialCharacter(Global.getCurrentShipHandlingUnit());
			var sWorkCenter = this.encodeSpecialCharacter(Global.getPackStation());
			var sBin = this.encodeSpecialCharacter(Global.getBin());
			var sTemplate = "/HUSet(HuId=''{0}'',EWMWarehouse=''{1}'',EWMWorkCenter=''{2}'',EWMStorageBin=''{3}'',Type=''1'')";
			return Util.formatText(sTemplate, [sHuId, Global.getWarehouseNumber(), sWorkCenter, sBin]);
		},
		getHUInfo: function (sHuId, sType) {
			var sPath = this.getHUPath(sHuId, sType);
			return _oModel.getProperty(sPath);
		},
		getHUItemsPath: function (sHuid, sType) {
			return this.getHUPath(sHuid, sType) + "/Items";
		},
		getPackagingMaterialPath: function () {
			var sWorkCenter = this.encodeSpecialCharacter(Global.getPackStation());
			var sTemplate = "/PackingStationSet(EWMWarehouse=''{0}'',EWMWorkCenter=''{1}'',EWMStorageBin='''')/PackMats";
			return Util.formatText(sTemplate, [Global.getWarehouseNumber(), sWorkCenter]);
		},
		getProductPath: function (sStockItemUUID) {
			var sTemplate = "/ItemSet(guid''{0}'')";
			return Util.formatText(sTemplate, sStockItemUUID);
		},
		getShipHUMaterialId: function (sHuid) {
			var sPath = this.getHUPath(sHuid, Const.SHIP_TYPE_HU) + "/PackagingMaterial";
			return _oModel.getProperty(sPath);
		},
		getPackageMaterial: function () {
			var oMaterial = Material.getCurrentMaterial();
			return oMaterial.PackagingMaterial;
		},
		getExceptionPackParameters: function (oProduct, iQty, sExccode, sUoM) {
			return {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "'" + Global.getSourceId() + "'",
				"ShippingHUId": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"SourceType": "'" + Global.getSourceType() + "'",
				"IsPackAll": false,
				"PackagingMaterial": "'" + this.getPackageMaterial() + "'",
				"Quan": iQty + "M",
				"Exccode": "'" + sExccode + "'",
				"SnList": "'" + oProduct.SnList + "'",
				"StockItemUUID": "guid'" + oProduct.StockItemUUID + "'",
				"AlternativeUnit": sUoM ? "'" + sUoM + "'" : "''",
				"Huident": oProduct.Huident === Global.getBin() ? "''" : "'" + oProduct.Huident + "'"
			};
		},
		getPackParameters: function (oProduct, fQuantity, sUoM) {
			var oParamater = {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "'" + Global.getSourceId() + "'",
				"ShippingHUId": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"SourceType": "'" + Global.getSourceType() + "'",
				"IsPackAll": false,
				"PackagingMaterial": "'" + this.getPackageMaterial() + "'",
				"SnList": "'" + oProduct.SnList + "'",
				"OrdReduction": Util.parseNumber(oProduct.QtyReduced) !== 0 ? true : false,
				"StockItemUUID": "guid'" + oProduct.StockItemUUID + "'",
				"AlternativeUnit": sUoM ? "'" + sUoM + "'" : "''",
				"Huident": oProduct.Huident === Global.getBin() ? "''" : "'" + oProduct.Huident + "'"
			};
			if (fQuantity) {
				oParamater.Quan = fQuantity + "M";
			}
			return oParamater;
		},

		getPackAllParameters: function (aProducts) {
			return {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "'" + Global.getSourceId() + "'",
				"ShippingHUId": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"SourceType": "'" + Global.getSourceType() + "'",
				"IsPackAll": true,
				"PackagingMaterial": "'" + this.getPackageMaterial() + "'",
				"Huident": "''"
			};
		},

		getUnpackParameters: function (oProduct, bNeedQuantity) {
			var oParamater = {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "'" + Global.getSourceId() + "'",
				"ShippingHUId": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"SourceType": "'" + Global.getSourceType() + "'",
				"StockItemUUID": "guid'" + oProduct.StockItemUUID + "'",
				"IsUnPackAll": false,
				"PackagingMaterial": "'" + Global.getSourceMaterialId() + "'"
			};
			if (bNeedQuantity) {
				oParamater.Quan = Util.parseNumber(oProduct.AlterQuan) + "M";
			}
			return oParamater;
		},
		getPrintParameters: function () {
			return {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"HUId": "'" + Global.getCurrentShipHandlingUnit() + "'"
			};
		},

		getUnpackAllParameters: function (aProducts) {
			return {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "'" + Global.getSourceId() + "'",
				"ShippingHUId": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"SourceType": "'" + Global.getSourceType() + "'",
				"IsUnPackAll": true,
				"Quan": "0M",
				"PackagingMaterial": "'" + Global.getSourceMaterialId() + "'"
			};
		},

		getCloseShipHandlingUnitParameters: function () {
			var oParameters = {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"ShippingHUId": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'"
			};
			return oParameters;
		},

		getChangeMaterialParameters: function (sHuId) {
			var oParameters = {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "''",
				"ShippingHUIdOld": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"ShippingHUIdNew": "'" + sHuId + "'",
				"SourceType": "'" + Global.getSourceType() + "'",
				"SourcePackMat": "'" + Global.getSourceMaterialId() + "'",
				"ShippingHUPackMat": "'" + Material.getSelectedMaterialId() + "'"
			};
			return oParameters;
		},
		getVarifyProductEANParameters: function (sValue) {
			var oParameters = {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"ProductName": "'" + sValue + "'"
			};
			return oParameters;
		},
		getDeleteHUParameters: function () {
			var oParameters = {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "''",
				"ShippingHUIdOld": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"ShippingHUIdNew": "''",
				"SourceType": "'" + Global.getSourceType() + "'",
				"SourcePackMat": "'" + Global.getSourceMaterialId() + "'",
				"ShippingHUPackMat": "'" + Material.getSelectedMaterialId() + "'",
				"DeleteShippingHUOnly": "true"
			};
			return oParameters;
		},
		getValidateSnParamters: function (oProduct, sSn) {
			return {
				"EWMWarehouse": "'" + Global.getWarehouseNumber() + "'",
				"EWMWorkCenter": "'" + Global.getPackStation() + "'",
				"EWMStorageBin": "'" + Global.getBin() + "'",
				"SourceId": "'" + Global.getSourceId() + "'",
				"ShippingHUId": "'" + Global.getCurrentShipHandlingUnit() + "'",
				"SourceType": "'" + Global.getSourceType() + "'",
				"DocumentReltdStockDocUUID": "guid'" + oProduct.DocumentReltdStockDocUUID + "'",
				"DocumentReltdStockDocItemUUID": "guid'" + oProduct.DocumentReltdStockDocItemUUID + "'",
				"ProductName": "'" + oProduct.ProductName + "'",
				"EWMSerialNumber": "'" + sSn + "'",
				"StockItemUUID": "guid'" + oProduct.StockItemUUID + "'"
			};
		},
		getScaleWeightData: function () {
			return {
				"EWMWarehouse": Global.getWarehouseNumber(),
				"EWMWorkCenter": Global.getPackStation(),
				"EWMStorageBin": Global.getBin(),
				"Huid": Global.getCurrentShipHandlingUnit()
			};
		},
		encodeSpecialCharacter: function (sInput) {
			if (!Util.isEmpty(sInput)) {
				return encodeURIComponent(sInput);
			} else {
				return sInput;
			}
		},
		isShipHUClosed: function (sHuId) {
			var bClosed = false;
			var mHU;
			sHuId = sHuId ? sHuId : Global.getCurrentShipHandlingUnit();
			if (!Util.isEmpty(sHuId) && (mHU = this.getHUInfo(sHuId, Const.SHIP_TYPE_HU))) {
				bClosed = mHU.Closed;
			}
			return bClosed;
		}
	};
});