/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
	sap.ui.define([
		"sap/ui/core/Control"
	], function(Control) {
		"use strict";

		var Container = Control.extend("scm.ewm.packoutbdlvs1.control.Container", {
			metadata: {
				properties: {

					/**
					 * CSS width of the layout.
					 */
					width: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: null
					},

					/**
					 * CSS height of the layout.
					 */
					height: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: null
					},

					/**
					 * CSS max-width of the layout.
					 */
					maxWidth: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: ""
					},

					/**
					 * CSS min-width of the layout.
					 */
					minWidth: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: ""
					},

					/**
					 * CSS max-height of the layout.
					 */
					maxHeight: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: ""
					},

					/**
					 * CSS min-height of the layout.
					 */
					minHeight: {
						type: "sap.ui.core.CSSSize",
						group: "Dimension",
						defaultValue: ""
					}
				},
				defaultAggregation: "content",
				aggregations: {

					/**
					 * Child Controls within the layout.
					 */
					content: {
						type: "sap.ui.core.Control",
						multiple: true,
						singularName: "content"
					}
				},
				designTime: true
			}
		});

		return Container;

	}, /* bExport= */ true);
