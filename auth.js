/* ==========================================================================
   Web-Verse auth (front-end demo only)
   - Static login:  admin / 12345
   - Registered users are kept in localStorage
   - The logged-in user is kept in sessionStorage (cleared when the tab closes)
   ========================================================================== */

(function ($) {
    "use strict";

    var USERS_KEY = "webverse_users";
    var SESSION_KEY = "webverse_user";

    // Static credentials required by the assignment
    var STATIC_USER = { username: "admin", password: "12345", name: "admin" };

    /* ---------- storage helpers ---------- */

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function findUserByEmail(email) {
        email = String(email).trim().toLowerCase();
        return getUsers().find(function (u) { return u.email === email; });
    }

    function setSession(name) {
        sessionStorage.setItem(SESSION_KEY, name);
    }

    function getSession() {
        return sessionStorage.getItem(SESSION_KEY);
    }

    function showAlert($box, type, message) {
        $box.removeClass("d-none success error")
            .addClass(type)
            .text(message);
    }

    /* ---------- shared validator settings ---------- */

    var hasValidator = !!$.validator;

    if (hasValidator) $.validator.setDefaults({
        errorElement: "span",
        errorClass: "error-msg",
        errorPlacement: function (error, element) {
            if (element.attr("type") === "checkbox") {
                error.insertAfter(element.closest("label"));
            } else {
                error.insertAfter(element);
            }
        },
        highlight: function (element) {
            $(element).addClass("input-error").removeClass("input-ok");
        },
        unhighlight: function (element) {
            $(element).removeClass("input-error").addClass("input-ok");
        }
    });

    // Name: letters, spaces, hyphens, apostrophes and dots only
    if (hasValidator) {
    $.validator.addMethod("personName", function (value, element) {
        return this.optional(element) || /^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F\s'.-]*$/.test(value);
    }, "Names can only contain letters, spaces, hyphens and apostrophes.");

    // Password: at least one letter and one number
    $.validator.addMethod("strongPassword", function (value, element) {
        return this.optional(element) || (/[A-Za-z]/.test(value) && /\d/.test(value));
    }, "Use at least one letter and one number.");

    // Email must not already be registered
    $.validator.addMethod("emailAvailable", function (value, element) {
        return this.optional(element) || !findUserByEmail(value);
    }, "That email is already registered. Try logging in.");
    }

    /* ======================================================================
       LOGIN PAGE
       ====================================================================== */

    var $loginForm = $("#loginForm");

    if ($loginForm.length) {
        // Already logged in? Skip straight to the landing page.
        if (getSession()) {
            window.location.replace("landing.html");
            return;
        }

        var $loginAlert = $("#formAlert");

        $loginForm.validate({
            rules: {
                username: { required: true, minlength: 3 },
                password: { required: true }
            },
            messages: {
                username: {
                    required: "Please enter your username or email.",
                    minlength: "Username must be at least 3 characters."
                },
                password: {
                    required: "Please enter your password."
                }
            },
            submitHandler: function (form) {
                var username = $.trim($("#username").val());
                var password = $("#password").val();
                var displayName = null;

                // 1) static credentials
                if (username.toLowerCase() === STATIC_USER.username && password === STATIC_USER.password) {
                    displayName = STATIC_USER.name;
                } else {
                    // 2) accounts created on the registration page
                    var match = getUsers().find(function (u) {
                        return (u.email === username.toLowerCase() || u.name.toLowerCase() === username.toLowerCase()) &&
                               u.password === password;
                    });
                    if (match) { displayName = match.name; }
                }

                if (displayName) {
                    setSession(displayName);
                    showAlert($loginAlert, "success", "Login successful! Swinging you in...");
                    $(form).find("button[type=submit]").prop("disabled", true);
                    setTimeout(function () {
                        window.location.href = "landing.html";
                    }, 700);
                } else {
                    showAlert($loginAlert, "error", "Invalid username or password. Please try again.");
                    $("#password").val("").trigger("focus");
                }
            }
        });

        // Clear the banner once the user starts typing again
        $loginForm.on("input", "input", function () {
            $loginAlert.addClass("d-none");
        });
    }

    /* ======================================================================
       REGISTRATION PAGE
       ====================================================================== */

    var $registerForm = $("#registerForm");

    if ($registerForm.length) {
        var $regAlert = $("#formAlert");

        $registerForm.validate({
            rules: {
                fullname: { required: true, minlength: 2, maxlength: 60, personName: true },
                email: { required: true, email: true, emailAvailable: true },
                password: { required: true, minlength: 6, strongPassword: true },
                "confirm-password": { required: true, equalTo: "#reg-password" }
            },
            messages: {
                fullname: {
                    required: "Please enter your full name.",
                    minlength: "Your name must be at least 2 characters.",
                    maxlength: "Your name is too long (60 characters max)."
                },
                email: {
                    required: "Please enter your email address.",
                    email: "That doesn't look like a valid email (try name@example.com)."
                },
                password: {
                    required: "Please create a password.",
                    minlength: "Password must be at least 6 characters."
                },
                "confirm-password": {
                    required: "Please confirm your password.",
                    equalTo: "Passwords don't match. Please type the same password again."
                }
            },
            submitHandler: function (form) {
                var users = getUsers();

                users.push({
                    name: $.trim($("#fullname").val()),
                    email: $.trim($("#email").val()).toLowerCase(),
                    password: $("#reg-password").val()
                });
                saveUsers(users);

                showAlert($regAlert, "success", "Account created! Redirecting you to the login page...");
                $(form).find("button[type=submit]").prop("disabled", true);

                setTimeout(function () {
                    window.location.href = "login.html";
                }, 1600);
            }
        });

        // Re-check confirm password whenever the password changes
        $("#reg-password").on("keyup change", function () {
            if ($("#confirm-password").val()) {
                $("#confirm-password").valid();
            }
        });
    }

    /* ======================================================================
       LANDING PAGE (protected)
       ====================================================================== */

    var $welcome = $("#welcomeName");

    if ($welcome.length) {
        var user = getSession();

        if (!user) {
            window.location.replace("login.html");
            return;
        }

        $welcome.text(user);

        $("#logoutBtn, .js-logout").on("click", function (e) {
            e.preventDefault();
            sessionStorage.removeItem(SESSION_KEY);
            window.location.href = "login.html";
        });
    }

})(jQuery);
