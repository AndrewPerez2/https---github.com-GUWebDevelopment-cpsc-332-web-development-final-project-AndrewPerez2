
(function ($) {
    ("use strict");

    //open/closes the sidebar menu
    $(".menu-toggle").click(function (e) {
        // e.preventDefault();
        $("#sidebar-wrapper").toggleClass("active");
        $(".menu-toggle > .fa-bars, .menu-toggle > .fa-times").toggleClass(
            "fa-bars fa-times"
        );
        $(this).toggleClass("active");
    });
    $('sidebar-wrapper .js-scroll-trigger').click(function () {
        $("#sidebar-wrapper").removeClass("active");
        $("menu-toggler").removeClass("active");
        $(".menu-toggle > fa.bars, .menu-toggle > .fa-times").toggleClass(
            "fa-bars fa-times"
        );

    });
    // scroll function to fade in and out through the screen
    $(document).scroll(function () {
        var scrollDistance = $(this).scrollTop(); //sets distance of number pictures
        if (scrollDistance > 100) { //if distance less than 100 pixels, fade the screen in and lower the upper half.
            $(".scroll-to-top").fadeIn();
        }
        //fade lower half out
        else {
            $(".scroll-to-top").fadeOut();
        }
    });
})(jQuery);

