(function(){
 	//SingletonFactory
	a4pDeviceAdapter = {
     	GetInstance : function(){
        if(DeviceAdapter.instance == null)
         	return new DeviceAdapter();
        else
            return DeviceAdapter.instance;
        }
	};

    //Private Class
    function DeviceAdapter(){
		//Private attributes
		var _device_menu_index = "";
		var _screen_width =  document.body.clientWidth;
		//var _screen_height =  document.body.clientHeight;
		//var _allFonctionBind = false;
		var _menu_select_bind = false;
		var _animate_totop_bind =false;
		var _show_side_bar_bind = false;
		var _checkBox_bind = false;
		var _ui_style_bind = false;
		var _is_state_resize = false;
		/*
		 * The Private Functions
 		 */
		function _isPhone(){
			//if(_screen_width < 480)
			if(_screen_width < 769)
				return true;
			else
				return false;
		}

		function _isPadOrPlus(){
			if(_screen_width >= 980)
				return true;
			else
				return false;
		}

		function _isOtherDevice(){
			//alert(_screen_width);
			//if( _screen_width >= 480 && _screen_width < 1024)
			if( _screen_width >= 769 && _screen_width < 980)
				return true;
			else
				return false;
		}

		// Test the button to top need display or not
		function _check_toTop_display(){
			if(_isPhone())
				$("#a4pToTop").show();
			else
				$("#a4pToTop").hide();
		}

		// Check is the Phone style or not
		function _check_isPhone_style(){

			if(_isPhone() && !_ui_style_bind){
				//if(_device_menu_index != 'index_config'){
					$("#a4pDetails").hide();
					$("#a4pSidebar").show();
				//}
				//else{
					//$("#a4pSidebar").show();
					//$("#a4pDetails").show();
				//}
			}
			else{
				if(!_isPhone()){
					$("#a4pSidebar").show();
					$("#a4pDetails").show();
				}
			}
			_ui_style_bind = true;
		}

		// Check the currerent index in the menu
		function _bind_menu_select(){
			//alert("_bind_menu_select");
			//alert("_device_menu_index " + _device_menu_index);
			if(_device_menu_index == "" || !_menu_select_bind){
				_device_menu_index = "index_home";
				$("#a4pHeaderV div a").each(function(){
					$(this).mouseover(function(){
						$(this).css({color:"#FFFFFF"});
					});
					$(this).mouseleave(function(){
						if($(this).attr("id") != _device_menu_index){
							$(this).css({color:"#999999"});
						}
					});
					$(this).click(function(){
						//alert("_device_menu_index " + _device_menu_index);
						if(_device_menu_index !=$(this).attr("id")){
							_device_menu_index = $(this).attr("id");
						}
					});
				});

				if(!_menu_select_bind){
				//MLE???	$("#a4pHeaderV div a").click(loadUrlVars);
					//$("#v-mleHeader div a").click(DeviceAdapter.instance.show_active_menu);
					_menu_select_bind = true;
				}
			}
		}

		//The funtion to animate to top
		function _bind_animate_totop(){
			if(_isPhone() && !_animate_totop_bind){
				$("#a4pToTop a").click(function(){
					var offset_top = $('#a4pSidebar').offset().top;
					offset_top -=20;
					$("html,body").animate({scrollTop: offset_top}, 618);
				});
				_animate_totop_bind = true;
			}
		}

		/*
		 * Bind the function shows_mobile side bar to the link button"to top"
		 * and the button of the mobile menu. If the device is mobile now
		 */
		function _bind_show_sidebar(){
			if(_isPhone()){
				$("#a4pToTop a").click(DeviceAdapter.instance.show_mobile_sidebar);
				if(!_show_side_bar_bind)
					$("#a4pHeaderV div a").click(DeviceAdapter.instance.show_mobile_sidebar);
				_show_side_bar_bind = true;
			}
		}

		/*
		 * Deplace the postion of the msg box if the user
		 * use the mobile phone
		 */
		function _deplace_msgBox_toTop(){
			//alert(_isOtherDevice());
			if(_isPhone()){// || _isOtherDevice()){
				$("#msgBox").prependTo("#detail_root");
			}
		}

		function _deplace_relCategories_toBottom(){
			//alert(_isOtherDevice());
			if(_isPhone()){// || _isOtherDevice()){
				//alert('toBottom');
				$("#relatedCatg").appendTo($("#a4pDetailsScroller .row").last());
			}
		}

		function _deplace_relCategories_toLeft(){
			if(_isPadOrPlus()|| _isOtherDevice()){
				//alert('toLeft');
				$("#relatedCatg").insertAfter($("#detail_root img").first());
			}
		}

		function _deplace_msgBox_toLeft(){
			if(_isPadOrPlus()|| _isOtherDevice()){
				$("#msgBox").insertAfter($("#detail_root img").first());
			}
		}

		function _deplace_rowFluid_to_right(){
			if(_isPadOrPlus()|| _isOtherDevice()){
				if($("#a4pDetailsScroller .row").size() > 2){
					if(!_is_state_resize){
						$("#a4pDetailsScroller .row").last().css({float:'right'});
						$("#a4pDetailsScroller .row").last().insertAfter($("#a4pDetailsScroller .row").first());
					}
				}
				else{
					$("#a4pDetailsScroller .row").css({width:'300px'});
					$("#a4pDetailsScroller").css({width:'300px'});
					$("#a4pDetailsWrapper").css({width:'300px'});
				}
			}
		}

		//Define the height for the itemDetial of iscoll by the element size */
		function _update_itemDetial_height(){
			var height = $("#a4pDetailsScroller").height();
			height += 380;
			$("#a4pDetailsScroller").height(height);
		}

		/*
		 * Init the bool parametres(Not for the menu element), because when the page reload,
		 * the element in template will be recreated. For rebind the function to the element
		 * we must init these parametres in every time when templated loaded
		 */
		function _init_bind_param_for_element(){
			_screen_width =  document.body.clientWidth;
			_checkBox_bind = false;
			_animate_totop_bind = false;
		}

		function _update_detail_button() {
			$("#a4pDetailsScroller button").click(function(){
				var link = $(this).data('link');
				var type = $(this).data('type');

				if (type == 'new') {
					return openChildBrowser(link, 'url');
				}

				//window.open(link);
				//$('<a href="' + link + '">' + link + '</a>').appendTo('body').click();//.remove();
				var a = document.createElement('a');
			    a.setAttribute("href", link);
			    a.setAttribute("target", "_blank");

			    var dispatch = document.createEvent("HTMLEvents")
			    dispatch.initEvent("click", false, false);
			    a.dispatchEvent(dispatch);
				});

		}

		/*
		 * The Public Functions
		 * Test the function _is_iPhone() and _is_iPad()
		 */
		this.reset_ui_style_bind = function(){
			_ui_style_bind = false;
		},

		// Refresh the size of the screen or window
		this.reset_screen_size = function(){
            a4p.InternalLog.log('a4p.device_adapter','reset_screen_size :'+_screen_width+' new:'+document.body.clientWidth);
			_screen_width = document.body.clientWidth;
			_is_state_resize = true;
		},

		this.resize_screen_fini = function(){
			_is_state_resize = false;
		},

		this.getDevice = function(){
			var device = "PC";
			if(_isPhone())
				device = "Phone";
			else if(_isPadOrPlus())
				device = "PadOrPlus";
			else if(_isOtherDevice())
				device = "OtherDevice";

            a4p.InternalLog.log('a4p.device_adapter','getDevice :'+device );

			return device;

		},

		this.isPadOrPlus = function(){
            a4p.InternalLog.log('a4p.device_adapter','isPadOrPlus :'+_isPadOrPlus() );
			return _isPadOrPlus();

		},
		this.isPhone = function(){
            a4p.InternalLog.log('a4p.device_adapter','isPhone :'+_isPhone() );
			return _isPhone();

		},

		this.isLargerThanDevice = function(deviceId){

			if (a4p.isUndefined(deviceId)) return true;

			if (deviceId == 'Phone') return false;
			if (deviceId == 'OtherDevice') return _isPadOrPlus();
			//if (deviceId == 'PadOrPlus') return _isPadOrPlus();

			return true;
		},

		this.get_active_index = function(){
			return _device_menu_index;
		},

		//Show the page of sidebar for the mobile
		this.show_mobile_sidebar = function(){
			//if(_device_menu_index != 'index_config'){
				$("#a4pDetails").hide();
				$("#a4pSidebar").show();
			//}
			//else{
				//$("#a4pSidebar").show();
				//$("#a4pDetails").show();
			//}
		},

		//Show the page of detail for the mobile
		this.show_mobile_detail = function(){
			$("#a4pDetails").show();
			$("#a4pSidebar").hide();
		},

		this.show_content_page = function(){
			$("#a4pDetails").show();
		},

		//Show active items in the mobile menu
		this.show_active_menu = function(){
			if($("#a4pHeaderV").css("display") == "block"){
				$("#a4pHeaderV div a").each(function(){
					if($(this).attr("id") == _device_menu_index){
						$(this).css({color:"#FFFFFF"});
					}
					else
						$(this).css({color:"#999999"});
				});
			}
		},

		/*
		 * When use the function of loadUrlVars, we update the
		 * active index of the menu mobile
		 */
		this.set_active_index = function(urlType){
			if(_device_menu_index!=""){
				new_index = 'index_'+ urlType;
				if(_device_menu_index != new_index){
					_device_menu_index = new_index;
				}
			}
			else{
				_device_menu_index = 'index_' + urlType;
			}
		},

		this.run = function(){
			_init_bind_param_for_element();
			_check_toTop_display();
			_check_isPhone_style();
			_bind_menu_select();
			_bind_show_sidebar();
			_deplace_msgBox_toTop();
			//_deplace_relCategories_toBottom();
			_deplace_relCategories_toLeft();
			_deplace_msgBox_toLeft();
			//_deplace_rowFluid_to_right();
			//_update_itemDetial_height();
			_update_detail_button();
		},

		// Add an Area for the checkBox in the use of the iPad to click easily
		this.bind_checkbox2area = function(){
			var check_area = $(".device_check_area");
			check_area.css('padding-top','7px');
			check_area.height("35px");
			check_area.width("110px");

			if(!_checkBox_bind){
				var is_input = false;
				check_area.find('input').click(function(){
					is_input = true;
				});

				check_area.click(function(){
					if(!is_input){
						if($(this).find('input').attr('checked'))
							$(this).find('input').attr('checked', false);
						else
							$(this).find('input').attr('checked', true);
					}
					else{
						is_input = false;
					}
				});

				_checkBox_bind = true;
			}
		},

		 /*
	  	   * LC: We must bind the 'fill' function to the btn "mleRefresh stop"
	  	   * because it is not exist in mleheader
	  	   */
		this.bind_fillBtnEvent = function(){
			var mleRefresh = $("#spmodal .a4pRefresh.stop");
			mleRefresh.click(function(){
                a4p.InternalLog.log('a4p.device_adapter.js','bind_fillBtnEvent');
				var params = {force : true};
				fifoAddJS('fillDB',params);
				fifoLaunch();
			});
		},

		/*
		 * Refresh the btn "Active" for the CRM account in the page config
		 */
		this.refresh_config_btnCRM = function(btn){
			if(btn.elem.context.id == 'is_demo_value'){
				btn.didChange();
				$(".list-unstyled li").each(function(){
					$(this).remove();
				});
				loadConfigTemplate("btnDemo");
			}
		},

		/*
		 * Show Title image
		 *  Use the image of fontawesome
		 */
		this.show_infoTitleImage = function(){
			var icon_phone = "<span class='glyphicon glyphicon-phone icon-large'></span>";
			var icon_user = "<span class='glyphicon glyphicon-user icon-large'></span>";
			var icon_envelope = "<span class='glyphicon glyphicon-envelope icon-large'></span>";
			var icon_map_marker = "<span class='glyphicon glyphicon-map-marker icon-large'></span>";
			var icon_credit_card = "<span class='glyphicon glyphicon-credit-card icon-large'></span>";
			var icon_icon_globe = "<span class='glyphicon glyphicon-globe icon-large'></span>";
			var icon_briefcase = "<span class='glyphicon glyphicon-briefcase icon-large'></span>";
			var icon_bar_chart = "<span class='glyphicon glyphicon-stats icon-large'></span>";
			var icon_file = "<span class='glyphicon glyphicon-file icon-large'></span>";
			var icon_hdd = "<span class='glyphicon glyphicon-hdd icon-large'></span>";
			var icon_calendar = "<span class='glyphicon glyphicon-calendar icon-large'></span>";

			if(_isPadOrPlus()){
				var icon = "";
				$("#a4pDetailsScroller fieldset").each(function(){
					var name = $(this).find('.control-label').first().attr('name');
					switch(name){
						case 'Salutation':
							icon = icon_user;
							break;
						case 'Work':
							icon = icon_phone;
							break;
						case 'Email':
							icon = icon_envelope;
							break;
						case 'Primary':
							icon = icon_map_marker;
							break;
						case 'Alternative':
							icon = icon_map_marker;
							break;
						case 'Name':

							if(urlType == 'account')
								icon = icon_credit_card;
							if(urlType == 'opportunity')
								icon = icon_briefcase;
							if(urlType == 'document')
								icon = icon_file;
							break;
						case 'Website':
							icon = icon_icon_globe;
							break;
						case 'Billing address':
							icon = icon_map_marker;
							break;
						case 'Stage':
							icon = icon_bar_chart;
							break;
						case 'Size':
							icon = icon_hdd;
							break;
						case 'Event name':
							icon = icon_calendar;
					}

					$(this).find('.control-label').first().prepend(icon);
				});
			}
		};

        DeviceAdapter.instance = this;

        // http://stackoverflow.com/questions/10490570/call-angular-js-from-legacy-code  ?
        $(window).resize( function(){
        	var deviceAdapter = a4pDeviceAdapter.GetInstance();
        	deviceAdapter.reset_screen_size();
        	deviceAdapter.reset_ui_style_bind();
        	//MLE ? deviceAdapter.run();
        	deviceAdapter.resize_screen_fini();
        });
	}
})();


