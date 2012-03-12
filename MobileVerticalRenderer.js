define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", 
	"dojox/calendar/_RendererMixin", "dojo/text!./templates/MobileVerticalRenderer.html"],
	 
	function(declare, _WidgetBase, _TemplatedMixin, _RendererMixin, template){
	
	/*=====
	var _WidgetBase = dijit._WidgetBase;
	var _TemplatedMixin = dijit._TemplatedMixin;
	var _RendererMixin = dojox.calendar._RendererMixin;
	=====*/ 

	return declare("dojox.calendar.MobileVerticalRenderer", [_WidgetBase, _TemplatedMixin, _RendererMixin], {
				
		//	module:
		//		dojox/calendar/MobileVerticalRenderer
		//	summary:
		//		The mobile specific item vertical renderer.
		
		templateString: template,
		mobile: true,
		
		visibilityLimits: {
			resizeStartHandle: 75,
			resizeEndHandle: -1,
			summaryLabel: 55,			
			startTimeLabel: 75,
			endTimeLabel: 20
		},		
		
		postCreate: function() {
			this.inherited(arguments);
			this._applyAttributes();
		}
	});
});
