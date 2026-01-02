/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/controller/WorkFlowController",
	"scm/ewm/packoutbdlvs1/modelHelper/Global",
	"scm/ewm/packoutbdlvs1/service/ODataService",
	"scm/ewm/packoutbdlvs1/modelHelper/Message",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/model/Material",
	"scm/ewm/packoutbdlvs1/modelHelper/Material",
	"scm/ewm/packoutbdlvs1/modelHelper/Items",
	"sap/ui/model/json/JSONModel",
	"scm/ewm/packoutbdlvs1/modelHelper/OData",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Cache",
	"scm/ewm/packoutbdlvs1/utils/CustomError",
	"sap/m/ValueColor",
	"sap/ui/core/ValueState",
	"sap/m/MessageBox",
	"scm/ewm/packoutbdlvs1/modelHelper/ItemWeight",
	"scm/ewm/packoutbdlvs1/model/AdvancedShipTableSetting",
	"scm/ewm/packoutbdlvs1/modelHelper/ColumnSettings",
	"scm/ewm/packoutbdlvs1/modelHelper/PackingMode",
	"scm/ewm/packoutbdlvs1/model/PackingMode",
	"scm/ewm/packoutbdlvs1/model/BasicShipTableSetting",
	"scm/ewm/packoutbdlvs1/model/InternalShipTableSetting"
], function (Controller, Global, Service, Message, Util, MaterialModel, MaterialHelper, TableItemsHelper,
	JSONModel, ODataHelper, Const, Cache, CustomError, ValueColor, ValueState, MessageBox, ItemWeight, AdvancedShipTableSetting,
	ColumnSettingsHelper, PackingMode, PackingModeModel, BasicShipTableSetting, InternalShipTableSetting) {
	"use strict";
	var quantityInput = "quantity_input";
	var tabIdPrefix = "shipHU-";
	var weightChartId = "weight-chart-id";
	var weightComparisonId = "weight-comparison-id";
	var actualWeightId = "actual-weight-input";
	var noMaterialStripId = "empty-material-msg-strip";
	var noChangeStripId = "no-change-strip";
	var emptyMaterialStripId = "empty-material-strip";
	var materialTableId = "packaging-material-table";
	return Controller.extend("scm.ewm.packoutbdlvs1.controller.Right", {
		oItemHelper: new TableItemsHelper(new JSONModel([])),
		oColumnSettingsHelper: new ColumnSettingsHelper(new JSONModel([])),
		init: function () {
			sap.ui.Device.resize.attachHandler(function () {
				this.adjustContainerHeight();
			}.bind(this));
			this.setModel(PackingModeModel, "packMode");
			this.oInitTab = this.getTabByIndex(0);
			this.oInitTab.setText(Const.INIT_TAB_TITLE);

			var oWeightChart = this.getWeightChartByTitle(Const.INIT_TAB_TITLE);
			if (!Util.isEmpty(oWeightChart)) {
				oWeightChart.setTooltip("");
			}

			Util.flushPendings.set(this.flushPendings.bind(this));

			var that = this;
			this.oTemplate = new sap.m.Button({
				type: {
					path: "material>Selected",
					formatter: that.formatMaterialButtonType
				},
				text: {
					parts: [{
						path: "material>DisplayCode"
					}, {
						path: "material>PackagingMaterialDescription"
					}, {
						path: "material>PackagingMaterial"
					}],
					formatter: that.formatFavoriteMaterialText
				},
				enabled: {
					path: "global>/pendingTaskNumber",
					formatter: that.formatSimpleMaterialButtonEnable
				},
				press: that.onPressMaterial.bind(that),
				width: "100%"
			});

			this.setButtonToolTip("delete-ship-unit");
			this.setButtonToolTip("create-ship-unit");
			this.setButtonToolTip("print-button");
			this.setButtonToolTip("unpack-all-button");
			this.setButtonToolTip("unpack-button");
			this.setButtonToolTip("id-weight");
			this.setButtonToolTip("close-ship-hu");
			this.setButtonToolTip("close-closed-ship-hu");
			this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		},
		initModel: function () {
			this.sTableId = "ShipProductTable";
			this.setModel(this.oItemHelper.getModel(), Const.ITEM_MODEL_NAME);
			MaterialModel.setSizeLimit(200);
			this.setModel(MaterialModel, "material");
			this.setModel(this.oColumnSettingsHelper.getModel(), Const.COLUM_SETTING_MODEL_NAME);
		},
		getPersonlServiceContainerItemName: function () {
			if (PackingMode.isAdvancedMode()) {
				return "advancedShipTableSettings";
			} else if (PackingMode.isBasicMode()) {
				return "basicShipTableSettings";
			} else {
				return "internaldShipTableSettings";
			}
		},
		getDefaultColumnSettingNameInService: function () {
			if (PackingMode.isAdvancedMode()) {
				return "advancedShipDefaultSettings";
			} else if (PackingMode.isBasicMode()) {
				return "basicShipDefaultSettings";
			} else {
				return "internalShipDefaultSettings";
			}
		},
		getDefaultColumnSetting: function () {
			if (PackingMode.isAdvancedMode()) {
				return JSON.parse(JSON.stringify(this._mAdvancedShipTableDefaultSettings));
			} else if (PackingMode.isBasicMode()) {
				return JSON.parse(JSON.stringify(this._mBasicShipDefaultDefaultSettings));
			} else {
				return JSON.parse(JSON.stringify(this._mInternalShipTableDefaultSettings));
			}
		},
		getViewName: function () {
			return Const.VIEW_SHIP;
		},
		getTableSettingDialogName: function () {
			return "scm.ewm.packoutbdlvs1.view.ShipTableSettingDialog";
		},

		onAfterRendering: function () {
			this.adjustContainerHeight();
		},
		formatMaterialButtonType: function (bDefault) {
			if (bDefault === true) {
				return sap.m.ButtonType.Emphasized;
			}
			return sap.m.ButtonType.Default;
		},

		onProductItemPressed: function (oEvent) {
			this.oItemHelper.setItemsStatusToNone();
			var oContext = oEvent.getSource().getBindingContext(Const.ITEM_MODEL_NAME);
			var oContextPath = oContext.getPath();
			var oModel = oContext.getModel();
			oModel.setProperty(oContextPath + "/Status", sap.ui.core.MessageType.Success);
			this.focus(quantityInput);
		},

		updateUIElementsAfterCloseShipHU: function (preResult, oParams) {
			//UI update
			var sSuccessMessage;
			this.setBusy(false);
			if (preResult.MsgVar === "") {
				sSuccessMessage = this.getI18nText("closeShippingHU", Global.getCurrentShipHandlingUnit());
				Message.addSuccess(sSuccessMessage);
				this.playAudio(Const.INFO);
			}
			this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
		},

		getVisibleFormElementCount: function (oLeftView) {
			var oContainer = oLeftView.byId("product-info");
			var aElements = oContainer.getFormElements();
			var aVisibleElements = [];
			aElements.forEach(function (oElement) {
				if (oElement.getVisible()) {
					aVisibleElements.push(oElement);
				}
			});
			oContainer = oLeftView.byId("deliver-info");
			if (!Util.isEmpty(oContainer) && oContainer.getVisible()) {
				aElements = oContainer.getFormElements();
				aElements.forEach(function (oElement) {
					if (oElement.getVisible()) {
						aVisibleElements.push(oElement);
					}
				});
			}
			return aVisibleElements.length;
		},
		adjustContainerHeight: function () {
			var oRightView = this.getView();
			if (oRightView && oRightView.getParent()) {
				var oLeftView = oRightView.getParent().getContent()[0];
			} else {
				return;
			}
			var oRightContainer = oRightView.byId("right-container");
			var oLeftContainer = oLeftView.byId("left-container");

			var oLeftContainerElement = document.getElementById(oLeftContainer.getId());
			var oRightContainerElement = document.getElementById(oRightContainer.getId());
			if (!oLeftContainerElement || !oRightContainerElement) {
				return;
			}
			var aProperties = this.getItemProperties();
			if (aProperties.length > 39) {
				oLeftContainer.setHeight("");
				return;
			}
			if (this.getVisibleFormElementCount(oLeftView) > 4) {
				oLeftContainer.setHeight("");
				return;
			}
			var oRightGrid = oRightView.byId("right-grid");
			var oLeftGrid = oLeftView.byId("left-grid");
			var oRightGridElement = document.getElementById(oRightGrid.getId());
			var oLeftGridElement = document.getElementById(oLeftGrid.getId());

			var oShipGrid = oRightView.byId("pod---ship--grid");
			var iRightHeight;
			if (Util.isEmpty(oShipGrid)) {
				iRightHeight = oRightGridElement.offsetTop + oRightGridElement.offsetHeight;
			} else {
				var oShipGridElement = document.getElementById(oShipGrid.getId());
				iRightHeight = oShipGridElement.offsetHeight + oRightGridElement.offsetHeight;
			}
			var iLeftHeight = oLeftGridElement.offsetTop + oLeftGridElement.offsetHeight;

			if (iLeftHeight > iRightHeight) {
				oRightContainer.setHeight(iLeftHeight + "px");
				oLeftContainer.setHeight(iLeftHeight + "px");
			} else {
				oRightContainer.setHeight(iRightHeight + "px");
				oLeftContainer.setHeight(iRightHeight + "px");
			}
		},
		delayCalledAdjustContainerHeight: function () {
			jQuery.sap.delayedCall(0, this, this.adjustContainerHeight);
		},
		getTabByIndex: function (iTabIndex) {
			var oShipHUBar = this.byId("shipHUBar");
			var oTabs = oShipHUBar.getItems();
			return oTabs[iTabIndex];
		},
		getTabId: function (sTabName) {
			var sCharcode = Util.getStringCharCode(sTabName);
			return tabIdPrefix + sCharcode;
		},
		getElementInTab: function (sTab, sElementId) {
			var sId = sap.ui.core.Fragment.createId(this.getTabId(sTab), sElementId);
			return sap.ui.getCore().byId(sId);
		},
		updatePackingInstr: function (sODO, sPackInstr) {
			if (Util.isEmpty(sODO) || Util.isEmpty(sPackInstr)) {
				this.clearPackingInstr();
				return;
			}
			this.setPackingInstrText(sPackInstr);
			var sMsg = this.getI18nText("checkPackingInstr", sODO);
			Message.addSuccess(sMsg);
			this.playAudio(Const.INFO);
		},
		clearPackingInstr: function () {
			this.setPackingInstrText("");
		},
		setPackingInstrText: function (sPackInstr) {
			var sHandlingUnitId = Global.getCurrentShipHandlingUnit();
			if (Util.isEmpty(sHandlingUnitId)) {
				return;
			}
			var oPackInstr = this.getElementInTab(sHandlingUnitId, "id-packing-instruction");
			if (!Util.isEmpty(oPackInstr)) {
				oPackInstr.setText(sPackInstr);
			}
		},
		hasTabByTitle: function (sTabTitle) {
			var iTabIndex = this.getTabIndexByTitle(sTabTitle);
			if (iTabIndex === -1) {
				return false;
			} else {
				return true;
			}
		},
		getTabByTitle: function (sTabTitle) {
			var oShipHUBar = this.byId("shipHUBar");
			var oTabs = oShipHUBar.getItems();
			var iTabIndex = this.getTabIndexByTitle(sTabTitle);
			if (iTabIndex === -1) {
				throw new CustomError();
			} else {
				return oTabs[iTabIndex];
			}
		},
		getTabIndexByTitle: function (sTabTitle) {
			var oShipHUBar = this.byId("shipHUBar");
			var oTabs = oShipHUBar.getItems();
			var that = this;
			var iCurrentTabIndex = Util.findIndex(oTabs, function (oTab) {
				var sText = oTab.getText();
				if (sText === sTabTitle || sText === that.decoratTabtitle(sTabTitle)) {
					return true;
				}
				return false;
			});
			if (iCurrentTabIndex === -1) {
				return -1;
			}
			return iCurrentTabIndex;
		},
		decoratTabtitle: function (sText) {
			return "*" + sText + "*";
		},

		onPressMaterial: function (oEvent) {
			var oButton = oEvent.getSource();
			var sPath = oButton.getBindingContext("material").sPath;
			var sSelectedMaterialId = MaterialHelper.getFavoriteMaterialIdByPath(sPath);
			if (MaterialHelper.IsSelectedMaterialExternal(sSelectedMaterialId)) {
				var sMessage = this.getI18nText("createShipHUContactAdmin");
				this.showErrorMessageBox(sMessage);
				return;
			}
			var sCurrentMaterialId = MaterialHelper.getCurrentMaterialId();
			if (Util.isEmpty(sCurrentMaterialId)) {
				var oCreateInfo = {};
				oCreateInfo.sHuId = "";
				oCreateInfo.sMaterialId = sSelectedMaterialId;
				this.setBusy(true);
				this.getWorkFlowFactory().getShipHUCreationWorkFlow().run(oCreateInfo);
			} else {
				if (sCurrentMaterialId === sSelectedMaterialId) {
					return;
				} else {
					this.setBusy(true);
					MaterialHelper.setSelectedMaterialId(sSelectedMaterialId);
					this.getWorkFlowFactory().getMaterialChangeWorkFlow().run(Global.getCurrentShipHandlingUnit());
				}
			}
		},

		initiateMaterialTable: function (sTableId, iColumns) {
			var oMaterialTable = this.byId(sTableId);
			oMaterialTable.destroyColumns();
			for (var inx = 0; inx < iColumns; inx++) {
				oMaterialTable.addColumn(new sap.m.Column());
			}
		},

		addTooltipToFavoriteMaterial: function (sTableId) {
			var oTable = this.byId(sTableId);
			var aTableItems = oTable.getItems();
			var aMaterials = MaterialHelper.getFavoriteMaterials();
			var idx = 0;
			aTableItems.forEach(function (oItem) {
				var aCells = oItem.getCells();
				aCells.forEach(function (oButton) {
					var oMaterial = aMaterials[idx++];
					var sToolTip = oMaterial.PackagingMaterial;
					if (!Util.isEmpty(oMaterial.PackagingMaterialDescription)) {
						sToolTip += " - " + oMaterial.PackagingMaterialDescription;
					}
					oButton.setTooltip(sToolTip);
				});
			});
		},
		onOpenCreateShipHUDialog: function () {
			return new Promise(function (resolve, reject) {
				var oView = this.getView();
				if (!this.oHandlingUnitDialog) {
					this.oHandlingUnitDialog = sap.ui.xmlfragment(oView.getId(), "scm.ewm.packoutbdlvs1.view.CreateDialog", this);
					this.initiateMaterialTable(materialTableId, 2);
					oView.addDependent(this.oHandlingUnitDialog);
				}
				if (!this.oHandlingUnitDialog.isOpen()) {
					this.updateInputWithDefault(Const.ID.CREATE_SHIP_INPUT, "");
					this.oHandlingUnitDialog.open();
				}
				this.addTooltipToFavoriteMaterial(materialTableId);
			}.bind(this));
		},
		onBeforeOpenCreateDialog: function () {
			var sDefaultMaterialId = MaterialHelper.getDefaultMaterialId();
			if (Util.isEmpty(sDefaultMaterialId)) {
				MaterialHelper.setSelectedMaterialId("");
			} else {
				MaterialHelper.setMaterialPressedById(sDefaultMaterialId, true);
				MaterialHelper.setSelectedMaterialId(sDefaultMaterialId);
			}
		},
		onAfterOpenCreateDialog: function () {
			this.focus(Const.ID.CREATE_SHIP_INPUT);
		},
		onAfterCloseCreateDialog: function () {
			this.getView().getParent().getContent()[0].byId("product-input").focus();
			this.clearComboBox("other-material-combo");
			this.setMessageStripVisible(noMaterialStripId, false);
			MaterialHelper.clearFormerPressedMaterial();
			MaterialHelper.setSelectedMaterialId("");
			this.updateInputWithDefault(Const.ID.CREATE_SHIP_INPUT, "");
		},
		handleButtonsEnableAfterCreate: function (mSource) {
			if (!Util.isEmpty(Global.getSourceId()) && !ODataHelper.isShipHUClosed()) {
				if (mSource.isSingleConsGroupNoReduction && !mSource.isSNEnable) {
					Global.setPackAllEnable(true);
				}
				var sProductId = Global.getProductId();
				if (!Util.isEmpty(sProductId)) {
					Global.setExceptionEnable(true);
				}
			}
			this.handleUnpackEnable();
		},
		needAutoCreateShippingHU: function (sConsGroup) {
			var aShippingHUs = Global.getShipHandlingUnits();
			if (PackingMode.isInternalMode() || !Global.getCheckConsolidationGroup()) {
				if (aShippingHUs.length === 0) {
					return true;
				} else {
					var sOpenHU = Util.find(aShippingHUs, function (sHU) {
						if (!ODataHelper.isShipHUClosed(sHU)) {
							return true;
						}
						return false;
					});
					if (Util.isEmpty(sOpenHU)) {
						return true;
					}
					return false;
				}
			}
			//it is outbound packing
			var bCreate = false;
			if (aShippingHUs.length === 0) {
				//alway pop auto create when there is no ship hu
				bCreate = true;
			} else {
				if (Util.isEmpty(sConsGroup)) {
					//source item is a broken item
					return false;
				} else {
					//source item is a normal item
					var aReleventShippingHUs = this.getShippingHUsByConsolidationGroup(sConsGroup);
					var aEmptyShippingHUs = this.getEmptyShipHus();
					if (aReleventShippingHUs.length === 0 && aEmptyShippingHUs.length === 0) {
						bCreate = true;
					}
				}
			}
			return bCreate;
		},
		onOpenDeleteShipHUDialog: function () {
			var sCurrentHU = Global.getCurrentShipHandlingUnit();
			var sWarning;
			if (this.oItemHelper.isEmpty()) {
				sWarning = this.getTextAccordingToMode("deleteEmptyHU", "deleteEmptyShipHU", [sCurrentHU]);
			} else {
				sWarning = this.getTextAccordingToMode("deleteNonEmptyHU", "deleteNonEmptyShipHU", [sCurrentHU, Global.getSourceId()]);
			}
			MessageBox.warning(
				sWarning, {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							this.setBusy(true);
							var bRefrshSource = false;
							if (!this.oItemHelper.isEmpty()) {
								//if pack from source hu, then deleted items will go back to bin
								//if pack for odo, the deteted items will go back to bin, then app still need to refresh the source
								bRefrshSource = (Global.isPackFromBin() || Global.isSourceTypeODO());
							}

							var oDeleteInfo = {
								"bCallService": true,
								"bRefreshSource": bRefrshSource
							};
							this.getWorkFlowFactory().getShipHUDeleteWorkFlow().run(oDeleteInfo);
						}
					}.bind(this)
				}
			);
			this.playAudio(Const.WARNING);
		},
		deleteCurrentShipHandlingUnit: function () {
			this.oItemHelper.clear();
			var sCurrentShipHU = Global.getCurrentShipHandlingUnit();
			Global.removeShipHandlingUnit(sCurrentShipHU);
			MaterialHelper.setCurrentMaterial({});
		},
		getShippingHUsByConsolidationGroup: function (sConsGroup) {
			var aShippingHandlingUnits = Global.getShipHandlingUnits();
			var aReleventShippingHUs = [];
			aShippingHandlingUnits.forEach(function (sShippingHU) {
				if (Cache.getShipHUConsGroup(sShippingHU) === sConsGroup && !ODataHelper.isShipHUClosed(sShippingHU)) {
					aReleventShippingHUs.push(sShippingHU);
				}
			});
			return aReleventShippingHUs;
		},
		handleUnpackEnable: function () {
			if (Global.getPendingTaskNumber() === 0 && !Global.getCurrentShipHandlingUnitClosed() && !Util.isEmpty(Global.getSourceId()) && !
				this.oItemHelper.isEmpty() && this.oItemHelper.getHighLightedItemIndex() === 0) {
				Global.setUnpackEnable(true);
			} else {
				Global.setUnpackEnable(false);
			}
		},
		autoCreateShipHUAfterClose: function () {
			var sDefaultMaterialId = MaterialHelper.getDefaultMaterialId();
			var sCurrentMaterialId = MaterialHelper.getCurrentMaterialId();
			if (Util.isEmpty(sDefaultMaterialId)) {
				return;
			}
			var oCreateInfo = {};
			oCreateInfo.sHuId = "";
			oCreateInfo.sMaterialId = sDefaultMaterialId;
			this.setBusy(true);
			this.getWorkFlowFactory().getShipHUCreationWorkFlow().run(oCreateInfo);
			MaterialHelper.setFavoriteMaterialSelectedById(sDefaultMaterialId, true);
			MaterialHelper.setFavoriteMaterialSelectedById(sCurrentMaterialId, false);
		},
		//for create ship handling unit dialogue
		onShipHUIDChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			this._changeHandlingUnitId(Const.ID.CREATE_SHIP_INPUT, "create", sInput);
		},
		onShipHUIDSubmit: function (oEvent) {
			if (this.byId(Const.ID.CREATE_SHIP_INPUT).getValueState() === "None") {
				this.byId("create").firePress();
			}
		},
		//for change package material dialogue
		onChangeShippingHUId: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			this._changeHandlingUnitId(Const.ID.CHANGE_SHIP_INPUT, "confirm-change-material-button", sInput);

			if (sInput !== Global.getCurrentShipHandlingUnit()) {
				this.setMessageStripVisible(noChangeStripId, false);
			} else {
				var sErrorMessage = this.getTextAccordingToMode("changeHUMaterialWithOldId", "changeShipHUMaterialWithOldId");
				this.updateInputWithError(Const.ID.CHANGE_SHIP_INPUT, sErrorMessage);
				this.playAudio(Const.ERROR);
			}
		},
		onChangeShippingHUIdSubmit: function () {
			if (this.byId(Const.ID.CHANGE_SHIP_INPUT).getValueState() === "None") {
				this.byId("confirm-change-material-button").firePress();
			}
		},
		_changeHandlingUnitId: function (sInputId, sConfirmButtonId, sInput) {
			if (Util.isEmpty(MaterialHelper.getSelectedMaterialId())) {
				this.updateInputWithDefault(sInputId, sInput);
			} else if (MaterialHelper.IsSelectedMaterialExternal()) {
				if (sInput === "") {
					this.updateInputWithError(sInputId);
					this.playAudio(Const.ERROR);
					return;
				} else {
					this.updateInputWithDefault(sInputId, sInput);
				}
			} else {
				this.updateInputWithDefault(sInputId, sInput);
			}
		},
		onToggleMaterial: function (oEvent) {
			var oButton = oEvent.getSource();
			var oContext = oButton.getBindingContext("material");
			var sPath = oContext.sPath;
			if (oButton.getPressed()) {
				MaterialHelper.clearFormerPressedMaterial();
				var sMaterialId = MaterialHelper.getMaterialIdByPath(sPath);
				MaterialHelper.setSelectedMaterialId(sMaterialId);
				this.setMessageStripVisible(noMaterialStripId, false);
				this.clearComboBox("other-material-combo");
			} else {
				MaterialHelper.setSelectedMaterialId("");
			}
			this.focus(Const.ID.CREATE_SHIP_INPUT);
		},
		onSelectOtherMaterial: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue"));
			setTimeout(function () {
				var oElement = this.byId("other-material-combo");
				var sMaterialId = oElement.getSelectedKey();
				if (!Util.isEmpty(sMaterialId)) {
					this.updateInputWithDefault("other-material-combo");
					MaterialHelper.clearFormerPressedMaterial();
					MaterialHelper.setSelectedMaterialId(sMaterialId);
					this.setMessageStripVisible(noMaterialStripId, false);
				} else {
					if (!Util.isEmpty(sInput)) {
						this.updateInputWithError("other-material-combo", this.getI18nText("incorrectMaterial"));
					}
				}
			}.bind(this), 0);
		},
		onCreateShippingHU: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var oInput = this.getView().byId(Const.ID.CREATE_SHIP_INPUT);
			var sHuId = oInput.getValue();
			var sMaterialId = MaterialHelper.getSelectedMaterialId();
			if (Util.isEmpty(sMaterialId)) {
				this.setMessageStripVisible(noMaterialStripId, true);
				this.playAudio(Const.ERROR);
				return;
			} else if (MaterialHelper.IsSelectedMaterialExternal()) {
				if (sHuId === "") {
					this.updateInputWithError(Const.ID.CREATE_SHIP_INPUT);
					this.focus(Const.ID.CREATE_SHIP_INPUT);
					this.playAudio(Const.ERROR);
					return;
				}
			}
			var oCreateInfo = {};
			oCreateInfo.sHuId = sHuId;
			oCreateInfo.sMaterialId = sMaterialId;
			oCreateInfo.oDialog = oDialog;
			oDialog.setBusy(true);
			this.getWorkFlowFactory().getShipHUCreationWorkFlow().run(oCreateInfo);
		},
		onPrint: function () {
			this.getWorkFlowFactory().getPrintWorkFlow().run();
		},
		onRemoveClosedShipHU: function () {
			this.getWorkFlowFactory().getShipHUCloseWorkFlow().run(true);
		},
		/********   Begin Create shipping hu work flow   ********/

		updateParameterAfterCreation: function (preResult, mSession) {
			var sShipHUId = preResult.HuId;
			mSession.sHuId = preResult.HuId;
			mSession.fLoadingWeight = Util.parseNumber(Util.formatNumber(preResult.NetWeight, 2));
			mSession.sWeightUoM = preResult.WeightUoM;
			Global.addShipHandlingUnit(sShipHUId);
			this.setCurrentShipHandlingUnit(sShipHUId);
			MaterialHelper.setCurrentMaterialById(mSession.sMaterialId);
		},
		updateMaterialButtonsAfterCreation: function (sMaterialId) {
			var sDefaultMaterialId = MaterialHelper.getDefaultMaterialId();
			if (!Util.isEmpty(sDefaultMaterialId)) {
				MaterialHelper.setFavoriteMaterialSelectedById(sDefaultMaterialId, false);
			}
			MaterialHelper.setFavoriteMaterialSelectedById(sMaterialId, true);
		},
		updateDataBingdingAfterCreation: function (mSession) {
			this.oItemHelper.clear();
		},
		// simple mode doesn't support exception and unpack
		handlePackAllEnableAfterCreate: function (mSession) {
			if (!Util.isEmpty(Global.getSourceId()) && !ODataHelper.isShipHUClosed()) {
				if (mSession.isSingleConsGroupNoReduction && !mSession.isSNEnable) {
					Global.setPackAllEnable(true);
				}
			}
		},
		createNewTab: function (sTabName, sFragment) {
			return new Promise(function (resolve, reject) {
				var oView = this.getView();
				var oBar = oView.byId("shipHUBar");
				this.oInitTab.setVisible(false);
				var oContent = sap.ui.xmlfragment(this.getTabId(sTabName), sFragment, this);
				oContent.setKey(sTabName);
				oContent.setText(sTabName);
				oBar.insertItem(oContent, 0);
				oBar.setSelectedKey(sTabName);
				this.delayCalledAdjustContainerHeight();
				resolve(sTabName);
			}.bind(this));
		},
		/********    End Create shipping hu work flow   ********/

		onEditMaterial: function (oEvent) {
			var oView = this.getView();
			var oDialog = oView.byId("change-material-dialog");
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(oView.getId(), "scm.ewm.packoutbdlvs1.view.ChangeMaterialDialog", this);
				this.initiateMaterialTable("pack-material-table", 2);
				oView.addDependent(oDialog);
			}
			oDialog.open();
			this.addTooltipToFavoriteMaterial("pack-material-table");
		},
		onBeforeOpenChangeMaterial: function () {
			var sMaterialId = MaterialHelper.getCurrentMaterialId();
			MaterialHelper.setOriginalMaterialId(sMaterialId);
			MaterialHelper.setSelectedMaterialId(sMaterialId);
			if (MaterialHelper.IsMaterialFavorite(sMaterialId)) {
				MaterialHelper.setMaterialPressedById(sMaterialId, true);
			} else {
				var oComboBox = this.getView().byId("change-material-combo");
				oComboBox.setSelectedKey(sMaterialId);
			}
		},
		onAfterOpenChangeMaterial: function () {
			this.focus(Const.ID.CHANGE_SHIP_INPUT);
		},
		onAfterCloseChangeDialog: function () {
			this.clearComboBox("change-material-combo");
			MaterialHelper.clearFormerPressedMaterial();
			MaterialHelper.setSelectedMaterialId("");
			this.setMessageStripVisible(emptyMaterialStripId, false);
			this.setMessageStripVisible(noChangeStripId, false);
			this.setMessageStripVisible(Const.ID.ERROR_MATERIAL_STRIP, false);
			this.updateInputWithDefault(Const.ID.CHANGE_SHIP_INPUT, "");
		},
		onChangeMaterial: function (oEvent) {
			var oDialog = oEvent.getSource().getParent();
			var sHuId = this.getView().byId(Const.ID.CHANGE_SHIP_INPUT).getValue();
			var sCurrentMaterialId = MaterialHelper.getCurrentMaterialId();
			var sMaterialId = MaterialHelper.getSelectedMaterialId();
			var sCurrentShipHUId = Global.getCurrentShipHandlingUnit();
			this.setMessageStripVisible(Const.ID.ERROR_MATERIAL_STRIP, false);
			if (Util.isEmpty(sMaterialId)) {
				this.setMessageStripVisible(emptyMaterialStripId, true);
				return;
			} else if (MaterialHelper.IsSelectedMaterialExternal()) {
				if (sHuId === "") {
					this.updateInputWithError(Const.ID.CHANGE_SHIP_INPUT);
					this.playAudio(Const.ERROR);
					this.focus(Const.ID.CHANGE_SHIP_INPUT);
					return;
				}
			}
			var sOriginalMaterialId = MaterialHelper.getOriginalMaterialId();
			if (sMaterialId === sOriginalMaterialId && sCurrentShipHUId === sHuId) {
				if (!this.getView().byId(noChangeStripId).getVisible()) {
					this.getView().byId(noChangeStripId).setVisible(true);
					this.playAudio(Const.WARNING);
				} else {
					oDialog.close();
				}
				return;
			}
			var oChangeInfo = {};
			oChangeInfo.sHuId = sHuId;
			oChangeInfo.oDialog = oDialog;
			oChangeInfo.bMaterialChanged = (sCurrentMaterialId !== sMaterialId);
			oDialog.setBusy(true);
			this.getWorkFlowFactory().getMaterialChangeWorkFlow().run(oChangeInfo);
		},

		onToggleMaterialInChange: function (oEvent) {
			var oButton = oEvent.getSource();
			var oContext = oButton.getBindingContext("material");
			var sPath = oContext.sPath;
			if (oButton.getPressed()) {
				MaterialHelper.clearFormerPressedMaterial();
				var sMaterialId = MaterialHelper.getMaterialIdByPath(sPath);
				MaterialHelper.setSelectedMaterialId(sMaterialId);
				this.setMessageStripVisible(emptyMaterialStripId, false);
				this.clearComboBox("change-material-combo");
				if (sMaterialId !== MaterialHelper.getOriginalMaterialId()) {
					this.setMessageStripVisible(noChangeStripId, false);
				}
			} else {
				MaterialHelper.setSelectedMaterialId("");
			}
			this.focus(Const.ID.CHANGE_SHIP_INPUT);
		},
		onSelectOtherMaterialInChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue"));
			setTimeout(function () {
				var oElement = this.byId("change-material-combo");
				var sMaterialId = oElement.getSelectedKey();
				if (!Util.isEmpty(sMaterialId)) {
					this.updateInputWithDefault("change-material-combo");
					MaterialHelper.clearFormerPressedMaterial();
					MaterialHelper.setSelectedMaterialId(sMaterialId);
					this.setMessageStripVisible(noMaterialStripId, false);
					if (sMaterialId !== MaterialHelper.getOriginalMaterialId()) {
						this.setMessageStripVisible(noChangeStripId, false);
					}
				} else {
					if (!Util.isEmpty(sInput)) {
						this.updateInputWithError("change-material-combo", this.getI18nText("incorrectMaterial"));
					}
				}
			}.bind(this), 0);
		},

		recreateTab: function (sOldTabName, sNewTabName, bSimple) {
			return new Promise(function (resolve, reject) {
				var oView = this.getView();
				var oBar = oView.byId("shipHUBar");
				if (sOldTabName !== sNewTabName) {
					var iIndex = this.getTabIndexByTitle(sOldTabName);
					var oTab = this.getTabByTitle(sOldTabName);
					oTab.destroy();
					var oContent;
					if (bSimple) {
						oContent = sap.ui.xmlfragment(this.getTabId(sNewTabName), "scm.ewm.packoutbdlvs1.view.SimpleTabContent", this);
					} else {
						oContent = sap.ui.xmlfragment(this.getTabId(sNewTabName), "scm.ewm.packoutbdlvs1.view.TabContent", this);
					}
					oContent.setKey(sNewTabName);
					oContent.setText(sNewTabName);

					oBar.insertItem(oContent, iIndex);
					oBar.setSelectedKey(sNewTabName);
					this.delayCalledAdjustContainerHeight();
					Cache.replaceShipHUConsGroup(sOldTabName, sNewTabName);
				}
				resolve(sNewTabName);
			}.bind(this));
		},

		/********    Begin Change material work flow   ********/
		updateMaterialButtonsAfterChange: function () {
			MaterialHelper.setFavoriteMaterialSelectedById(MaterialHelper.getCurrentMaterialId(), false);
			MaterialHelper.setFavoriteMaterialSelectedById(MaterialHelper.getSelectedMaterialId(), true);
			// MaterialHelper.setSelectedMaterialId("");
		},

		updateCurrentMaterialAfterChange: function () {
			var oMaterial = MaterialHelper.getMaterialById(MaterialHelper.getSelectedMaterialId());
			MaterialHelper.setCurrentMaterial(oMaterial);
		},

		/********    End Change material work flow   ********/

		onCloseCurrentShipHU: function (oEvent) {
			this.getWorkFlowFactory().getShipHUCloseWorkFlow().run();
		},
		formatCloseBtn: function (aShipItem, sCurrentShipHU) {
			if (!Util.isEmpty(sCurrentShipHU)) {
				if (!this.oItemHelper || this.oItemHelper.isEmpty()) {
					Global.setCloseShipHUEnable(false);
					return false;
				}
				Global.setCloseShipHUEnable(true);
				return true;
			}
			Global.setCloseShipHUEnable(false);
			return false;
		},
		removeTabByTabName: function (sTabName) {
			return new Promise(function (resolve, reject) {
				var oTab = this.getTabByTitle(sTabName);
				oTab.destroy();
				this.delayCalledAdjustContainerHeight();
				resolve();
			}.bind(this));
		},
		removeTabAfterClose: function (sShipHU) {
			this.removeTabByTabName(sShipHU)
				.then(function () {
					this.oItemHelper.clear();
				}.bind(this));
		},
		onChangeQuantityPack: function (oEvent) {
			var oSource = oEvent.getSource();
			var sNewValue = Util.trim(oEvent.getParameter("newValue"));

			if (!Util.isEmpty(sNewValue)) {
				//todo:: add a common check NaN
				var iQuantity = Util.parseNumber(sNewValue);
				var sQuantity = Util.formatNumber(iQuantity);
				if (Util.isEmpty(sQuantity) || iQuantity < 0) {
					var sText = this.getI18nText("inputQuantityNotice");
					this.updateInputWithError(oSource, sText);
					this.playAudio(Const.ERROR);
				} else {
					this.updateInputWithDefault(oSource);
					var oProduct = oSource.getBindingContext(Const.ITEM_MODEL_NAME).getObject();
					var oObjectInfo = {
						oProduct: oProduct,
						iQuantity: Util.formatNumber(Util.parseNumber(sNewValue) - Util.parseNumber(oProduct.PreviousAlterQuan), 3),
						mSource: oSource
					};
					if (oObjectInfo.iQuantity !== 0) {
						this.getWorkFlowFactory().getQuantityChangeWorkFlow().run(oObjectInfo);
					}
				}
			} else {
				this.updateInputWithError(oSource);
				this.playAudio(Const.ERROR);
			}
		},
		onActualWeightChangeSimple: function (oEvent) {
			this.checkActualWeight(oEvent, [function () {
				this.setBusy(false);
			}.bind(this)]);
		},
		onActualWeightChangeAdvanced: function (oEvent) {
			this.checkActualWeight(oEvent, [function () {
				return Service.getHUSet(Global.getCurrentShipHandlingUnit(), Const.SHIP_TYPE_HU);
			}, function (oResult) {
				this.setBusy(false);
				var fNetWeight = Util.parseNumber(Util.formatNumber(oResult.NetWeight, 2));
				this.updateNetWeightRelated(fNetWeight, oResult.WeightUoM);
			}.bind(this)]);
		},
		checkActualWeight: function (oEvent, aUpdateCallback) {
			var oInput = oEvent.getSource();
			var sInputValue = Util.trim(oEvent.getParameter("newValue"));
			var bEmptyInput = Util.isEmpty(sInputValue);
			var fWeight = Util.parseNumber(sInputValue);
			var sWeight = Util.formatNumber(fWeight, 3);
			var fMaxWeight = Util.parseNumber(Util.formatNumber(MaterialHelper.getCurrentMaterialMaxWeightTol(), 3));
			var fTareWeight = Util.parseNumber(Util.formatNumber(MaterialHelper.getCurrentMaterialTareWeight(), 3));
			var fMaxWeightWithTare = fMaxWeight + fTareWeight;
			var sError;
			if (bEmptyInput) {
				this.updateInputWithDefault(oInput, "");
			} else if (isNaN(fWeight)) {
				this.updateInputWithError(oInput);
			} else if (fMaxWeight !== 0 && fWeight > fMaxWeightWithTare) {
				sError = this.getI18nText("exceedWeight", [fMaxWeightWithTare]);
				this.updateInputWithError(oInput, sError);
			} else if (fWeight <= 0) {
				sError = this.getI18nText("grossWeightLessThan0Error");
				this.updateInputWithError(oInput, sError);
			} else {
				if (!this.checkQuantityOverflow(fWeight, oInput)) {
					this.updateInputWithDefault(oInput, sWeight);
				}
				var mData = ODataHelper.getHUInfo(Global.getCurrentShipHandlingUnit(), Const.SHIP_TYPE_HU);
				sWeight = Util.parseNumber(oInput.getValue()).toString();
				this.setBusy(true);
				var oPromise = Service.updateHU(mData, sWeight);
				aUpdateCallback.forEach(function (fnCallback) {
					oPromise = oPromise.then(fnCallback);
				});
				oPromise.catch(function () {
					this.setBusy(false);
					this.updateInputWithError(oInput);
				}.bind(this));

			}
			oInput.focus();
		},
		restoreShipHUTabs: function (aShipHUs) {
			this.clearShipHUTabs();
			aShipHUs.forEach(function (oShipHU) {
				this.createNewTab(oShipHU.HuId);
			}.bind(this));
		},
		clearShipHUTabs: function () {
			var oShipHUBar = this.byId("shipHUBar");
			var aTabs = oShipHUBar.getItems();
			if (aTabs.length > 1) {
				//leave init tab alone
				aTabs.splice(aTabs.length - 1, 1);
				aTabs.forEach(function (oTab) {
					oTab.destroy();
				});
			}
		},
		onMaterialQuickView: function (oEvent) {
			var oLink = oEvent.getSource();
			var oView = this.getView();
			var oQuickView = oView.byId("material-quick-view");
			if (!oQuickView) {
				oQuickView = sap.ui.xmlfragment(oView.getId(), "scm.ewm.packoutbdlvs1.view.MaterialQuickView", this);
				oView.addDependent(oQuickView);
			}
			oQuickView.openBy(oLink);
		},
		onGetScaleWeight: function (oEvent) {
			this.setBusy(true);
			Service.getScaleWeight().then(function (oResult) {
				this.setBusy(false);
				var fGrossWeight = Util.parseNumber(Util.formatNumber(oResult.GrossWeight, 2));
				this.updateScaleWeight(fGrossWeight);
				var fNetWeight = Util.parseNumber(Util.formatNumber(oResult.NetWeight, 2));
				this.updateNetWeightRelated(fNetWeight, oResult.UoM);
			}.bind(this)).catch(function () {
				//todo handle error message
				this.setBusy(false);
			}.bind(this));
		},
		formatQuickViewDisplay: function (sI18n, sValue, sUom) {
			var fValue = parseFloat(sValue);
			if (fValue === 0) {
				return sI18n;
			} else {
				sValue = Util.formatNumber(fValue, 3);
				return sI18n + " " + sValue + " " + sUom;
			}
		},
		/********    Begin Update bullet chart   ********/
		//only used in advanced mode, but in multi work flows
		updateNetWeightRelated: function (fWeight, sUOM, sHuId) {
			fWeight = Util.parseNumber(Util.formatNumber(fWeight, 2));
			//update weight chart
			if (Util.isEmpty(sHuId)) {
				sHuId = Global.getCurrentShipHandlingUnit();
			}
			var sId = sap.ui.core.Fragment.createId(this.getTabId(sHuId), weightChartId);
			var oWeightChart = sap.ui.getCore().byId(sId);
			var oActual = oWeightChart.getActual();
			var fMaxWeight = Util.parseNumber(Util.formatNumber(MaterialHelper.getCurrentMaterialMaxWeight(), 2));
			oActual.setColor(this.getWeightChartColor(fWeight, fMaxWeight));
			oActual.setValue(fWeight);
			oWeightChart.setActualValueLabel(Util.formatNumber(fWeight));
			oWeightChart.setTargetValueLabel(Util.formatNumber(oWeightChart.getTargetValue()));
			//update weight chart tool tip
			this.updateWeightChartToolTip(fWeight);

			//update weight comparison form
			sId = sap.ui.core.Fragment.createId(this.getTabId(sHuId), weightComparisonId);
			var oWeightComparisonForm = sap.ui.getCore().byId(sId);
			var oEstimatedWeightElement = oWeightComparisonForm.getFormElements()[0];
			var oEstimatedWeightLabel = oEstimatedWeightElement.getFields()[0];
			if (fWeight !== 0) {
				oEstimatedWeightLabel.setText(Util.formatNumber(fWeight) + " " + sUOM);
			} else {
				oEstimatedWeightLabel.setText("");
			}
		},
		getWeightChartColor: function (fWeight, fMaxWeight) {
			if (fWeight >= fMaxWeight) {
				return ValueColor.Critical;
			}
			return ValueColor.Good;
		},
		updateWeightChartToolTip: function (fWeight) {
			var sCurrentShipHu = Global.getCurrentShipHandlingUnit();
			if (!Util.isEmpty(sCurrentShipHu) && this.hasTabByTitle(sCurrentShipHu)) {
				var sEstimatedWeight = Util.formatNumber(fWeight, 2);
				var sEstimatedUom = MaterialHelper.getCurrentMaterialUom();
				var sCapacity = Util.formatNumber(parseFloat(MaterialHelper.getCurrentMaterialMaxWeight()), 2);
				var sMaximum = Util.formatNumber(parseFloat(MaterialHelper.getCurrentMaterialMaxWeightTol()), 2);
				var sToolTip = this.getI18nText("toolTipTxt", [sEstimatedWeight, sEstimatedUom, sCapacity, sEstimatedUom, sMaximum, sEstimatedUom]);

				var oWeightChart = this.getWeightChartByTitle(sCurrentShipHu);
				oWeightChart.setTooltip(sToolTip); //to do:
			}
		},
		getWeightChartByTitle: function (sTabTitle) {
			var oTab = this.getTabByTitle(sTabTitle);
			return this.getWeightChartInTab(oTab);
		},

		getWeightChartInTab: function (oTab) {
			var oGrid = oTab.getContent()[0];
			var oRightGrid = oGrid.getContent()[1];
			var oWeightChart;
			if (!Util.isEmpty(oRightGrid)) {
				var oFlexBox = oRightGrid.getContent()[0];
				oWeightChart = oFlexBox.getItems()[0];
			}
			return oWeightChart;
		},
		/********    End Update bullet chart   ********/

		onSelectShippingHU: function (oEvent) {
			if(PackingMode.isBasicMode())
			{
				return;
			}
			var sText = oEvent.getParameter("item").getText();
			if (sText === " ") {
				return;
			}
			if (Global.getPendingTaskNumber() > 0) {
				var sCurrentShippingHU = Global.getCurrentShipHandlingUnit();
				oEvent.getSource().setSelectedKey(sCurrentShippingHU);
				return;
			}
			var sShipHU = this.getView().byId("shipHUBar").getSelectedKey();
			this.getWorkFlowFactory().getShipHUSelectionWorkFlow().run(sShipHU);
		},

		onShippingHUChange: function (oEvent) {
			var sInput = Util.trim(oEvent.getParameter("newValue")).toUpperCase();
			this.setBusy(true);
			Service.convertHUID(sInput)
				.then(function (oResult) {
					sInput = oResult.Huident;
					if (Global.isShipHandlingUnitExist(sInput)) {
						if (Global.isShipHandlingUintActived(sInput)) {
							this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
						} else {
							this.getView().byId("shipHUBar").setSelectedKey(sInput);
							this.getWorkFlowFactory().getShipHUSelectionWorkFlow().run(sInput);
							this.updateInputWithDefault(Const.ID.SHIP_INPUT, "");
						}
					} else {
						this.getWorkFlowFactory().getShipHUChangeWorkFlow().run(sInput);
					}
				}.bind(this))
				.finally(function () {
					this.setBusy(false);
				}.bind(this));

		},

		clearActualWeight: function (sHuId) {
			var sId = sap.ui.core.Fragment.createId(this.getTabId(sHuId), actualWeightId);
			var oInput = sap.ui.getCore().byId(sId);
			this.updateInputWithDefault(oInput, "");
		},
		getNextProposedShipHUByConsGroup: function (sConsGroup) {
			var aShipHUs = Global.getShipHandlingUnits();
			var iIndex = Util.findIndex(aShipHUs, function (oShipHU) {
				var sShipHUConsGroup = Cache.getShipHUConsGroup(oShipHU);
				if (sShipHUConsGroup === sConsGroup) {
					return true;
				}
				return false;
			});
			var sProposedShipHU = iIndex === -1 ? aShipHUs[0] : aShipHUs[iIndex];
			return sProposedShipHU;
		},
		selectTabByTabName: function (sProposedShipHuId) {
			var oView = this.getView();
			var oBar = oView.byId("shipHUBar");
			oBar.setSelectedKey(sProposedShipHuId);
			this.adjustContainerHeight();
			return this.updateTabContent(sProposedShipHuId);
		},
		updateTabContent: function (sHuid) {
			return new Promise(function (resolve, reject) {
				this.setBusy(true);
				Service.getHUItems(sHuid, Const.SHIP_TYPE_HU).then(function (aItems) {
					this.oItemHelper.setItems(aItems);
					this.updateShippingHUMaterial(sHuid);
					this.updateShipItemStatus();
					this.handleButtonsEnableAfterSwitch();

					// var fLoadingWeight = this.getLoadingWeightInCurrentShipHandlingUnit();
					// var sUOM = this.getWeightUOMInCurrentShipHandlingUnit();
					// this.updateNetWeightRelated(fLoadingWeight, sUOM);
					// this.clearGrossWeight();

					this.setBusy(false);
					resolve();
				}.bind(this)).catch(function (error) {
					//todo handle error message
					this.setBusy(false);
					if (!Util.isEmpty(error) && error._sKey === Const.ERRORS.CAN_NOT_FIND_SHIP_HU) {
						this.showErrorMessagePopup(error._sDescription);
					} else {
						reject();
					}
				}.bind(this));
			}.bind(this));
		},
		handleButtonsEnableAfterSwitch: function () {
			if (!Util.isEmpty(Global.getSourceId())) {
				this.publish(Const.EVENT_BUS.CHANNELS.PACKALL_ENABLE, Const.EVENT_BUS.EVENTS.SUCCESS);
			}
			var sProductId = Global.getProductId();
			if (!Util.isEmpty(sProductId)) {
				this.publish(Const.EVENT_BUS.CHANNELS.EXCEPTION_ENABLE, Const.EVENT_BUS.EVENTS.SUCCESS);
			}
			this.handleUnpackEnable();
		},
		updateShippingHUMaterial: function (sHuid) {
			this.setCurrentShipHandlingUnit(sHuid);
			var sMaterialId = ODataHelper.getShipHUMaterialId(sHuid);
			var oMaterial = MaterialHelper.getMaterialById(sMaterialId);
			MaterialHelper.setCurrentMaterial(oMaterial);
		},
		clearComboBox: function (sBoxId) {
			this.getView().byId(sBoxId).clearSelection();
			this.updateInputWithDefault(sBoxId, "");
		},
		setMessageStripVisible: function (sStripId, bVisible) {
			this.getView().byId(sStripId).setVisible(bVisible);
		},
		hilightShipHandlingUnitsByConsolidationGroup: function (sCosolidationGroup) {
			this.dehilightShipHandlingUnits();
			var aHandlingUnit = this.getHightlightShipHandlingUnits(sCosolidationGroup);
			if (aHandlingUnit.length > 0) {
				this.hilightShipHandlingUnits(aHandlingUnit);
			}
		},
		hilightShipHandlingUnits: function (aHandlingUnit) {
			var that = this;
			var bDecorated = false;
			aHandlingUnit.forEach(function (sHandlingUnit) {
				var oTab = that.getTabByTitle(sHandlingUnit);
				oTab.data("title", sHandlingUnit);
				oTab.setText(that.decoratTabtitle(sHandlingUnit));
				bDecorated = true;
			});

			function toggle() {
				aHandlingUnit.forEach(function (sHandlingUnit) {
					var oTab = that.getTabByTitle(sHandlingUnit);
					if (bDecorated) {
						oTab.setText(sHandlingUnit);
					} else {
						oTab.setText(that.decoratTabtitle(sHandlingUnit));
					}
				});
				bDecorated = !bDecorated;
				that.delayId = jQuery.sap.delayedCall(1000, null, toggle);

			}
			that.delayId = jQuery.sap.delayedCall(1000, null, toggle);
		},
		getEmptyShipHus: function () {
			var aShippingHandlingUnits = Global.getShipHandlingUnits();
			var aEmptyHUs = [];
			aShippingHandlingUnits.forEach(function (sShippingHU) {
				if (Cache.getIsEmptyHU(sShippingHU)) {
					aEmptyHUs.push(sShippingHU);
				}
			});
			return aEmptyHUs;
		},
		// if has ship hu with same odo then hilight
		// if no ship hu has same odo, then hilight empty hu
		getHightlightShipHandlingUnits: function (sConsGroup) {
			var sCurrentShipGroup = Cache.getShipHUConsGroup(Global.getCurrentShipHandlingUnit());
			//todo consider closed hu
			if (PackingMode.isInternalMode() || !Global.getCheckConsolidationGroup()) {
				return [];
			}

			if (Util.isEmpty(sConsGroup)) {
				//it is a broken item, no suggestionfor it
				return [];
			}

			// it is a normal item
			var aShippingHU = this.getShippingHUsByConsolidationGroup(sConsGroup);
			var aHandlingUnits = [];
			if (aShippingHU.length > 0) {
				aHandlingUnits = aShippingHU;
			} else { //check empty ship hu
				aHandlingUnits = this.getEmptyShipHus();
			}
			//if only one ship hu and it is the active one, then no need to blink
			if (aHandlingUnits.length === 1 && aHandlingUnits[0] === Global.getCurrentShipHandlingUnit()) {
				aHandlingUnits = [];
			}
			return aHandlingUnits;
		},
		dehilightShipHandlingUnits: function () {
			var that = this;
			var aHandlingUnit = Global.getShipHandlingUnits();
			jQuery.sap.clearDelayedCall(that.delayId);
			aHandlingUnit.forEach(function (sHandlingUnit) {
				var oTab = that.getTabByTitle(sHandlingUnit);
				oTab.setText(sHandlingUnit);
			});
		},
		onUnpack: function (oEvent) {
			this.setBusy(true);
			var oProduct = this.oItemHelper.getHighLightedItem();
			this.getWorkFlowFactory().getUnpackWorkFlow().run(oProduct);
		},
		onUnpackAll: function (oEvent) {
			this.setBusy(true);
			var aProducts = this.oItemHelper.getModel().getData();
			this.getWorkFlowFactory().getUnpackAllWorkFlow().run(aProducts);
		},

		updateScaleWeight: function (fWeight) {
			var oTab = this.getTabByTitle(Global.getCurrentShipHandlingUnit());
			var oScaleWeightField = this.getScaleWeightInTab(oTab);
			this.updateInputWithDefault(oScaleWeightField, fWeight);
		},

		getScaleWeightInTab: function (oTab) {
			var oGrid = oTab.getContent()[0];
			var oRightGrid = oGrid.getContent()[1];
			var oForm = oRightGrid.getContent()[1];
			var oFormContainer = oForm.getFormContainers()[0];
			var oScaleWeightElement = oFormContainer.getFormElements()[1];
			var oScaleWeightField = oScaleWeightElement.getFields()[0];
			return oScaleWeightField;
		},
		onHighlightColumnListItem: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext(Const.ITEM_MODEL_NAME);
			if (!Global.getCurrentShipHandlingUnitClosed() && !Util.isEmpty(Global.getSourceId())) {
				this.oItemHelper.setItemsStatusToNone();
				var oContextPath = oContext.getPath();
				var oModel = oContext.getModel();
				oModel.setProperty(oContextPath + "/Status", sap.ui.core.MessageType.Success);

				var highLightedItem_Ship = this.oItemHelper.getHighLightedItem();
				Global.setSelectedProductInShip(highLightedItem_Ship);
			}

		},

		formatShipHUIdRequired: function (sSelectedMaterialId) {
			if (!Util.isEmpty(sSelectedMaterialId) && MaterialHelper.IsSelectedMaterialExternal()) {
				return true;
			}
			return false;
		},
		formatMaterialDisplay: function (sDescription, sMaterialId) {
			if (Util.isEmpty(sDescription)) {
				return sMaterialId;
			}
			return sDescription;
		},
		formatDeleteBtn: function (sShipHU, bShipHUClosed, iPendingTaskNumber) {
			if (bShipHUClosed || iPendingTaskNumber > 0) {
				return false;
			}
			return !Util.isEmpty(sShipHU);
		},
		formatEditIconVisible: function (bClosed, sString) {
			if (Util.isEmpty(sString) || bClosed) {
				return false;
			}
			return true;
		},
		formatCreateButton: function (aFavorite, aOthers, iPendingTaksNumber) {
			var bEnabled = false;
			if (iPendingTaksNumber === 0 && (aFavorite.length > 0 || aOthers.length > 0)) {
				bEnabled = true;
			}
			return bEnabled;
		},
		formatFavoriteMaterialText: function (sMaterialCode, sMaterialName, sMaterialId) {
			if (!Util.isEmpty(sMaterialCode)) {
				return sMaterialCode;
			} else if (!Util.isEmpty(sMaterialName)) {
				return sMaterialName;
			}
			return sMaterialId;
		},
		formatMaterialComboText: function (sMaterialDescription, sMaterialId) {
			if (Util.isEmpty(sMaterialDescription)) {
				return sMaterialId;
			} else {
				return sMaterialId + " - " + sMaterialDescription;
			}
		},
		formatMaterialButtonIcon: function (bPressed) {
			if (bPressed === true) {
				return "sap-icon://accept";
			}
			return "";
		},
		formatShipHUIdEditable: function (bEditable) {
			if (bEditable === false) {
				return true;
			}
			return false;
		},
		formatMaxWeightInChart: function (fValue) {
			return fValue === undefined ? 0 : Util.parseNumber(Util.formatNumber(fValue, 2));
		},
		formatTargetValueDisplay: function (fValue) {
			return fValue !== undefined;
		},
		formatMaxCapacityInfo: function (fMaxWeight, sUom) {
			return fMaxWeight === undefined ? "" : "/" + Util.parseNumber(Util.formatNumber(fMaxWeight, 2)) + " " + sUom;
		},
		formatThreshold: function (sWeight) {
			return Number(sWeight);
		},
		formatPrintText: function (bClosed) {
			var sText;
			if (bClosed) {
				sText = this.getI18nText("reprint");
			} else {
				sText = this.getI18nText("print");
			}
			return sText;
		},
		formatWeightEnable: function (bClosed, aItems, iPendingTaskNumber) {
			var bEnable = false;
			if (!bClosed && aItems.length > 0 && iPendingTaskNumber === 0) {
				bEnable = true;
			}
			return bEnable;
		},
		/********    enable gross weight input in the simplemode  ********/
		formatWeightEnableInSimpleMode: function (aItems, iPendingTaskNumber) {
			var bEnable = false;
			if (aItems.length > 0 && iPendingTaskNumber === 0) {
				bEnable = true;
			}
			return bEnable;
		},
		formatPrintEnable: function (sHu, iPendingTaskNumber) {
			if (Util.isEmpty(sHu) || iPendingTaskNumber > 0) {
				return false;
			}
			return true;
		},
		setCurrentShipHandlingUnit: function (sHuId) {
			Global.setCurrentShipHandlingUnit(sHuId);
			if (Util.isEmpty(sHuId)) {
				Global.setCurrentShipHandlingUnitClosed(false);
			} else {
				Global.setCurrentShipHandlingUnitClosed(ODataHelper.isShipHUClosed(sHuId));
			}
		},
		updateShipItemStatus: function () {
			if (this.oItemHelper.isEmpty()) {
				return;
			}
			this.oItemHelper.setItemsStatusToNone();
			if (!Util.isEmpty(Global.getSourceId()) && !Global.getCurrentShipHandlingUnitClosed()) {
				this.oItemHelper.setItemHighlightByIndex(0);
				return;
			}
		},

		formatCompleteIconVisible: function (bPending) {
			if (bPending) {
				return false;
			}
			return true;
		},
		formatBusyIndicatorVisible: function (bPending) {
			if (bPending) {
				return true;
			}
			return false;
		},
		getLoadingWeightInCurrentShipHandlingUnit: function () {
			var fLoadingWeight = 0;
			var sPackMat = MaterialHelper.getCurrentMaterialId();
			var aAllItems = this.oItemHelper.getAllItems();
			aAllItems.forEach(function (oItem) {
				var fWeight = ItemWeight.getItemAlterWeight(sPackMat, oItem.OriginId);
				fLoadingWeight += Util.parseNumber(oItem.AlterQuan) * fWeight;
			});
			return fLoadingWeight;
		},
		getWeightUOMInCurrentShipHandlingUnit: function () {
			var sWeightUOM;
			var sPackMat = MaterialHelper.getCurrentMaterialId();
			sWeightUOM = ItemWeight.getWeightUOMForSpecificPackMat(sPackMat);
			return sWeightUOM;
		},

		getGrossWeight: function () {
			var oInput = this.getGrossWeightInput();
			return oInput.getValue();
		},

		setGrossWeight: function (sValue) {
			var oInput = this.getGrossWeightInput();
			if (!Util.isEmpty(oInput)) {
				oInput.setValue(sValue);
			}
		},

		clearGrossWeight: function () {
			this.setGrossWeight("");
		},

		getGrossWeightInput: function () {
			var sHandlingUnitId = Global.getCurrentShipHandlingUnit();
			var oInput = this.getElementInTab(sHandlingUnitId, "actual-weight-input");
			return oInput;
		},

		//unpackItem/unpackAll callback: delete the ship handling unit from ui, if the ship handling unit is deleted from backend
		unpackCallback: function (mUnpackResponse) {
			if (Util.isEmpty(mUnpackResponse.HuId)) { //handling unit is deleted in the backend
				Message.addSuccess(this.getTextAccordingToMode("handlingUnitDeleted", "shipHandlingUnitDeleted", [Global.getCurrentShipHandlingUnit()]));
				this.playAudio(Const.INFO);
				var oDeleteInfo = {
					"bCallService": false,
					"bRefreshSource": true
				};
				this.getWorkFlowFactory().getShipHUDeleteWorkFlow().run(oDeleteInfo);
				throw new CustomError(Const.ERRORS.INTERRUPT_WITH_NO_ACTION);
			} else {
				return mUnpackResponse;
			}
		},
		/**
		 * flush all the uncommited pack items(do not include the item which have sent but not responsed from the server) to the server
		 * for simple model: enable/disable item input
		 * @return {Promise}
		 */
		flushPendings: function () {
			var aItems = this.oItemHelper.getAllItems();
			var mItem;
			var aWorkflow = [];
			var aPromise = [];
			for (var i = 0; i < aItems.length; i++) {
				mItem = aItems[i];
				mItem.PackedQuan = mItem.PackedQuan ? mItem.PackedQuan : 0;
				if ((mItem.OperationDeltaQuan - mItem.PackedQuan !== 0) && (mItem.OperationDeltaQuan !== mItem.DefaultAltQuan)) {
					var oPackInfo = {
						oProduct: mItem,
						sQuantity: "0",
						iIndex: i,
						bAdd: false
					};
					aWorkflow.push(this.getWorkFlowFactory().getPackItemWorkFlow().run(oPackInfo));
				}
			}
			if (aWorkflow.length > 0) {
				if (Global.getAsyncMode()) {
					return new Promise(function (resolve, reject) {
						jQuery.sap.delayedCall(0, null, function () {
							aWorkflow.forEach(function (oWorkflow) {
								aPromise.push(oWorkflow.getAsyncPromise());
							});
							Promise
								.all(aPromise)
								.then(function () {
									resolve();
								})
								.catch(function (oError) {
									reject(oError);
								});
						});
					});
				} else {
					aWorkflow.forEach(function (oWorkflow) {
						aPromise.push(oWorkflow.getResult());
					});
					return Promise.all(aPromise);
				}
			} else {
				return Promise.resolve();
			}
		},
		formatItemInputEnable: function (ItemStauts, PackedQuan, OperationDeltaQuan, DefaultAltQuan) {
			var bEnable = true;
			if (ItemStauts !== sap.ui.core.MessageType.Success || (OperationDeltaQuan === DefaultAltQuan && OperationDeltaQuan !== PackedQuan)) {
				bEnable = false;
			}
			return bEnable;
		},
		formatSimpleMaterialButtonEnable: function (iPendingTaskNumber) {
			if (iPendingTaskNumber > 0) {
				return false;
			}
			return true;
		},
		formatDialogMaterialLabel: function (aFavoriteMaterial) {
			if (aFavoriteMaterial.length === 0) {
				return this.getI18nText("packMaterial");
			} else {
				return this.getI18nText("favoritePackMaterial");
			}
		},
		getHandlingUnitDisplayWhenScanOnOtherSide: function () {
			return new Promise(function (resolve, reject) {
				var sWarning = this.getI18nText("scanExistingHUonOtherSide");
				MessageBox.warning(
					sWarning, {
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.YES) {
								resolve();
							} else {
								reject(Const.ERRORS.INTERRUPT_WITH_NO_ACTION);
							}
						}.bind(this)
					}
				);
			}.bind(this));
		},
		handleUnpackItemsWithDifferentODO: function (oProduct) {
			return new Promise(function (resolve, reject) {
				if (Global.isSourceTypeODO()) {
					var sProductODO = oProduct.EWMRefDeliveryDocumentNumber;
					var sSourceODO = Global.getSourceId();
					if (sProductODO !== sSourceODO) {
						var sBin = Global.getBin();
						var sMsg = this.getI18nText("unpackToBin", [sProductODO, sBin]);
						Message.addSuccess(sMsg);
						this.setBusy(false);
						reject(Const.ERRORS.INTERRUPT_WITH_NO_ACTION);
					}

				}
				resolve();
			}.bind(this));
		},
		handleUnpackAllItemsWithDifferentODO: function (aProducts) {
			return new Promise(function (resolve, reject) {
				if (Global.isSourceTypeODO()) {
					var sSourceODO = Global.getSourceId();
					var iIdx = Util.findIndex(aProducts, function (oProduct) {
						if (oProduct.EWMRefDeliveryDocumentNumber !== sSourceODO) {
							return true;
						}
					});
					if (iIdx !== -1) {
						//there is at least 1 product whose ODO is different with sourceId
						var sBin = Global.getBin();
						var sMsg = this.getI18nText("unpackAllToBin", [sSourceODO, sBin]);
						Message.addSuccess(sMsg);
					}
					iIdx = Util.findIndex(aProducts, function (oProduct) {
						if (oProduct.EWMRefDeliveryDocumentNumber === sSourceODO) {
							return true;
						}
					});
					if (iIdx == -1) {
						//the ODO of all products are different with sourceId
						this.setBusy(false);
						reject(Const.ERRORS.INTERRUPT_WITH_NO_ACTION);
					}
				}
				resolve();
			}.bind(this));
		},
		initColumnSettingModel: function () {
			this.oColumnSettingsHelper.setData(this.getDefaultColumnSetting());
			this.oColumnSettingsHelper.handleStatusColumnSetting(Global.getAsyncMode(), this.getI18nText("status"));
		},
		resetMaterialButtons: function () {
			var sDefaultMaterialId = MaterialHelper.getDefaultMaterialId();
			var sCurrentMaterialId = MaterialHelper.getCurrentMaterialId();
			if (!Util.isEmpty(sDefaultMaterialId)) {
				MaterialHelper.setFavoriteMaterialSelectedById(sDefaultMaterialId, true);
			}
			MaterialHelper.setFavoriteMaterialSelectedById(sCurrentMaterialId, false);
		},
		formatCreateDialogTitle: function (sMode) {
			return this.getTextAccordingToMode("createNewHU", "createNewShipHU", [], sMode);
		},
		formatChangeDialogTitle: function (sMode) {
			return this.getTextAccordingToMode("changeHandlingUnitMaterial", "changeShipHandlingUnitMaterial", [], sMode);
		},
		formatDialogLabel: function (sMode) {
			return this.getTextAccordingToMode("handlingUnitLabel", "shipHandlingUnit", [], sMode);
		},
		updateCacheIsEmptyHU: function () {
			if (this.oItemHelper.getItemsNum() === 0) {
				Cache.setIsEmptyHU(Global.getCurrentShipHandlingUnit(), true);
			} else {
				Cache.setIsEmptyHU(Global.getCurrentShipHandlingUnit(), false);
			}
		},
		initDefaultColumnSetting: function () {
			this._mAdvancedShipTableDefaultSettings = JSON.parse(JSON.stringify(AdvancedShipTableSetting.getData()));
			this._mBasicShipDefaultDefaultSettings = JSON.parse(JSON.stringify(BasicShipTableSetting.getData()));
			this._mInternalShipTableDefaultSettings = JSON.parse(JSON.stringify(InternalShipTableSetting.getData()));
		}
	});
});