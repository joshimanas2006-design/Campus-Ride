var app = angular.module("campusRideApp", []);

app.controller("CampusRideController", function ($scope, $http, $timeout) {

    var API_URL = "http://localhost:3000/api";

    // =====================================================
    // VARIABLES
    // =====================================================

    $scope.rides = [];
    $scope.filteredRides = [];
    $scope.students = [];

    $scope.currentUser = null;
    $scope.searchText = "";

    $scope.showLogin = false;
    $scope.showRegister = false;
    $scope.showOfferRide = false;
    $scope.showBookings = false;

    $scope.loginData = {};
    $scope.registerData = {};
    $scope.newRide = {};

    $scope.myBookings = [];
    $scope.bookingRequests = [];

    $scope.bookingCounts = {
        pending: 0,
        accepted: 0,
        rejected: 0,
        total: 0
    };

    $scope.Number = Number;


    // =====================================================
    // RESTORE LOGIN
    // =====================================================

    var savedUser = localStorage.getItem("campusRideUser");

    if (savedUser) {
        try {
            $scope.currentUser = JSON.parse(savedUser);
        } catch (e) {
            localStorage.removeItem("campusRideUser");
        }
    }


    // =====================================================
    // LOGIN MODAL
    // =====================================================

    $scope.openLogin = function () {

        $scope.showLogin = true;
        $scope.showRegister = false;
        $scope.loginData = {};

    };


    $scope.closeLogin = function () {

        $scope.showLogin = false;

    };


    // =====================================================
    // REGISTER MODAL
    // =====================================================

    $scope.openRegister = function () {

        $scope.showRegister = true;
        $scope.showLogin = false;
        $scope.registerData = {};

    };


    $scope.closeRegister = function () {

        $scope.showRegister = false;

    };


    // =====================================================
    // OFFER RIDE MODAL
    // =====================================================

    $scope.openOfferRide = function () {

        if (!$scope.currentUser) {

            alert("Please login first.");

            $scope.openLogin();

            return;
        }

        $scope.showOfferRide = true;
        $scope.newRide = {};

    };


    $scope.closeOfferRide = function () {

        $scope.showOfferRide = false;

    };


    // =====================================================
    // BOOKINGS MODAL
    // =====================================================

    $scope.openBookings = function () {

        if (!$scope.currentUser) {

            alert("Please login first.");

            $scope.openLogin();

            return;
        }

        $scope.showBookings = true;

        $scope.loadBookings();

    };


    $scope.closeBookings = function () {

        $scope.showBookings = false;

    };


    // =====================================================
    // REGISTER
    // =====================================================

    $scope.register = function () {

        if (
            !$scope.registerData.name ||
            !$scope.registerData.email ||
            !$scope.registerData.phone ||
            !$scope.registerData.password
        ) {

            alert("Please fill all fields.");

            return;
        }


        $http.post(
            API_URL + "/register",
            $scope.registerData
        )

        .then(function (response) {

            alert("Registration successful! You can now login.");

            $scope.showRegister = false;

            $scope.registerData = {};

            $scope.openLogin();

        })

        .catch(function (error) {

            console.error(
                "Registration error:",
                error
            );

            alert(
                error.data &&
                error.data.message
                    ? error.data.message
                    : "Registration failed."
            );

        });

    };


    // =====================================================
    // LOGIN
    // =====================================================

    $scope.login = function () {

        if (
            !$scope.loginData.email ||
            !$scope.loginData.password
        ) {

            alert("Please enter email and password.");

            return;
        }


        $http.post(
            API_URL + "/login",
            $scope.loginData
        )

        .then(function (response) {

            $scope.currentUser =
                response.data.student;


            localStorage.setItem(
                "campusRideUser",
                JSON.stringify(
                    $scope.currentUser
                )
            );


            $scope.showLogin = false;

            $scope.loginData = {};


            alert(
                "Welcome, " +
                $scope.currentUser.name +
                "!"
            );


            $scope.loadBookings();

        })

        .catch(function (error) {

            console.error(
                "Login error:",
                error
            );

            alert(
                error.data &&
                error.data.message
                    ? error.data.message
                    : "Login failed."
            );

        });

    };


    // =====================================================
    // LOGOUT
    // =====================================================

    $scope.logout = function () {

        $scope.currentUser = null;

        localStorage.removeItem(
            "campusRideUser"
        );


        $scope.myBookings = [];

        $scope.bookingRequests = [];


        $scope.bookingCounts = {

            pending: 0,
            accepted: 0,
            rejected: 0,
            total: 0

        };


        alert("Logged out successfully.");

    };


    // =====================================================
    // LOAD STUDENTS
    // =====================================================

    $scope.loadStudents = function () {

        $http.get(
            API_URL + "/students"
        )

        .then(function (response) {

            $scope.students =
                response.data || [];

        })

        .catch(function (error) {

            console.error(
                "Error loading students:",
                error
            );

        });

    };


    // =====================================================
    // LOAD RIDES
    // =====================================================

    $scope.loadRides = function () {

        $http.get(
            API_URL + "/rides"
        )

        .then(function (response) {

            $scope.rides =
                response.data || [];


            $scope.filteredRides =
                $scope.rides;


            $timeout(function () {

                $scope.updateMapWithRides();

            }, 100);

        })

        .catch(function (error) {

            console.error(
                "Error loading rides:",
                error
            );

        });

    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    $scope.formatDate = function (date) {

        if (!date) return "";

        var d = new Date(date);

        if (isNaN(d.getTime())) {

            return date;

        }


        return d.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    // =====================================================
    // FORMAT TIME FOR DISPLAY
    // =====================================================

    $scope.formatTime = function (time) {

        if (!time) return "";

        var value = String(time).trim();


        // Handle ISO datetime
        // Example:
        // 1970-01-01T01:30:00.000Z

        if (value.indexOf("T") !== -1) {

            var timePart =
                value.split("T")[1] || "";

            timePart =
                timePart
                    .replace("Z", "")
                    .split(".")[0];

            value = timePart;

        }


        var parts =
            value.split(":");


        if (parts.length < 2) {

            return value;

        }


        var hour =
            parseInt(parts[0], 10);

        var minute =
            parts[1];


        if (isNaN(hour)) {

            return value;

        }


        var ampm =
            hour >= 12
                ? "PM"
                : "AM";


        hour =
            hour % 12;


        if (hour === 0) {

            hour = 12;

        }


        return (
            hour +
            ":" +
            minute +
            " " +
            ampm
        );

    };


    // =====================================================
    // FORMAT DATE FOR MYSQL
    // =====================================================

    function formatDateForMySQL(date) {

        if (!date) return null;


        if (date instanceof Date) {

            var year =
                date.getFullYear();

            var month =
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");

            var day =
                String(
                    date.getDate()
                ).padStart(2, "0");


            return (
                year +
                "-" +
                month +
                "-" +
                day
            );

        }


        var d = new Date(date);


        if (isNaN(d.getTime())) {

            return null;

        }


        var y =
            d.getFullYear();

        var m =
            String(
                d.getMonth() + 1
            ).padStart(2, "0");

        var dayValue =
            String(
                d.getDate()
            ).padStart(2, "0");


        return (
            y +
            "-" +
            m +
            "-" +
            dayValue
        );

    };


    // =====================================================
    // FIXED TIME FORMAT FOR MYSQL
    // =====================================================
    //
    // IMPORTANT:
    // Angular/browser may send:
    //
    // 01:30
    //
    // OR:
    //
    // 01:30:00
    //
    // OR:
    //
    // 1970-01-01T01:30:00.000Z
    //
    // MySQL TIME column requires:
    //
    // HH:MM:SS
    //
    // We extract the time directly instead of using
    // new Date(...).getHours(), which can cause timezone
    // changes.
    // =====================================================

    function formatTimeForMySQL(time) {

        if (!time) return null;


        // If browser gives a Date object

        if (time instanceof Date) {

            var hours =
                String(
                    time.getHours()
                ).padStart(2, "0");

            var minutes =
                String(
                    time.getMinutes()
                ).padStart(2, "0");


            return (
                hours +
                ":" +
                minutes +
                ":00"
            );

        }


        time =
            String(time).trim();


        // =================================================
        // ISO STRING
        // Example:
        // 1970-01-01T01:30:00.000Z
        // =================================================

        if (time.indexOf("T") !== -1) {

            var timePart =
                time.split("T")[1] || "";


            timePart =
                timePart
                    .replace("Z", "")
                    .split(".")[0];


            if (
                /^\d{2}:\d{2}$/.test(
                    timePart
                )
            ) {

                return (
                    timePart +
                    ":00"
                );

            }


            if (
                /^\d{2}:\d{2}:\d{2}$/.test(
                    timePart
                )
            ) {

                return timePart;

            }

        }


        // =================================================
        // HH:MM
        // =================================================

        if (
            /^\d{2}:\d{2}$/.test(time)
        ) {

            return time + ":00";

        }


        // =================================================
        // HH:MM:SS
        // =================================================

        if (
            /^\d{2}:\d{2}:\d{2}$/.test(time)
        ) {

            return time;

        }


        return null;

    };


    // =====================================================
    // OFFER RIDE
    // =====================================================

    $scope.offerRide = function () {

        if (!$scope.currentUser) {

            alert("Please login first.");

            return;
        }


        if (
            !$scope.newRide.from_location ||
            !$scope.newRide.to_location ||
            !$scope.newRide.ride_date ||
            !$scope.newRide.ride_time ||
            !$scope.newRide.available_seats
        ) {

            alert(
                "Please fill all required fields."
            );

            return;

        }


        var mysqlDate =
            formatDateForMySQL(
                $scope.newRide.ride_date
            );


        var mysqlTime =
            formatTimeForMySQL(
                $scope.newRide.ride_time
            );


        // Stop if date/time conversion failed

        if (!mysqlDate) {

            alert("Invalid ride date.");

            return;

        }


        if (!mysqlTime) {

            alert("Invalid ride time.");

            return;

        }


        var rideData = {

            driver_id:
                $scope.currentUser.id,

            from_location:
                $scope.newRide.from_location,

            to_location:
                $scope.newRide.to_location,

            ride_date:
                mysqlDate,

            ride_time:
                mysqlTime,

            available_seats:
                Number(
                    $scope.newRide.available_seats
                ),

            price:
                Number(
                    $scope.newRide.price || 0
                )

        };


        console.log(
            "Sending ride data:",
            rideData
        );


        $http.post(
            API_URL + "/rides",
            rideData
        )

        .then(function (response) {

            console.log(
                "Ride created:",
                response.data
            );


            alert(
                "Ride offered successfully!"
            );


            $scope.showOfferRide = false;

            $scope.newRide = {};


            $scope.loadRides();

        })

        .catch(function (error) {

            console.error(
                "Offer ride error:",
                error
            );


            alert(
                error.data &&
                error.data.message
                    ? error.data.message
                    : "Could not offer ride."
            );

        });

    };


    // =====================================================
    // DELETE RIDE
    // =====================================================

    $scope.deleteRide = function (ride) {

        if (!$scope.currentUser) return;


        if (
            Number(ride.driver_id) !==
            Number($scope.currentUser.id)
        ) {

            alert(
                "You can only delete your own ride."
            );

            return;

        }


        if (
            !confirm(
                "Are you sure you want to delete this ride?"
            )
        ) {

            return;

        }


        $http.delete(

            API_URL +
            "/rides/" +
            ride.id,

            {
                data: {

                    driver_id:
                        $scope.currentUser.id

                }

            }

        )

        .then(function () {

            alert(
                "Ride deleted successfully."
            );


            $scope.loadRides();

            $scope.loadBookings();

        })

        .catch(function (error) {

            console.error(
                "Delete ride error:",
                error
            );


            alert(
                error.data &&
                error.data.message
                    ? error.data.message
                    : "Could not delete ride."
            );

        });

    };


    // =====================================================
    // SEARCH RIDES
    // =====================================================

    $scope.searchRides = function () {

        var search =
            ($scope.searchText || "")
                .toLowerCase()
                .trim();


        if (!search) {

            $scope.filteredRides =
                $scope.rides;

            return;

        }


        $scope.filteredRides =
            $scope.rides.filter(
                function (ride) {

                    return (

                        String(
                            ride.from_location || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            ride.to_location || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            ride.driver_name || ""
                        )
                        .toLowerCase()
                        .includes(search)

                    );

                }
            );

    };


    // =====================================================
    // CHECK OWN RIDE
    // =====================================================

    $scope.isMyRide = function (ride) {

        if (!$scope.currentUser) {

            return false;

        }


        return (
            Number(ride.driver_id) ===
            Number($scope.currentUser.id)
        );

    };


    // =====================================================
    // REQUEST RIDE
    // =====================================================

    $scope.requestRide = function (ride) {

        if (!$scope.currentUser) {

            alert("Please login first.");

            $scope.openLogin();

            return;

        }


        if (!ride) return;


        if ($scope.isMyRide(ride)) {

            alert(
                "You cannot book your own ride."
            );

            return;

        }


        if (
            Number(
                ride.available_seats
            ) <= 0
        ) {

            alert(
                "No seats available."
            );

            return;

        }


        if (
            !confirm(
                "Send booking request to " +
                ride.driver_name +
                "?"
            )
        ) {

            return;

        }


        var bookingData = {

            ride_id:
                ride.id,

            student_id:
                $scope.currentUser.id

        };


        $http.post(

            API_URL +
            "/bookings",

            bookingData

        )

        .then(function () {

            alert(
                "Booking request sent successfully!"
            );


            $scope.loadRides();

            $scope.loadBookings();

        })

        .catch(function (error) {

            console.error(
                "Booking error:",
                error
            );


            alert(
                error.data &&
                error.data.message
                    ? error.data.message
                    : "Could not send booking request."
            );

        });

    };


    // =====================================================
    // LOAD BOOKINGS
    // =====================================================

    $scope.loadBookings = function () {

        if (!$scope.currentUser) return;


        var studentId =
            $scope.currentUser.id;


        // =================================================
        // MY BOOKINGS
        // =================================================

        $http.get(

            API_URL +
            "/bookings/student/" +
            studentId

        )

        .then(function (response) {

            $scope.myBookings =
                response.data || [];


            $scope.calculateBookingCounts();

        })

        .catch(function (error) {

            console.error(
                "Error loading my bookings:",
                error
            );

        });


        // =================================================
        // BOOKING REQUESTS FOR MY RIDES
        // =================================================

        $http.get(

            API_URL +
            "/bookings/driver/" +
            studentId

        )

        .then(function (response) {

            $scope.bookingRequests =
                response.data || [];


            $scope.calculateBookingCounts();

        })

        .catch(function (error) {

            console.error(
                "Error loading booking requests:",
                error
            );

        });

    };


    // =====================================================
    // BOOKING COUNTS
    // =====================================================

    $scope.calculateBookingCounts =
        function () {

            var pending = 0;

            var accepted = 0;

            var rejected = 0;


            ($scope.myBookings || [])
                .forEach(
                    function (booking) {

                        var status =
                            String(
                                booking.status || ""
                            ).toUpperCase();


                        if (
                            status === "PENDING"
                        ) {

                            pending++;

                        }


                        if (
                            status === "ACCEPTED"
                        ) {

                            accepted++;

                        }


                        if (
                            status === "REJECTED"
                        ) {

                            rejected++;

                        }

                    }
                );


            $scope.bookingCounts = {

                pending: pending,

                accepted: accepted,

                rejected: rejected,

                total:
                    pending +
                    accepted +
                    rejected

            };

        };


    // =====================================================
    // BOOKING STATUS CLASS
    // =====================================================

    $scope.getBookingStatusClass =
        function (status) {

            status =
                String(
                    status || ""
                ).toUpperCase();


            if (
                status === "ACCEPTED"
            ) {

                return "bg-success";

            }


            if (
                status === "REJECTED"
            ) {

                return "bg-danger";

            }


            return "bg-warning text-dark";

        };


    // =====================================================
    // ACCEPT BOOKING
    // =====================================================

    $scope.acceptBooking =
        function (booking) {

            if (!$scope.currentUser) {

                return;

            }


            if (
                !confirm(
                    "Accept booking request from " +
                    booking.passenger_name +
                    "?"
                )
            ) {

                return;

            }


            $http.put(

                API_URL +
                "/bookings/" +
                booking.id +
                "/accept",

                {

                    driver_id:
                        $scope.currentUser.id

                }

            )

            .then(function () {

                alert(
                    "Booking accepted successfully!"
                );


                $scope.loadBookings();

                $scope.loadRides();

            })

            .catch(function (error) {

                console.error(
                    "Accept booking error:",
                    error
                );


                alert(
                    error.data &&
                    error.data.message
                        ? error.data.message
                        : "Could not accept booking."
                );

            });

        };


    // =====================================================
    // REJECT BOOKING
    // =====================================================

    $scope.rejectBooking =
        function (booking) {

            if (!$scope.currentUser) {

                return;

            }


            if (
                !confirm(
                    "Reject booking request from " +
                    booking.passenger_name +
                    "?"
                )
            ) {

                return;

            }


            $http.put(

                API_URL +
                "/bookings/" +
                booking.id +
                "/reject",

                {

                    driver_id:
                        $scope.currentUser.id

                }

            )

            .then(function () {

                alert(
                    "Booking rejected."
                );


                $scope.loadBookings();

            })

            .catch(function (error) {

                console.error(
                    "Reject booking error:",
                    error
                );


                alert(
                    error.data &&
                    error.data.message
                        ? error.data.message
                        : "Could not reject booking."
                );

            });

        };


    // =====================================================
    // REFRESH BOOKINGS
    // =====================================================

    $scope.refreshBookings = function () {

        $scope.loadBookings();

        $scope.loadRides();

    };


    // =====================================================
    // TOTAL SEATS
    // =====================================================

    $scope.getTotalSeats = function (ride) {

        return Number(
            ride.available_seats || 0
        );

    };


    // =====================================================
    // MAP
    // =====================================================

    var map = null;

    var pickupMarkers = [];

    var destinationMarkers = [];

    var routeLines = [];


    // =====================================================
    // LOCATION COORDINATES
    // =====================================================

    var locationCoordinates = {

        "Andheri":
            [19.1197, 72.8468],

        "Bandra":
            [19.0607, 72.8362],

        "Kurla":
            [19.0726, 72.8845],

        "Ghatkopar":
            [19.0860, 72.9081],

        "Vikhroli":
            [19.1111, 72.9278],

        "Powai":
            [19.1176, 72.9060],

        "Mulund":
            [19.1726, 72.9425],

        "Thane":
            [19.2183, 72.9781],

        "Dadar":
            [19.0178, 72.8478],

        "Matunga":
            [19.0270, 72.8550],

        "Sion":
            [19.0460, 72.8630],

        "Chembur":
            [19.0626, 72.8970],

        "Vashi":
            [19.0771, 72.9986],

        "Nerul":
            [19.0330, 73.0197],

        "Sanpada":
            [19.0610, 73.0080],

        "Ghansoli":
            [19.1260, 73.0050],

        "Airoli":
            [19.1590, 72.9986],

        "Navi Mumbai":
            [19.0330, 73.0297],

        "Mumbai":
            [19.0760, 72.8777],

        "SM Shetty College":
            [19.1217, 72.9060],

        "SM Shetty":
            [19.1217, 72.9060],

        "S.M. Shetty College":
            [19.1217, 72.9060]

    };


    // =====================================================
    // GET COORDINATES
    // =====================================================

    function getCoordinates(location) {

        if (!location) {

            return null;

        }


        var cleanLocation =
            String(location).trim();


        if (
            locationCoordinates[
                cleanLocation
            ]
        ) {

            return locationCoordinates[
                cleanLocation
            ];

        }


        var lower =
            cleanLocation.toLowerCase();


        for (
            var key in locationCoordinates
        ) {

            if (
                key.toLowerCase() ===
                lower
            ) {

                return locationCoordinates[
                    key
                ];

            }

        }


        return null;

    };


    // =====================================================
    // INITIALIZE MAP
    // =====================================================

    function initMap() {

        if (map) return;


        var mapElement =
            document.getElementById("map");


        if (!mapElement) return;


        map =
            L.map("map")
                .setView(
                    [19.0760, 72.8777],
                    11
                );


        L.tileLayer(

            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

            {

                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"

            }

        ).addTo(map);


        $scope.updateMapWithRides();

    };


    // =====================================================
    // UPDATE MAP WITH RIDES
    // =====================================================

    $scope.updateMapWithRides =
        function () {

            if (!map) return;


            // Remove old pickup markers

            pickupMarkers.forEach(
                function (marker) {

                    map.removeLayer(
                        marker
                    );

                }
            );


            // Remove old destination markers

            destinationMarkers.forEach(
                function (marker) {

                    map.removeLayer(
                        marker
                    );

                }
            );


            // Remove old route lines

            routeLines.forEach(
                function (line) {

                    map.removeLayer(
                        line
                    );

                }
            );


            pickupMarkers = [];

            destinationMarkers = [];

            routeLines = [];


            // Add rides

            ($scope.rides || [])
                .forEach(
                    function (ride) {

                        var from =
                            getCoordinates(
                                ride.from_location
                            );


                        var to =
                            getCoordinates(
                                ride.to_location
                            );


                        if (
                            !from ||
                            !to
                        ) {

                            return;

                        }


                        // =================================================
                        // PICKUP MARKER
                        // =================================================

                        var pickupMarker =
                            L.marker(from)
                                .addTo(map)
                                .bindPopup(

                                    "<b>Pickup</b><br>" +

                                    ride.from_location +

                                    "<br><br>" +

                                    "<b>Driver:</b> " +

                                    (
                                        ride.driver_name ||
                                        "Unknown"
                                    )

                                );


                        pickupMarkers.push(
                            pickupMarker
                        );


                        // =================================================
                        // DESTINATION MARKER
                        // =================================================

                        var destinationMarker =
                            L.marker(to)
                                .addTo(map)
                                .bindPopup(

                                    "<b>Destination</b><br>" +

                                    ride.to_location +

                                    "<br><br>" +

                                    "<b>Driver:</b> " +

                                    (
                                        ride.driver_name ||
                                        "Unknown"
                                    )

                                );


                        destinationMarkers.push(
                            destinationMarker
                        );


                        // =================================================
                        // ROUTE LINE
                        // =================================================

                        var routeLine =
                            L.polyline(

                                [from, to],

                                {

                                    weight: 4,

                                    opacity: 0.7

                                }

                            ).addTo(map);


                        routeLines.push(
                            routeLine
                        );

                    }
                );

        };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    $scope.loadStudents();

    $scope.loadRides();


    if ($scope.currentUser) {

        $scope.loadBookings();

    }


    // =====================================================
    // START MAP
    // =====================================================

    $timeout(
        function () {

            initMap();

        },
        500
    );

});