(function (root, factory) {
	"use strict";

	if (typeof exports === 'object') {
		module.exports = factory(root, require('angular'));
	} else if (typeof define === 'function' && define.amd) {
		define(['angular'], function (angular) {
			return (root.ngNotificationsBar = factory(root, angular));
		});
	} else {
		root.ngNotificationsBar = factory(root, root.angular);
	}
}(this, function (window, angular) {
	"use strict";

	var module = angular.module('ngNotificationsBar', []);

	module.provider('notificationsConfig', function () {
		var config = {};

		function setHideDelay(value) {
			config.hideDelay = value;
		}

		function getHideDelay() {
			return config.hideDelay;
		}

		function setAcceptHTML(value) {
			config.acceptHTML = value;
		}

		function getAcceptHTML() {
			return config.acceptHTML;
		}

		function setAutoHide(value) {
			config.autoHide = value;
		}

		function setAutoHideAnimation(value) {
			config.autoHideAnimation = value;
		}

		function getAutoHideAnimation() {
			return config.autoHideAnimation;
		}

		function setAutoHideAnimationDelay(value) {
			config.autoHideAnimationDelay = value;
		}

		function getAutoHideAnimationDelay() {
			return config.autoHideAnimationDelay;
		}

		function getAutoHide() {
			return config.autoHide;
		}

		function setAutoMaxNotifications(value) {
			config.maxNotifications = value;
		}

		function getAutoMaxNotifications() {
			return config.maxNotifications;
		}

		return {
			setHideDelay: setHideDelay,
			setAutoHide: setAutoHide,
			setAutoHideAnimation: setAutoHideAnimation,
			setAutoHideAnimationDelay: setAutoHideAnimationDelay,
			setAcceptHTML: setAcceptHTML,
			setAutoMaxNotifications: setAutoMaxNotifications,

			$get: function () {
				return {
					getHideDelay: getHideDelay,
					getAutoHide: getAutoHide,
					getAutoHideAnimation: getAutoHideAnimation,
					getAutoHideAnimationDelay: getAutoHideAnimationDelay,
					getAcceptHTML: getAcceptHTML,
					getAutoMaxNotifications: getAutoMaxNotifications
				};
			}
		};
	});

	module.factory('notifications', ['$rootScope', function ($rootScope) {
		var showError = function (message) {
			$rootScope.$broadcast('notifications:error', message);
		};

		var showWarning = function (message) {
			$rootScope.$broadcast('notifications:warning', message);
		};

		var showInfo = function (message) {
			$rootScope.$broadcast('notifications:info', message);
		};

		var showSuccess = function (message) {
			$rootScope.$broadcast('notifications:success', message);
		};

		var closeAll = function () {
			$rootScope.$broadcast('notifications:closeAll');
		};

		return {
			showError: showError,
			showInfo: showInfo,
			showWarning: showWarning,
			showSuccess: showSuccess,
			closeAll: closeAll
		};
	}]);

	module.directive('notificationsBar', ['notificationsConfig', '$timeout', '$document', function (notificationsConfig, $timeout, $document) {
		return {
			restrict: 'EA',
			template: function (elem, attr) {
				var acceptHTML = notificationsConfig.getAcceptHTML() || false;
				var iconClasses = attr.closeicon || 'glyphicon glyphicon-remove';
				return acceptHTML ? '\
					<div class="notifications-container" ng-if="notifications.length">\
						<div class="notification {{note.type}}" ng-repeat="note in notifications" ng-class="{\'note-close\': note.close}" ng-class="note.animation">\
							<span class="message" compile="note.message"></span>\
							<span class="' + iconClasses + ' close-click" ng-click="close($index)"></span>\
						</div>\
					</div>\
				' : '\
					<div class="notifications-container" ng-if="notifications.length">\
						<div class="notification {{note.type}} note-{{$index}}" ng-repeat="note in notifications" ng-class="{\'note-close\': note.close}" ng-class="note.animation">\
							<span class="message" >{{note.message}}</span>\
							<span class="' + iconClasses + ' close-click" ng-click="close($index)"></span>\
						</div>\
					</div>\
				';
			},
			link: function (scope) {
				var notifications = scope.notifications = [];
				var autoHideDelay = notificationsConfig.getHideDelay() || 3000;
				var autoHide = notificationsConfig.getAutoHide() || false;
				var autoHideAnimation = notificationsConfig.getAutoHideAnimation() || '';
				var autoHideAnimationDelay = notificationsConfig.getAutoHideAnimationDelay() || 1200;
				var autoMaxNotifications = notificationsConfig.getAutoMaxNotifications() || false;

				var removeById = function (id) {
					var found = -1;

					notifications.forEach(function (el, index) {
						if (el.id === id) {
							found = index;

							el.animation = {};
							el.animation[autoHideAnimation] = true;

							scope.$apply();
						}
					});

					if (found >= 0) {
						scope.close(found);
					}
				};

				var removeOldNotifications = function () {
					notifications.shift();
				};

				var notificationHandler = function (event, data, type, animation) {
					var id, message, maxNotifications = autoMaxNotifications,
						hide = autoHide, hideDelay = autoHideDelay;

					if (typeof data === 'object') {
						message = data.message;
						maxNotifications = data.maxNotifications || maxNotifications;
						hide = (typeof data.hide === 'undefined') ? autoHide : !!data.hide;
						hideDelay = data.hideDelay || hideDelay;
						type = (typeof data.class === 'undefined') ? type : data.class + ' ' + type;
					} else {
						message = data;
					}

					id = 'notif_' + (new Date()).getTime();

					// If there are more then the maximum of notications then remove old notifications
					if (maxNotifications && notifications.length >= maxNotifications) {
						removeOldNotifications();
					}

					notifications.push({id: id, type: type, message: message, animation: animation});
					if (hide) {
						var timer = $timeout(function () {
							removeById(id);
							$timeout.cancel(timer);
						}, hideDelay);
					}
				};

				scope.$on('notifications:error', function (event, data) {
					notificationHandler(event, data, 'error');
				});

				scope.$on('notifications:warning', function (event, data) {
					notificationHandler(event, data, 'warning');
				});

				scope.$on('notifications:info', function (event, data) {
					notificationHandler(event, data, 'info');
				});

				scope.$on('notifications:success', function (event, data) {
					notificationHandler(event, data, 'success');
				});

				scope.$on('notifications:closeAll', function () {
					notifications.length = 0;
				});

				scope.close = function (index) {
					notifications[index].close = true;

					var timerClose = $timeout(function () {
						notifications.splice(index, 1);
						$timeout.cancel(timerClose);
					}, autoHideAnimationDelay);
				};
			}
		};
	}]).directive('compile', ['$compile', function ($compile) {
		return function (scope, element, attrs) {
			scope.$watch(function (scope) {
				return scope.$eval(attrs.compile);
			}, function (value) {
				element.html(value);
				$compile(element.contents())(scope);
			});
		};
	}]);

	return module;
}));
