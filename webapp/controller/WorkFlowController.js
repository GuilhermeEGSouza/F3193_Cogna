/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"zcogna/ewm/packoutbdlvs1/controller/BaseController",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Items",
	"sap/ui/model/json/JSONModel",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/modelHelper/ItemWeight",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material",
	"zcogna/ewm/packoutbdlvs1/service/ODataService",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"sap/m/MessageBox",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global"
], function (Controller, TableItemsHelper, JSONModel, Util, ItemWeight, MaterialHelper, Service, Message, Const, MessageBox, Global) {
	"use strict";
	return Controller.extend("zcogna.ewm.packoutbdlvs1.controller.WorkFlowController", {
		getWorkFlowFactory: function () {
			return this.oView.getParent().getParent().getParent().getController().oWorkFlowFactory;
		},
		oItemHelper: null,
		formatTableTitle: function (sHU, aItems) {
			if (!sHU) {
				return;
			}

			return this.getI18nText("itemsOfHandkingUnit", [sHU, aItems.length]);
		},
		onSerialNumberPopover: function (oEvent) {
			this.openSerialNumberPopover(oEvent, Const.ITEM_MODEL_NAME, this.oItemHelper);
		},
		setButtonToolTip: function (sId) {
			var oButton = this.byId(sId);
			if (Util.isEmpty(oButton)) {
				return;
			}
			var sTooltip = oButton.getTooltip();
			if (Util.isEmpty(sTooltip)) {
				oButton.setTooltip(oButton.getText());
			}
		},
		updateItemWeightInNeed: function (sSourceId, sSourceType) {
			var sPackMat = MaterialHelper.getCurrentMaterialId();
			var aAllItems = this.oItemHelper.getAllItems();
			var iIdx = Util.findIndex(aAllItems, function (oItem) {
				if (!ItemWeight.isSpecificItemWeightExisted(sPackMat, oItem.OriginId)) {
					//find a item in source/ship hu which does not exist in the ItemWeight
					return true;
				}
				return false;
			});
			if (iIdx !== -1) {
				return this.updateItemWeight(sSourceId, sSourceType);
			}
			return Util.getResolvePromise();
		},
		updateItemWeight: function (sSourceId, sSourceType) {
			return new Promise(function (resolve, reject) {
				var sPackMat = MaterialHelper.getCurrentMaterialId();
				this.setBusy(true);
				Service.getItemWeight(sSourceId, sSourceType)
					.then(function (oResult) {
						this.setBusy(false);
						ItemWeight.addItemWeightForPackMat(sPackMat, oResult);
						resolve();
					}.bind(this))
					.catch(function (oError) {
						this.setBusy(false);
						this.playAudio(Const.ERROR);
						Message.addError(oError);
						reject();
					}.bind(this));

			}.bind(this));
		},
		handleSettingDialogButtonPressed: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment(this.getTableSettingDialogName(), this);
			}
			this.getView().addDependent(this._oDialog);
			this.setDisplayMessageBoxForColumnSettingChange(true);
			this._oDialog.open();
		},
		onConfirmColumnSettingsChange: function (oEvent) {
			this.updatePersonalizationService();
			oEvent.getSource().close();
			this.updateTableColumn();
		},

		onCancelColumnSettingsChange: function (oEvent) {
			this.rollBackColumnSettingsModel();
			oEvent.getSource().close();
		},
		updatePersonalizationService: function () {
			var oTableSettings = JSON.parse(JSON.stringify(this.oColumnSettingsHelper.getColumnSettings()));

			oTableSettings.forEach(function (oTableSetting) {
				oTableSetting.index = oTableSetting.defaultIndex;
			});

			this.oColumnSettingsHelper.setColumnSettings(oTableSettings);
			this.setContainerItemValue(this.getPersonlServiceContainerItemName(), oTableSettings);
		},

		rollBackColumnSettingsModel: function () {
			this.getPersonalizationContainer()
				.then(function (oContainer) {
					var oTableSettings = oContainer.getItemValue(this.getPersonlServiceContainerItemName());
					if (oTableSettings) {
						this.oColumnSettingsHelper.setColumnSettings(oTableSettings);
						this.oColumnSettingsHelper.updateRestore();
					}
				}.bind(this));
		},

		setContainerItemValue: function (sItemName, oValue) {
			this.getPersonalizationContainer().then(function (oContainer) {
				oContainer.setItemValue(sItemName, oValue);
				oContainer.save();
			}.bind(this));
		},

		initColumnSetting: function (sPersonalServiceName) {
			this.getPersonalizationContainer()
				.then(function (oContainer) {

					var sSettingName = this.getPersonlServiceContainerItemName();
					var oTableSettings = oContainer.getItemValue(sSettingName);
					if (Util.isEmpty(oTableSettings) || this.isDefaultColumnSettingChange(oContainer)) {
						var oDefaultSetting = this.getDefaultColumnSetting();
						this.updateDefaultColumnSetting(oDefaultSetting, oContainer);

						this.initColumnSettingModel();
						this.initColumnSettingText();

						oTableSettings = JSON.parse(JSON.stringify(this.oColumnSettingsHelper.getColumnSettings()));
						oContainer.setItemValue(this.getPersonlServiceContainerItemName(), oTableSettings);

						oContainer.save();
					} else {
						var oNewTableSettings = JSON.parse(JSON.stringify(oTableSettings));
						this.oColumnSettingsHelper.setColumnSettings(oNewTableSettings);
						this.initColumnSettingText();
						if (this.getViewName() === Const.VIEW_SHIP) {
							if (this.oColumnSettingsHelper.handleStatusColumnSetting(Global.getAsyncMode(), this.getI18nText("status"))) {
								this.updatePersonalizationService();
							}
						}
					}
					this.updateTableColumn();
					this.oColumnSettingsHelper.updateRestore();
				}.bind(this));
		},
		onRestoreColumnSettings: function () {
			var oDefaultSetting = this.getDefaultColumnSetting();
			var aDefaultSetting = this.initDefaultColumnSettingText(oDefaultSetting);
			this.oColumnSettingsHelper.restore(aDefaultSetting);
			this.oColumnSettingsHelper.handleStatusColumnSetting(Global.getAsyncMode(), this.getI18nText("status"));
		},
		updateTableColumn: function () {
			var aTableSettings = this.oColumnSettingsHelper.getColumnSettings();
			var oTable = this.byId(this.sTableId);
			var aColumns = oTable.getColumns();
			aTableSettings.forEach(function (oColumnSetting) {
				for (var i = 0; i < aColumns.length; i++) {
					if (aColumns[i].getHeader().getText() === this.getI18nText(oColumnSetting.columnKey)) {
						aColumns[i].setVisible(oColumnSetting.visible);
					}
				}
			}.bind(this));
		},
		isColumnMandatory: function (sColumnTitle) {
			var aColumnSettings = this.oColumnSettingsHelper.getColumnSettings();
			var iIndex = aColumnSettings.findIndex(function (oColumnSetting) {
				if (sColumnTitle === this.getI18nText(oColumnSetting.columnKey) && oColumnSetting.mandatory) {
					return true;
				}
			}.bind(this));
			return iIndex !== -1 ? true : false;
		},
		setMandatoryColumnVisible: function (oTable) {
			var aItems = oTable.getItems();
			aItems.forEach(function (oItem) {
				if (this.isColumnMandatory(oItem.getCells()[0].getText()) && !oItem.getSelected()) {
					oItem.setSelected(true);
					oTable.fireSelectionChange({
						listItem: oItem,
						listItems: [],
						selected: true
					});
				}
			}.bind(this));
		},

		getColumnSettingTable: function (oPanel) {
			var oContainer = oPanel.getAggregation("content")[0];
			return oContainer;
		},
		isMandatoryColumnInvisible: function (oTable) {
			var aItems = oTable.getItems();
			var iIndex = aItems.findIndex(function (oItem) {
				if (this.isColumnMandatory(oItem.getCells()[0].getText()) && !oItem.getSelected()) {
					return true;
				}
			}.bind(this));
			return iIndex !== -1;
		},
		setDisplayMessageBoxForColumnSettingChange: function (bValue) {
			this._oDialog.removeAllCustomData();
			var oCustomData = new sap.ui.core.CustomData({
				key: bValue
			});
			this._oDialog.addCustomData(oCustomData);
		},
		onChangeColumnsItems: function (oEvent) {
			var oPanel = oEvent.getSource();
			var oColTable = this.getColumnSettingTable(oPanel);
			var bDisplayMessageBoxForColumnSettingChange = this._oDialog.getCustomData()[0].getKey();
			if (this.isMandatoryColumnInvisible(oColTable)) {
				if (bDisplayMessageBoxForColumnSettingChange === "true") {
					this._oDialog.setBusy(true);
					var sMessage = this.getI18nText("deselectMandatoryField");
					var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
					this.playAudio(Const.ERROR);
					MessageBox.error(
						sMessage, {
							styleClass: bCompact ? "sapUiSizeCompact" : "",
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function () {
								this._oDialog.setBusy(false);
								this.setMandatoryColumnVisible(oColTable);
								this.oColumnSettingsHelper.setMandatoryColumnVisible();
								this.oColumnSettingsHelper.updateRestore();
								this.setDisplayMessageBoxForColumnSettingChange(true);
							}.bind(this)
						}
					);
					this.setDisplayMessageBoxForColumnSettingChange(false);
				} else {
					this.setMandatoryColumnVisible(oColTable);
					this.oColumnSettingsHelper.setMandatoryColumnVisible();
				}
			}
			this.oColumnSettingsHelper.updateRestore();
		},
		initColumnSettingText: function () {
			var aColumnSettings = this.oColumnSettingsHelper.getColumnSettings();
			aColumnSettings.forEach(function (oColumnSetting) {
				var sKey = oColumnSetting.columnKey;
				var sText = this.getI18nText(sKey);
				this.oColumnSettingsHelper.setColumnTextByKey(sKey, sText);
			}.bind(this));
		},
		isDefaultColumnSettingChange: function (oContainer) {
			var oDefaultSettingInService = this.getDefaultColumnSettingInService(oContainer);
			var oDefaultSetting = this.getDefaultColumnSetting();
			if (JSON.stringify(oDefaultSettingInService) === JSON.stringify(oDefaultSetting)) {
				return false;
			}
			return true;
		},
		getDefaultColumnSettingInService: function (oContainer) {
			var sValueName = this.getDefaultColumnSettingNameInService();
			var oTableSetting = oContainer.getItemValue(sValueName);
			return oTableSetting;
		},
		updateDefaultColumnSetting: function (oTableSettings, oContainer) {
			var oNewTableSettings = JSON.parse(JSON.stringify(oTableSettings));
			var sValueName = this.getDefaultColumnSettingNameInService();
			oContainer.setItemValue(sValueName, oNewTableSettings);
			oContainer.setItemValue(this.getPersonlServiceContainerItemName(), "");
		},
		initDefaultColumnSettingText: function (oDefaultSetting) {
			var aTableSettings = oDefaultSetting.columnSettings;
			aTableSettings.forEach(function (oColumnSetting) {
				var sKey = oColumnSetting.columnKey;
				var sText = this.getI18nText(sKey);
				oColumnSetting.text = sText;
			}.bind(this));
			return aTableSettings;
		},
		getItemProperties: function () {
			var oMetaData = this.getModel().getServiceMetadata();
			if (Util.isEmpty(oMetaData)) {
				return [];
			}
			var aEntityType = oMetaData.dataServices.schema[0].entityType;
			var oEntityType = Util.find(aEntityType, function (oType) {
				if (oType.name === "Item") {
					return true;
				}
				return false;
			});
			if (Util.isEmpty(oEntityType)) {
				return [];
			} else {
				return oEntityType.property;
			}
		}
	});
});