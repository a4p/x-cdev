'use strict';

//controller of Responsive


function responsiveCtrl($scope, $window) {
  $scope.responsiveOneColumn = false;
  $scope.responsiveWidth = 0;
  $scope.responsiveHeight = 0;
  $scope.responsiveHeightPage = 0;
//  $scope.leftMarginStyle = {};
//  $scope.rightMarginStyle = {};
//  $scope.middleStyle = {};

  $scope.updateWidth = function() {
      $scope.responsiveWidth = $window.innerWidth;
	  // returns width of browser viewport
      $scope.responsiveWidth = $(window).width() || $(document).width();
      $scope.responsiveWidth = $(document).width();
  }

  $scope.updateHeight = function() {
     //$scope.responsiveHeight = $window.innerHeight;
	  $scope.responsiveHeight = $(window).height() || $(document).height();
     // because of header and footer
     $scope.responsiveHeightPage = $scope.responsiveHeight - 100;
  };

  $scope.columnAdjustments = function() {
	  if ($scope.responsiveWidth < 768)
	  {
          $scope.responsiveOneColumn = true;
          //var mid = $scope.responsiveWidth - 30;
       //   $scope.leftMarginStyle = { width: '15px', maxWidth: '15px' };
       //   $scope.middleStyle = { width: mid + 'px', maxWidth: mid + 'px', };
       //   $scope.rightMarginStyle = { width: '15px', maxWidth: '15px', verticalAlign: 'text-top' };
      } else if ($scope.responsiveWidth >= 1024 ){
          $scope.responsiveOneColumn = false;
      //    var mid = 614;
      //    var margin = ($scope.responsiveWidth - 614) * 0.5;
      //    $scope.leftMarginStyle = { width:  margin + 'px' };
      //    $scope.middleStyle = { width: mid + 'px', maxWidth: mid + 'px', };
      //    $scope.rightMarginStyle = { width: margin + 'px', verticalAlign: 'text-top' };
      } else {
          $scope.responsiveOneColumn = false;
       //   var pc20 = Math.round($scope.responsiveWidth * 0.2);
       //   var pc60 = Math.round($scope.responsiveWidth * 0.6)
       //   $scope.leftMarginStyle = { width:  pc20 + 'px' };
       //   $scope.middleStyle = { width: pc60 + 'px', maxWidth: pc60 + 'px', };
       //   $scope.rightMarginStyle = { width: pc20 + 'px', verticalAlign: 'text-top' };
      }

      //a4p.InternalLog.log('ctrlResponsive', $scope.responsiveOneColumn+' '+$scope.responsiveWidth+' '+$scope.responsiveHeight);
  };

    /*
  $scope.updateWidth();
  $scope.updateHeight();
  $scope.columnAdjustments();

  $window.onresize = function () {
	  a4p.InternalLog.log('ctrlResponsive', 'onresize');

	  // prevent iOS fixed pb
	  // cf. http://stackoverflow.com/questions/7970389/ios-5-fixed-positioning-and-virtual-keyboard
	  setTimeout(function() {

		  var scrollTop = $(window).scrollTop();
          //var offsetTop = $('body').offset().top;
          //a4p.InternalLog.log('ctrlResponsive', ' Scroll '+ scrollTop);
          if (scrollTop <= 0){
	          //$("body").css("height", "+=1").css("height", "-=1");
	          //$("body").scrollTop();
	          //$("body").scroll(0);
	          window.scrollTo(0,0);
              //$('body,html').animate({'scrollTop': '0'}, 10000);
		  }


	  }, 0);
      a4p.safeApply($scope, function() {
          $scope.updateWidth();
          $scope.updateHeight();
          $scope.columnAdjustments();
      });
  };
  */
}

