/*  ---------------------------------------------------
    Template Name: Male Fashion
    Description: Male Fashion - ecommerce teplate
    Author: Colorib
    Author URI: https://www.colorib.com/
    Version: 1.0
    Created: Colorib
---------------------------------------------------------  */

'use strict';

(function ($) {

    /*------------------
        Preloader
    --------------------*/
    $(window).on('load', function () {
        $(".loader").fadeOut();
        $("#preloder").delay(200).fadeOut("slow");

        /*------------------
            Gallery filter
        --------------------*/
        $('.filter__controls li').on('click', function () {
            $('.filter__controls li').removeClass('active');
            $(this).addClass('active');
        });
        if ($('.product__filter').length > 0) {
            var containerEl = document.querySelector('.product__filter');
            var mixer = mixitup(containerEl);
        }
    });

    /*------------------
        Background Set
    --------------------*/
    // $('.set-bg').each(function () {
    //     var bg = $(this).data('setbg');
    //     $(this).css('background-image', 'url(' + bg + ')');
    // });

    //Search Switch
    $('.search-switch').on('click', function () {
        $('.search-model').fadeIn(400);
    });

    $('.search-close-switch').on('click', function () {
        $('.search-model').fadeOut(400, function () {
            $('#search-input').val('');
        });
    });

    $('#search-form').on('submit', function (e) {
        e.preventDefault();
        const query = $('#search-input').val();
    
        window.location.href = `/shop?search=${encodeURIComponent(query)}`;
    });

    /*------------------
		Navigation
	--------------------*/
    $(".mobile-menu").slicknav({
        prependTo: '#mobile-menu-wrap',
        allowParentLinks: true
    });

    /*------------------
        Accordin Active
    --------------------*/
    $('.collapse').on('shown.bs.collapse', function () {
        $(this).prev().addClass('active');
    });

    $('.collapse').on('hidden.bs.collapse', function () {
        $(this).prev().removeClass('active');
    });

    //Canvas Menu
    $(".canvas__open").on('click', function () {
        $(".offcanvas-menu-wrapper").addClass("active");
        $(".offcanvas-menu-overlay").addClass("active");
    });

    $(".offcanvas-menu-overlay").on('click', function () {
        $(".offcanvas-menu-wrapper").removeClass("active");
        $(".offcanvas-menu-overlay").removeClass("active");
    });

    /*-----------------------
        Hero Slider
    ------------------------*/
    $(".hero__slider").owlCarousel({
        loop: true,
        margin: 0,
        items: 1,
        dots: false,
        nav: true,
        navText: ["<span class='arrow_left'><span/>", "<span class='arrow_right'><span/>"],
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        smartSpeed: 1200,
        autoHeight: false,
        autoplay: false
    });

    /*--------------------------
        Select
    ----------------------------*/
    $("select").niceSelect();

    /*-------------------
		Radio Btn
	--------------------- */
    // $(".product__color__select label, .shop__sidebar__size label, .product__details__option__size label").on('click', function () {
    //     $(".product__color__select label, .shop__sidebar__size label, .product__details__option__size label").removeClass('active');
    //     $(this).addClass('active');
    // });

    /*-------------------
		Scroll
	--------------------- */
    $(".nice-scroll").niceScroll({
        cursorcolor: "#0d0d0d",
        cursorwidth: "5px",
        background: "#e5e5e5",
        cursorborder: "",
        autohidemode: true,
        horizrailenabled: false
    });

    /*------------------
        CountDown
    --------------------*/
    // For demo preview start
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    if(mm == 12) {
        mm = '01';
        yyyy = yyyy + 1;
    } else {
        mm = parseInt(mm) + 1;
        mm = String(mm).padStart(2, '0');
    }
    var timerdate = mm + '/' + dd + '/' + yyyy;
    // For demo preview end


    // Uncomment below and use your date //

    /* var timerdate = "2020/12/30" */

    $("#countdown").countdown(timerdate, function (event) {
        $(this).html(event.strftime("<div class='cd-item'><span>%D</span> <p>Days</p> </div>" + "<div class='cd-item'><span>%H</span> <p>Hours</p> </div>" + "<div class='cd-item'><span>%M</span> <p>Minutes</p> </div>" + "<div class='cd-item'><span>%S</span> <p>Seconds</p> </div>"));
    });

    /*------------------
		Magnific
	--------------------*/
    $('.video-popup').magnificPopup({
        type: 'iframe'
    });

    /*-------------------
		Quantity change
	--------------------- */
    var proQty = $('.pro-qty');

    // var limitWar = $('#max-limit')
    
    //increment and decrement button 
    proQty.prepend('<span class="fa fa-angle-up dec qtybtn"></span>');
    proQty.append('<span class="fa fa-angle-down inc qtybtn"></span>');

    
    proQty.on('click', '.qtybtn', function () { 
        const productQuantity = product.variants[0].sizes[0].stock
        let $button = $(this);
        let $input = $button.parent().find('input')
        let oldValue = parseInt($input.val());
        let newVal;
        if ($button.hasClass('inc')) {
            if(oldValue >= productQuantity){
                newVal = oldValue
                $("#max-limit").text("out of stock!");
            }
            else if(oldValue >= 10){
                newVal = 10
                $("#max-limit").text("you hit your max limit!");
            }else{
                newVal = parseFloat(oldValue) + 1;
            }
        } else {
            // not allowed below one
            if (oldValue > 1) {
                newVal = parseFloat(oldValue) - 1;
                $("#max-limit").text('')
            } else {
                newVal = 1;
            }
        }
        $input.val(newVal).trigger('input')
    });

    var proQty = $('.pro-qty-2');

    proQty.prepend('<span class="fa fa-angle-left dec qtybtn"></span>');
    proQty.append('<span class="fa fa-angle-right inc qtybtn"></span>');
    
    proQty.on('click', '.qtybtn', function () {
        let $button = $(this);
        console.log($button)
        let $input = $button.parent().find('input')
        console.log('input field',$input[0].outerHTML)

        const availableStock = parseInt($input.data('stock'))
        console.log('avalilabel stock',availableStock)

        let itemId = $input.closest('td').find('p').attr('id').replace('max-limit-', '');  // Extract actual item ID
        let $errorMsg = $("#max-limit-" + itemId);
        console.log('eror path',$errorMsg)

        let oldValue = parseInt($input.val());
        let newVal;

        if ($button.hasClass('inc')) {
            if(oldValue >= availableStock){
                $errorMsg.text('out of stock!')
                newVal = oldValue
            }
            else if(oldValue >= 10){
                newVal = 10
                $errorMsg.text("you hit your max limit!");
            }else{
                newVal = parseFloat(oldValue) + 1;
            }
        } else {
            // not allowed below one
            if (oldValue > 1) {
                 newVal = parseFloat(oldValue) - 1;
                 $errorMsg.text('')
            } 
            // not allowed above ten
            else {
                newVal = 1;
            }
        }
        $input.val(newVal).trigger('input')

        

        // Get the item price or offer price
        let $priceElement = $button.closest('tr').find('#dicoutedPrice-' + itemId);
        let itemPrice;
        
        if ($priceElement.length) {
            // Use the offer price if it exists
            itemPrice = parseInt($priceElement.text().replace(/[^0-9]/g, ''));
        } else {
            // Otherwise, use the regular price
            itemPrice = parseInt($button.closest('tr').find('#mrp-' + itemId).text().replace(/[^0-9]/g, ''));
        }
    
        // Calculate item total
        var itemTotal = newVal * itemPrice;
    
        // Update the item total in the DOM
        $('#itemTotal-' + itemId).html('₹ ' + itemTotal.toFixed(2));
        
        console.log('new value',newVal)


        fetch('/updatedCartItemQuantity',{
            method:'PUT',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                itemId: itemId,
                quantity: newVal,
                itemTotal:itemTotal,
            })
        })
        .then(response => response.json())
        .then(result =>{
            if(result.success){
               // Update cart totals dynamically
            let totalMrp = result.updatedCart[0].items.reduce((acc, curr) => {
                let price = curr.product.variants[0].price;
                return acc + (price * curr.quantity);
            }, 0);
            console.log('totalmrp',totalMrp)

            let totalDiscount = totalMrp - result.updatedCart[0].totalPrice;
            let totalAmount = result.updatedCart[0].totalPrice;

            // Update Total MRP, Discount, and Total Amount in DOM
            $('#cart-total-mrp').html('₹ ' + totalMrp.toFixed(2));
            $('#discout-amout').html('₹ ' + totalDiscount.toFixed(2));
            $('#cart-total').html('₹ ' + totalAmount.toFixed(2));
            }else{
                console.log('error updating quantity')
            }
        })
        .catch(error => console.log('something went wrong',error))
    });
    
    

    /*------------------
        Achieve Counter
    --------------------*/
    $('.cn_num').each(function () {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 4000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

})(jQuery);