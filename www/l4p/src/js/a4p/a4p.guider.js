/*
 * a4p-Guider
 * Guiding the clients when the first time
 * Dependent on jquery.joyride-1.0.3.js
 */
var sBuilder;
var guider;

//Test guider is well include
//a4p.InternalLog.log('a4p.Guider', 'Running');
(function() {
	/* -------------------------------------Guider Constructor----------------------------------------------------*/
	function Guider(){
		var self = this;
		this.needGuider = this._isNeedGuide();
		this.tipContent = " ";
		this.currentGroup = 0;

		this.groupSize = 2;

		//If groupState[i] = false, It is that group i is not visited
		this.groupState = new Array();
		for(var i=0; i<this.groupSize; ++i){
			this.groupState[i] = false;
		}

		/*
		 * The number of elements in each group
		 * Because we can not get the .length of the array if it is init by 'key' =>'value'
		 */
		this.item_in_group = new Array(2,1);
		/*
		 * Use the Tasg's title in form of  ('id' : 'title')
		 * If the tool tips doesn's have titlem use the 'Next' ou 'Close' to replace
		 */
		this.tags_title = new Array(
				/* --------------------Add your tips title here !----------------------------*/
				//Group 1: the guider info for the page event
				{	'synch':'Spinner'
					,'btn_off' : 'Crm/Meeting'},
				//Group 2: the guider info for the page event after click button "CRM"
				{	'rdv-header-back' : 'Crm/Meeting'}
		);

		/*
		 * User the tags's ID with content text to add tips ('id' : 'text')
		 * We use the different group to show guider when the URL changing (in different pages)
		 * If the elements in the same page please add the tips in the same group
		 */
		this.tags = new Array(
				/* --------------------Add your tips here !----------------------------*/
				//Group 1: the guider info for the page event
				{	'synch':'Resynchronize your data.'
					,'btn_off': 'Share your meeting data with your cutomer.' },

				//Group 2: the guider info for the page event after click button "CRM"
				{	'rdv-header-back' : 'Click this button, back to your CRM mode.'}

		);

		this.interV = setInterval(function(){
			self._init();
		},300);

	}
	/* Guider Constructor End */

	/* -------------------------------------Guider Prototype------------------------------------------------------*/
	Guider.prototype = {
			//Public methods
			run:function(){
				//a4p.InternalLog.log('a4p.Guider', 'Run');
				$(window).joyride({
					/* Options will go here */
					'tipLocation': 'bottom',   // 'top' or 'bottom' in relation to parent
					'tipAnimation': 'fade', // 'pop' or 'fade' in each tip
					'cookieMonster': true 	   // true/false for whether cookies are used
				});
				this._overflowTest();
                a4p.InternalLog.log('a4p.Guider', '_init: Running');
			},

			//Private methods
			_init:function(){
				this._overflowTest();
				//a4p.InternalLog.log('a4p.Guider', '_init: Waiting for element loaded');
				//All of the elements are loaded
				for(this.currentGroup; this.currentGroup < this.groupSize; ++this.currentGroup){
					if(this._isElementReady(this.currentGroup)){
						if(this.currentGroup != 0){
							//Delete the tips in the last group
							this._deleteLastGroupTips();
						}

						/* ------------------------- Content begin ---------------------------------*/
						sBuilder.append("<ol id='joyRideTipContent'>");

						var counter = 1;
						//Add every tip in this group
						for (var key in this.tags[this.currentGroup]) {
                            if (!this.tags[this.currentGroup].hasOwnProperty(key)) continue;
                            var btn_type = 'Next';
                            var title = 'Step' + counter;
                            if(counter == this.item_in_group[this.currentGroup]){
                                btn_type = 'Close';
                            }
                            counter ++;
                            if(this.tags_title[this.currentGroup][key] != ""){
                                title = this.tags_title[this.currentGroup][key];
                            }
                            this._addTip(key, btn_type,title,this.tags[this.currentGroup][key]);
						}

						sBuilder.append("</ol>");
						/* ------------------------- Content end -----------------------------------*/

						//Content toString
						this.tipContent = sBuilder.toString();
						//empty the sBuilder
						sBuilder.empty();

						//Add the tips in the page
						$('body').append(this.tipContent);
						this.groupState[this.currentGroup] = true;
						this.run();
					}
					else{
						//Does not increase the count currentGroup
						break;
					}
				}


				//Check whether the user switch the page
				var is_page_change = false;
				if(this.currentGroup > 0){
					//this._overflowTest();
					if(!this._isElementReady(this.currentGroup-1)){
						this._deleteLastGroupTips();
						is_page_change = true;
					}
				}

				//Clear interval when user change the page
				if(this._isAllVisited()){
					if(is_page_change){
						//Delete the tips in the last group
                        a4p.InternalLog.log('a4p.Guider', '_init: Element loaded, clear interval.');
						clearInterval(this.interV);
					}
				}

			},

			/*
			 * Add a tip to Guider's tip content
			 * data_id (string): html element's id
			 * data_text (string): btn type of the tip (Next or Close)
			 * text (string): text of the tip
			 */
			_addTip:function(data_id,data_text,title,text){
				//Tips begin
				sBuilder.append("<li data-id='"); sBuilder.append(data_id);
				sBuilder.append("' data-text='"); sBuilder.append(data_text);
				sBuilder.append("' class='custom'>");
					//Tips Title
					sBuilder.append("<h2>"); sBuilder.append(title); sBuilder.append("</h2>");
					//Tips Text
					sBuilder.append("<p>"); sBuilder.append(text); sBuilder.append("</p>");
				//Tips end
				sBuilder.append("</li>");
			},

			_isNeedGuide:function(){
				//TODO: Test and verify in Database or Local storage
				return true;
			},

			_stopGuider:function(){
				this.needGuider = false;
			},

			_isElementReady:function(group){
				for (key in this.tags[group]) {
                    if (!this.tags[group].hasOwnProperty(key)) continue;
                    if($('#'+key).size()==0 || $('#'+key).css('display') == 'none'){
                        return false;
                    }
                    else{
                        //For the Event page
                        if( key == 'rdv-header-back'){
                            if($('#spmodal').css('display') == 'none'){
                                return false;
                            }
                            else{
                                //Change z-index for Tips are not be coveraged
                                $('#spmodal').css('z-index','1');
                            }
                        }
                    }
				}
				return true;
			},

			//Test is overflow or not in the right side
			_overflowTest:function(){
				$('.joyride-tip-guide.custom').each(function(){
					if($(this).css('display') == 'block'){
						var screen_width = window.screen.width;
						if(screen_width < window.screen.height){
							screen_width = window.screen.height;
						}

						var offset = $(this).outerWidth() + $(this).offset().left - screen_width + 25;
						if(offset > 0){
							$(this).offset({left:($(this).offset().left - offset)});
							var nub = $(this).find('.joyride-nub.top');
							nub.offset({left:(nub.offset().left + offset)});
						}
					}
				});

			},

			//Test is all of the tips are visited
			_isAllVisited:function(){
				for(var i=0; i<this.groupSize; ++i){
					if(this.groupState[i] == false)
						return false;
				}
				return true;
			},

			//Delete the tips in the last group
			_deleteLastGroupTips : function(){
				var last_group_element_size = $('#joyRideTipContent li').size();
				if ($('#joyRideTipContent').size() != 0){
					//Remove group template
					$('#joyRideTipContent').remove();
					//Remove groupe elements
					for(var i=0 ; i< last_group_element_size; ++i){
						$('#joyRidePopup'+ i).remove();
					}
				}
			}
	};
	/* Guider.prototype end */

	/* Init Guider */
	$(window).load(function() {
		guider = new Guider();
	});

})();

/*
 * Class StringBuilder
 */
(function(){
	/* -------------------------------------StringBuilder Constructor----------------------------------------------------*/
	function StringBuilder(){
		this._string_ = new Array();
	}
	/* StringBuilder Constructor End */

	/* -------------------------------------StringBuilder Prototype------------------------------------------------------*/
	StringBuilder.prototype={
		//Public methods
		append : function(str){
			this._string_.push(str);
		},
		toString : function(){
			return this._string_.join("");
		},
		empty : function(){
			this._string_ = [];
		}

	};
	/* StringBuilder.prototype end */


	/* Init StringBuilder */
	sBuilder = new StringBuilder();
})();
// JavaScript Document
