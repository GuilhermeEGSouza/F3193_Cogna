/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([],
	function() {
	"use strict";

	var AudioListRenderer = {
	};


	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	AudioListRenderer.render = function(oRenderManager, oAudioList) {
		// convenience variable
		var rm = oRenderManager;
		// write the HTML into the render manager
		rm.write("<div");
		rm.writeControlData(oAudioList);

		//rm.writeAttributeEscaped("src", oAudio.getSrc());

		//rm.writeStyles();
		//rm.writeClasses();
		rm.write(">"); // Audio element

		// render content
		var aItems = oAudioList.getItems();

		for (var i = 0; i < aItems.length; i++) {
			rm.renderControl(aItems[i]);
		}

		rm.write("</div>");
	};

	return AudioListRenderer;
}, /* bExport= */ true);
