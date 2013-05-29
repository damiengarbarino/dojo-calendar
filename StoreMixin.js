define(["dojo/_base/declare", "dojo/_base/array", "dojo/_base/html", "dojo/_base/lang", 
        "dojo/aspect", "dojo/dom-class", "dojo/Stateful", "dojo/when", "dojox/calendar/Store"],
	function(declare, arr, html, lang, aspect, domClass, Stateful, when, Store){

	return declare("dojox.calendar.StoreMixin", [Stateful, Store], {
		
		// summary:
		//		This mixin contains the store management.

		// startTimeAttr: String
		//		The attribute of the store item that contains the start time of 
		//		the events represented by this item.	Default is "startTime". 
		startTimeAttr: "startTime",
		
		// endTimeAttr: String
		//		The attribute of the store item that contains the end time of 
		//		the events represented by this item.	Default is "endTime".
		endTimeAttr: "endTime",
		
		// summaryAttr: String
		//		The attribute of the store item that contains the summary of 
		//		the events represented by this item.	Default is "summary".
		summaryAttr: "summary",
		
		// allDayAttr: String
		//		The attribute of the store item that contains the all day state of 
		//		the events represented by this item.	Default is "allDay".
		allDayAttr: "allDay",
		
		// subColumnAttr: String
		//		The attribute of the store item that contains the sub column name of 
		//		the events represented by this item.	Default is "calendar".
		subColumnAttr: "calendar",
	
		// cssClassFunc: Function
		//		Optional function that returns a css class name to apply to item renderers that are displaying the specified item in parameter. 
		cssClassFunc: null,		
							
		// decodeDate: Function?
		//		An optional function to transform store date into Date objects.	Default is null. 
		decodeDate: null,
		
		// encodeDate: Function?
		//		An optional function to transform Date objects into store date.	Default is null. 
		encodeDate: null,
		
		// displayedItemsInvalidated: Boolean
		//		Whether the data items displayed must be recomputed, usually after the displayed 
		//		time range has changed. 
		// tags:
		//		protected
		displayedItemsInvalidated: false,
		
		postMixInProperties: function(){
			this.inherited(arguments);
			
			// attach the original item to the render item.
			aspect.around(this, "itemToRenderItem", function(itemToRenderItemFunc){
				return function(){
					var renderItem = itemToRenderItemFunc.apply(this, arguments);				
					renderItem._item = arguments[0];
					return renderItem;
				};
			});
		},
		
		refreshRendering: function(){
			if(!this.owner){
				this.inherited(arguments);
			}
		},
									
		itemToRenderItem: function(item, store){
			// summary:
			//		Creates the render item based on the dojo.store item. It must be of the form:
			//	|	{
			//  |		id: Object,
			//	|		startTime: Date,
			//	|		endTime: Date,
			//	|		summary: String
			//	|	}
			//		By default it is building an object using the store id, the summaryAttr, 
			//		startTimeAttr and endTimeAttr properties as well as decodeDate property if not null. 
			//		Other fields or way to query fields can be used if needed.
			// item: Object
			//		The store item. 
			// store: dojo.store.api.Store
			//		The store.
			// returns: Object
			if(this.owner){
				return this.owner.itemToRenderItem(item, store);
			}
			return {
				id: store.getIdentity(item),				
				summary: item[this.summaryAttr],
				startTime: (this.decodeDate && this.decodeDate(item[this.startTimeAttr])) || this.newDate(item[this.startTimeAttr], this.dateClassObj),
				endTime: (this.decodeDate && this.decodeDate(item[this.endTimeAttr])) || this.newDate(item[this.endTimeAttr], this.dateClassObj),
				allDay: item[this.allDayAttr] != null ? item[this.allDayAttr] : false,
				subColumn: item[this.subColumnAttr],   
				cssClass: this.cssClassFunc ? this.cssClassFunc(item) : null 
			};
		},
		
		renderItemToItem: function(/*Object*/ renderItem, /*dojo.store.api.Store*/ store){
			// summary:
			//		Create a store item based on the render item. It must be of the form:
			//	|	{
			//	|		id: Object
			//	|		startTime: Date,
			//	|		endTime: Date,
			//	|		summary: String
			//	|	}
			//		By default it is building an object using the summaryAttr, startTimeAttr and endTimeAttr properties
			//		and encodeDate property if not null. If the encodeDate property is null a Date object will be set in the start and end time.
			//		When using a JsonRest store, for example, it is recommended to transfer dates using the ISO format (see dojo.date.stamp).
			//		In that case, provide a custom function to the encodeDate property that is using the date ISO encoding provided by Dojo. 
			// renderItem: Object
			//		The render item. 
			// store: dojo.store.api.Store
			//		The store.
			// returns:Object
			if(this.owner){
				return this.owner.renderItemToItem(renderItem, store);
			}
			var item = {};
			item[store.idProperty] = renderItem.id;
			item[this.summaryAttr] = renderItem.summary;
			item[this.startTimeAttr] = (this.encodeDate && this.encodeDate(renderItem.startTime)) || renderItem.startTime;
			item[this.endTimeAttr] = (this.encodeDate && this.encodeDate(renderItem.endTime)) || renderItem.endTime;
			if(renderItem.subColumn){
				item[this.subColumnAttr] = renderItem.subColumn;
			}
			return lang.mixin(store.get(renderItem.id), item);
		},			
		
		_computeVisibleItems: function(renderData){
			// summary:
			//		Computes the data items that are in the displayed interval.
			// renderData: Object
			//		The renderData that contains the start and end time of the displayed interval.
			// tags:
			//		protected

			var startTime = renderData.startTime;
			var endTime = renderData.endTime;
			if(this.items){
				renderData.items = arr.filter(this.items, function(item){
					return this.isOverlapping(renderData, item.startTime, item.endTime, startTime, endTime);
				}, this);
			}
		},
		
		removeItem: function(index, item, items){
			// summary:
			//		Remove a widget internal item. This can be redefined but must not be called directly.
			// index: Number
			//		The index of the removed item.
			// item: Object
			//		The removed item.
			// items: Array
			//		The array of items to remove the item from.
			// tags:
			//		protected
			items.splice(index, 1);
			if(this.setItemSelected && this.isItemSelected(item)){
				this.setItemSelected(item, false);
				this.dispatchChange(item, this.get("selectedItem"), null, null);
			}
			
			this._setItemStoreState(item, null); // delete
			
			return true;
		},

		putItem: function(index, item, items){
			// summary:
			//		Modify a widget internal item. This can be redefined but must not be called directly.
			// index: Number
			//		The index of the modified item.
			// item: Object
			//		The modified item.
			// items: Array
			//		The array of items in which the modified item is.
			// tags:
			//		protected

			// we want to keep the same item object and mixin new values into old object
			var oldItem = items[index];
						
			// we want to keep the same item object and mixin new values
			// into old object
			lang.mixin(oldItem, item);
			
			this._setItemStoreState(item, "stored");
			
			var cal = this.dateModule; 
			if(!this._isEditing){
				if(cal.compare(item.startTime, oldItem.startTime) != 0 ||
					cal.compare(item.endTime, oldItem.endTime) != 0){
					this.invalidateLayout();
				}else{
					this.updateRenderers(oldItem);
				}
			}
		},

		addItem: function(index, item, items){
			// summary:
			//		Add a widget internal item. This can be redefined but must not be called directly.
			// index: Number
			//		The index of the added item.
			// item: Object
			//		The added item.
			// items: Array
			//		The array of items in which to add the item.
			// tags:
			//		protected
								
			var s = this._getItemStoreStateObj(item);
			if(s){
				// if the item is at the correct index (creation)
				// we must fix it. Should not occur but ensure integrity.
				if(items[index].id != item.id){						
					var l = items.length; 
					for(var i=l-1; i>=0; i--){
						if(items[i].id == item.id){
							items.splice(i, 1);
							break;
						}
					}						
					items.splice(index, 0, item);						
				}
				// update with the latest values from the store.
				lang.mixin(s.renderItem, item);
			}else{
				items.splice(index, 0, item);					
			}
			
			this._itemLayoutInvalidated = true;
			this._setItemStoreState(item, "stored");
			
			return true;
		},
					
		_getItemStoreStateObj: function(/*Object*/item){
			// tags
			//		private
			
			if(this.owner){
				return this.owner._getItemStoreStateObj(item);
			}
			
			var store = this.get("store");
			if(store != null && this._itemStoreState != null){
				var id = item.id == undefined ? store.getIdentity(item) : item.id;
				return this._itemStoreState[id];
			}
			return null;
		},
		
		getItemStoreState: function(item){
			//	summary:
			//		Returns the creation state of an item. 
			//		This state is changing during the interactive creation of an item.
			//		Valid values are:
			//		- "unstored": The event is being interactively created. It is not in the store yet.
			//		- "storing": The creation gesture has ended, the event is being added to the store.
			//		- "stored": The event is not in the two previous states, and is assumed to be in the store 
			//		(not checking because of performance reasons, use store API for testing existence in store).
			// item: Object
			//		The item.
			// returns: String
			
			if(this.owner){
				return this.owner.getItemStoreState(item);
			}

			if(this._itemStoreState == null){
				return "stored";
			}
			
			var store = this.get("store");
			var id = item.id == undefined ? store.getIdentity(item) : item.id;
			var s = this._itemStoreState[id];
			
			if(store != null && s != undefined){				
				return s.state;								
			}
			return "stored";		
		},
		
		_setItemStoreState: function(/*Object*/item, /*String*/state){
			// tags
			//		private
			
			if(this.owner){
				this.owner._setItemStoreState(item, state);
				return;
			}
			
			console.log("_setItemStoreState ", item.id, "state:", state);
			
			if(this._itemStoreState == undefined){
				this._itemStoreState = {};
			}
			
			var store = this.get("store");
			var id = item.id == undefined ? store.getIdentity(item) : item.id;
			var s = this._itemStoreState[id];
			
						
			if(state == "stored" || state == null){
				if(s != undefined){
					delete this._itemStoreState[id];					
				}
				return;	
			}

			if(store){				
				this._itemStoreState[id] = {
						id: id,
						item: item,
						renderItem: this.itemToRenderItem(item, store),
						state: state
				};						
			}
		}
				
	});

});
