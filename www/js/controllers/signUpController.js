/**
 * Created by raul on 1/5/16.
 */

angular.module('controllers').controller('SignUpController', function ($scope, $cordovaGeolocation, GenericController, mainFactory, User) {

    function init() {
        GenericController.init($scope);
        $scope.days = [];
        $scope.months = [
            { value: 1, text: "January" },
            { value: 2, text: "February" },
            { value: 3, text: "March" },
            { value: 4, text: "April" },
            { value: 5, text: "May" },
            { value: 6, text: "June" },
            { value: 7, text: "July" },
            { value: 8, text: "August" },
            { value: 9, text: "September" },
            { value: 10, text: "October" },
            { value: 11, text: "November" },
            { value: 12, text: "December" }
        ];
        $scope.years = [];
        $scope.user = {};
        $scope.wrongCredentials = false;

        initComboboxes();
    }

    function initComboboxes() {
        for (var i = 1; i <= 31; i++) {
            $scope.days.push(i);
        }
        for (i = 1998; i >= 1935; i--) {
            $scope.years.push(i);
        }
    }

    $scope.checkAccountAvailability = function () {
        if (!$scope.validateEmail($scope.user.email)) {
            $scope.showMessage("Please enter a valid email address!", 2500);
            return;
        }
        $scope.addAbsPosition();
        mainFactory.checkEmailAvailability({"email": $scope.user.email}).then(successCheckEmail, errorCheckEmail);
    };

    function successCheckEmail(response) {
        if (!response.data.success) {
            $scope.wrongCredentials = true;
            $scope.showMessage(response.data.error, 3000);
        }
        else {
            if (response.data.existEmail) {
                $scope.wrongCredentials = true;
                $scope.showMessage("There's another account using that email!", 2500);
            }
            else {
                $scope.wrongCredentials = false;
            }
        }
    }

    function errorCheckEmail(response) {
        $scope.wrongCredentials = true;
        $scope.showMessage(response.data.error, 3000);
    }

    $scope.signUp = function() {
        if ($scope.wrongCredentials) {
            $scope.showMessage("There's another account using that email!", 2500);
            return;
        }
        if (!$scope.user.email) {
            $scope.showMessage("Email cannot be empty!", 2500);
            return;
        }
        if (!$scope.validateEmail($scope.user.email)) {
            $scope.showMessage("Please enter a valid email address!", 2500);
            return;
        }
        if (!$scope.user.password) {
            $scope.showMessage("Password cannot be empty!", 2500);
            return;
        }
        if (!$scope.user.name) {
            $scope.showMessage("Name cannot be empty!", 2500);
            return;
        }
        if (!$scope.user.gender) {
            $scope.showMessage("Gender cannot be empty!", 2500);
            return;
        }
        if (!$scope.user.day || !$scope.user.month || !$scope.user.year) {
            $scope.showMessage("Birthday cannot be empty!", 2500);
            return;
        }
        $scope.showMessageWithIcon("Creating account...");
        $scope.getCurrentLocation();

    };

    $scope.getCurrentLocation = function () {
        var posOptions = {timeout: 10000, enableHighAccuracy: false};
        $cordovaGeolocation.getCurrentPosition(posOptions).then(successGetLocation, errorGetLocation);
    };

    function successGetLocation(position) {
        geocodeLatLng(position.coords.latitude, position.coords.longitude);
    }

    function errorGetLocation(err) {
        $scope.hideMessage();
        console.log(err);
        if (err.code == 1) {
            $scope.showMessage("Please enable GPS service to continue.", 3000);
        }
    }

    function geocodeLatLng(lat, long) {
        var geocoder = new google.maps.Geocoder;
        var latlng = {lat: parseFloat(lat), lng: parseFloat(long)};
        geocoder.geocode({'location': latlng}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    //results[0] = Full street address
                    //results[1] = locality address
                    //results[2] = postal code address
                    //results[3] = county address
                    //results[4] = state address
                    //results[5] = country address
                    var userObj = {
                        "email": $scope.user.email,
                        "password": $scope.user.password,
                        "name": $scope.user.name,
                        "lastname": "Rivero",
                        "dob": $scope.user.month + "-" + $scope.user.day + "-" + $scope.user.year,
                        "gender": $scope.user.gender,
                        "age": calculateAge(),
                        "location": results[2].formatted_address,
                        "pictures": "'{1.jpg}'", //temporary solution until the picture upload feature is done
                        "coords": latlng
                    };
                    mainFactory.createAccount(userObj).then(successCallBack, errorCallBack);
                } else {
                    $scope.showMessage('No results found', 2500);
                }
            } else {
                $scope.showMessage('Geocoder failed due to: ' + status, 2500);
            }
        });
    }

    function calculateAge() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        var diffYears = yyyy - parseInt($scope.user.year);
        var a = mm * 30 + dd, b = parseInt($scope.user.month) * 30 + parseInt($scope.user.day);
        return a < b ? diffYears - 1 : diffYears;
    }

    function successCallBack(response) {
        $scope.hideMessage();
        $scope.setUserToLS($scope.user.email);
        User.setToken(response.data.token);
        response.data.user = $scope.parseDataFromDB(response.data.user);
        User.setUser(response.data.user);
        //$scope.goToPage('add_photos');
        $scope.goToPage('app/matching');
    }

    function errorCallBack(response) {
        $scope.hideMessage();
        $scope.showMessage(response.data.error, 3000);
    }

    init();
});