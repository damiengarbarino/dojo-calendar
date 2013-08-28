define([
"dojo/_base/declare", "dojo/_base/lang", "dojo/query", "dojo/dom-class"],
function(declare, lang, query, domClass){
	return declare("lib.calendar._GridHighlightMixin", null, {
		currHours: null,
		refreshCurrHour: null,
		
		getCurrHour: function(){
			if(this.currHours === null){
				var now = new Date();
				this.currHours = now.getHours();
				// set refresh timeout to next hour
				var refresh = new Date();
				refresh.setHours(refresh.getHours() + 1, 0, 0);
				this.timeoutRefresh = setTimeout(lang.hitch(this, this.refreshCurrHour), refresh - now + 1);
			}
			return this.currHours;
		},
		
		refreshCurrHour: function(){
			clearTimeout(this.timeoutRefresh);
			this.timeoutRefresh = null;
			var now = new Date();
			this.currHours = now.getHours();
			
			var rd = this.renderData;
			// rebuild grid
			this._buildGrid(rd, rd);

			// set next timeout after 1 hour
			var refresh = new Date();
			refresh.setHours(refresh.getHours() + 1, 0, 0);
			this.timeoutRefresh = setTimeout(lang.hitch(this, this.refreshCurrHour), refresh - now + 1);
		},
		
		defaultStyleGridCell: function(node, date, hours, minutes, renderData){
			// summary:
			//		Styles the CSS classes to the node that displays a cell.
			//		By default this method is setting:
			//		- "dojoxCalendarToday" class name if the date displayed is the current date,
			//		- "dojoxCalendarWeekend" if the date represents a weekend,
			//		- the CSS class corresponding of the displayed day of week ("Sun", "Mon" and so on),
			//		- the CSS classes corresponfing to the time of day (e.g. "H14" and "M30" for for 2:30pm).   
			// node: Node
			//		The DOM node that displays the cell in the grid.
			// date: Date
			//		The date displayed by this cell.
			// hours: Integer
			//		The hours part of time of day displayed by the start of this cell.
			// minutes: Integer
			//		The minutes part of time of day displayed by the start of this cell.
			// renderData: Object
			//		The render data object.
			// tags:
			//		protected
			
			var cl = new Array(this._cssDays[date.getDay()], "H"+hours, "M"+minutes);
			
			var h = this.getCurrHour();
			if(hours == h){
				cl.push("dojoxCalendarToday");
			}else if(this.isToday(date)){				
				cl.push("dojoxCalendarToday");
			} else if(this.isWeekEnd(date)){
				cl.push("dojoxCalendarWeekend");
			}
			
			return domClass.replace(node, cl);
		}
	});
});
