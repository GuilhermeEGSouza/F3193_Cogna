/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([],
	function() {
	"use strict";

	var AudioRenderer = {
	};


	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	AudioRenderer.render = function(oRenderManager, oAudio) {
		// convenience variable
		var rm = oRenderManager;
		// write the HTML into the render manager
		rm.write("<audio");
		rm.writeControlData(oAudio);

		rm.writeAttributeEscaped("src", oAudio.getSrc());

		rm.write(">"); // Audio element

		rm.write("</audio>");
	};

	return AudioRenderer;
}, /* bExport= */ true);
