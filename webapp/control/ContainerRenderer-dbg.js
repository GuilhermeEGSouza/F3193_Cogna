/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
// Provides default renderer for control ui.control.Container
sap.ui.define([], function() {
	"use strict";

	/**
	 * control/Container renderer.
	 * @namespace
	 */
	var ContainerRenderer = {};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oContainer an object representation of the control that should be rendered
	 */
	ContainerRenderer.render = function(oRenderManager, oContainer) {
		// convenience variable
		var rm = oRenderManager;

		// write the HTML into the render manager
		rm.write("<div");
		rm.writeControlData(oContainer);
		rm.addClass("container");

		if (oContainer.getWidth() && oContainer.getWidth() !== "") {
			rm.addStyle("width", oContainer.getWidth());
		}

		if (oContainer.getHeight() && oContainer.getHeight() !== "") {
			rm.addStyle("height", oContainer.getHeight());
		}

		if (oContainer.getMinWidth() && oContainer.getMinWidth() !== "") {
			rm.addStyle("min-width", oContainer.getMinWidth());
		}

		if (oContainer.getMaxWidth() && oContainer.getMaxWidth() !== "") {
			rm.addStyle("max-width", oContainer.getMaxWidth());
		}

		if (oContainer.getMinHeight() && oContainer.getMinHeight() !== "") {
			rm.addStyle("min-height", oContainer.getMinHeight());
		}

		if (oContainer.getMaxHeight() && oContainer.getMaxHeight() !== "") {
			rm.addStyle("max-height", oContainer.getMaxHeight());
		}

		rm.writeStyles();
		rm.writeClasses();
		rm.write(">"); // DIV element

		// render content
		var aContent = oContainer.getContent();

		for (var i = 0; i < aContent.length; i++) {
			rm.renderControl(aContent[i]);
		}

		rm.write("</div>");
	};

	return ContainerRenderer;

}, /* bExport= */ true);