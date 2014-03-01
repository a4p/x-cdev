(function($) {
	var gStar=0;
	var methods = {
		initRaty : function(selfRaty) {
			
	        var RatyReadOnly = false;
	        if (selfRaty == 0) {
	            RatyReadOnly = false;
	        }
	        $("#star").raty({
	        	cancel    : true,
	        	cancelOff : '/raty/cancel-off.png',
	    	  	cancelOn  : '/raty/cancel-on.png',
	            hintList: ['1', '2', '3', '4', '5'], 
	            number: 5, 
	            readOnly: RatyReadOnly, 
	            scoreName: "score", 
	            start: selfRaty, 
	            starOff: "/raty/star-off.png", 
	            starOn: "/raty/star-on.png", 
	            click: function (score) {
	                
	                methods.saveRaty(score); 
	                methods.clickRaty(score);
	            }
	        });
	    },
	    saveRaty : function(selfRaty) {
	        gStar = selfRaty;
	    },
	    clickRaty : function(selfRaty) {
	          $.fn.raty.readOnly(true);
	    }
	    
	};
	
	$.fn.feedback = function(){
		var html = ''+
		
		'<div class="control-group">'+
			'<label class="control-label" for="feedback_company_name" lang="en" name="Company">'+
				'Company'+
			'</label>'+
			'<div class="controls">'+
				'<input type="text" id="feedback_company_name" class="editable" placeholder="Your company\'s name">'+
			'</div>'+
		'</div>'+
		'<div class="control-group">'+
			'<label class="control-label" for="feedback_phone" lang="en" name="Your Phone">'+
				'Your Phone'+
			'</label>'+
			'<div class="controls">'+
				'<input type="tel" class="editable" id="feedback_phone"  placeholder="Your Phone">'+
			'</div>'+
		'</div>'+
		'<div class="control-group">'+
			'<div class="controls" id="rate">'+
				'<div id="star"></div>'+
			'</div>'+
		'</div>'+
		'<div class="control-group">'+
			'<div class="controls">'+
				'<textarea id="feedback_feedback" class="editable" placeholder="Your feedback is usefull to improve our application!"></textarea>'+
			'</div>'+
		'</div>';
		
		this.empty();
		this.append(html);
		methods.initRaty(2);
		return this;
		
	};
	$.fn.feedback.save = function(){		
		var feedback_company_name = $('#feedback_company_name').val();
		var feedback_phone = $('#feedback_phone').val();
		var feedback_feedback = $('#feedback_feedback').val();
		var feedback_star = gStar;
		window.localStorage['feedback_company_name'] = feedback_company_name;
		window.localStorage['feedback_phone'] = feedback_phone;
		window.localStorage['feedback_feedback'] = feedback_feedback;
		window.localStorage['feedback_star'] = feedback_star;
	};
	
})(jQuery);


